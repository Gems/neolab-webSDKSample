import React from 'react';
import { makeStyles, Typography } from '@material-ui/core';
import LogoTextImage from '../../assets/pwa152.png';
import ConnectButton from '../buttons/ConnectButton';
import PasswordButton from '../buttons/PasswordButton';
import ProfileButton from '../buttons/ProfileButton';
import FirmwareButton from '../buttons/FirmwareButton';

const useStyle = makeStyles((theme) => ({
  wrap: {
    background: 'rgba(255,255,255,1)',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backdropFilter: 'blur(4px)',
    borderBottom: '1px solid #E7E7E7',
    justifyContent: 'space-between',
    "& button" : {
      padding: '4px',
      color: '#121212',
      fontFamily: 'Noto Sans CJK KR',
      fontStyle: 'normal',
      fontWeight: 'bold',
      fontSize: '13px',
      lineHeight: '16px',
      letterSpacing: '0.25px',
      minWidth: '120px',
      marginRight: '16px',
      border: '1px solid #CED3E2'
    }
  },
  logoContainer: {
    alignItems: 'center',
    display: 'flex'
  },
  imgStyle: {
    width: '80px',
  },
  title: {
    fontFamily: 'Noto Sans CJK KR',
    fontStyle: 'normal',
    fontWeight: 'bold',
    fontSize: '30px',
    color: 'black',
  },
  navStyle: {
    height: '50px',
    backgroundColor: 'rgba(255,255,255,1)',
    display: 'flex',
  },
  penInfo: {
    display: 'flex',
    alignItems: 'center',
    marginRight: '20px',
  },
}));

const Header = ({ controller, configurationInfo, passwordPen, authorized }) => {
  const classes = useStyle();
  return (
    <div className={classes.wrap}>
      <div className={classes.logoContainer}>
        <img src={LogoTextImage} className={classes.imgStyle} alt="logo" />
        <Typography className={classes.title}>Web SDK Sample</Typography>
      </div>
      <div className={classes.navStyle}>
        <Typography variant='subtitle2' className={classes.penInfo}>{authorized ? `Mac: ${controller.info.MacAddress}` : ''}</Typography>
        <Typography variant='subtitle2' className={classes.penInfo}>{authorized ? `HoverMode: ${configurationInfo.HoverMode}` : ''}</Typography>
        <Typography variant='subtitle2' className={classes.penInfo}>{authorized ? `Battery: ${configurationInfo.Battery}` : ''}</Typography>
        {authorized ? <FirmwareButton controller={controller} /> : ""}
        {/* {authorized ? <ProfileButton controller={controller} /> : ""} */}
        {authorized ? <PasswordButton controller={controller} passwordPen={passwordPen} /> : ""}
        <ConnectButton controller={controller} />
      </div> 
    </div>
  );
};

export default Header;
