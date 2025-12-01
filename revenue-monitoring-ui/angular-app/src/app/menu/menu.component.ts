import {
  ChangeDetectorRef,
  Component,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';

import { DestroyManager } from '../providers/destroy-manager.service';
import { MenuService } from '../providers/menu.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs';

@Component({
    selector: 'app-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.css'],
    providers: [DestroyManager],
    standalone: false
})
export class MenuComponent implements OnInit, OnChanges {
  @Input() showMenu: boolean = true; // Receive menu visibility state from parent

  menuOpen = false;
  // menuItems: any[] = [];
  activeRoute = ''; // Track the active menu item
  expandedCategories: { [key: string]: boolean } = {}; // Track expanded categories
  header: string = '';
  @Input() menuItems: any[] = [];

  constructor(
    private menuService: MenuService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    console.log('Menu items:', this.menuItems);
    // this.menuService.menuItems$.subscribe((items) => {
    //   this.menuItems = items;
    //   this.cdr.detectChanges();
    //   console.log('Menu items:', this.menuItems);
    // });
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.activatedRoute),
        map((route) => {
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        mergeMap((route) => route.data)
      )
      .subscribe((data) => {
        this.header = data['header'];
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['menuItems']) {
      console.log('Menu items changed:', changes['menuItems']);
    }
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  toggleCategory(category: string | null) {
    if (!category) {
      this.expandedCategories = {};
    } else {
      this.expandedCategories = { [category]: true };
    }
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
