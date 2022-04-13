import { IpcRendererEvent } from 'electron';
import { Credentials } from 'google-auth-library';
import { calendar_v3 } from 'googleapis';
declare global {
  interface Window {
    api: API;
  }
}

type IpcEventCallback<T> = (event: IpcRendererEvent, arg: T) => void;
type IpcRendererEventFunction<T> = (cb: IpcEventCallback<T>) => () => void;

export interface API {
  onLoginChange: IpcRendererEventFunction<IloggedIn>;
  onCalendarAction: IpcRendererEventFunction<CalendarAction>;
  onConnectionChange: IpcRendererEventFunction<Object>;
  getInitialState(): InitialCalendarState;
  getData(): Promise<CalendarJSON[]>;
  getCalendarColors(): Promise<CalendarColors>;
  getEventRefresh(): Promise<Record<string, EventJson[]>>;
}

export type IloggedIn =
  | {
      loggedIn: true;
    }
  | {
      loggedIn: false;
      url: string;
    };

export interface InitialCalendarState {
  isLoggedIn: boolean;
  url?: string;
  viewMode: ViewModes;
}

export type EventStatus = 'future' | 'current' | 'passed' | 'cancelled';
export type ViewModes = 'day' | 'month';

interface EventBase extends Omit<calendar_v3.Schema$Event, 'start' | 'end'> {
  dateIndexes: number[];
  calendarId: string;
}

interface EventDateBase {
  fullDay: true;
  start: {
    date: Date;
  };
  end: { date: Date };
}

interface EventDateTimeBase {
  fullDay: false;
  start: {
    dateTime: Date;
  };
  end: {
    dateTime: Date;
  };
}
export type EventDate = EventBase & EventDateBase;
export type EventDateTime = EventBase & EventDateTimeBase;
export type Event = EventBase & (EventDateTimeBase | EventDateBase);

export type getEventColorFunc = (colorId: Event) => [string, string];
export interface EventsByDate {
  [index: number]: Event[];
}

export interface Calendar extends calendar_v3.Schema$CalendarListEntry {
  eventsByDate: EventsByDate;
  totalEvents: Event[];
}

export interface Calendars {
  [index: string]: Calendar;
}

export interface CalendarJSON extends calendar_v3.Schema$CalendarListEntry {
  events: EventJson[];
}
export interface EventDateJson
  extends Omit<calendar_v3.Schema$Event, 'start' | 'end'> {
  start: {
    date: string;
  };
  end: {
    date: string;
  };
}
export interface EventDateTimeJson
  extends Omit<calendar_v3.Schema$Event, 'start' | 'end'> {
  start: {
    dateTime: string;
  };
  end: {
    dateTime: string;
  };
}

export type EventJson = EventDateJson | EventDateTimeJson;

export interface CalendarColors {
  calendar: {
    [key: string]: calendar_v3.Schema$ColorDefinition;
  };
  event: {
    [key: string]: calendar_v3.Schema$ColorDefinition;
  };
}

export interface StoreData {
  googleCredentials?: Credentials;
  syncTokens: Record<string, string>;
  calendarViewMode: ViewModes;
}

export interface DayData {
  startOfDay: number;
  endOfDay: number;
  dayName: string;
}

export type CalendarActions = 'changeView' | 'refresh';

interface CalendarActionBase<T extends CalendarActions> {
  type: T;
  body?: Object;
}

interface ChangeViewAction extends CalendarActionBase<'changeView'> {
  body: {
    viewMode: ViewModes;
  };
}

interface RefreshCalendarAction extends CalendarActionBase<'refresh'> {}

export type CalendarAction = ChangeViewAction | RefreshCalendarAction;
