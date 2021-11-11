import { useCallback, useEffect, useState } from 'react';
import {
  CalendarColors,
  CalendarJSON,
  Event,
  EventStatus,
  MonthEvents
} from '../../../types/index';
import './calendar.scss';
import Day from './Day';

const currentDate = new Date();
const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'long' });

function getMonthData(year: number, month: number) {
  const monthDate = new Date(year, month, 1);
  const firstDay = monthDate.getDay();
  monthDate.setMonth(monthDate.getMonth() + 1);
  monthDate.setDate(0);
  const numOfDays = monthDate.getDate();
  return {
    numOfDays,
    firstDay,
    name: monthFormat.format(monthDate)
  };
}

const days = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

const getEventStatus = (startTime: number, endTime: number): EventStatus => {
  let currentTime = Date.now();
  if (currentTime > startTime && currentTime < endTime) {
    return 'during';
  } else if (currentTime > endTime) {
    return 'passed';
  }
  return 'future';
};

const getData = async () => {
  const calendars = await window.api.getInitData();
  const monthEvents: MonthEvents = {};
  for (const calendar of calendars) {
    for (let i = 0; i < calendar.events.length; i++) {
      let eventJSON = calendar.events[i];
      let event: Event | null = null;
      if (eventJSON.start?.date && eventJSON.end?.date) {
        const startDate = new Date(eventJSON.start.date);
        const endDate = new Date(eventJSON.end.date);
        const eventStatus = getEventStatus(
          startDate.getTime(),
          endDate.getTime()
        );
        event = {
          ...eventJSON,
          fullDay: true,
          eventStatus,
          calendarId: calendar.id!,
          start: {
            date: startDate
          },
          end: {
            date: endDate
          }
        };
      } else if (eventJSON.start?.dateTime && eventJSON.end?.dateTime) {
        const startDate = new Date(eventJSON.start.dateTime);
        const endDate = new Date(eventJSON.end.dateTime);
        const eventStatus = getEventStatus(
          startDate.getTime(),
          endDate.getTime()
        );
        event = {
          ...eventJSON,
          fullDay: false,
          calendarId: calendar.id!,
          eventStatus,
          start: {
            dateTime: startDate
          },
          end: {
            dateTime: endDate
          }
        };
      }
      if (event) {
        if (event.fullDay) {
          let start = event.start.date.getDate() + 1;
          let end = event.start.date.getDate() + 1;
          for (let day = start; day <= end; day++) {
            monthEvents[day]
              ? monthEvents[day].push(event)
              : (monthEvents[day] = [event]);
          }
        } else {
          let date = event.start.dateTime.getDate();
          monthEvents[date]
            ? monthEvents[date].push(event)
            : (monthEvents[date] = [event]);
        }
      }
    }
  }
  console.log(calendars);
  return { monthEvents, calendars };
};

const Calendar: React.FC = () => {
  const [monthEvents, setMonthEvents] = useState<MonthEvents>({});
  const [currentCals, setCurrentCals] = useState<CalendarJSON[]>([]);
  const [monthData, _setMonthData] = useState(
    getMonthData(currentDate.getFullYear(), currentDate.getMonth())
  );
  const [year, _setYear] = useState(currentDate.getFullYear().toString());
  const [calendarColors, setCalendarColors] = useState<CalendarColors>({
    calendar: {},
    event: {}
  });

  useEffect(() => {
    (async () => {
      let [{ calendars, monthEvents }, calendarColors] = await Promise.all([
        getData(),
        window.api.getCalendarColors()
      ]);
      setCurrentCals(calendars);
      setMonthEvents(monthEvents);
      setCalendarColors(calendarColors);
    })();
  }, []);

  const getEventColor = useCallback(
    (event: Event) => {
      let color = undefined;
      let cal = null;
      if ((cal = currentCals.find(cal => cal.id === event.calendarId))) {
        color = cal.backgroundColor!;
      }
      if (event.colorId) {
        color = calendarColors.event[event.colorId].background!;
      }
      return color;
    },
    [calendarColors]
  );

  // const _getCalendarColor = useCallback(
  //   (colorId: string) => {
  //     return calendarColors.event[colorId];
  //   },
  //   [calendarColors]
  // );

  const daysDivs: JSX.Element[] = [];
  let monthStart = false;
  for (let i = 0; i < 7 * 5; i++) {
    if (i === monthData.firstDay || (monthStart && i <= monthData.numOfDays)) {
      monthStart = true;
      daysDivs.push(
        <Day
          key={i}
          date={i}
          events={monthEvents[i]}
          getEventColor={getEventColor}
        />
      );
    } else {
      daysDivs.push(<Day key={i} getEventColor={getEventColor} />);
    }
  }

  return (
    <div className="calendar">
      <div className="month-name">{`${monthData.name} ${year}`}</div>
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
