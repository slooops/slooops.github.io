import { TestBed } from '@angular/core/testing';
import { SidebarService } from './sidebar.service';

describe('SidebarService', () => {
  let service: SidebarService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SidebarService],
    });
    service = TestBed.inject(SidebarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isExpanded$', () => {
    it('should default to true', (done) => {
      service.isExpanded$.subscribe((expanded) => {
        expect(expanded).toBe(true);
        done();
      });
    });

    it('should emit false after setSidebarState(false)', (done) => {
      service.setSidebarState(false);
      service.isExpanded$.subscribe((expanded) => {
        expect(expanded).toBe(false);
        done();
      });
    });

    it('should emit true after setSidebarState(true)', (done) => {
      service.setSidebarState(false);
      service.setSidebarState(true);
      service.isExpanded$.subscribe((expanded) => {
        expect(expanded).toBe(true);
        done();
      });
    });
  });

  describe('activeItem$', () => {
    it('should default to Orders', (done) => {
      service.activeItem$.subscribe((item) => {
        expect(item).toBe('Orders');
        done();
      });
    });

    it('should emit new value after setActiveItem', (done) => {
      service.setActiveItem('Invoices');
      service.activeItem$.subscribe((item) => {
        expect(item).toBe('Invoices');
        done();
      });
    });

    it('should handle empty string', (done) => {
      service.setActiveItem('');
      service.activeItem$.subscribe((item) => {
        expect(item).toBe('');
        done();
      });
    });
  });
});
