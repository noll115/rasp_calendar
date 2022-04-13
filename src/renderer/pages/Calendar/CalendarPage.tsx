import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createEvent,
  getMonthData,
  removeEventFromCalendar
} from 'renderer/util';
import {
  CalendarColors,
  Calendars,
  Event,
  getEventColorFunc,
  ViewModes
} from '../../../types/index';
import './calendar.scss';
import { MonthView } from '../../components';
import { TimeDisplay } from 'renderer/components/TimeDisplay';
import { DayView } from 'renderer/components/DayView';
import { useHistory } from 'react-router';

enum Views {
  MONTH = 'month',
  DAY = 'day'
}

const syncInterval = 1000 * 60 * 0.5;

const getData = async () => {
  const calendarsJSON = await window.api.getData();
  const calendars: Calendars = {};
  for (const calendarJSON of calendarsJSON) {
    const totalEvents: Event[] = [];
    const eventsByDate: Record<string, Event[]> = {};
    calendarJSON.events.map(eventJSON => {
      const newEvent = createEvent(eventJSON, calendarJSON.id!);
      if (newEvent) {
        totalEvents.push(newEvent);
        for (const date of newEvent.dateIndexes) {
          eventsByDate[date]
            ? eventsByDate[date].push(newEvent)
            : (eventsByDate[date] = [newEvent]);
        }
      }
    });
    calendars[calendarJSON.id!] = {
      ...calendarJSON,
      totalEvents,
      eventsByDate
    };
  }
  console.log(calendars);
  return calendars;
};

const CalendarPage: React.FC = () => {
  const [calendars, setCalendars] = useState<Calendars>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<ViewModes>(Views.DAY);
  const [isLoading, setIsLoading] = useState(true);
  const monthData = useMemo(
    () => getMonthData(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate.getFullYear(), currentDate.getMonth()]
  );
  const [calendarColors, setCalendarColors] = useState<CalendarColors>({
    calendar: {},
    event: {}
  });
  let history = useHistory();

  useEffect(() => {
    let remove = window.api.onCalendarAction((_, action) => {
      console.log(action);
      switch (action.type) {
        case 'changeView':
          console.log('new View');
          setCurrentView(action.body.viewMode);
          break;
        default:
          break;
      }
    });
    let unSub = window.api.onLoginChange((_, newState) => {
      if (!newState.loggedIn) {
        history.push('/');
      }
    });
    return () => {
      unSub();
      remove();
    };
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timer;
    (async () => {
      let [calendars, calendarColors] = await Promise.all([
        getData(),
        window.api.getCalendarColors()
      ]);
      setCalendars(calendars);
      setCalendarColors(calendarColors);
      setIsLoading(false);
      timer = setInterval(async () => {
        let newCalendarEvents = await window.api.getEventRefresh();
        const newDate = new Date();
        if (Object.keys(newCalendarEvents).length > 0) {
          setCalendars(prevCalendars => {
            let dirty = false;
            let newCalendars = { ...prevCalendars };
            for (const calendarId in newCalendarEvents) {
              let newEvents = newCalendarEvents[calendarId];
              const { totalEvents, eventsByDate, ...prevCalendarData } =
                prevCalendars[calendarId];
              const newCalendar = (newCalendars[calendarId] = {
                ...prevCalendarData,
                eventsByDate: { ...eventsByDate },
                totalEvents: [...totalEvents]
              });
              for (const eventJSON of newEvents) {
                if (eventJSON.status === 'cancelled') {
                  dirty = removeEventFromCalendar(eventJSON.id!, newCalendar);
                } else {
                  console.log(eventJSON, calendarId, newDate.getMonth());
                  const newEvent = createEvent(
                    eventJSON,
                    calendarId,
                    newDate.getMonth()
                  );
                  if (newEvent) {
                    dirty = true;
                    const index = newCalendar.totalEvents.findIndex(
                      ({ id }) => id === newEvent.id
                    );
                    if (index !== -1) {
                      const oldEvent = newCalendar.totalEvents[index];
                      newCalendar.totalEvents[index] = newEvent;
                      for (const date of oldEvent.dateIndexes) {
                        const eventsForDate = newCalendar.eventsByDate[date];
                        newCalendar.eventsByDate[date] = eventsForDate.filter(
                          ({ id }) => id !== newEvent.id
                        );
                      }
                    } else {
                      newCalendar.totalEvents.push(newEvent);
                    }
                    for (const date of newEvent.dateIndexes) {
                      newCalendar.eventsByDate[date]
                        ? newCalendar.eventsByDate[date].push(newEvent)
                        : (newCalendar.eventsByDate[date] = [newEvent]);
                    }
                  }
                }
              }
            }
            return dirty ? newCalendars : prevCalendars;
          });
        }
        setCurrentDate(newDate);
      }, syncInterval);
    })();
    return () => {
      clearInterval(timer);
    };
  }, []);

  const getEventColor = useCallback<getEventColorFunc>(
    (event: Event) => {
      let background = event.colorId
        ? calendarColors.event[event.colorId].background!
        : calendars[event.calendarId].backgroundColor!;
      let foreground = event.colorId
        ? calendarColors.event[event.colorId].foreground!
        : calendars[event.calendarId].foregroundColor!;
      return [background, foreground];
    },
    [calendarColors, calendars]
  );

  let title = null;
  if (currentView === Views.DAY) {
    title = (
      <span>
        <span className="calendar-header-date">
          {monthData.name} {currentDate.getDate()}
        </span>
        , {currentDate.getFullYear().toString()}
      </span>
    );
  } else {
    title = (
      <span>
        {monthData.name} {currentDate.getFullYear().toString()}
      </span>
    );
  }

  if (isLoading) {
    return <div></div>;
  }

  return (
    <div className="calendar">
      <div className="calendar-header">
        {title}
        <TimeDisplay date={currentDate} />
      </div>
      <div className="calendar-body">
        {currentView === Views.MONTH ? (
          <MonthView
            getEventColor={getEventColor}
            calendars={calendars}
            currentDate={currentDate}
            monthData={monthData}
          />
        ) : (
          <DayView
            calendars={calendars}
            time={currentDate}
            getEventColor={getEventColor}
          />
        )}
      </div>
    </div>
  );
};

export { CalendarPage };
