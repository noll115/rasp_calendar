import React from 'react';
import { getEventStatus } from 'renderer/util';
import { DayData, Event, EventDateTime, getEventColorFunc } from 'types';
import { EventDisplay } from './EventDisplay';
// import MyImg from '../../../../assets/img/cat-sleep.png';
interface Props {
  events: Event[];
  time: Date;
  dayData: DayData;
  getEventColor: getEventColorFunc;
}

const DayDescription: React.FC<Props> = ({ time, events, getEventColor }) => {
  const currentEvents = events
    .filter(event => !event.fullDay)
    .filter(
      event => getEventStatus(event, time) == 'current'
    ) as EventDateTime[];

  const futureEvent = events
    .filter(event => !event.fullDay)
    .find(event => getEventStatus(event, time) === 'future') as EventDateTime;
  if (currentEvents.length === 0 && !futureEvent) {
    return (
      <div className="day-description no-events">
        You're done for the day!
        {/* <img src={MyImg} /> */}
      </div>
    );
  }
  console.log(currentEvents, futureEvent);
  return (
    <div className="day-description">
      {currentEvents.length > 0 && (
        <section className="current-events">
          <h1>
            {currentEvents.length > 1 ? 'Current Events' : 'Current Event'}
          </h1>
          <div className="events">
            {currentEvents.map(event => (
              <EventDisplay
                key={event.id}
                event={event}
                getEventColor={getEventColor}
              />
            ))}
          </div>
        </section>
      )}
      {futureEvent && (
        <section className="future-event">
          <h1>Upcoming event</h1>
          <EventDisplay event={futureEvent} getEventColor={getEventColor} />
        </section>
      )}
    </div>
  );
};

export { DayDescription };
