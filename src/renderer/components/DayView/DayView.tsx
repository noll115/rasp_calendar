import React, { useEffect, useState } from 'react';
import { getEventStatus, getTimeText } from 'renderer/util';
import { Calendars, Event, EventDate, EventDateTime } from 'types';
import './day-view.scss';

const hrs: string[] = [];
for (const postFix of ['am', 'pm']) {
  for (const hr of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
    if (hr === 12) hrs.push(`${hr} ${postFix === 'am' ? 'pm' : 'am'}`);
    else hrs.push(`${hr} ${postFix}`);
  }
}

interface EventDescProps {
  events: Event[];
  time: Date;
  dayData: DayData;
  getEventColor(event: Event): string;
}

const EventDesc: React.FC<EventDescProps> = ({
  time,
  events,
  getEventColor
}) => {
  const [allDayEvents, setAllDayEvents] = useState<EventDate[]>([]);

  useEffect(() => {
    const allDayEvents = events.filter(event => event.fullDay) as EventDate[];
    setAllDayEvents(allDayEvents);
  }, [time.getDate(), events]);

  const currentEvents = events.filter(
    event => getEventStatus(event, time) == 'current'
  );

  const futureEvent = events.find(
    event => getEventStatus(event, time) === 'future'
  );
  if (allDayEvents.length === 0 && currentEvents.length === 0 && !futureEvent) {
    return <div className="event-desc no-events">You're done for the day!</div>;
  }

  return (
    <div className="event-desc">
      {allDayEvents.length > 0 && (
        <div className="all-day-events">
          {allDayEvents.map(event => {
            return <div>{event.summary}</div>;
          })}
        </div>
      )}
      {currentEvents.length > 0 && (
        <div className="current-events">
          {currentEvents.map(event => {
            const backgroundColor = getEventColor(event);
            return <div style={{ backgroundColor }}>{event.summary}</div>;
          })}
        </div>
      )}
      {futureEvent && <div className="future-event"></div>}
    </div>
  );
};

const EventList: React.FC<{
  dayData: DayData;
  dayEndTime: number;
  events: EventDateTime[][];
  time: Date;
  getEventColor(event: Event): string;
}> = ({ events, getEventColor, dayData, dayEndTime, time }) => {
  const eventDivs: JSX.Element[] = [];
  console.log(events);
  events.forEach(eventRow => {
    for (let i = 0; i < eventRow.length; i++) {
      const event = eventRow[i];
      const startTime = event.start.dateTime.getTime() - dayData.startOfDay;
      const endTime = event.end.dateTime.getTime() - dayData.startOfDay;

      const startPos = (startTime / dayEndTime) * 100;
      const endPos = 100 - (endTime / dayEndTime) * 100;
      const endTimeTxt = getTimeText(event.end.dateTime);
      let startTimeTxt = getTimeText(event.start.dateTime);
      const samePostFix =
        endTimeTxt.includes('pm') === startTimeTxt.includes('pm');
      startTimeTxt = samePostFix
        ? startTimeTxt.substring(0, startTimeTxt.length - 3)
        : startTimeTxt;
      const timeText = `${startTimeTxt} - ${endTimeTxt}`;
      const status = getEventStatus(event, time);
      const backgroundColor = getEventColor(event);
      const onlyEvent = eventRow.length === 1;
      const gridColumn = onlyEvent ? undefined : `${i + 1}/${i + 1}`;
      eventDivs.push(
        <div
          key={event.id}
          className={`event ${status}`}
          style={{
            top: `${startPos}%`,
            bottom: `${endPos}%`,
            backgroundColor,
            gridColumn
          }}
        >
          <span className="time">{timeText}</span>
          <span>{event.summary}</span>
        </div>
      );
    }
  });
  return <>{eventDivs}</>;
};

interface EventGridProps {
  events: Event[];
  time: Date;
  dayData: DayData;
  getEventColor(event: Event): string;
}

const EventGrid: React.FC<EventGridProps> = ({
  time,
  dayData,
  events,
  getEventColor
}) => {
  const currentTime = time.getTime() - dayData.startOfDay;
  const dayEndTime = dayData.endOfDay - dayData.startOfDay;
  const progress = currentTime / dayEndTime;
  console.log(events);
  const eventCols: EventDateTime[][] = [];
  events.forEach(event => {
    if (!event.fullDay) {
      const startTime = event.start.dateTime.getTime();
      const endTime = event.end.dateTime.getTime();
      const overLapping = eventCols.some(eventRow => {
        const otherEvent = eventRow[0];
        const otherStartTime = otherEvent.start.dateTime.getTime();
        const otherEndTime = otherEvent.end.dateTime.getTime();
        const overlap = otherStartTime >= startTime || endTime <= otherEndTime;
        if (overlap) {
          eventRow.push(event);
        }
        return overlap;
      });
      if (!overLapping) {
        eventCols.push([event]);
      }
    }
  });
  return (
    <div className="events">
      <EventList
        getEventColor={getEventColor}
        dayData={dayData}
        dayEndTime={dayEndTime}
        events={eventCols}
        time={time}
      />
      <div className="time-line" style={{ top: `${progress * 100}%` }} />
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
      <EventDesc
        events={events}
        time={time}
        dayData={dayData}
        getEventColor={getEventColor}
      />
    </div>
  );
};

export { DayView };
