import fs from 'fs/promises';
import { calendar_v3, google } from 'googleapis';
import http from 'http';
import log from 'electron-log';
import { URL } from 'url';
import { BrowserWindow, ipcMain } from 'electron';
import { OAuth2Client } from 'google-auth-library';
import { CalendarJSON, EventJson } from 'types';
import { UserStore } from './userStore';

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

const PORT = 4040;

class GoogleAPI {
  mainWindow: BrowserWindow;
  oAuth2Client: OAuth2Client | undefined;
  calendarAPI: calendar_v3.Calendar | undefined;
  store: UserStore;
  tokenServer: http.Server | null = null;
  getAssetPath: (path: string) => string;

  constructor(
    mainWindow: BrowserWindow,
    store: UserStore,
    getAssetPath: (path: string) => string
  ) {
    this.mainWindow = mainWindow;
    this.getAssetPath = getAssetPath;
    this.store = store;
    this.createClient();
  }

  private async startServer(authUrl: string) {
    let closingServer: Promise<void> | null = null;
    if (this.tokenServer) {
      closingServer = new Promise(res => this.tokenServer!.close(() => res()));
    }
    return (closingServer ?? Promise.resolve()).then(
      () =>
        new Promise<string>(resolve => {
          this.tokenServer = http.createServer((req, res) => {
            if (req.url) {
              log.log(req.url);
              const urlObj = new URL(req.url, `http://${req.headers.host}`);
              const code = urlObj.searchParams.get('code');
              if (code) {
                resolve(code);
                res.end('Done');
                this.tokenServer!.close(() => {
                  this.tokenServer = null;
                });
              } else {
                res.writeHead(302, {
                  location: authUrl
                });
                res.end();
              }
            }
          });
          this.tokenServer.listen(PORT, () => {
            log.log(`listening to ${PORT}`);
          });
        })
    );
  }

  async getNewToken(oAuth2Client: OAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES
    });
    const ip = require('ip');
    this.mainWindow.webContents.send('onLogin', {
      loggedIn: false,
      url: `${ip.address()}:${PORT}`
    });
    const code = await this.startServer(authUrl);
    const r = await oAuth2Client.getToken(code);
    this.store.set('googleCredentials', r.tokens);
    return r.tokens;
  }

  async createClient() {
    const content = await fs.readFile(
      this.getAssetPath('client-secret.json'),
      'utf-8'
    );

    const { client_secret, client_id, redirect_uris } = JSON.parse(content);
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[1]
    );

    let token = this.store.get('googleCredentials');
    if (token) {
      if (token.expiry_date! <= Date.now()) {
        token = await this.getNewToken(oAuth2Client);
      }
    } else {
      token = await this.getNewToken(oAuth2Client);
    }
    oAuth2Client.setCredentials(token);
    this.oAuth2Client = oAuth2Client;
    this.calendarAPI = google.calendar({ version: 'v3', auth: oAuth2Client });
    try {
      this.setupIPC();
    } catch (err) {
      console.error('IPCs already created');
    }
    this.mainWindow.webContents.send('onLogin', {
      loggedIn: true
    });
  }

  private async getEvents(
    calendar: CalendarJSON,
    beginMonth: Date,
    endMonth: Date
  ) {
    const eventsRes = (
      await this.calendarAPI?.events.list({
        calendarId: calendar.id!,
        singleEvents: true,
        timeMin: beginMonth.toISOString(),
        timeMax: endMonth.toISOString(),
        fields:
          'nextSyncToken,nextPageToken,timeZone,items(id,colorId,updated,summary,start(dateTime,date,timeZone),end(dateTime,date,timeZone),reminders/*)'
      })!
    ).data;
    calendar.events = eventsRes.items! as EventJson[];
    return [calendar.id!, eventsRes.nextSyncToken!];
  }

  private async getSyncEvents(
    calendarId: string,
    syncToken: string,
    _beginMonth: Date,
    _endMonth: Date
  ): Promise<[string, string, calendar_v3.Schema$Event[]]> {
    const eventsRes = (
      await this.calendarAPI?.events.list({
        calendarId: calendarId,
        singleEvents: true,
        syncToken,
        fields:
          'nextSyncToken,nextPageToken,timeZone,items(status,id,colorId,updated,summary,start(dateTime,date,timeZone),end(dateTime,date,timeZone),reminders/*)'
      })!
    ).data;
    return [calendarId, eventsRes.nextSyncToken!, eventsRes.items!];
  }

  private setupIPC() {
    ipcMain.handle('getData', async () => {
      const res = (
        await this.calendarAPI?.calendarList.list({
          fields:
            'nextSyncToken,items(backgroundColor,foregroundColor,id,timeZone,selected)'
        })!
      ).data;
      let calendars = res.items as CalendarJSON[];
      const beginMonth = new Date();
      beginMonth.setDate(1);
      beginMonth.setHours(0, 0, 0, 0);
      const endMonth = new Date();
      endMonth.setMonth(beginMonth.getMonth() + 1);
      endMonth.setDate(0);
      let promises: Promise<string[]>[] = [];
      for (const calendar of calendars) {
        promises.push(this.getEvents(calendar, beginMonth, endMonth));
      }

      let newSyncTokenStrings = await Promise.all(promises);
      let tokenObj = Object.fromEntries(newSyncTokenStrings);
      console.log(tokenObj);
      this.store.set('syncTokens', tokenObj);
      return calendars;
    });
    ipcMain.handle('getCalendarColors', async () => {
      let color = await (await this.calendarAPI?.colors.get({
        fields: 'calendar,event'
      }))!.data;
      return color;
    });
    ipcMain.handle('getEventRefresh', async () => {
      const syncTokens = this.store.get('syncTokens');
      const calendarIds = Object.keys(syncTokens);
      const beginMonth = new Date();
      beginMonth.setDate(1);
      beginMonth.setHours(0, 0, 0, 0);
      const endMonth = new Date();
      endMonth.setMonth(beginMonth.getMonth() + 1);
      endMonth.setDate(0);
      endMonth.setHours(23);
      console.log(beginMonth, endMonth);
      let syncEvents: Promise<[string, string, calendar_v3.Schema$Event[]]>[] =
        [];
      for (const calendarId of calendarIds) {
        const syncToken = syncTokens[calendarId];
        syncEvents.push(
          this.getSyncEvents(calendarId, syncToken, beginMonth, endMonth)
        );
      }
      const res = await Promise.all(syncEvents);
      const newSyncTokens = res.reduce((acc, val) => {
        acc[val[0]] = val[1];
        return acc;
      }, {} as Record<string, string>);
      this.store.set('syncTokens', newSyncTokens);
      return res.reduce((acc, val) => {
        if (val[2].length > 0) {
          acc[val[0]] = val[2];
        }
        return acc;
      }, {} as Record<string, calendar_v3.Schema$Event[]>);
    });
  }
}

export default GoogleAPI;
