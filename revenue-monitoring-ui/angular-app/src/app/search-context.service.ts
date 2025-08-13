import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface O2cSearchResult {
  searchType: string;
  searchValue: string;
  orderId: string;
  subRefIds: string[];
  invoiceIds: string[];
  subCodes: string[];
}

export interface O2cSearchStarted {
  searchType: string;
  searchValue: string;
  isLoading: boolean;
}

@Injectable({ providedIn: 'root' })
export class SearchContextService {
  private o2cSearchVisible = new BehaviorSubject<boolean>(false);
  public o2cSearchVisible$ = this.o2cSearchVisible.asObservable();

  private searchPayload = new BehaviorSubject<O2cSearchResult | null>(null);
  public searchPayload$ = this.searchPayload.asObservable();

  private searchStarted = new BehaviorSubject<O2cSearchStarted | null>(null);
  public searchStarted$ = this.searchStarted.asObservable();

  setO2cSearchVisible(isVisible: boolean) {
    this.o2cSearchVisible.next(isVisible);
  }

  emitSearchPayload(payload: O2cSearchResult) {
    console.log('Emitting search payload to business insights:', payload);
    this.searchPayload.next(payload);
  }

  emitSearchStarted(payload: O2cSearchStarted) {
    console.log('Emitting search started to clear existing data:', payload);
    this.searchStarted.next(payload);
  }
}
