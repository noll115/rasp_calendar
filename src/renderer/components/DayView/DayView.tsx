import React, { useEffect, useRef, useState } from 'react';
import { Calendars, Event } from 'types';
import './day-view.scss';

const hrs: string[] = [];
for (const postFix of ['am', 'pm']) {
  for (const hr of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
    if (hr === 12) hrs.push(`${hr} ${postFix === 'am' ? 'pm' : 'am'}`);
    else hrs.push(`${hr} ${postFix}`);
  }
}

const EventDesc: React.FC = () => {
  return <div className="event-desc"></div>;
};

const EventGrid: React.FC<{ events: Event[]; time: Date; dayData: DayData }> =
  ({ time, dayData }) => {
    const eventsRef = useRef<HTMLDivElement>(null);
    const [_height, setHeight] = useState(0);

    const progress =
      (time.getTime() - dayData.startOfDay) /
      (dayData.endOfDay - dayData.startOfDay);

    useEffect(() => {
      if (eventsRef.current) setHeight(eventsRef.current.clientHeight);
    });

    return (
      <div className="events" ref={eventsRef}>
        <div className="time-line" style={{ top: `${progress * 100}%` }}></div>
      </div>
    );
  };

interface DayData {
  startOfDay: number;
  endOfDay: number;
}

interface Props {
  calendars: Calendars;
  time: Date;
  getEventColor(colorId: Event, calendar: Calendars): string | undefined;
}

const DayView: React.FC<Props> = ({ calendars, time }) => {
  const [events, setEvents] = useState<Event[]>([]);
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

  return (
    <div className="day-view">
      <div className="events-presentation">
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
          <div></div>
        </div>
        {dayData && <EventGrid events={events} time={time} dayData={dayData} />}
      </div>
      <EventDesc />
    </div>
  );
};

export { DayView };
