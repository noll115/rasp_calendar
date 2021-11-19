import { useCallback, useEffect, useMemo, useState } from 'react';
import { getMonthData, getTimeData, isFullDayEvent } from 'renderer/util';
import {
  Calendar,
  CalendarColors,
  Calendars,
  Event,
  EventJson
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
    calendars[calendarJSON.id!] = {
      ...calendarJSON,
      events: [],
      eventsByDate: {}
    };
    calendarJSON.events.map(eventJSON => {
      addEventToCalendar(
        eventJSON,
        calendarJSON.id!,
        calendars[calendarJSON.id!]
      );
    });
  }
  console.log(calendars);
  return calendars;
};

const Calendar: React.FC = () => {
  const [calendars, setCalendars] = useState<Calendars>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [daysDivs, setdaysDiv] = useState<JSX.Element[]>([]);
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
        console.log(newCalendarEvents);
        const newDate = new Date();
        if (Object.keys(newCalendarEvents).length > 0) {
          setCalendars(prevCalendars => {
            let dirty = false;
            let newCalendars = { ...prevCalendars };
            for (const calendarId in newCalendarEvents) {
              let newEvents = newCalendarEvents[calendarId];
              for (const newEvent of newEvents) {
                const calendar = newCalendars[calendarId];
                if (newEvent.status === 'cancelled') {
                  calendar.events = calendar.events.filter(event => {
                    if (event.id === newEvent.id) {
                      dirty = true;
                      const dates = event.dateIndexes;
                      for (const date of dates) {
                        calendar.eventsByDate[date] = calendar.eventsByDate[
                          date
                        ].filter(dateEvent => dateEvent.id !== event.id);
                      }
                      return false;
                    }
                    return true;
                  });
                } else {
                  const eventJSON = newEvent;
                  const changed = addEventToCalendar(
                    eventJSON,
                    calendarId,
                    calendar,
                    currentDate
                  );
                  dirty = dirty || changed;
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
  useEffect(() => {
    console.log('render', daysDivs);
    let monthStart = false;
    let res: JSX.Element[] = [];
    for (let i = 0; i < 7 * 5; i++) {
      if (
        i === monthData.firstDay ||
        (monthStart && i <= monthData.numOfDays)
      ) {
        monthStart = true;
        res.push(
          <Day
            key={i}
            date={i}
            isCurrentDay={i === currentDate.getDate()}
            calendars={calendars}
            getEventColor={getEventColor}
          />
        );
      } else {
        res.push(<Day key={i} getEventColor={getEventColor} />);
      }
    }
    setdaysDiv(res);
  }, [currentDate.getDate(), monthData, calendars]);

  const getEventColor = useCallback(
    (event: Event, calendars: Calendars) => {
      return event.colorId
        ? calendarColors.event[event.colorId].background!
        : calendars[event.calendarId].backgroundColor!;
    },
    [calendarColors]
  );

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
        {daysDivs}
      </span>
    </div>
  );
};

export { Calendar };

const addEventToCalendar = (
  eventJSON: EventJson,
  calendarId: string,
  calendar: Calendar,
  currentDate?: Date
) => {
  let { startDate, endDate } = getTimeData(eventJSON);
  if (
    currentDate !== undefined &&
    currentDate.getMonth() !== startDate.getMonth()
  ) {
    return false;
  }
  let event: Event;
  if (isFullDayEvent(eventJSON)) {
    let dateIndexes: number[] = [];
    let start = startDate.getDate() + 1;
    let end = endDate.getDate() + 1;
    for (let date = start; date < end; date++) {
      dateIndexes.push(date);
    }
    event = {
      ...eventJSON,
      fullDay: true,
      calendarId: calendarId,
      dateIndexes,
      start: {
        date: startDate
      },
      end: {
        date: endDate
      }
    };
    for (const date of dateIndexes) {
      calendar.eventsByDate[date]
        ? calendar.eventsByDate[date].push(event)
        : (calendar.eventsByDate[date] = [event]);
    }
  } else {
    const date = startDate.getDate();
    event = {
      ...eventJSON,
      fullDay: false,
      calendarId: calendarId,
      dateIndexes: [date],
      start: {
        dateTime: startDate
      },
      end: {
        dateTime: endDate
      }
    };
    calendar.eventsByDate[date]
      ? calendar.eventsByDate[date].push(event)
      : (calendar.eventsByDate[date] = [event]);
  }
  let index = -1;
  if (
    (index = calendar.events.findIndex(evnt => evnt.id === event.id)) !== -1
  ) {
    calendar.events[index] = event;
  } else {
    calendar.events.push(event);
  }
  return true;
};
