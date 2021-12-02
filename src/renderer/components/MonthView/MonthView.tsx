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
  getEventColor(event: Event): string;
}

const MonthView: React.FC<Props> = ({
  calendars,
  monthData,
  currentDate,
  getEventColor
}) => {
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
  );
};

export { MonthView };
