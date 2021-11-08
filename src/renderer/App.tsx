import { MemoryRouter as Router, Switch, Route } from 'react-router-dom';
import InitPage from './pages/InitPage';
import Calendar from './pages/Calendar';
import './index.scss';
export default function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={InitPage} />
        <Route exact path="/calendar" component={Calendar} />
      </Switch>
    </Router>
  );
}
