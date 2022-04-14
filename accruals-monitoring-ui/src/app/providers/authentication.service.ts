import { Injectable } from '@angular/core';
import { HttpClient , HttpHeaders } from '@angular/common/http';
import { AppConfigService } from './app-config.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  constructor(private appConfig: AppConfigService) { }

  async getValidToken() {
    const date = new Date();
    const timestampCurr = Math.floor(date.getTime() / 1000); /* current time seconds */
    const accessToken = sessionStorage.getItem('accessToken');
    const refreshToken = sessionStorage.getItem('refreshToken');
    const accessTokenExpire = parseInt(sessionStorage.getItem('accessTokenExpireTime') 
    || '0');
    const accessTokenExpireMax = accessTokenExpire + 3 * 60 * 60; /* 3 hours between cals -> logout */


    if (timestampCurr < accessTokenExpireMax) {
      if (accessTokenExpire < timestampCurr) {
        this.ssoLogout();
      }

    } else { /* logout if 3 hours after expiration of token */
      this.ssoLogout();
    }
  }

  async getTokens() {
    let authClientId = this.appConfig.getConfig().authClientId;
    let authClientSecret = this.appConfig.getConfig().authClientSecret;
    let ssoUrl = 'https://cloudsso.cisco.com';

    const href = window.location.href;
    if (href.search('-dev') !== -1 || href.search('-ts1') !== -1 
      || href.search('-ts3') !== -1 || href.search('localhost') !== -1) {
      ssoUrl = 'https://cloudsso-test.cisco.com';
    }

    const tokenSsoUrl = ssoUrl + '/as/token.oauth2';

    sessionStorage.removeItem('tokenObject');
    sessionStorage.removeItem('authBasic');
    sessionStorage.removeItem('idToken');
    sessionStorage.removeItem('loginUser');
    sessionStorage.removeItem('refreshTokenData');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('expires_in');
    sessionStorage.removeItem('accessTokenExpireTime');


    /* GET TOKEN */

    let dataJson: any = {
      client_id: authClientId, 
      grant_type: 'client_credentials',
      response_type: 'token', 
      client_secret: authClientSecret
    };

    let data = Object.keys(dataJson).map((key) => {
      return encodeURIComponent(key) + '=' + encodeURIComponent(dataJson[key]);
    }).join('&');

    await this.postRequest(tokenSsoUrl, data);

  }

  postRequest(url: string, data: any) {
    return fetch(url, {
      mode: 'cors',
      cache: 'no-cache',
      method: 'POST',
      body: data,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    }).then(response => response.json())
    .then(info => {
      const tknObjStr = JSON.stringify(info);
      sessionStorage.setItem('refreshTokenData', tknObjStr);
      if (sessionStorage.getItem('accessToken')) {
        const appendToken = sessionStorage.getItem('accessToken') + ' ' + info.access_token;
        sessionStorage.setItem('accessToken', appendToken);
      } else {
        sessionStorage.setItem('accessToken', info.access_token);
      }
      sessionStorage.setItem('expires_in', info.expires_in);

      const expires_in = info.expires_in;
      const dateCurr = new Date();
      const timeStampCurr = Math.floor(dateCurr.getTime() / 1000); /* current time seconds */
      const expireTime = timeStampCurr + expires_in - 300; /* time 5 min before token expire */
      sessionStorage.setItem('accessTokenExpireTime', '' + expireTime);
    });
  }

  ssoLogout() {
    sessionStorage.clear();
  }

}
