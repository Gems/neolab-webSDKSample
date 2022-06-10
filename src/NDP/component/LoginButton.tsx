import { makeStyles } from '@material-ui/core';
import React from 'react';

const useStyle = makeStyles((theme) => ({
  mainBackground: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'center',
  },
  title: {
    margin: '15px',
  }
}));

const LoginButton = () => {
  const classes = useStyle();
  
  return (
    <div>
      123
    </div>
  );
};

export default LoginButton;
