import Auth from "./Auth";
import User from "./User";
import Relay from "./Relay";
// import {clientIdType, AuthorizationToken, TokenUserData} from "./enum";

// old test server : https://ndp-dev.onthe.live:5443
// new test server : https://llorqt3rofirq76mqwrlexseh4.apigateway.ap-seoul-1.oci.customer-oci.com
// live server server : https://router.neolab.net
const NdpDefaultRouter = "https://ndp-dev.onthe.live:5443";//;"https://llorqt3rofirq76mqwrlexseh4.apigateway.ap-seoul-1.oci.customer-oci.com";

let isShared = false;
let shared: NDP | undefined;

interface NDPinit {
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
  // If you want to share the redirectUri, just provide it in the redirectUri.
  redirectUri?: string,
  applicationId: number,
  resourceOwnerId: string
}

class NDP {
  Auth: Auth = new Auth();
  User: User = new User();
  Relay: Relay = new Relay();
  url: { [type: string]: string } = {};

  applicationId: number = -1;
  resourceOwnerId: string = "";
  isReady: boolean = false;
  userId: string = "";

  private gatewayStateChangeFunctions: Array<Function> = [];

  constructor(initData?: NDPinit) {
    // If you want to use a single NDP class within the project, you can achieve it by dynamically creating it by default,
    // or using setShare to centralize and unify its usage.
    // TODO : Consider whether to centralize the default conditions for unification.

    if (isShared && shared !== undefined)
      return shared;

    if (initData !== undefined)
      this.init(initData);
  }

  async init(initData: NDPinit) {
    this.applicationId = initData.applicationId;
    this.resourceOwnerId = initData.resourceOwnerId;


    this.Auth.init({
      googleClientId: initData.googleClientId,
      googleClientSecret: initData.googleClientSecret,
      appleClientId: initData.appleClientId,
      appleClientSecret: initData.appleClientSecret,
      ndpClientId: initData.ndpClientId,
      ndpClientSecret: initData.ndpClientSecret,
      googleRedirectUri: initData.googleRedirectUri,
      appleRedirectUri: initData.appleRedirectUri,
      ndpRedirectUri: initData.ndpRedirectUri,
      redirectUri: initData.redirectUri
    });

    this.Auth.onAuthStateChanged((userId: string) => {
      this.setInitDataAfterLogin(userId);
    })

    await this.getGateway();
  }

  async setInitDataAfterLogin(userId: string) {
    this.userId = userId;
    this.User.setInit({
      userId,
      accessToken: this.Auth.tokenData.access_token,
      clientId: this.Auth.clientIds[this.Auth.usedType],
      url: this.url.USER
    });
    this.Relay.setInit({
      userId,
      accessToken: this.Auth.tokenData.access_token,
      applicationId: this.applicationId,
      url: this.url.RELAY
    });
    const rooms = await this.Relay.getRoom();
    if (rooms && rooms.resultElements[0]) {
      this.Relay.setRoom(rooms.resultElements[0]);
    }
  }

  onGatewayReady(callback: Function) {
    this.gatewayStateChangeFunctions.push(callback);
  }


  async getGateway() {
    if (this.applicationId === -1 || this.resourceOwnerId === "") {
      //console.error("applicationId 혹은 resourceOwnerId가 존재하지 않습니다.");
      console.error("applicationId or resourceOwnerId does not exist.");
      return;
    }

    const url = `${NdpDefaultRouter}/gateway/v2/router/client`
                          + `?applicationId=${this.applicationId}&resourceOwnerId=${this.resourceOwnerId}`;

    const getUrl = await fetch(url, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const urlData = await getUrl.json();
    this.url.server = urlData.url;
    let test;
    try {
      const url = `${this.url.server}/gateway/v2/server`
                            + `?applicationId=${this.applicationId}&resourceOwnerId=${this.resourceOwnerId}`;

      const server = await fetch(url, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
        }
      })

      test = await server.json();
    } catch (e) {
      console.error(e);
      test = {
        kind: "gateway#server#list",
        totalElements: 6,
        resultElements: [
          {
            url: "https://ndp-dev.onthe.live:7443",
            type: "AUTH"
          },
          {
            url: "https://oxogtygao4tvhdvbyoavgcec3q.apigateway.ap-seoul-1.oci.customer-oci.com",
            type: "INK"
          },
          {
            url: "https://hm2n2nugz6vne47ongnswa3rym.apigateway.ap-seoul-1.oci.customer-oci.com",
            type: "PAPER"
          },
          {
            url: "https://m72l6oxib7r6qz7emzdd725iji.apigateway.ap-seoul-1.oci.customer-oci.com",
            type: "RELAY"
          },
          {
            url: "https://dze7e4hpxxhmw5myojknwgjx7a.apigateway.ap-seoul-1.oci.customer-oci.com",
            type: "STORAGE"
          },
          {
            url: "https://cournpfv7a63sawyhe4emkdmly.apigateway.ap-seoul-1.oci.customer-oci.com",
            type: "USER"
          }
        ]
      };
    }

    console.log(test.resultElements);

    for (let i = 0; i < test.resultElements.length; i++)
      test.resultElements.forEach((item: any) => this.url[item.type] = item.url);

    this.isReady = true;

    this.Auth.setUrl(this.url.AUTH, this.url.USER);

    for (let i = 0; i < this.gatewayStateChangeFunctions.length; i++)
      this.gatewayStateChangeFunctions[i]();
  }

  // For convenience, create a shared instance immediately when calling getInstance.
  static getInstance() {
    return isShared
        ? shared as NDP
        : (new NDP()).setShare();
  }

  setShare(): NDP {
    isShared = true;
    return shared = this;
  }

  unsetShare() {
    isShared = false;
    shared = undefined;
  }
}

export default NDP;

