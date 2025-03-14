import { Component, OnInit } from '@angular/core';

import { DestroyManager } from '../providers/destroy-manager.service';
import { MenuService } from '../providers/menu.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
  providers: [DestroyManager],
})
export class MenuComponent implements OnInit {
  menuOpen = false;
  menuItems: { label: string; route: string }[] = [];
  activeRoute = ''; // Track the active submenu

  constructor(private menuService: MenuService, private router: Router) {}

  ngOnInit() {
    this.menuService.menuItems$.subscribe((items) => {
      this.menuItems = items;

      // Set first submenu as the default when menu opens
      if (items.length > 0 && !this.activeRoute) {
        this.activeRoute = items[0].route;
        this.router.navigateByUrl(this.activeRoute); // Navigate to first item
      }
    });
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  selectMenu(route: string) {
    this.activeRoute = route; // Track selected menu
    this.menuOpen = false; // Close menu after selecting
  }
}
