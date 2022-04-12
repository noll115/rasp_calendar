import fs from 'fs/promises';
import { calendar_v3, google } from 'googleapis';
import http from 'http';
import log from 'electron-log';
// import { URL } from 'url';
import { BrowserWindow, ipcMain } from 'electron';
import { Credentials, OAuth2Client } from 'google-auth-library';
import { CalendarJSON, EventJson, ViewModes } from '../types';
import { UserStore } from './userStore';

class GoogleAPI {
  private mainWindow: BrowserWindow;
  private oAuth2Client!: OAuth2Client;
  private calendarAPI?: calendar_v3.Calendar;
  private store: UserStore;
  private getAssetPath: (path: string) => string;
  private _isLoggedIn = false;
  private isIpcSetup = false;
  constructor(
    mainWindow: BrowserWindow,
    store: UserStore,
    getAssetPath: (path: string) => string
  ) {
    this.mainWindow = mainWindow;
    this.getAssetPath = getAssetPath;
    this.store = store;
  }

  get isLoggedIn() {
    return this._isLoggedIn;
  }

  private parseData(req: http.IncomingMessage) {
    return new Promise<any>(res => {
      const chunks: Uint8Array[] = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => {
        let jsonData: any = JSON.parse(Buffer.concat(chunks).toString());
        res(jsonData);
      });
    });
  }

  async handleUserLogin(req: http.IncomingMessage, res: http.ServerResponse) {
    let serverAuthCode = await this.parseData(req);
    log.info(serverAuthCode);
    this.createClient(serverAuthCode);
    let viewMode: ViewModes = this.store.get('calendarViewMode') ?? 'day';
    res.end(JSON.stringify({ viewMode }));
  }

  async handleLogout(_: http.IncomingMessage, res: http.ServerResponse) {
    this.mainWindow.webContents.send('onLoginChange', {
      loggedIn: false
    });
    this._isLoggedIn = false;
    res.end();
  }

  private async createClient(authToken?: string) {
    const content = await fs.readFile(
      this.getAssetPath('client-secret.json'),
      'utf-8'
    );
    const { client_secret, client_id } = JSON.parse(content);
    this.oAuth2Client = new google.auth.OAuth2(client_id, client_secret, '');
    this.oAuth2Client.on('tokens', tokens => {
      log.info('NEW REFRESH TOKEN');
      if (tokens.refresh_token) {
        this.store.set('googleCredentials', prevData => ({
          ...prevData,
          refresh_token: tokens.refresh_token
        }));
      }
    });
    if (authToken) {
      try {
        let { tokens } = await this.oAuth2Client.getToken(authToken);
        this.login(tokens);
      } catch (error) {
        log.error(error);
        this.login();
      }
    } else {
      this.login();
    }
  }

  async login(newCreds?: Credentials) {
    log.info('LOGGING IN ');
    if (!this.isIpcSetup) this.setupIPC();
    if (newCreds) {
      this.store.set('googleCredentials', newCreds);
    }
    let token = newCreds || this.store.get('googleCredentials');
    log.info(token, token?.expiry_date! >= Date.now());

    if (!token) {
      return;
    }
    this.oAuth2Client.setCredentials(token);
    this.calendarAPI = google.calendar({
      version: 'v3',
      auth: this.oAuth2Client
    });
    this._isLoggedIn = true;
    this.mainWindow.webContents.send('onLoginChange', {
      loggedIn: true
    });
  }

  eventFields =
    'nextSyncToken,nextPageToken,timeZone,items(id,attendees(responseStatus,email),colorId,updated,summary,description,start(dateTime,date,timeZone),end(dateTime,date,timeZone),reminders/*)';

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
        fields: this.eventFields
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
        fields: this.eventFields
      })!
    ).data;
    return [calendarId, eventsRes.nextSyncToken!, eventsRes.items!];
  }

  private setupIPC() {
    log.info('setting up IPCs');
    this.isIpcSetup = true;
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
      endMonth.setHours(24, 0, 0, 0);
      console.log(beginMonth.toLocaleString(), endMonth.toLocaleString());

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
      endMonth.setHours(24, 0, 0, 0);
      console.log(beginMonth.toLocaleString(), endMonth.toLocaleString());
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
