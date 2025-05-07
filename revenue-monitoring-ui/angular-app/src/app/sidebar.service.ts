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

  private _activeItem = new BehaviorSubject<string>('Orders');
  activeItem$ = this._activeItem.asObservable();

  setActiveItem(item: string) {
    this._activeItem.next(item);
  }
}
