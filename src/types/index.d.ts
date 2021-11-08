import { IpcRendererEvent } from 'electron';
import { calendar_v3 } from 'googleapis';
declare global {
  interface Window {
    api: API;
  }
}

export interface API {
  onLogin(cb: (event: IpcRendererEvent, arg: IloggedIn) => void): void;
  getInitData(): Promise<CalendarJSON[]>;
}

export type IloggedIn =
  | {
      loggedIn: true;
    }
  | {
      loggedIn: false;
      url: string;
    };

export interface MonthEvents {
  [index: string]: calendar_v3.Schema$Event[];
}

export interface CalendarJSON extends calendar_v3.Schema$Calendar {
  events: calendar_v3.Schema$Event[];
}
