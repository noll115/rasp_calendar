import fs from 'fs/promises';
import { calendar_v3, google } from 'googleapis';
import path from 'path';
import http from 'http';
import log from 'electron-log';
import { URL } from 'url';
import { BrowserWindow, ipcMain } from 'electron';
import { Credentials, OAuth2Client } from 'google-auth-library';
import { CalendarJSON } from 'types';

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

const TOKEN_PATH = path.join(__dirname, 'token.json');
const PORT = 4040;

class GoogleAPI {
  mainWindow: BrowserWindow;
  oAuth2Client: OAuth2Client | undefined;
  calendarAPI: calendar_v3.Calendar | undefined;
  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.createClient();
  }

  private async startServer(authUrl: string) {
    return new Promise<string>((resolve) => {
      const server = http.createServer((req, res) => {
        if (req.url) {
          log.log(req.url);
          const urlObj = new URL(req.url, `http://${req.headers.host}`);
          const code = urlObj.searchParams.get('code');
          if (code) {
            resolve(code);
            res.end('Done');
            server.close();
          } else {
            res.writeHead(302, {
              location: authUrl,
            });
            res.end();
          }
        }
      });
      server.listen(PORT, () => {
        log.log(`listening to ${PORT}`);
      });
    });
  }

  async getNewToken(oAuth2Client: OAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    const ip = require('ip');
    this.mainWindow.webContents.send('onLogin', {
      loggedIn: false,
      url: `${ip.address()}:${PORT}`,
    });
    const code = await this.startServer(authUrl);
    const r = await oAuth2Client.getToken(code);
    await fs.writeFile(TOKEN_PATH, JSON.stringify(r.tokens));
    return r.tokens;
  }

  async createClient() {
    const content = await fs.readFile(
      path.join(__dirname, 'client-secret.json'),
      'utf-8'
    );
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { client_secret, client_id, redirect_uris } = JSON.parse(content);
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[1]
    );
    let token: Credentials | null;
    try {
      let tokenStr = await fs.readFile(TOKEN_PATH, 'utf-8');
      token = JSON.parse(tokenStr) as Credentials;
      if (token.expiry_date! <= Date.now()) {
        token = await this.getNewToken(oAuth2Client);
      }
    } catch (err) {
      token = await this.getNewToken(oAuth2Client);
    }
    oAuth2Client.setCredentials(token);
    this.oAuth2Client = oAuth2Client;
    this.calendarAPI = google.calendar({ version: 'v3', auth: oAuth2Client });
    try {
      this.setupIPC();
    } catch (err) {}
    this.mainWindow.webContents.send('onLogin', {
      loggedIn: true,
    });
  }

  private setupIPC() {
    ipcMain.handle('getInitData', async () => {
      const res = (
        await this.calendarAPI?.calendarList.list({
          fields:
            'nextSyncToken,items(backgroundColor,foregroundColor,id,timeZone,selected)',
        })!
      ).data;
      let calendars = res.items as CalendarJSON[];
      for (const calendar of calendars) {
        const beginMonth = new Date();
        beginMonth.setDate(1);
        beginMonth.setHours(0, 0, 0, 0);
        const endMonth = new Date();
        endMonth.setMonth(beginMonth.getMonth() + 1);
        endMonth.setDate(0);
        const eventsRes = (
          await this.calendarAPI?.events.list({
            calendarId: calendar.id!,
            singleEvents: true,
            orderBy: 'startTime',
            timeMin: beginMonth.toISOString(),
            timeMax: endMonth.toISOString(),
            fields:
              'nextSyncToken,timeZone,items(id,summary,start(dateTime,date,timeZone),end(dateTime,date,timeZone),iCalUID,reminders/*)',
          })!
        ).data;
        const calendarEvents = eventsRes.items!;
        calendar.events = calendarEvents;
      }
      return calendars;
    });
  }
}

export default GoogleAPI;
