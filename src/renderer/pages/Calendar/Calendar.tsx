import { useEffect, useState } from 'react';
import { MonthEvents } from 'types';
import './calendar.scss';
import Day from './Day';

const currentDate = new Date();
const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'long' });
const dateRgx = /\d+-\d+-(\d+)/;

function getMonthData(year: number, month: number) {
  const monthDate = new Date(year, month, 1);
  const firstDay = monthDate.getDay();
  monthDate.setMonth(monthDate.getMonth() + 1);
  monthDate.setDate(0);
  const numOfDays = monthDate.getDate();
  return {
    numOfDays,
    firstDay,
    name: monthFormat.format(monthDate),
  };
}

const days = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const getData = async () => {
  const calendars = await window.api.getInitData();
  const monthEvents: MonthEvents = {};
  for (const calendar of calendars) {
    for (const evnt of calendar.events) {
      let dateValue = null;
      if (evnt.start?.date && evnt.end?.date) {
        dateValue = dateRgx.exec(evnt.start.date);
      } else if (evnt.start?.dateTime && evnt.start.dateTime) {
        dateValue = dateRgx.exec(evnt.start.dateTime);
      }
      if (dateValue) {
        const date = dateValue[1];
        monthEvents[date]
          ? monthEvents[date].push(evnt)
          : (monthEvents[date] = [evnt]);
      }
    }
  }
  console.log(monthEvents);
  return monthEvents;
};

const Calendar: React.FC = () => {
  const [monthEvents, setMonthEvents] = useState<MonthEvents>({});
  const [monthData, _setMonthData] = useState(
    getMonthData(currentDate.getFullYear(), currentDate.getMonth())
  );
  const [year, _setYear] = useState(currentDate.getFullYear().toString());
  useEffect(() => {
    (async () => {
      setMonthEvents(await getData());
    })();
  }, []);

  const daysDivs: JSX.Element[] = [];
  let monthStart = false;
  for (let i = 0; i < 7 * 5; i++) {
    if (i === monthData.firstDay || (monthStart && i <= monthData.numOfDays)) {
      monthStart = true;
      daysDivs.push(<Day key={i} date={i} events={monthEvents[i]} />);
    } else {
      daysDivs.push(<Day key={i} />);
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
