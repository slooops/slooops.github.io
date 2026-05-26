import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ApiHttpService } from './http.service';
import { AuthenticationService } from './authentication.service';
import { DestroyManager } from './destroy-manager.service';

describe('ApiHttpService', () => {
  let service: ApiHttpService;
  let httpMock: HttpTestingController;
  let destroyManager: DestroyManager;
  let authServiceSpy: jasmine.SpyObj<AuthenticationService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthenticationService', [
      'getHostUrl',
    ]);
    authServiceSpy.getHostUrl.and.returnValue('http://localhost:8080/api/');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiHttpService,
        DestroyManager,
        { provide: AuthenticationService, useValue: authServiceSpy },
      ],
    });
    service = TestBed.inject(ApiHttpService);
    httpMock = TestBed.inject(HttpTestingController);
    destroyManager = TestBed.inject(DestroyManager);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getHostUrl', () => {
    it('should return the host URL from auth service', () => {
      expect(service.getHostUrl()).toBe('http://localhost:8080/api/');
    });
  });

  describe('get', () => {
    it('should make GET request with correct URL', () => {
      service.get('test-endpoint', destroyManager).subscribe((data: any) => {
        expect(data.result).toBe('success');
      });

      const req = httpMock.expectOne('http://localhost:8080/api/test-endpoint');
      expect(req.request.method).toBe('GET');
      req.flush({ result: 'success' });
    });

    it('should cancel request on destroy', () => {
      let completed = false;
      service.get('test-endpoint', destroyManager).subscribe({
        complete: () => (completed = true),
      });

      destroyManager.ngOnDestroy();

      const req = httpMock.match('http://localhost:8080/api/test-endpoint');
      // Request was cancelled
      expect(completed).toBe(true);
    });
  });

  describe('post', () => {
    it('should make POST request with data', () => {
      const postData = { name: 'test', value: 42 };

      service.post<any>('create-item', postData).subscribe((data: any) => {
        expect(data.id).toBe(1);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/create-item');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(postData);
      req.flush({ id: 1 });
    });
  });

  describe('put', () => {
    it('should make PUT request with data', () => {
      const putData = { name: 'updated' };

      service
        .put('update-item', putData, destroyManager)
        .subscribe((data: any) => {
          expect(data.success).toBe(true);
        });

      const req = httpMock.expectOne('http://localhost:8080/api/update-item');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(putData);
      req.flush({ success: true });
    });
  });

  describe('delete', () => {
    it('should make DELETE request', () => {
      service
        .delete('delete-item/123', destroyManager)
        .subscribe((data: any) => {
          expect(data.deleted).toBe(true);
        });

      const req = httpMock.expectOne(
        'http://localhost:8080/api/delete-item/123',
      );
      expect(req.request.method).toBe('DELETE');
      req.flush({ deleted: true });
    });
  });
});
