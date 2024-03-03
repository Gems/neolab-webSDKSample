import React from 'react';
import { Button } from '@material-ui/core';
// @ts-ignore
import { PenHelper } from 'web_pen_sdk';

const ConnectButton = ({ controller }) => <>
  { controller?.info
      ? <>
          <Button onClick={() => controller.RequestInitPenDisk()}>Init Pen</Button>
          <Button onClick={() => PenHelper.disconnect()}>Disconnect</Button>
        </>
      : <Button onClick={() => PenHelper.scanPen()}>Connect</Button>
  }
</>;

export default ConnectButton;
