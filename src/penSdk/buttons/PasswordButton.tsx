import React from 'react';
import {Button, makeStyles} from '@material-ui/core';

const useStyle = makeStyles((theme) => ({}));

const PasswordButton = ({controller, passwordPen}) => {
  const classes = useStyle();

  const setPassword = () => {
    const newPassword = prompt("Please enter your new password");
    const reNewPassword = prompt("Please enter the new password again.");

    if (newPassword === null || newPassword.length !== 4) {
      alert("Please enter the password correctly.")
      return;
    }

    if (newPassword === reNewPassword) {
      // To set up a password, we use 0000 as the old password.
      controller?.SetPassword("0000", newPassword);
    } else {
      alert("The provided passwords don't match.");
    }
  }
  const updatePassword = () => {
    const oldPassword = prompt("Please enter your current password");
    const newPassword = prompt("Enter your new password");

    if (!oldPassword || !newPassword)
      return;

    if (newPassword && newPassword.length !== 4) {
      alert("The password should be 4 digits long.");
      return;
    }

    controller?.SetPassword(oldPassword, newPassword);
  };

  const removePassword = () => {
    const oldPassword = prompt("Please enter your current password");

    if (!oldPassword || oldPassword.length !== 4) {
      alert("Please enter the password correctly.")
      return;
    }

    //To remove the password, please set newPassword to an empty string (an empty value).
    controller?.SetPassword(oldPassword, "");
  }

  return (
      <>
        {passwordPen ?
            <>
              <Button onClick={updatePassword}>Update Password</Button>
              <Button onClick={removePassword}>Remove Password</Button>
            </> :
            <Button onClick={setPassword}>Set Password</Button>
        }
      </>
  );
};

export default PasswordButton;
