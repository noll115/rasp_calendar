import React, { useEffect, useState } from 'react';
import { Calendars, DayData, Event } from 'types';
import './day-view.scss';
import { DayDescription } from './DayDescription';
import { EventGrid } from './EventGrid';

const hrs: string[] = [];
for (const postFix of ['am', 'pm']) {
  for (const hr of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
    if (hr === 12) hrs.push(`${hr} ${postFix === 'am' ? 'pm' : 'am'}`);
    else hrs.push(`${hr} ${postFix}`);
  }
}

interface Props {
  calendars: Calendars;
  time: Date;
  getEventColor(colorId: Event): string;
}

const DayView: React.FC<Props> = ({ calendars, time, getEventColor }) => {
  const [events, setEvents] = useState<Event[] | null>(null);
  const [dayData, setDayData] = useState<DayData | null>(null);
  const date = time.getDate();
  useEffect(() => {
    const events: Event[] = [];
    for (const calId in calendars) {
      const calendar = calendars[calId];
      const date = time.getDate();
      const eventsForDate = calendar.eventsByDate[date];
      if (eventsForDate) {
        for (const event of eventsForDate) {
          if (event.fullDay) {
            events.unshift(event);
          } else {
            events.push(event);
          }
        }
      }
    }
    events.sort((a, b) => {
      if (a.fullDay) {
        return -1;
      } else if (b.fullDay) {
        return 1;
      }
      return a.start.dateTime.getTime() - b.start.dateTime.getTime();
    });
    setEvents(events);
    const startOfDay = new Date(time);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(time);
    endOfDay.setHours(23, 59, 59, 999);
    setDayData({
      startOfDay: startOfDay.getTime(),
      endOfDay: endOfDay.getTime()
    });
  }, [date, calendars]);

  if (!dayData || !events) {
    return null;
  }

  return (
    <div className="day-view">
      <div className="events-presentation">
        <div className="day-name">Tuesday</div>
        <div className="events-grid">
          <div className="hours">
            {hrs.map(hr => (
              <div className="hour-wrap">
                <div className="hour">{hr}</div>
              </div>
            ))}
          </div>
          {hrs.map((_, i) => (
            <div className="horizontal" style={{ gridRow: i + 1 }}></div>
          ))}
          <div className="vertical">
            <div></div>
          </div>
          <EventGrid
            events={events}
            time={time}
            dayData={dayData}
            getEventColor={getEventColor}
          />
        </div>
      </div>
      <DayDescription
        events={events}
        time={time}
        dayData={dayData}
        getEventColor={getEventColor}
      />
    </div>
  );
};

export { DayView };
