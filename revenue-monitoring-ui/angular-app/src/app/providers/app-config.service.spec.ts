import { TestBed } from '@angular/core/testing';
import { AppConfigService } from './app-config.service';

describe('AppConfigService', () => {
  let service: AppConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppConfigService],
    });
    service = TestBed.inject(AppConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getApiUrl', () => {
    it('should return a string', () => {
      const url = service.getApiUrl();
      expect(typeof url).toBe('string');
    });

    it('should return a non-empty value', () => {
      const url = service.getApiUrl();
      expect(url.length).toBeGreaterThan(0);
    });
  });
});
