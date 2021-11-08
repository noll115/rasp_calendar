import React, { useEffect, useState } from 'react';
import cat from '../../../assets/img/cat.gif';
import { useHistory } from 'react-router';
import './init-page.scss';

const Login: React.FC<{ url: string }> = ({ url }) => {
  return (
    <div className="login-page">
      <div className="title">
        <i className="fab fa-raspberry-pi" /> - Calendar
      </div>
      <div className="body">
        Please go to
        <br />
        {`http://${url}`}
        <br />
        to link your google calendar.
        <div className="icons">
          <i className="fas fa-mobile-alt" />
          <i className="fas fa-desktop" />
        </div>
      </div>
    </div>
  );
};

const Loading: React.FC = () => {
  return (
    <div className="loading">
      <img src={cat} alt="cat" />
    </div>
  );
};

const InitPage: React.FC = () => {
  const [loginState, setLoginState] = useState({
    loading: true,
    isLoggedIn: false,
    url: '',
  });

  const history = useHistory();
  console.log(loginState);
  useEffect(() => {
    window.api.onLogin((_, newState) => {
      setLoginState({
        loading: false,
        isLoggedIn: newState.loggedIn,
        url: newState.loggedIn ? '' : newState.url,
      });
    });
  }, []);

  useEffect(() => {
    if (loginState.isLoggedIn) {
      history.push('/calendar');
    }
  }, [loginState.isLoggedIn, history]);

  if (loginState.loading) return <Loading />;

  if (!loginState.loading && !loginState.isLoggedIn) {
    return <Login url={loginState.url} />;
  }

  return null;
};

export default InitPage;
