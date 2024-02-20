import {clientIdType, AuthorizationToken, TokenUserData} from "./enum";
import qs from "query-string";

interface AuthInitData {
  googleClientId?: string,
  googleClientSecret?: string,
  appleClientId?: string,
  appleClientSecret?: string,
  ndpClientId?: string,
  ndpClientSecret?: string,
  googleRedirectUri?: string,
  appleRedirectUri?: string,
  ndpRedirectUri?: string,
  // redirectUri를 공유하고 싶다면 redirectUri 에다가만 넣으면 됨
  redirectUri?: string,
  authURL?: string,
  userURL?: string
}


class Auth {
  isInit: boolean = false;
  // ↓ If the login success is attempted through another method,
  //   there is a possibility that the headerAuthorization may be compromised.
  //   Therefore, the login should only be attempted once.
  isLogin: boolean = false;
  private _headerAuthorization: string = "";
  authURL: string = "";
  userURL: string = "";
  usedType: clientIdType = null as unknown as clientIdType;
  clientIds: { [type in clientIdType]: string } = {
    google: "",
    apple: "",
    ndp: ""
  };
  clientSecrets: { [type in clientIdType]: string } = {
    google: "",
    apple: "",
    ndp: ""
  };
  // Regardless of the login type, the redirectUri can be shared, so it should be added as a default.
  redirectUris: { [type in (clientIdType | "default")]: string } = {
    google: "",
    apple: "",
    ndp: "",
    default: ""
  };

  tokenUserData: TokenUserData = {
    "sub": "",
    "aud": "",
    "resourceOwner": "",
    "scope": [""],
    "iss": "",
    "type": "",
    "applicationId": 0,
    "exp": 0,
    "iat": 0,
    "jti": ""
  }
  tokenData: AuthorizationToken = {
    "client_id": "",
    "access_token": "",
    "refresh_token": "",
    "token_type": ""
  };

  private authStateChangeFunctions: Array<Function> = [];

  private _userId: string = "";

  constructor(initData ?: AuthInitData) {
    initData && this.init(initData);
  }

  init(initData: AuthInitData) {
    this.clientIds.google = initData.googleClientId ?? "";
    this.clientIds.apple = initData.appleClientId ?? "";
    this.clientIds.ndp = initData.ndpClientId ?? "";

    this.clientSecrets.google = initData.googleClientSecret ?? "";
    this.clientSecrets.apple = initData.appleClientSecret ?? "";
    this.clientSecrets.ndp = initData.ndpClientSecret ?? "";

    this.redirectUris.google = initData.googleRedirectUri ?? "";
    this.redirectUris.apple = initData.appleRedirectUri ?? "";
    this.redirectUris.ndp = initData.ndpRedirectUri ?? "";


    this.redirectUris.default = initData.redirectUri ?? "";

    this.setUrl(initData.authURL, initData.userURL);
  }

  setUrl(authURL: string | undefined, userURL: string | undefined) {
    if (!authURL || !userURL)
      return;

    this.authURL = authURL;
    this.userURL = userURL;
    this.isInit = true;
  }

  onAuthStateChanged(callbackFunction: (userId: string) => any) {
    this.authStateChangeFunctions.push(callbackFunction);
  }

  get headerAuthorization(): string {
    return this._headerAuthorization;
  }

  set headerAuthorization(val: any) {
    console.error("can not change");
  }

  get userId(): string {
    return this._userId;
  }

  set userId(val: any) {
    console.error("can not change");
  }

  async getDataWithLogin(type: clientIdType, scope?: string) {
    try {
      const code = await this.login(type, scope);


      this.usedType = type;

      const token = await this.getLoginToken(code);

      console.log(token);

      for (let i = 0; i < this.authStateChangeFunctions.length; i++) {
        try {
          this.authStateChangeFunctions[i](this._userId);
        } catch (e) {
        }
      }
      // TODO : 유저 정보 불러오기 등등 필요함
      return token;
    } catch (e) {
      console.error(e);
    }
  }

  googleLogin = async (scope?: string) => this.getDataWithLogin("google", scope);
  ndpLogin = async (scope?: string) => this.getDataWithLogin("ndp", scope);
  appleLogin = async (scope?: string) => this.getDataWithLogin("apple", scope);

  async getLoginToken(code: string) {
    const tokenUrl = `${this.authURL}/oauth/v2/token?code=${code}&grant_type=authorization_code`;
    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${this.headerAuthorization}`
      }
    })

    this.tokenData = await res.json() as AuthorizationToken;

    this.discomposeJWTToken(this.tokenData.access_token);

    return this.tokenData;
  }

  private discomposeJWTToken(token: string) {
    const jwtData = token.split(".");
    // console.log(jwtData[1], Buffer);
    console.log(token);
    console.log(jwtData[0]);
    console.log(jwtData[1]);
    console.log(jwtData[2]);
    console.log(Buffer.from(jwtData[1], "base64").toString());

    const jwtUserData = JSON.parse(Buffer.from(jwtData[1], "base64").toString());

    if (jwtUserData.sub) {
      this._userId = jwtUserData.sub;
      this.tokenUserData = jwtUserData as TokenUserData;
    }
  }

  async login(type: clientIdType, scope?: string) {
    scope = scope ?? "profile.read,profile.write,userdata.read,userdata.write,storage.read,storage.write";

    return new Promise((resolve: (value: string) => void, reject) => {
      const error =
          !this.isInit ? "Gateway is not ready"
              : (!this.clientIds[type] || !this.clientSecrets[type]) ? `${type}_Id is not ready`
                  : this.isLogin ? "Already logged in"
                      : null;

      if (error) {
        console.error(error);
        reject(error);
        return;
      }

      this._headerAuthorization = Buffer
          .from(`${this.clientIds[type]}:${this.clientSecrets[type]}`)
          .toString("base64");

      const redirectUri = this.redirectUris.default || this.redirectUris[type];
      const authorizationRequest = `${this.authURL}/oauth/v2/authorize`
            + `?client_id=${this.clientIds[type]}&response_type=code&scope=${scope}&redirect_uri=${redirectUri}`;

      console.log(authorizationRequest);

      const popup = window.open(authorizationRequest, "_blank", "width = 500, height = 800, top = 0, left = 0, location = no");

      if (!popup)
        reject("Can't use Popup");

      const receiveMessage = async (event) => {
        // origin check.
        if (event.origin !== window.location.origin)
          return;

        // Check if the postMessage is a login data.
        if (event.data.constructor !== String || event.data.indexOf("login/") === -1)
          return;

        popup?.close();

        const search = event.data.substring(6); //   login/~~~~~~Since it was intended to be received as a login data, it should be removed.
        const {code} = qs.parse(search);

        resolve(code as string);
      }

      window.addEventListener("message", receiveMessage);

      const interval = setInterval(() => {
        // Automatic detection of pop-up termination
        // originally intended to use onbeforeunload,
        // but the event was not triggered as the popup contents continued to change.
        if (popup && popup.closed) {
          clearInterval(interval);
          window.removeEventListener("message", receiveMessage);
          reject();
        }
      }, 500);
    })
  }
}

export default Auth;