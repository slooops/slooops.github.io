import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthenticationService } from './authentication.service';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate'], { url: '/home' });

    TestBed.configureTestingModule({
      providers: [
        AuthenticationService,
        { provide: Router, useValue: routerSpy },
      ],
    });
    service = TestBed.inject(AuthenticationService);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getUserID', () => {
    it('should return userId', () => {
      service.userId = 'testuser';
      expect(service.getUserID()).toBe('testuser');
    });

    it('should return undefined when not set', () => {
      expect(service.getUserID()).toBeUndefined();
    });
  });

  describe('getUserName', () => {
    it('should return username', () => {
      service.username = 'TESTUSER';
      expect(service.getUserName()).toBe('TESTUSER');
    });
  });

  describe('getHostUrl', () => {
    it('should return localhost URL', () => {
      expect(service.getHostUrl()).toBe('http://localhost:8080/api/');
    });
  });

  describe('getControlTowerSupportAgentApiUrl', () => {
    it('should return controlTowerSupportAgentApiUrl', () => {
      service.controlTowerSupportAgentApiUrl = 'http://example.com/api';
      expect(service.getControlTowerSupportAgentApiUrl()).toBe(
        'http://example.com/api',
      );
    });
  });

  describe('getRoles', () => {
    it('should return userRoles array', () => {
      service.userRoles = ['ADMIN', 'USER'];
      expect(service.getRoles()).toEqual(['ADMIN', 'USER']);
    });

    it('should return empty array by default', () => {
      expect(service.getRoles()).toEqual([]);
    });
  });

  describe('getAdminRoles', () => {
    it('should return role names from userAccessRoles', () => {
      service.userAccessRoles = [
        { roleId: 1, roleName: 'ADMIN' },
        { roleId: 2, roleName: 'VIEWER' },
      ];
      expect(service.getAdminRoles()).toEqual(['ADMIN', 'VIEWER']);
    });

    it('should return empty array when no access roles', () => {
      service.userAccessRoles = [];
      expect(service.getAdminRoles()).toEqual([]);
    });
  });

  describe('getUserAccessRoles', () => {
    it('should return role names', () => {
      service.userAccessRoles = [{ roleId: 1, roleName: 'CASE_IQ_MONITORING' }];
      expect(service.getUserAccessRoles()).toEqual(['CASE_IQ_MONITORING']);
    });
  });

  describe('ssoLogout', () => {
    it('should clear sessionStorage', () => {
      sessionStorage.setItem('accessToken', 'test');
      sessionStorage.setItem('refreshToken', 'test2');
      service.ssoLogout();
      expect(sessionStorage.getItem('accessToken')).toBeNull();
      expect(sessionStorage.getItem('refreshToken')).toBeNull();
    });
  });

  describe('getValidToken', () => {
    it('should call ssoLogout when token is expired', async () => {
      spyOn(service, 'ssoLogout');
      // Set expire time far in the past
      sessionStorage.setItem('accessTokenExpireTime', '1000');
      await service.getValidToken();
      expect(service.ssoLogout).toHaveBeenCalled();
    });

    it('should call ssoLogout when past max time', async () => {
      spyOn(service, 'ssoLogout');
      // Set expire time way in the past (past the 3-hour window)
      const now = Math.floor(Date.now() / 1000);
      sessionStorage.setItem(
        'accessTokenExpireTime',
        String(now - 4 * 60 * 60),
      );
      await service.getValidToken();
      expect(service.ssoLogout).toHaveBeenCalled();
    });
  });

  describe('getUserId', () => {
    it('should set localhost defaults', async () => {
      // On localhost, getUserId sets defaults
      await service.getUserId();
      expect(service.username).toBe('JASLOOP');
      expect(service.userId).toBe('jasloop');
      expect(service.authUrl).toBe('http://localhost:8080/api/');
    });
  });
});
