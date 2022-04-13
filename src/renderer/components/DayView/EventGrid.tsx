import React from 'react';
import { getEventStatus, getTimeRangeText } from 'renderer/util';
import { DayData, Event, EventDateTime, getEventColorFunc } from 'types';

interface Props {
  events: Event[];
  time: Date;
  dayData: DayData;
  getEventColor: getEventColorFunc;
}

const EventGrid: React.FC<Props> = ({
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
        const startInOther =
          startTime > otherStartTime && startTime < otherEndTime;
        const endInOther = endTime > otherStartTime && endTime < otherEndTime;
        const overlap = startInOther || endInOther;
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
  const halfHr = 1.8e6;
  const eventDivs: JSX.Element[] = [];
  eventCols.forEach(eventRow => {
    for (let i = 0; i < eventRow.length; i++) {
      const event = eventRow[i];
      const startTime = event.start.dateTime.getTime() - dayData.startOfDay;
      const endTime = event.end.dateTime.getTime() - dayData.startOfDay;
      const startPos = (startTime / dayEndTime) * 100;
      const endPos = 100 - (endTime / dayEndTime) * 100;
      const numOfHalfHrs = (endTime - startTime) / halfHr;
      const status = getEventStatus(event, time);
      const [backgroundColor, _] = getEventColor(event);
      const gridColumn =
        eventRow.length === 1 ? undefined : `${i + 1}/${i + 1}`;
      eventDivs.push(
        <div
          key={event.id}
          className={`event ${status} ${numOfHalfHrs <= 1 ? 'small' : ''}`}
          style={{
            top: `${startPos}%`,
            bottom: `${endPos}%`,
            backgroundColor,
            gridColumn
          }}
        >
          <span className="time">
            {getTimeRangeText(event.start.dateTime, event.end.dateTime)}
          </span>
          <span>{event.summary || 'Busy'}</span>
        </div>
      );
    }
  });

  return (
    <div className="events">
      {eventDivs}
      <div className="time-line" style={{ top: `${progress * 100}%` }} />
    </div>
  );
};

export { EventGrid };
