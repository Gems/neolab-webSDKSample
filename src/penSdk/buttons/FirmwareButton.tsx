import React, { useState } from 'react';
import { Button, makeStyles } from '@material-ui/core';

const useStyle = makeStyles((theme) => ({
}));

const ConnectButton = ({ controller }) => {
  const classes = useStyle();

  const [fileName, setFileName] = useState("");
  const [fwFile, setFwFile] = useState();
  

  const input = document.getElementById("inputFile");

  const handleFile = (e) => {
    setFwFile(e.target.files[0]);
    setFileName(e.target.files[0].name);
  }

  const update = () => {
      if(fileName === ""){
          // alert("파일부터 선택해주세요.");
          alert("Please select a file");
          return;
      }
      controller.RequestFirmwareInstallation(fwFile, "1.10", true)
  }

  return (
      <>
        <input type="file" id="inputFile" onChange={handleFile} style={{display:'none'}} />
        <Button onClick={() => input?.click()} >Software file selection:<br/>{fileName}</Button>
        <Button onClick={update} >Start the update</Button>
      </>
  );
};

export default ConnectButton;
