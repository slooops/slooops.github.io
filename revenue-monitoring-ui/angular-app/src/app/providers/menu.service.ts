import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthenticationService } from './authentication.service';

export interface MenuCategory {
  category?: string;
  items?: { label: string; route: string; role: string[] }[];
  label?: string;
  route?: string;
  role?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private menuItems = new BehaviorSubject<MenuCategory[]>([]);
  menuItems$ = this.menuItems.asObservable();

  constructor(private authService: AuthenticationService) {}

  updateMenuItems(menuData: MenuCategory[]) {
    const userRoles = this.authService.getRoles(); // Get user roles

    const filteredMenu = menuData
      .map((menu) => {
        if (menu.category && menu.items) {
          // Filter nested menu items by role
          const filteredItems = menu.items.filter((item) =>
            item.role.some((role) => userRoles.includes(role))
          );
          return filteredItems.length > 0
            ? { ...menu, items: filteredItems }
            : null;
        } else {
          // Filter standalone menu items by role
          return menu.role?.some((role) => userRoles.includes(role))
            ? menu
            : null;
        }
      })
      .filter((menu) => menu !== null); // Remove empty categories

    this.menuItems.next(filteredMenu as MenuCategory[]);
  }
}
