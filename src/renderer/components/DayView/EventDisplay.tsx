import React from 'react';
import { getTimeRangeText } from 'renderer/util';
import { Event, getEventColorFunc } from 'types';
import { ImClock, ImCheckmark, ImCross, ImParagraphLeft } from 'react-icons/im';
import { IoHelpSharp } from 'react-icons/io5';
import { BsPeopleFill } from 'react-icons/bs';
import { IconType } from 'react-icons';
import { calendar_v3 } from 'googleapis';

interface EventDisplayProps {
  event: Event;
  getEventColor: getEventColorFunc;
}

const EventDisplay: React.FC<EventDisplayProps> = ({
  event,
  getEventColor
}) => {
  const [backgroundColor, foreground] = getEventColor(event);

  if (event.fullDay) {
    return (
      <div className="event" style={{ backgroundColor }}>
        <section className="event-title">
          <h5 className="title" style={{ color: foreground }}>
            {event.summary || 'Busy'}
          </h5>
        </section>
      </div>
    );
  }

  return (
    <div className="event">
      <section className="event-title">
        <span className="icon" style={{ backgroundColor }}></span>
        <h1 className="title" style={{ color: foreground }}>
          {event.summary || 'Busy'}
        </h1>
      </section>
      <section className="event-time">
        <ImClock className="icon" />
        {getTimeRangeText(event.start.dateTime, event.end.dateTime)}
      </section>
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

export { EventDisplay };
