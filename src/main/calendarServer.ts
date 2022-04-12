import http from 'http';
import log from 'electron-log';
import { BrowserWindow, ipcMain } from 'electron';
import { UserStore } from './userStore';
import { CalendarAction } from '../types';
import GoogleAPI from './googleAPI';
import ip from 'ip';

const PORT = 4040;

class CalendarServer {
  mainWindow: BrowserWindow;
  store: UserStore;
  server!: http.Server;
  googleAPI: GoogleAPI;
  getAssetPath: (path: string) => string;
  ipAddr: string;

  constructor(
    mainWindow: BrowserWindow,
    store: UserStore,
    getAssetPath: (path: string) => string
  ) {
    this.mainWindow = mainWindow;
    this.store = store;
    this.getAssetPath = getAssetPath;
    this.ipAddr = ip.address();
    this.googleAPI = new GoogleAPI(mainWindow, store, getAssetPath);

    ipcMain.handle('getInitialState', () => ({
      isLoggedIn: this.googleAPI.isLoggedIn,
      url: this.googleAPI.isLoggedIn ? null : `${this.ipAddr}:${PORT}`,
      viewMode: store.get('calendarViewMode')
    }));
    this.startServer();
  }

  private parseData(req: http.IncomingMessage) {
    return new Promise<CalendarAction>(res => {
      const chunks: Uint8Array[] = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => {
        let jsonData: CalendarAction = JSON.parse(
          Buffer.concat(chunks).toString()
        );
        res(jsonData);
      });
    });
  }

  private async handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    let data = await this.parseData(req);
    log.info(data);
    switch (data.type) {
      case 'changeView':
        this.store.set('calendarViewMode', data.body.viewMode);
        break;
    }
    this.mainWindow.webContents.send('onCalendarAction', data);
    res.end();
  }

  private startServer() {
    this.server = http.createServer((req, res) => {
      log.info(req.url);
      switch (req.url) {
        case '/action':
          this.handleRequest(req, res);
          break;
        case '/login':
          this.googleAPI.handleUserLogin(req, res);
          break;
        case '/logout':
          this.googleAPI.handleLogout(req, res);
          break;
        default:
          res.writeHead(400).end();
      }
    });
    this.server.listen(PORT, () => {
      log.log(`listening to ${this.ipAddr}:${PORT}`);
    });
  }
}

export default CalendarServer;
