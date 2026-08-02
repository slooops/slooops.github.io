import { TestBed } from '@angular/core/testing';
import { DestroyManager } from './destroy-manager.service';

describe('DestroyManager', () => {
  let service: DestroyManager;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DestroyManager],
    });
    service = TestBed.inject(DestroyManager);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('destroyObservable', () => {
    it('should return an observable', () => {
      expect(service.destroyObservable).toBeDefined();
      expect(service.destroyObservable.subscribe).toBeDefined();
    });
  });

  describe('ngOnDestroy', () => {
    it('should emit on destroy', (done) => {
      service.destroyObservable.subscribe({
        next: () => {
          // Destroy signal received
          done();
        },
      });
      service.ngOnDestroy();
    });

    it('should complete on destroy', (done) => {
      service.destroyObservable.subscribe({
        complete: () => {
          done();
        },
      });
      service.ngOnDestroy();
    });

    it('should not throw when called multiple times', () => {
      service.ngOnDestroy();
      // Second call should not throw since subject is already completed
      expect(() => service.ngOnDestroy()).not.toThrow();
    });
  });
});
