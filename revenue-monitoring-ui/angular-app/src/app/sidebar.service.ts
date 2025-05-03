// sidebar.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  private _isExpanded = new BehaviorSubject<boolean>(true);
  isExpanded$ = this._isExpanded.asObservable();

  setSidebarState(isExpanded: boolean) {
    this._isExpanded.next(isExpanded);
  }
}
