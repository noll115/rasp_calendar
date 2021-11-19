import { useEffect, useRef, useState } from 'react';
import { getEventStatus } from 'renderer/util';
import { Calendars, Event } from 'types';
import './day.scss';

const getEventText = (event: Event) => {
  let summary = event.summary || '(No title)';
  if (event.fullDay) {
    return <span className="summary">{summary}</span>;
  }
  let { dateTime } = event.start;
  const hour = dateTime.getHours() % 13 ? dateTime.getHours() % 13 : 1;
  const minute = dateTime.getMinutes() ? `:${dateTime.getMinutes()}` : '';
  const postFix = dateTime.getHours() < 12 ? 'am' : 'pm';
  return (
    <>
      <span className="time">{`${hour}${minute} ${postFix}`}</span>
      <span className="summary">{summary}</span>
    </>
  );
};

interface Props {
  date?: number;
  calendars?: Calendars;
  isCurrentDay?: boolean;
  getEventColor(colorId: Event, calendar: Calendars): string | undefined;
}

const Day: React.FC<Props> = ({
  date,
  calendars,
  getEventColor,
  isCurrentDay
}) => {
  const [daysEvents, setEvents] = useState<Event[]>([]);
  const eventsRef = useRef<HTMLDivElement>(null);

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

  let eventDivs =
    calendars &&
    daysEvents.map((evnt, i) => {
      let backgroundColor = getEventColor(evnt, calendars);
      return (
        <div
          className={`event ${getEventStatus(evnt)}`}
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

export { Day };
