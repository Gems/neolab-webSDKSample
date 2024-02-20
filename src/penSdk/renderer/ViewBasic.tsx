import { Button, duration, makeStyles, MenuItem, Select } from '@material-ui/core';
// @ts-ignore
import { PenHelper, PenController } from 'web_pen_sdk';
import React, { useEffect, useReducer, useRef, useState } from "react";
import {
  VersionInfo,
  PenConfigurationInfo,
  AuthorizationRequest
// @ts-ignore
} from 'web_pen_sdk/Util/type';
import Header from '../component/Header';
import { appendPdfToStorage, MainViewFC, PenManager, RenderHelper, savePDF, ViewMessageType } from 'web_view_sdk_test';
import { OuterRendererProps } from 'web_view_sdk_test/dist/renderer';
import OptionMessageType from 'web_view_sdk_test/dist/common/structures/OptionMessageType';
import { IPageSOBP, ZoomFitEnum } from 'web_view_sdk_test/dist/common';
import ReplayModal from './ReplayModal';

const useStyle = makeStyles(() => ({
  mainBackground: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'center',
    alignItems: 'center',
    position: 'relative',
    height: window.innerHeight,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  hoverCanvasContainer: {
    position: 'absolute',
  },
  inputContainer: {
    display: 'flex',
    justifyContent: 'center',
  },
  inputStyle: {
    margin: 20,
  },
}));

const ViewBasic = () => {
  // console.error("[ViewBasic] Init");
  const classes = useStyle();
  
  const [isAuthenticationRequired, setIsAuthenticationRequired] = useState<boolean>(false);
  const [penMessageArgs, setPenSettingInfo] = useState<PenConfigurationInfo>();
  const [controller, setController] = useState<PenController>();
  const [authorized, setAuthorized] = useState<boolean>(false);
  
  const penManager = new PenManager();
  const renderHelper = useRef({} as RenderHelper);

  const [options, setOptions] = useState({} as OuterRendererProps)
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  
  const [activePage, setActivePage] = useState<IPageSOBP>({} as IPageSOBP);
  const [pageInfos, setPageInfos] = useState<IPageSOBP[]>([]);

  const [replayModalOn, SetReplayModalOn] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);

  useEffect(() => {
    renderHelper.current = new RenderHelper();
    renderHelper.current.messageCallback = viewMessage;

    PenHelper.debugMode(false);
    // TODO: Configure Pen Callbacks here.
  });

  const handleConfigurationInfo = (configurationInfo: PenConfigurationInfo) => {
    const _controller = PenHelper.pens.filter(
        c => c.configurationInfo === configurationInfo)[0];

    if (controller !== _controller)
      setController(_controller);  // 해당 펜의 controller를 등록해준다.

    setPenSettingInfo(configurationInfo);  // 펜의 Setting 정보 저장
  }

  const handleSetupSuccess = () => controller?.RequestPenStatus();

  const handlePenDisconnected = () => {
    console.log('Pen disconnected');

    setController(undefined);  // 펜 연결해제시 펜 controller 초기화.
    setPenSettingInfo(undefined);  // 펜 연결해제시 Setting 정보 초기화
    setAuthorized(false);  // 연결해제시 인증상태 초기화
  }

  const handleAuthenticationRequest = (request: AuthorizationRequest) => {
    setIsAuthenticationRequired(true);
    requestAuthentication(request);  // 패스워드 요청시 process
  }

  const handleAuthenticationSuccess = (noPassword: boolean) => {
    setIsAuthenticationRequired(!noPassword);
  }

  const handlePenAuthorized = () => {
    setAuthorized(true);  // Pen 인증 성공시 authorized trigger 값 true 변경
    penManager.registerPen(controller);
  }

  const handleRealtimeDataStatus = (enabled: boolean) => {
    !controller && console.warn("Can't set Hover: controller is not defined");
    controller?.SetHoverEnable(enabled);
  }

  const viewMessage = async (type, args) => {
    switch(type){
      case ViewMessageType.MOUSE_DOWN:
        console.log("MOUSEDOWN");
        console.log(args);
        break;
      case ViewMessageType.VIEW_PAGE_CHANGE:
        console.log("VIEWCHANGE");
        console.log(args);
        setActivePage(args.activePage)
        break;
      case ViewMessageType.REPLAY_PROGRESS:
        console.log(`리플레이 진행도 : ${args.progress}, 진행시간 : ${Math.floor(args.deltaTime / 1000)}`);
        // deltaTime.current = args.deltaTime;
        // setDeltatime(args.deltaTime);
        break;
      case ViewMessageType.ADDED_PAGEINFO:
        setPageInfos(args.pageInfos)
        break;
      case ViewMessageType.CHANGE_ACTIVEPAGE:
        setActivePage(args.activePage)
        break;
      case OptionMessageType.IS_CROP_MODE:
        console.log(args)
        break;
      default:
        break;
    }
  }

  /**
   * Request Password Process.
   *
   * @param request
   */
  const requestAuthentication = (request: AuthorizationRequest) => {
    if (request.retryCount >= 10)
      alert('펜의 모든정보가 초기화 됩니다.');

    const password = prompt(
        `비밀번호를 입력해주세요. (4자리) (${request.retryCount}회 시도)`
              + `\n비밀번호 ${request.resetCount}회 오류 시 필기데이터가 초기화 됩니다. `);

    if (!password)
      return;
    
    if (password.length !== 4)
      alert('패스워드는 4자리 입니다.')

    controller?.AuthorizeWithPassword(password);
  }

  const fileOpen = () => {
    return new Promise(resolve => {
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = false;
      input.accept = ".pdf";
      
      input.onchange = () => {
        const files = input.files!;
        const fileName = files[0].name;
        const fileReader = new FileReader();

        fileReader.readAsDataURL(files[0]);

        fileReader.onload = (e) => {
          throw new Error("Check implementation here");

          // const dataUrl = e.target?.result;
          // resolve(appendPdfToStorage(dataUrl, fileName, undefined));
        }
      }

      input.click();
    })
  }
  const zoomIn = () => {
    renderHelper.current.handleZoomIn();
  }
  const zoomOut = () => {
    renderHelper.current.handleZoomOut();
  }
  const showGrid = () => {
    renderHelper.current.toggleShowGrid();
  }
  const cropMode = () => {
    renderHelper.current.toggleIsCropMode();
  }
  const autoPageChange = () => {
    renderHelper.current.toggleDisableAutoPageChange();
  }
  const autoFocus = () => {
    renderHelper.current.toggleDisableAutoFocus();
  }
  const laserPointer = () => {
    renderHelper.current.toggleLaserPointer();
  }
  const mousePen = () => {
    renderHelper.current.toggleDisableMousePen();
  }
  const panZoom = () => {
    renderHelper.current.toggleDisablePanZoom();
  }
  const setPenType = (e) => {
    const penName = e.target.value;
    const penType = penName==="펜" ? 0 : penName==="지우개" ? 1 : 2
    penManager.setPenRendererType(penType);
  }
  const changeColor = () => {
    const penColorNum = Math.floor(Math.random() * 9);
    penManager.setColor(penColorNum);
  }
  const changeThick = () => {
    const penThickNum = Math.floor(Math.random() * 9);
    penManager.setThickness(penThickNum)
  }
  const pdfSave = () => {
    savePDF("testPDF");
  }
  const writerChange = () => {
    renderHelper.current.handleWriterChanged("");
  }
  const onwerChange = () => {
    renderHelper.current.handleSurfaceOwnerChanged("");
  }
  const wrowChange = () => {
    renderHelper.current.handlePageChangerWriterChanged("");
  }
  const replayStart = () => {
    renderHelper.current.replayStart();
  }
  const replayPause = () => {
    renderHelper.current.replayPause();
  }
  const replayRewind = () => {
    renderHelper.current.replayRewind();
  }
  const replayOn = () => {
    const currDuration = renderHelper.current.replayOn();
    setDuration(currDuration);
    if(currDuration){
      SetReplayModalOn(true);
      console.log(`리플레이 총 시간 : ${Math.floor(currDuration / 1000)}`);
    }
  }
  const replayOff = () => {
    renderHelper.current.replayOff();
    SetReplayModalOn(false);
  }
  const prevPage = () => {
    let currIdx = pageInfos.findIndex((sobp) => sobp.page === activePage.page);
    if(currIdx === 0) {
      console.log("첫 페이지입니다.")
      return;
    }
    const prevPage = pageInfos[currIdx - 1];
    renderHelper.current.setActivePageToMain(prevPage);
  }
  const nextPage = () => {
    let currIdx = pageInfos.findIndex((sobp) => sobp.page === activePage.page);
    if(currIdx === pageInfos.length - 1) {
      console.log("마지막 페이지입니다.")
      return;
    }
    const nextPage = pageInfos[currIdx + 1];
    renderHelper.current.setActivePageToMain(nextPage);
  }
  const removeAllStroke = () => {
    renderHelper.current.removeAllCanvasObject(activePage);
  }
  const setViewFit = () => {
    renderHelper.current.setViewFit(ZoomFitEnum.HEIGHT);
  }
  return (
    <>
      <Header controller={controller} configurationInfo={penMessageArgs} passwordPen={isAuthenticationRequired} authorized={authorized} />
      <div id="menu">
        <Button onClick={fileOpen}>파일열기</Button>
        <Button onClick={pdfSave}>PDF저장</Button>
        <Button onClick={zoomIn}>줌인</Button>
        <Button onClick={zoomOut}>줌아웃</Button>
        {/* <Button onClick={showGrid}>그리드ONOFF</Button> */}
        {/* <Button onClick={cropMode}>크롭모드ONOFF</Button> */}
        <Select onChange={setPenType} defaultValue={"펜"}>
          <MenuItem value={"펜"}>펜</MenuItem>
          <MenuItem value={"지우개"}>지우개</MenuItem>
          <MenuItem value={"마커"}>마커</MenuItem>
        </Select>
        {/* <Button onClick={changeColor}>랜덤색변경</Button> */}
        {/* <Button onClick={changeThick}>랜덤두께변경</Button> */}
        {/* <Button onClick={autoPageChange}>오토페이지체인지ONOFF</Button> */}
        {/* <Button onClick={autoFocus}>오토포커스ONOFF</Button> */}
        {/* <Button onClick={laserPointer}>레이저포인터ONOFF</Button> */}
        {/* <Button onClick={mousePen}>마우스펜ONOFF</Button> */}
        {/* <Button onClick={panZoom}>패닝ONOFF</Button> */}
        <Button onClick={replayOn}>리플레이온</Button>
        <Button onClick={replayOff}>리플레이오프</Button>
        <Button onClick={prevPage}>이전페이지</Button>
        <Button onClick={nextPage}>다음페이지</Button>
        <Button onClick={removeAllStroke}>전체지우기</Button>
        <Button onClick={setViewFit}>페이지높이맞춤</Button>
      </div>
      <div id="view" className={classes.mainBackground}>
        <MainViewFC/>
      </div>
      <ReplayModal modalState={replayModalOn} replayOff={replayOff} duration={duration} renderHelper={renderHelper.current}/>
    </>
  );
};

export default ViewBasic;