import { TestBed } from '@angular/core/testing';
import {
  SearchContextService,
  O2cSearchResult,
  O2cSearchStarted,
} from './search-context.service';

describe('SearchContextService', () => {
  let service: SearchContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SearchContextService],
    });
    service = TestBed.inject(SearchContextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('o2cSearchVisible$', () => {
    it('should default to false', (done) => {
      service.o2cSearchVisible$.subscribe((visible) => {
        expect(visible).toBe(false);
        done();
      });
    });

    it('should emit true after setO2cSearchVisible(true)', (done) => {
      service.setO2cSearchVisible(true);
      service.o2cSearchVisible$.subscribe((visible) => {
        expect(visible).toBe(true);
        done();
      });
    });

    it('should emit false after setO2cSearchVisible(false)', (done) => {
      service.setO2cSearchVisible(true);
      service.setO2cSearchVisible(false);
      service.o2cSearchVisible$.subscribe((visible) => {
        expect(visible).toBe(false);
        done();
      });
    });
  });

  describe('searchPayload$', () => {
    it('should default to null', (done) => {
      service.searchPayload$.subscribe((payload) => {
        expect(payload).toBeNull();
        done();
      });
    });

    it('should emit search payload after emitSearchPayload', (done) => {
      const testPayload: O2cSearchResult = {
        searchType: 'ORDER',
        searchValue: '12345',
        orderId: 'ORD-001',
        subRefIds: ['SUB-1', 'SUB-2'],
        invoiceIds: ['INV-1'],
        subCodes: ['CODE-A'],
      };

      service.emitSearchPayload(testPayload);

      service.searchPayload$.subscribe((payload) => {
        expect(payload).toEqual(testPayload);
        expect(payload!.orderId).toBe('ORD-001');
        expect(payload!.subRefIds.length).toBe(2);
        done();
      });
    });
  });

  describe('searchStarted$', () => {
    it('should default to null', (done) => {
      service.searchStarted$.subscribe((started) => {
        expect(started).toBeNull();
        done();
      });
    });

    it('should emit search started payload', (done) => {
      const testStarted: O2cSearchStarted = {
        searchType: 'INVOICE',
        searchValue: 'INV-999',
        isLoading: true,
      };

      service.emitSearchStarted(testStarted);

      service.searchStarted$.subscribe((started) => {
        expect(started).toEqual(testStarted);
        expect(started!.isLoading).toBe(true);
        done();
      });
    });
  });
});
