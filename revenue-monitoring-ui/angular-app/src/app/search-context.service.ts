import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SearchContextService {
  private isO2cSearchVisible = new BehaviorSubject<boolean>(false);
  public o2cSearchVisible$ = this.isO2cSearchVisible.asObservable();

  setO2cSearchVisible(isVisible: boolean) {
    this.isO2cSearchVisible.next(isVisible);
  }
}
