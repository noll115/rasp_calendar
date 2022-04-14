import log from 'electron-log';
import { BrowserWindow, ipcMain } from 'electron';
import { UserStore } from './userStore';
import { CalendarAction, SocketServer } from '../types';
import GoogleAPI from './googleAPI';
import ip from 'ip';
import { Server } from 'socket.io';
import { createServer } from 'http';

const PORT = 4040;

class CalendarServer {
  mainWindow: BrowserWindow;
  store: UserStore;
  server!: SocketServer;
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

  private handleAction(action: CalendarAction) {
    log.info(action);
    switch (action.type) {
      case 'changeView':
        this.store.set('calendarViewMode', action.body.viewMode);
        break;
    }
    this.mainWindow.webContents.send('onCalendarAction', action);
  }

  private startServer() {
    const httpServer = createServer();
    this.server = new Server(httpServer, { serveClient: false });
    this.server.on('connection', socket => {
      let authToken = socket.handshake.auth.token as string | null;

      if (!this.googleAPI.isLoggedIn && authToken) {
        this.googleAPI.handleUserLogin(authToken);
        let viewMode = this.store.get('calendarViewMode') ?? 'month';
        socket.emit('newViewMode', viewMode);
      }
      socket.on('action', this.handleAction);
      socket.on('logout', this.googleAPI.handleLogout);
    });

    httpServer.listen(PORT, () => {
      log.log(`listening to ${this.ipAddr}:${PORT}`);
    });
  }
}

export default CalendarServer;
