import { Button, makeStyles } from '@material-ui/core';
import React from 'react';

import NDP from "../../NDP-lib";


(window as any).NDP = NDP;

const ndp = new NDP({
  googleClientId : "neolab_local_test_for_google",
  googleClientSecret : "Di8DTTUPauInbLZxI1NiiWRm8rh2zU5I",
  ndpClientId : "neolab_local_test",
  ndpClientSecret  : "Di8DTTUPauInbLZxI1NiiWRm8rh2zU5I",
  redirectUri : "http://127.0.0.1:3000/loginCheck.html",
  applicationId : 1538,
  resourceOwnerId : "neolab"
});

ndp.setShare();

const useStyle = makeStyles(() => ({
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

const tryLogin = async ()=>{
  const code = await NDP.getInstance().Auth.googleLogin();
  // const code = await NDP.getInstance().Auth.ndpLogin();
  console.log(code);
  // NDP.getInstance().getLoginToken(code);
}

const LoginButton = () => {
  const classes = useStyle();

  return (
    <React.Fragment>
      <Button onClick={tryLogin}>Login</Button>
    </React.Fragment>
  );
};

export default LoginButton;
