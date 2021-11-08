import { calendar_v3 } from 'googleapis';
import './day.scss';

interface Props {
  date?: number;
  events?: calendar_v3.Schema$Event[];
}

const Day: React.FC<Props> = ({ date, events }) => {
  return (
    <div key={date} className="day">
      <span className="date">{date}</span>
      <span className="events">
        {events?.map((evnt, i) => (
          <div key={i}>{JSON.stringify(evnt.summary)}</div>
        ))}
      </span>
    </div>
  );
};

export { Day };
