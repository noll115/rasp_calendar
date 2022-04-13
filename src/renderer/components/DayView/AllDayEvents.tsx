import React, { useEffect, useState } from 'react';
import { Event, EventDate, getEventColorFunc } from 'types';
import { EventDisplay } from './EventDisplay';

interface Props {
  events: Event[];
  time: Date;
  getEventColor: getEventColorFunc;
}

const AllDayEvents: React.FC<Props> = ({ time, events, getEventColor }) => {
  const [dayEvents, setDayEvents] = useState<EventDate[]>([]);

  useEffect(() => {
    const allDayEvents = events.filter(event => event.fullDay) as EventDate[];
    setDayEvents(allDayEvents);
  }, [time.getDate(), events]);

  if (dayEvents.length === 0) {
    return null;
  }

  return (
    <div className="all-day-events">
      <div className="all-day-events-title">All-day</div>
      <div className="events">
        {dayEvents.map(event => (
          <EventDisplay
            key={event.id}
            event={event}
            getEventColor={getEventColor}
          />
        ))}
      </div>
    </div>
  );
};

export { AllDayEvents };
