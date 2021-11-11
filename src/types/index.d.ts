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
  getCalendarColors(): Promise<CalendarColors>;
  refreshData(): Promise<CalendarJSON[]>;
}

export type IloggedIn =
  | {
      loggedIn: true;
    }
  | {
      loggedIn: false;
      url: string;
    };

export type EventStatus = 'future' | 'during' | 'passed';

interface EventBase extends Omit<calendar_v3.Schema$Event, 'start' | 'end'> {
  calendarId: string;
  eventStatus: EventStatus;
}

interface EventFullDay {
  fullDay: true;
  start: {
    date: Date;
  };
  end: { date: Date };
}

interface EventTime {
  fullDay: false;
  start: {
    dateTime: Date;
  };
  end: {
    dateTime: Date;
  };
}

export type Event = EventBase & (EventTime | EventFullDay);

export interface MonthEvents {
  [index: string]: Event[];
}

export interface CalendarJSON extends calendar_v3.Schema$CalendarListEntry {
  events: calendar_v3.Schema$Event[];
}

export interface CalendarColors {
  calendar: {
    [key: string]: calendar_v3.Schema$ColorDefinition;
  };
  event: {
    [key: string]: calendar_v3.Schema$ColorDefinition;
  };
}
