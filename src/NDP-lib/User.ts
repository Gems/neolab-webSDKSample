import {UserData} from "./enum";


interface UserInitData {
    userId:string,
    accessToken:string,
    url : string,
    clientId : string
}



class User {
    userId : string = "";
    accessToken : string = "";
    url : string = "";
    clientId : string = "";
    userData : UserData|null = null;
    
    async setInit(initData:UserInitData){
        this.userId = initData.userId;
        this.accessToken = initData.accessToken;
        this.clientId = initData.clientId;

        this.url = initData.url;
        let data;
        try{
          console.log(`${this.url}/user/v2/users/${this.userId}/profile?clientId=${this.clientId}`)
          const res = await fetch(`${this.url}/user/v2/users/${this.userId}/profile?clientId=${this.clientId}`,{
            method : "GET",
            headers: {
              'Content-Type': 'application/json',
              'Authorization' : `Bearer ${this.accessToken}`
            }
          });
          data = await res.json();
        }catch(e){
          console.log(e);
          data = {
              "id": "rinmin1@naver.com",
              "originId": "1546",
              "name": " 김민겸",
              "email": "rinmin1@naver.com",
              "birthday": null,
              "gender": null,
              "nationality": null,
              "pictureUrl": null,
              "visitCount": 1,
              "lastVisitDate": {
                  "year": 2022,
                  "monthValue": 6,
                  "hour": 9,
                  "minute": 7,
                  "second": 5,
                  "nano": 0,
                  "dayOfYear": 165,
                  "dayOfWeek": "TUESDAY",
                  "month": "JUNE",
                  "dayOfMonth": 14,
                  "chronology": {
                      "calendarType": "iso8601",
                      "id": "ISO"
                  }
              },
              "allowedPushMessage": false,
              "canShare": false,
              "extra": null
          }
        }
        console.log(data);

        this.userData = data as UserData;
    }
}

export default User;