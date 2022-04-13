import React, { useEffect, useRef, useState } from 'react';
import { getEventStatus, getTimeText } from 'renderer/util';
import { Calendars, Event, getEventColorFunc } from 'types';
import './day.scss';

const getEventText = (event: Event) => {
  let summary = event.summary || '(No title)';
  if (event.fullDay) {
    return <span className="summary">{summary}</span>;
  }
  let { dateTime } = event.start;

  return (
    <>
      <span className="time">{getTimeText(dateTime)}</span>
      <span className="summary">{summary}</span>
    </>
  );
};

interface Props {
  date?: number;
  calendars?: Calendars;
  isCurrentDay?: boolean;
  time: Date;
  getEventColor: getEventColorFunc;
}
const _Day: React.FC<Props> = ({
  date,
  calendars,
  getEventColor,
  isCurrentDay,
  time
}) => {
  const [daysEvents, setEvents] = useState<Event[]>([]);
  const eventsRef = useRef<HTMLDivElement>(null);
  const currentEvent = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (date && calendars) {
      let events: Event[] = [];
      for (const calId in calendars) {
        let calendar = calendars[calId];
        const eventsForDate = calendar.eventsByDate[date];
        if (eventsForDate)
          for (const event of eventsForDate) {
            if (event.fullDay) {
              events.unshift(event);
            } else {
              events.push(event);
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
    }
  }, [calendars, date]);

  useEffect(() => {
    if (currentEvent.current) {
      currentEvent.current.scrollIntoView();
    }
  }, [daysEvents]);

  let eventDivs =
    calendars &&
    daysEvents.map((evnt, i) => {
      let [backgroundColor, _] = getEventColor(evnt);
      const status = getEventStatus(evnt, time);
      return (
        <div
          className={`event ${status}`}
          ref={status === 'current' && !evnt.fullDay ? currentEvent : undefined}
          style={{ backgroundColor }}
          key={i}
        >
          {getEventText(daysEvents[i])}
        </div>
      );
    });

  return (
    <div key={date} className="day">
      <span className={`date ${isCurrentDay ? 'current-day' : ''}`}>
        {date}
      </span>
      <div className="events" ref={eventsRef}>
        {eventDivs}
      </div>
    </div>
  );
};

const Day = React.memo(_Day, (prevProps, nextProps) => {
  if (prevProps.calendars != nextProps.calendars) {
    return false;
  }
  if (prevProps.isCurrentDay != nextProps.isCurrentDay) {
    return false;
  }
  return !nextProps.isCurrentDay;
});

export { Day };
