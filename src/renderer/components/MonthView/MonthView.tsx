import React from 'react';
import { Calendars, Event } from 'types';
import Day from '../Day';
import './month-view.scss';

const days = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

interface Props {
  monthData: { numOfDays: number; firstDay: number; name: string };
  calendars: Calendars;
  currentDate: Date;
  getEventColor(event: Event): [string, string];
}

const MonthView: React.FC<Props> = ({
  calendars,
  monthData,
  currentDate,
  getEventColor
}) => {
  let monthStart = false;
  let res: JSX.Element[] = [];
  let date = 1;
  for (let i = 0; i < 7 * 5; i++) {
    if (
      i === monthData.firstDay ||
      (monthStart && date <= monthData.numOfDays)
    ) {
      monthStart = true;
      const isCurrentDay = date === currentDate.getDate();
      res.push(
        <Day
          key={i}
          date={date++}
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
    <div className="grid">
      <div className="top-row">
        {days.map((day, i) => (
          <span className="day-name" key={i}>
            {day}
          </span>
        ))}
      </div>
      {res}
    </div>
  );
};

export { MonthView };
