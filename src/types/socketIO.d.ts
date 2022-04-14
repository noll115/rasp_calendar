import { Server } from 'socket.io';
import { CalendarAction, ViewModes } from './index';

interface ServerToClientEvents {
  newViewMode: (viewMode: ViewModes) => void;
}

interface ClientToServerEvents {
  login: (authCode: string) => void;
  action: (action: CalendarAction) => void;
  logout: () => void;
}

export type SocketServer = Server<ClientToServerEvents, ServerToClientEvents>;
