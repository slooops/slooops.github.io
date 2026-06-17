import { Injectable } from '@angular/core';
import { AppConfigService } from './app-config.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  constructor(private router: Router) {}

  async getValidToken() {
    const date = new Date();
    const timestampCurr = Math.floor(
      date.getTime() / 1000,
    ); /* current time seconds */
    const accessTokenExpire = parseInt(
      sessionStorage.getItem('accessTokenExpireTime') || '0',
    );
    const accessTokenExpireMax =
      accessTokenExpire + 3 * 60 * 60; /* 3 hours between cals -> logout */

    if (timestampCurr < accessTokenExpireMax) {
      if (accessTokenExpire < timestampCurr) {
        this.ssoLogout();
      }
    } else {
      /* logout if 3 hours after expiration of token */
      this.ssoLogout();
    }
  }

  async getTokens() {
    let authClientId = this.authClientId;
    let authClientSecret = this.authClientSecret;
    let ssoUrl = 'https://id.cisco.com';

    const href = window.location.href;
    if (
      href.search('-dev') !== -1 ||
      href.search('-ts1') !== -1 ||
      href.search('-ts3') !== -1 ||
      href.search('-int') !== -1 ||
      href.search('-stg') !== -1
    ) {
      ssoUrl = 'https://int-id.cisco.com';
    } else if (href.search('localhost') !== -1) {
      ssoUrl = '';
    }

    const tokenSsoUrl = ssoUrl + '/oauth2/default/v1/token';

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
      client_secret: authClientSecret,
    };

    let data = Object.keys(dataJson)
      .map((key) => {
        return (
          encodeURIComponent(key) + '=' + encodeURIComponent(dataJson[key])
        );
      })
      .join('&');

    if (ssoUrl) {
      await this.postRequest(tokenSsoUrl, data);
    }

    await this.getUserRoles(this.userId);
    await this.getUserRolesSync(this.userId);
    if (
      this.userRoles.length === 0 &&
      !this.bypassRoutes.includes(this.router.url)
    ) {
      this.router.navigate(['/error']);
    }
  }

  postRequest(url: string, data: any) {
    return fetch(url, {
      mode: 'cors',
      cache: 'no-cache',
      method: 'POST',
      body: data,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
      .then((response) => response.json())
      .then(async (info) => {
        const tknObjStr = JSON.stringify(info);
        sessionStorage.setItem('refreshTokenData', tknObjStr);
        if (sessionStorage.getItem('accessToken')) {
          const appendToken =
            sessionStorage.getItem('accessToken') + ' ' + info.access_token;
          sessionStorage.setItem('accessToken', appendToken);
        } else {
          sessionStorage.setItem('accessToken', info.access_token);
        }
        sessionStorage.setItem('expires_in', info.expires_in);

        const expires_in = info.expires_in;
        const dateCurr = new Date();
        const timeStampCurr = Math.floor(
          dateCurr.getTime() / 1000,
        ); /* current time seconds */
        const expireTime =
          timeStampCurr + expires_in - 300; /* time 5 min before token expire */
        sessionStorage.setItem('accessTokenExpireTime', '' + expireTime);
      });
  }

  username: string;
  userId: string;
  authClientId: string;
  authClientSecret: string;
  authUrl: string;
  controlTowerSupportAgentApiUrl: string;
  bypassRoutes = ['/caseiq'];
  enableMockAuth: boolean = false;
  async getUserId() {
    return fetch('/user/name')
      .then((response) => response.json())
      .then((info) => {
        this.username = info['auth_user_name'];
        this.userId = info['auth_user'];
        this.authClientId = info['auth_client_id'];
        this.authClientSecret = info['auth_client_secret'];
        this.authUrl = info['auth_url'];
        this.controlTowerSupportAgentApiUrl =
          info['control_tower_support_agent_api_url'];
        this.enableMockAuth = info['environment'];
      })
      .catch((error) => {
        console.error('Error fetching user info:', error);
        this.router.navigate(['/error']);
      });
    // .catch((error) => {
    //   console.error('Error fetching user info:', error);
    //   this.router.navigate(['/error']);
    // });
  }

  getUserID() {
    return this.userId;
  }

  getUserName() {
    return this.username;
  }

  getHostUrl() {
    return this.authUrl;
  }

  getControlTowerSupportAgentApiUrl() {
    return this.controlTowerSupportAgentApiUrl;
  }

  userRoles: string[] = [];
  userAccessRoles: string[] = [];
  getUserRoles(username: string) {
    let rolesUrl = this.authUrl + `user-role?username=${username}`;
    return fetch(rolesUrl)
      .then((response) => response.json())
      .then((info) => {
        console.log('User roles fetched:', info);
        this.userRoles = [
          'CASE_IQ_MONITORING',
          ...info['userRoles'].map((role: any) => role.roleName),
        ];
      })
      .catch((error) => {
        console.error('Error fetching user roles:', error);
      });
  }

  adminRoles: any = [];

  getUserRolesSync(username: string) {
    let rolesUrl =
      this.authUrl + `user-access-list-by-user?userName=${username}`;
    return fetch(rolesUrl)
      .then((response) => response.json())
      .then((info) => {
        this.userAccessRoles =
          info['userRoles'].map((role: any) => role.roleName) || [];
        this.adminRoles = info['userRoles']
          .filter((r) => r.roleAdmin === 'Y')
          .map((r) => (r.roleId !== 2 ? r.roleName + '_ADMIN' : r.roleName));
      })
      .catch((error) => {
        console.error('Error fetching user roles:', error);
      });
  }

  getRoles() {
    return this.userRoles;
  }

  getUserAccessRoles(): string[] {
    if (this.enableMockAuth) {
      return ['ADMIN'];
    }

    return ['ADMIN'];
  }

  ssoLogout() {
    sessionStorage.clear();
  }
}
