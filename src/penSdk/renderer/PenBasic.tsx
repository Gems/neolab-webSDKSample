import {Button, makeStyles, TextField} from '@material-ui/core';
// @ts-ignore
import {NoteServer, PenController, PenHelper} from "web_pen_sdk/dist";
import {useEffect, useRef, useState} from "react";
import {fabric} from 'fabric';
import {
  AuthorizationRequest,
  Dot,
  DotTypes,
  PageInfo,
  PaperSize,
  PenConfigurationInfo,
  ScreenDot,
// @ts-ignore
} from 'web_pen_sdk/dist/Util/type';
import {InvalidPageInfo} from '../utils/constants';
import {isPlatePaper, isPUI, isSamePage} from 'web_view_sdk_test/dist/common';
import Header from '../component/Header';
import alice from '../../assets/alice_Quiz03.nproj';
import note_3138 from '../../assets/note_3138.nproj';
// @ts-ignore
import {ncodeToScreen, ncodeToSmartPlateScreen} from "web_pen_sdk/dist/Util/utils";

const useStyle = makeStyles(() => ({
  mainBackground: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'center',
    alignItems: 'center',
    position: 'relative',
    height: window.innerHeight-163.25,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  hoverCanvasContainer: {
    position: 'absolute',
  },
  mainCanvas: {
    position: 'absolute',
    boxShadow: '1px 2px 6px rgba(0, 0, 0, 0.2)',
  },
  hoverCanvas: {
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

// TODO: Figure out proper type.
async function fetchPaperDetails(pageInfo: any) {

  let imageBlobUrl: string = "";
  let paperSize: PaperSize | null = null;

  // Ed: PUI is a special piece of paper that holds symbols to control input state (color, thickness, etc.)
  if(isPUI(pageInfo) || pageInfo.section === 0) // pageInfo.section === 0 -> abnormal pageInfo
    return { imageBlobUrl, paperSize };

  try {
    imageBlobUrl = isPlatePaper(pageInfo) ? "" : await NoteServer.getNoteImage(pageInfo);
  } catch (e) {
    console.error(e);
  }

  const nprojUrl = pageInfo.book === 3138
      ? note_3138
      : pageInfo.owner === 45 && pageInfo.book === 3
          ? alice
          : null;

  // 페이지가 바뀔 때마다 PUI 세팅을 새로 해준다. 왜냐하면 페이지마다 PUI 위치가 다를 수 있기 때문
  // EN: Whenever the page changes, PUI settings are updated. This is because the PUI location can vary on each page.
  try {
    paperSize = (await NoteServer.extractMarginInfo(nprojUrl, pageInfo)) as PaperSize;
    // noinspection ES6MissingAwait
    NoteServer.setNprojInPuiController(nprojUrl, pageInfo);
  } catch (e) {
    console.error("Nproj PUI controller setting error: ", e);
  } finally {
    console.log("Nproj is set successfully in PUI controller.");
  }

  return { imageBlobUrl, paperSize };
}

const bindImageToNote = async (imageBlobUrl: string)=> new Promise<{ width: number, height: number}>((resolve, reject) => {
  const image = new Image();
  image.src = imageBlobUrl;
  image.onload = () => resolve({ width: image.width, height: image.height });
  image.onerror = reject;
});

class CanvasRenderer {
  private readonly canvas: fabric.Canvas;

  private readonly hoverCanvas: fabric.Canvas;

  private readonly ctx: CanvasRenderingContext2D;

  private readonly hoverPoint: fabric.Circle;

  private angle: number = 0;

  private noteWidth: number;

  private noteHeight: number;

  private imageBlobUrl: string | fabric.Image | undefined = undefined

  private paperSize: PaperSize | null = null;

  plateMode: boolean = false;

  constructor(canvasElement: HTMLCanvasElement, hoverCanvasElement: HTMLCanvasElement, noteWidth: number = 0, noteHeight: number = 0) {

    this.canvas = new fabric.Canvas(canvasElement);
    this.hoverCanvas = new fabric.Canvas(hoverCanvasElement);
    this.ctx = this.canvas.getContext();

    this.hoverPoint = new fabric.Circle({
      radius: 10,
      fill: '#ff2222',
      stroke: '#ff2222',
      opacity: 0,
      top: 0,
      left: 0,
    });

    this.hoverCanvas.add(this.hoverPoint);

    this.noteWidth = noteWidth;
    this.noteHeight = noteHeight;

    if (noteWidth && noteHeight)
      this.changeNoteSize(noteWidth, noteHeight);
  }

  togglePlateMode() {
    this.plateMode = !this.plateMode;
  }

  updatePaper(paperSize: PaperSize, imageBlobUrl: string) {
      // SmartPlate Case, 서버에서 가져온 이미지를 사용하지 않으므로 0으로 설정해주고, canvasFb의 backgroundColor를 white로 만들어준다.
      // EN: For the SmartPlate Case, set the value to 0 since it does not use the images fetched from the server.
      //     Additionally, set the backgroundColor of canvasFb to white.

      this.paperSize = paperSize;
      this.imageBlobUrl = imageBlobUrl;

      bindImageToNote(this.imageBlobUrl)
          .then(({ width, height }) => this.changeNoteSize(width, height));
  }

  private changeNoteSize(width: number, height: number) {
    this.noteWidth = width;
    this.noteHeight = height;

    /**
     * Refactoring canvas width based on noteImage.
     *
     * Canvas(View) default height = 'window.innerHeight - 81(Header) - 82.25(input container)'
     * CanvasFb.height : CanvasFb.width = noteHeight : noteWidth;
     * CanvasFb.width(=refactorCanvasWidth) = (CanvasFb.height * noteWidth) / noteHeight;
     */

    // header(81) + inputContainer(82.25) + margin value(20)
    const canvasHeight = window.innerHeight - 183.25;
    const canvasWidth = canvasHeight * width / height;

    this.changeCanvasSize(canvasWidth, canvasHeight);

    const imageOptions = this.imageBlobUrl
        &&  {  // Resizing noteImage to fit canvas size
          scaleX: canvasWidth! / this.noteWidth,
          scaleY: canvasHeight / this.noteHeight,
          // backgroundImage angle setting
          angle: this.angle,
          top: this.angle === 180 || this.angle === 270 ? this.canvas.height : 0,
          left: this.angle === 90 || this.angle === 180 ? this.canvas.width : 0,
        };

    this.canvas.backgroundColor = 'white';
    this.canvas.setBackgroundImage(
        this.imageBlobUrl ?? "",
        this.canvas.requestRenderAll.bind(this.canvas),
        imageOptions || undefined);
  }

  changeCanvasSize(width?: number, height?: number) {
    if (width) {
      this.canvas.setWidth(width);
      this.hoverCanvas.setWidth(width);
    }

    if (height) {
      this.canvas.setHeight(height);
      this.hoverCanvas.setHeight(height);
    }

    this.canvas.requestRenderAll(); // REVIEW: Do we need it?
    this.hoverCanvas.requestRenderAll();
  };

  /**
   * Set canvas angle.
   *
   * @param {number} rotateAngle
   */
  rotateCanvas(rotateAngle: number) {
    if (rotateAngle !== 0 && rotateAngle !== 90 && rotateAngle !== 180 && rotateAngle !== 270)
      return;

    // if (!pageInfo || !isPlatePaper(pageInfo))
    //   return;

    const rotateDirection = Math.abs(this.angle - rotateAngle) / 90;
    this.angle = rotateAngle;

    if (rotateDirection % 2 === 1) {  // 90' → 1, 270' → 3 - swap noteWidth <-> noteHeight
      const tmp1 = this.noteWidth;
      // noinspection JSSuspiciousNameCombination
      this.noteWidth = this.noteHeight;
      this.noteHeight = tmp1;
    }
  }

  private isStrokeStarted: boolean = false;

  drawStroke(stroke: Dot[]) {
    if (!this.paperSize)
      return;

    const view = { width: this.canvas.width!, height: this.canvas.height! };

    console.log("View: ", view);

    let isFirstDotHandled = false;
    this.ctx.lineWidth = 1;

    for (let dot of stroke) {
      const screenDot: ScreenDot = isPlatePaper(dot.pageInfo)
          ? ncodeToSmartPlateScreen(dot, view, this.angle, this.paperSize)
          : ncodeToScreen(dot, view, this.paperSize);

      if (isFirstDotHandled) {
        this.ctx.lineTo(screenDot.x, screenDot.y);
        this.ctx.stroke();
        this.ctx.closePath();
      }

      isFirstDotHandled = true;

      this.ctx.beginPath();
      this.ctx.moveTo(screenDot.x, screenDot.y);
    }

    this.ctx.closePath();
  }

  continueStroke(dot: Dot) {
    if (!this.paperSize)
      return;

    const view = { width: this.canvas.width!, height: this.canvas.height! };
    const screenDot: ScreenDot = isPlatePaper(dot.pageInfo)
        ? ncodeToSmartPlateScreen(dot, view, this.angle, this.paperSize)
        : ncodeToScreen(dot, view, this.paperSize);

    try {
      if (this.isStrokeStarted) {
        this.ctx.lineWidth = 1;
        this.ctx.lineTo(screenDot.x, screenDot.y);
        this.ctx.stroke();
        this.ctx.closePath();

        this.isStrokeStarted = false;
      }

      switch (dot.dotType) {
        case DotTypes.PEN_DOWN:
          if (this.hoverPoint) {
            this.hoverPoint.set({opacity: 0});
            this.hoverCanvas.requestRenderAll();
          }
          break;
        case DotTypes.PEN_MOVE:
          this.ctx.beginPath();
          this.ctx.moveTo(screenDot.x, screenDot.y);

          this.isStrokeStarted = true;
          break;

        case DotTypes.PEN_HOVER:
          if (this.hoverPoint) {
            this.hoverPoint.set({ left: screenDot.x, top: screenDot.y, opacity: 0.5 });
            this.hoverCanvas.requestRenderAll();
          }
          break;
      }
    } catch (e) {
      console.error("Handling stroke error", e);
    }
  }
}

class ConnectedPen {
  readonly controller: PenController;

  configurationInfo: PenConfigurationInfo | null = null;

  authorized: boolean = false;

  isAuthenticationRequired: boolean = false;

  onDisconnect: (() => void) | null = null;

  onChange: (() => void) | null = null;

  onDot: ((dot: Dot) => void) | null = null;

  onStroke: ((stroke: Dot[]) => void) | null = null;

  onPage: ((page: PageInfo) => void) | null = null;

  constructor(controller: PenController) {
    this.controller = controller;
    this.controller.setCallbacks({
      onDot: (dot: Dot) => this.onDot?.(dot),
      onStroke: (stroke: Dot[]) => this.onStroke?.(stroke),
      onPage: (page: PageInfo) => this.onPage?.(page),
      onConfigurationInfo: (configurationInfo: PenConfigurationInfo) => {
        this.configurationInfo = configurationInfo;
        this.triggerOnChange();
      },
      onSetupSuccess: this.handleSetupSuccess.bind(this),
      onPenDisconnected: this.handlePenDisconnected.bind(this),
      onPenAuthorized: this.handlePenAuthorized.bind(this),
      onAuthenticationRequest: this.handleAuthenticationRequest.bind(this),
      onAuthenticationSuccess: this.handleAuthenticationSuccess.bind(this),
      onRealtimeDataStatus: this.handleRealtimeDataStatus.bind(this),
    });
  }

  private triggerOnChange() {
    this.onChange?.();
  }

  private handleAuthenticationRequest(request: AuthorizationRequest) {
    this.isAuthenticationRequired = true;
    this.triggerOnChange();

    if (request.retryCount >= 10)
      return alert('펜의 모든정보가 초기화 됩니다.');

    const password = prompt(
        `비밀번호를 입력해주세요. (4자리) (${request.retryCount}회 시도)`
            + `\n비밀번호 ${request.resetCount}회 오류 시 필기데이터가 초기화 됩니다. `);

    if (!password)
      return;

    if (password.length !== 4)
      return alert('패스워드는 4자리 입니다.')

    this.controller.AuthorizeWithPassword(password);
  }

  private handleSetupSuccess() {
    // TODO: #1 — Nowhere the `onSetupSuccess` handler is called.
    //       #2 — This request should be handled inside PenController.
    this.controller.RequestPenStatus();
  }

  private handlePenDisconnected() {
    console.log('Pen disconnected');
    this.onDisconnect?.();
  }

  private handlePenAuthorized() {
    PenHelper.debugMode(false);
    this.authorized = true;
    this.triggerOnChange();
  }

  private handleAuthenticationSuccess(noPassword: boolean) {
    this.isAuthenticationRequired = !noPassword;
    this.triggerOnChange();
  }

  private handleRealtimeDataStatus(enabled: boolean) {
    this.controller.SetHoverEnable(enabled);
    this.triggerOnChange();
  }
}

const PenBasic = () => {
  const classes = useStyle();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverCanvasRef = useRef<HTMLCanvasElement>(null);

  const [pageInfo, setPageInfo] = useState<PageInfo>();
  const [pen, setPen] = useState<{ connectedPen: ConnectedPen }>();
  const [canvasRenderer, setCanvasRenderer] = useState<CanvasRenderer>();

  const { connectedPen } = pen || {} as any;

  PenHelper.onPenConnected = (controller: PenController) => {
    setPen({ connectedPen: new ConnectedPen(controller) });
  };

  if (connectedPen) {
    connectedPen.onDisconnect = () => setPen(undefined);

    connectedPen.onChange = () => setPen({ connectedPen });

    connectedPen.onStroke = (stroke: Dot[]) => canvasRenderer?.drawStroke(stroke);

    connectedPen.onDot = (dot: Dot) => {
      if (dot.dotType === DotTypes.PEN_ERROR)
        return;

      canvasRenderer?.continueStroke(dot);
    };

    connectedPen.onPage = (page: PageInfo) => {
      if (!canvasRenderer || (isPlatePaper(page) !== canvasRenderer.plateMode))
        // SmartPlate를 터치했는데 plateMode가 on으로 설정되지 않으면 사용하지 못하도록 함.
        // EN: If the SmartPlate is touched and the plateMode is not set to "on," prevent its usage.
        return alert('Plate Mode를 on으로 설정한 후, 캔버스를 생성해주세요.');

      if (isSamePage(page, InvalidPageInfo))
        // Don't handle Invalid (Empty) Page.
        return;

      // Set new pageInfo only oif page has changed
      if (!isSamePage(pageInfo as any, page))
        setPageInfo(page);
    };
  }

  useEffect(
      () => {
        if (!canvasRef.current || !hoverCanvasRef.current)
          return console.warn("No Canvas refs");

        setCanvasRenderer(new CanvasRenderer(canvasRef.current, hoverCanvasRef.current));
      },
      [ canvasRef, hoverCanvasRef ]);

  /** Setting Ncode noteImage/paperSize */
  useEffect(
      () => {
        if (!pageInfo || !canvasRenderer)
          return;

        fetchPaperDetails(pageInfo)
            .then(({ imageBlobUrl, paperSize }) =>
                paperSize && canvasRenderer.updatePaper(paperSize, imageBlobUrl));
      },
      [ pageInfo, canvasRenderer ]);

  // PenHelper.getPaperInfo({
  //   section: 3,
  //   owner: 1013,
  //   book: 2,
  //   page: 16
  // })

  return (
    <>
      <Header controller={connectedPen?.controller}
              configurationInfo={connectedPen?.configurationInfo}
              passwordPen={connectedPen?.isAuthenticationRequired}
              authorized={connectedPen?.authorized} />

      <div id="abc" className={classes.mainBackground}>
        <canvas ref={canvasRef} className={classes.mainCanvas} width={window.innerWidth} height={window.innerHeight -163.25}></canvas>
        <div className={classes.hoverCanvasContainer}>
          <canvas ref={hoverCanvasRef} className={classes.hoverCanvas} width={window.innerWidth} height={window.innerHeight - 163.25}></canvas>
        </div>
      </div>
      { canvasRenderer &&
        <div className={classes.inputContainer}>
          <div className={classes.inputStyle}>
            <Button variant="contained" color="primary" size="large" onClick={() => canvasRenderer.togglePlateMode() }>
              { canvasRenderer.plateMode ? 'Plate mode off' : 'Plate mode on' }
            </Button>
          </div>
          { canvasRenderer.plateMode ?
            <div className={classes.inputContainer}>
              <div className={classes.inputStyle}>
                <TextField id="width" label="Width" variant="outlined" type="number" size="small"
                    onChange={(e) => canvasRenderer.changeCanvasSize(parseInt(e.target.value))}
                    />
              </div>
              <div className={classes.inputStyle}>
                <TextField id="height" label="Height" variant="outlined" type="number" size="small"
                    onChange={(e) => canvasRenderer.changeCanvasSize(undefined, parseInt(e.target.value))}
                    />
              </div>
              <div className={classes.inputStyle}>
                <TextField id="angle" label="Angle" variant="outlined" type="number" size="small"
                    onChange={(e) => canvasRenderer.rotateCanvas(parseInt(e.target.value))}
                    />
              </div>
            </div> : ''
          }
        </div>
      }
    </>
  );
};

export default PenBasic;