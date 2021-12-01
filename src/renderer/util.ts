import { Calendar, Event, EventDateJson, EventJson, EventStatus } from 'types';

const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'long' });

const getMonthData = (year: number, month: number) => {
  const monthDate = new Date(year, month, 1);
  const firstDay = monthDate.getDay();
  monthDate.setMonth(monthDate.getMonth() + 1);
  monthDate.setDate(0);
  const numOfDays = monthDate.getDate();
  return {
    numOfDays,
    firstDay,
    name: monthFormat.format(monthDate)
  };
};
const isFullDayEvent = (event: EventJson): event is EventDateJson => {
  let { start, end } = event as EventDateJson;
  return start.date !== undefined && end.date !== undefined;
};

const getEventStatus = (event: Event, currentTime: Date): EventStatus => {
  let startTime: number;
  let endTime: number;
  if (event.fullDay) {
    let start = event.start.date.getDate() + 1;
    let end = event.start.date.getDate() + 1;
    if (currentTime.getDate() < start) return 'future';
    if (currentTime.getDate() > end) return 'passed';
    return 'during';
  } else {
    startTime = event.start.dateTime.getTime();
    endTime = event.end.dateTime.getTime();
  }
  const timeMS = currentTime.getTime();
  const { attendees } = event;
  if (attendees) {
    const attendee = attendees.find(att => att.email === event.calendarId);
    if (attendee?.responseStatus == 'declined') {
      return 'passed';
    }
  }
  if (startTime < timeMS && timeMS < endTime) {
    return 'during';
  } else if (timeMS > endTime) {
    return 'passed';
  }
  return 'future';
};

const createEvent = (
  eventJSON: EventJson,
  calendarId: string,
  currentMonth?: number
) => {
  let newEvent: Event;
  if (isFullDayEvent(eventJSON)) {
    const startDate = new Date(eventJSON.start.date);
    if (currentMonth && currentMonth !== startDate.getMonth()) {
      return null;
    }
    const endDate = new Date(eventJSON.end.date);
    let dateIndexes: number[] = [];
    let start = startDate.getDate() + 1;
    let end = endDate.getDate() + 1;
    for (let date = start; date < end; date++) {
      dateIndexes.push(date);
    }
    newEvent = {
      ...eventJSON,
      fullDay: true,
      calendarId: calendarId,
      dateIndexes,
      start: {
        date: startDate
      },
      end: {
        date: endDate
      }
    };
  } else {
    const startDate = new Date(eventJSON.start.dateTime);
    const endDate = new Date(eventJSON.end.dateTime);
    if (currentMonth && currentMonth !== startDate.getMonth()) {
      return null;
    }
    const date = startDate.getDate();
    newEvent = {
      ...eventJSON,
      fullDay: false,
      calendarId: calendarId,
      dateIndexes: [date],
      start: {
        dateTime: startDate
      },
      end: {
        dateTime: endDate
      }
    };
  }
  return newEvent;
};

const removeEventFromCalendar = (eventId: string, calendar: Calendar) => {
  const { totalEvents, eventsByDate } = calendar;
  const index = totalEvents.findIndex(evnt => {
    console.log(eventId, evnt.id);
    return evnt.id === eventId;
  });
  if (index !== -1) {
    const [elem] = totalEvents.splice(index, 1);
    for (const date of elem.dateIndexes) {
      eventsByDate[date] = eventsByDate[date].filter(
        dateEvent => dateEvent.id !== eventId
      );
    }
  }
  return index !== -1;
};

const getTimeText = (date: Date, includeMins?: boolean) => {
  const hour = date.getHours() <= 12 ? date.getHours() : date.getHours() - 12;
  const minute =
    date.getMinutes() || includeMins
      ? ':' + String(date.getMinutes()).padStart(2, '0')
      : '';
  const postFix = date.getHours() < 12 ? 'am' : 'pm';
  return `${hour}${minute} ${postFix}`;
};

export {
  getTimeText,
  createEvent,
  getEventStatus,
  isFullDayEvent,
  getMonthData,
  removeEventFromCalendar
};
