import React, { useEffect, useState } from 'react';
import { getTimeText } from 'renderer/util';

interface Props {
  date: Date;
}

const TimeDisplay: React.FC<Props> = ({ date }) => {
  const [timeStr, setTimeStr] = useState(``);

  useEffect(() => {
    setTimeStr(getTimeText(date, true).toLocaleUpperCase());
  }, [date.getHours(), date.getMinutes()]);

  return <span>{timeStr}</span>;
};

export { TimeDisplay };
