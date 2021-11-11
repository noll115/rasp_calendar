import { useEffect, useRef, useState } from 'react';
import { Event } from 'types';
import './day.scss';

const getEventText = (event: Event) => {
  let summary = event.summary || '';
  return event.fullDay ? (
    <span className="summary">{summary}</span>
  ) : (
    <>
      <span className="time">
        {event.start.dateTime
          .toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit'
          })
          .toLowerCase()}
      </span>
      <span className="summary">{summary}</span>
    </>
  );
};

interface Props {
  date?: number;
  events?: Event[];
  getEventColor(colorId: Event): string | undefined;
}
const Day: React.FC<Props> = ({ date, events, getEventColor }) => {
  const [daysEvents, setDaysEvents] = useState(events || []);
  const eventsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDaysEvents(events || []);
  }, [events]);

  let currentEventIndex = daysEvents.findIndex(
    ({ eventStatus }) => eventStatus === 'during' || eventStatus === 'future'
  );
  if (currentEventIndex === -1) {
    currentEventIndex = daysEvents.length - 1;
  }
  let eventDivs = daysEvents?.map((evnt, i) => {
    let backgroundColor = getEventColor(evnt);
    return (
      <div
        className={`event ${evnt.eventStatus}`}
        style={{ backgroundColor }}
        key={i}
      >
        {getEventText(daysEvents[i])}
      </div>
    );
  });

  return (
    <div key={date} className="day">
      <span className="date">{date}</span>
      <div className="events" ref={eventsRef}>
        {eventDivs}
      </div>
    </div>
  );
};

export { Day };
