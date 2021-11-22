import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createEvent,
  getMonthData,
  removeEventFromCalendar
} from 'renderer/util';
import {
  Calendar,
  CalendarColors,
  Calendars,
  Event
} from '../../../types/index';
import './calendar.scss';
import Day from './Day';

const syncInterval = 1000 * 60 * 0.5;

const days = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

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

const Calendar: React.FC = () => {
  const [calendars, setCalendars] = useState<Calendars>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthData = useMemo(
    () => getMonthData(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate.getFullYear(), currentDate.getMonth()]
  );
  const [calendarColors, setCalendarColors] = useState<CalendarColors>({
    calendar: {},
    event: {}
  });

  useEffect(() => {
    let timer: NodeJS.Timer;
    (async () => {
      let [calendars, calendarColors] = await Promise.all([
        getData(),
        window.api.getCalendarColors()
      ]);
      setCalendars(calendars);
      setCalendarColors(calendarColors);
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

  const getEventColor = useCallback(
    (event: Event, calendars: Calendars) => {
      return event.colorId
        ? calendarColors.event[event.colorId].background!
        : calendars[event.calendarId].backgroundColor!;
    },
    [calendarColors]
  );

  let monthStart = false;
  let res: JSX.Element[] = [];
  for (let i = 0; i < 7 * 5; i++) {
    if (i === monthData.firstDay || (monthStart && i <= monthData.numOfDays)) {
      monthStart = true;
      const isCurrentDay = i === currentDate.getDate();
      res.push(
        <Day
          key={i}
          date={i}
          isCurrentDay={isCurrentDay}
          calendars={calendars}
          getEventColor={getEventColor}
          time={currentDate}
        />
      );
    } else {
      res.push(
        <Day key={i} getEventColor={getEventColor} time={currentDate} />
      );
    }
  }

  return (
    <div className="calendar">
      <div className="month-name">{`${monthData.name} ${currentDate
        .getFullYear()
        .toString()}`}</div>
      <span className="grid">
        <div className="top-row">
          {days.map((day, i) => (
            <span className="day-name" key={i}>
              {day}
            </span>
          ))}
        </div>
        {res}
      </span>
    </div>
  );
};

export { Calendar };
