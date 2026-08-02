import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.removeItem('fit-dark-mode');
    TestBed.configureTestingModule({
      providers: [ThemeService],
    });
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.removeItem('fit-dark-mode');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isDarkMode', () => {
    it('should return current dark mode state', () => {
      expect(typeof service.isDarkMode).toBe('boolean');
    });
  });

  describe('toggle', () => {
    it('should toggle dark mode on', () => {
      const initial = service.isDarkMode;
      service.toggle();
      expect(service.isDarkMode).toBe(!initial);
    });

    it('should toggle dark mode off after toggling on', () => {
      const initial = service.isDarkMode;
      service.toggle();
      service.toggle();
      expect(service.isDarkMode).toBe(initial);
    });

    it('should persist preference to localStorage', () => {
      service.toggle();
      const stored = localStorage.getItem('fit-dark-mode');
      expect(stored).toBe(String(service.isDarkMode));
    });
  });

  describe('isDarkMode$', () => {
    it('should emit current value on subscribe', (done) => {
      service.isDarkMode$.subscribe((value) => {
        expect(typeof value).toBe('boolean');
        done();
      });
    });

    it('should emit new value after toggle', (done) => {
      const initial = service.isDarkMode;
      let emissions = 0;
      service.isDarkMode$.subscribe((value) => {
        emissions++;
        if (emissions === 2) {
          expect(value).toBe(!initial);
          done();
        }
      });
      service.toggle();
    });
  });

  describe('routeSupportsDarkMode', () => {
    it('should default to false', () => {
      expect(service.routeSupportsDarkMode).toBe(false);
    });

    it('should allow setting to true', () => {
      service.routeSupportsDarkMode = true;
      expect(service.routeSupportsDarkMode).toBe(true);
    });

    it('should force dark mode off when set to false while dark', () => {
      service.routeSupportsDarkMode = true;
      // Toggle dark mode on
      if (!service.isDarkMode) {
        service.toggle();
      }
      expect(service.isDarkMode).toBe(true);
      // Set route doesn't support dark mode
      service.routeSupportsDarkMode = false;
      expect(service.isDarkMode).toBe(false);
    });
  });

  describe('localStorage initialization', () => {
    it('should initialize from localStorage when set to true', () => {
      localStorage.setItem('fit-dark-mode', 'true');
      const freshService = new ThemeService();
      expect(freshService.isDarkMode).toBe(true);
      freshService.ngOnDestroy();
    });

    it('should initialize from localStorage when set to false', () => {
      localStorage.setItem('fit-dark-mode', 'false');
      const freshService = new ThemeService();
      expect(freshService.isDarkMode).toBe(false);
      freshService.ngOnDestroy();
    });
  });

  describe('ngOnDestroy', () => {
    it('should clean up without errors', () => {
      expect(() => service.ngOnDestroy()).not.toThrow();
    });
  });
});
