import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
} from '@angular/core';

import { DestroyManager } from '../providers/destroy-manager.service';
import { MenuService } from '../providers/menu.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
  providers: [DestroyManager],
})
export class MenuComponent implements OnInit {
  menuOpen = false;
  menuItems: any[] = [];
  activeRoute = ''; // Track the active menu item
  expandedCategories: { [key: string]: boolean } = {}; // Track expanded categories

  constructor(private menuService: MenuService) {}

  ngOnInit() {
    this.menuService.menuItems$.subscribe((items) => {
      this.menuItems = items;
    });
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  toggleCategory(category: string) {
    this.expandedCategories[category] = !this.expandedCategories[category];
  }

  selectMenu(route: string) {
    this.activeRoute = route; // Track selected menu
    this.menuOpen = false; // Close menu after selecting
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const targetElement = event.target as HTMLElement;
    if (!targetElement.closest('.menu-container')) {
      this.menuOpen = false;
    }
  }
}
