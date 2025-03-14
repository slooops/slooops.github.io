import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private menuItems = new BehaviorSubject<
    { label: string; route: string; role: string[] }[]
  >([]);
  menuItems$ = this.menuItems.asObservable();

  constructor(private authService: AuthenticationService) {}

  updateMenuItems(items: { label: string; route: string; role: string[] }[]) {
    const userRoles = this.authService.getRoles(); // Fetch roles from AuthService
    const filteredItems = items.filter((item) =>
      item.role.some((role) => userRoles.includes(role))
    );
    this.menuItems.next(filteredItems);
  }
}
