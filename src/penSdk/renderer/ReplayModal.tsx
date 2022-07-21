import { Box, Button, Slider } from "@material-ui/core";
import { useEffect, useState } from "react";
import { RenderHelper, ViewMessageType } from "web_view_sdk_test";

type Props = {
  modalState: boolean;
  duration: number;
  renderHelper: RenderHelper;
  replayOff: () => void;
}
const ReplayModal = (props: Props) => {
  const [position, setPosition] = useState<number>(0);
  const [modalOn, setModalOn] = useState<boolean>(false);

  useEffect(() => {
    props.renderHelper.messageCallback = async (type, args) => {
      viewMessage(type, args);
    }
  });

  useEffect(() => {
    setModalOn(props.modalState);
    setPosition(0);
  }, [props.modalState])

  const viewMessage = (type, args) => {
    switch(type){
      case ViewMessageType.REPLAY_PROGRESS:
        console.log(`리플레이 진행도 : ${args.progress}, 진행시간 : ${Math.floor(args.deltaTime / 1000)}`);
        setPosition(args.deltaTime);
        break;
      default:
        break;
    }
  }

  const replayStart = () => {
    props.renderHelper.replayStart();
  }
  const replayPause = () => {
    props.renderHelper.replayPause();
  }
  const replayRewind = () => {
    props.renderHelper.replayRewind();
  }
  const changeTime = (event, newValue) => {
    props.renderHelper.replaySetTime(newValue);
    setPosition(newValue);
  }
  const formatDuration = (time: number) => {
    const second = Math.floor(time / 1000);
    let minute = Math.floor(second / 60);
    let secondLeft = second - minute * 60;
    if(time < 0) {
      minute = 0;
      secondLeft = 0;
    }
    return `${minute}:${secondLeft < 10 ? `0${secondLeft}` : secondLeft}`;
  }

  return(
    <>
      {modalOn ? 
       <div style={{
         position: "fixed",
         top:120,
         right:50,
         zIndex: 999,
         width: 150,
         flex:1,
       }}>
        <Slider
          value={position}
          min={0}
          step={0.02}
          max={props.duration}
          onChange={changeTime}
        />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: -2,
          }}
        >
          <text>{formatDuration(position)}</text>
          <text>-{formatDuration(props.duration - position)}</text>
        </Box>
        <div style={{display: "flex", alignItems: "center",
            justifyContent: "center",}}>
        <Button onClick={replayRewind}>◀</Button>
        <Button onClick={replayPause}>◫</Button>
        <Button onClick={replayStart}>▶</Button>
        <Button onClick={props.replayOff}>X</Button>
        </div>
       </div>
       : "" 
      }
    </>
  )
}

export default ReplayModal;