import React, { useEffect, useState } from 'react';
import { getEventStatus, getTimeRangeText } from 'renderer/util';
import { DayData, Event, EventDate, EventDateTime } from 'types';
import { ImClock, ImCheckmark, ImCross, ImParagraphLeft } from 'react-icons/im';
import { IoHelpSharp } from 'react-icons/io5';
import { BsPeopleFill } from 'react-icons/bs';
import { IconType } from 'react-icons';
import { calendar_v3 } from 'googleapis';
interface Props {
  events: Event[];
  time: Date;
  dayData: DayData;
  getEventColor(event: Event): string;
}

const DayDescription: React.FC<Props> = ({ time, events, getEventColor }) => {
  const [allDayEvents, setAllDayEvents] = useState<EventDate[]>([]);
  useEffect(() => {
    const allDayEvents = events.filter(event => event.fullDay) as EventDate[];
    setAllDayEvents(allDayEvents);
  }, [time.getDate(), events]);

  const currentEvents = events
    .filter(event => !event.fullDay)
    .filter(
      event => getEventStatus(event, time) == 'current'
    ) as EventDateTime[];

  const futureEvent = events
    .filter(event => !event.fullDay)
    .find(event => getEventStatus(event, time) === 'future') as EventDateTime;
  if (allDayEvents.length === 0 && currentEvents.length === 0 && !futureEvent) {
    return <div className="event-desc no-events">You're done for the day!</div>;
  }
  console.log(currentEvents, futureEvent);
  return (
    <div className="day-description">
      {allDayEvents.length > 0 && (
        <section className="all-day-events">
          <h1>All Day Events</h1>
          {allDayEvents.map(event => (
            <EventDisplay
              key={event.id}
              event={event}
              getEventColor={getEventColor}
            />
          ))}
        </section>
      )}
      {currentEvents.length > 0 && (
        <section className="current-events">
          <h1>Current Events</h1>
          <div>
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

const AttendeeList = (attendees: calendar_v3.Schema$EventAttendee[]) => {
  return attendees
    .sort((a, b) => {
      if (a.responseStatus === b.responseStatus) {
        return 0;
      }
      if (a.responseStatus === 'accepted') {
        return -1;
      }
      if (b.responseStatus === 'accepted') {
        return 1;
      }
      return 1;
    })
    .map(attendee => {
      let Icon: IconType;
      switch (attendee.responseStatus) {
        case 'declined':
          Icon = ImCross;
          break;
        case 'accepted':
          Icon = ImCheckmark;
          break;
        case 'needsAction':
        case 'tentative':
        default:
          Icon = IoHelpSharp;
          break;
      }
      return (
        <div key={attendee.email}>
          <Icon className="icon" />
          <span>
            {attendee.email}
            {attendee.displayName}
          </span>
        </div>
      );
    });
};

interface EventDisplayProps {
  event: Event;
  getEventColor(event: Event): string;
}

const EventDisplay: React.FC<EventDisplayProps> = ({
  event,
  getEventColor
}) => {
  const backgroundColor = getEventColor(event);
  return (
    <div className="event">
      <section className="event-title">
        <span className="icon" style={{ backgroundColor }}></span>
        <h2 className="title">{event.summary || 'Busy'}</h2>
      </section>
      {!event.fullDay && (
        <section className="event-time">
          <ImClock className="icon" />
          {getTimeRangeText(event.start.dateTime, event.end.dateTime)}
        </section>
      )}
      {event.attendees && (
        <section className="event-attendees">
          <h4>
            <BsPeopleFill className="icon" />
            Attendees
          </h4>
          <div className="attendees-list">{AttendeeList(event.attendees)}</div>
        </section>
      )}
      {event.description && (
        <section className="event-desc">
          <ImParagraphLeft className="icon" />
          <span
            className="content"
            dangerouslySetInnerHTML={{ __html: event.description }}
          ></span>
        </section>
      )}
    </div>
  );
};

export { DayDescription };
