import React, { useEffect, useRef, useState } from 'react';
import cat from '../../../assets/img/cat.gif';
import { useHistory } from 'react-router';
import './init-page.scss';
import QRcode from 'qrcode';

const Login: React.FC<{ url: string }> = ({ url }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) {
      QRcode.toCanvas(canvasRef.current, url, {
        width: canvasRef.current.width
      });
    }
  }, []);

  return (
    <div className="login-page">
      <div className="title">
        <i className="fab fa-raspberry-pi" /> - Calendar
      </div>
      <div className="body">
        <canvas ref={canvasRef} className="canvas" />
        <div className="icons">
          Please scan with the app to get started
          <i className="fas fa-mobile-alt" />
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
    url: ''
  });

  const history = useHistory();
  console.log(loginState);
  useEffect(() => {
    window.api.onLogin((_, newState) => {
      setLoginState({
        loading: false,
        isLoggedIn: newState.loggedIn,
        url: newState.loggedIn ? '' : newState.url
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
