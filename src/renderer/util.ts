import { Event, EventDateJson, EventJson, EventStatus } from 'types';

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

const getTimeData = (event: EventJson) => {
  let startDate: Date;
  let endDate: Date;
  if (isFullDayEvent(event)) {
    startDate = new Date(event.start.date);
    endDate = new Date(event.end.date);
  } else {
    startDate = new Date(event.start.dateTime);
    endDate = new Date(event.end.dateTime);
  }
  return { startDate, endDate };
};

const getEventStatus = (event: Event): EventStatus => {
  let currentTime = new Date();
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
    endTime = event.start.dateTime.getTime();
  }
  const timeMS = currentTime.getTime();
  if (timeMS > startTime && timeMS < endTime) {
    return 'during';
  } else if (timeMS > endTime) {
    return 'passed';
  }
  return 'future';
};

export { getTimeData, getEventStatus, isFullDayEvent, getMonthData };
