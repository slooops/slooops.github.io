import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, mergeMap, takeUntil } from 'rxjs/operators';
import { AuthenticationService } from './providers/authentication.service';
import { DataService } from './providers/data.service';
import { Subject } from 'rxjs/internal/Subject';
import { DestroyManager } from './providers/destroy-manager.service';
import { MenuService } from './providers/menu.service';
import { SearchContextService } from './search-context.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [DestroyManager],
})
export class AppComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  showNavbar = true;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
    private authService: AuthenticationService,
    private dataService: DataService,
    private destroyManager: DestroyManager,
    private menuService: MenuService,
    private searchContextService: SearchContextService
  ) {}

  menuOpened = false;
  header: string = '';
  userName!: string;
  isHelpDropdownOpen: boolean = false;
  userRoles!: string[];
  isAdmin$!: boolean;
  showMenu: boolean = true;
  menuItems: any[] = [];
  ngOnInit(): void {
    // Initialize properties that depend on injected services
    this.userName = this.authService.getUserName();
    this.userRoles = this.authService.getRoles();
    this.isAdmin$ = this.userRoles.includes('ADMIN');
    this.searchContextService.o2cSearchVisible$.subscribe((isVisible) => {
      this.showNavbar = !isVisible;
    });

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
        mergeMap((route) => route.data),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        this.showNavbar = !data['hideNavbar']; // Hide navbar based on route data
        this.titleService.setTitle(data['title']);
        this.header = data['header'];
        this.dataService.setHeader(data['header']);
        const hiddenRoutes = ['/home', '/error', '/business-insights']; // Define routes where menu should be hidden
        this.showMenu = !hiddenRoutes.includes(this.router.url);
      });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (event.url.includes('/period-close-tracking')) {
          this.menuService.updateHeader(
            'Continuous Monitoring > Pre-Close (Internal)'
          );
        } else if (event.url.includes('/invoice-to-cash')) {
          this.menuService.updateHeader(
            'Continuous Monitoring > Pre-Invoicing'
          );
        } else if (event.url.includes('/revenue-accounting')) {
          this.menuService.updateHeader(
            'Continuous Monitoring > Standard Revenue'
          );
        } else if (event.url.includes('/gl-posting')) {
          this.menuService.updateHeader(
            'Continuous Monitoring > General Ledger'
          );
        } else if (event.url.includes('/business-insights')) {
          this.menuService.updateHeader(
            'Business Insights > Large Deal Tracker'
          );
        } else if (event.url.includes('/order-management')) {
          this.menuService.updateHeader('Order Management > Imports');
        }
      }
    });

    this.dataService
      .getExceptionAssignmentUsers(this.destroyManager)
      .subscribe((data) => {
        this.dataService.setAssignmentUsers(data);
      });

    this.menuItems = [
      {
        label: 'Period Close Tracking',
        route: '/period-close-tracking',
        role: ['ADMIN', 'PERIOD_CLOSE'],
      },
      {
        label: 'Invoice to Cash',
        route: '/invoice-to-cash',
        role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
      },
      {
        label: 'Revenue Accounting',
        route: '/revenue-accounting',
        role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
      },
      {
        label: 'GL Posting',
        route: '/gl-posting',
        role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
      },
      {
        label: 'Operations Controls',
        route: '',
        role: [''],
      },

      // {
      //   category: 'Invoice to Cash',
      //   items: [
      //     {
      //       label: 'Pre Invoicing',
      //       route: '/pre-invoicing',
      //       role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
      //     },
      //     {
      //       label: 'Invoicing',
      //       route: '/invoicing',
      //       role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
      //     },
      //     {
      //       label: 'Post Invoicing',
      //       route: '/post-invoicing',
      //       role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
      //     },
      //     {
      //       label: 'eInvoicing',
      //       route: '/einvoicing',
      //       role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
      //     },
      //     {
      //       label: 'Fusion',
      //       route: '/fusion',
      //       role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
      //     },
      //   ],
      // },
      // {
      //   category: 'Revenue Accounting',
      //   items: [
      //     {
      //       label: 'Standard Revenue',
      //       route: '/standard-revenue',
      //       role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
      //     },
      //     {
      //       label: 'Rol',
      //       route: '/rol',
      //       role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
      //     },
      //     {
      //       label: 'Accruals',
      //       route: '/accruals',
      //       role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
      //     },
      //     {
      //       label: 'Accounts',
      //       route: '/accounts',
      //       role: ['ADMIN', 'ACCOUNT_RECON'],
      //     },
      //   ],
      // },
      // {
      //   category: 'GL Posting',
      //   items: [
      //     {
      //       label: 'General Ledger',
      //       route: '/general-ledger',
      //       role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
      //     },
      //   ],
      // },
      // {
      //   category: 'Operations Controls',
      //   items: [
      //     {
      //       label: 'Invoice to Cash',
      //       route: '',
      //       role: ['ADMIN'],
      //     },
      //     {
      //       label: 'Revenue',
      //       route: '',
      //       role: ['ADMIN'],
      //     },
      //   ],
      // },
    ];

    this.menuService.header$.subscribe((newHeader) => {
      console.log('Header updated in AppComponent:', newHeader);
      this.header = newHeader;
    });
  }

  toggleHelpDropdown(event: MouseEvent) {
    this.isHelpDropdownOpen = !this.isHelpDropdownOpen; // Toggle dropdown visibility
    event.stopPropagation(); // Prevent event bubbling
  }

  stopPropagation(event: MouseEvent) {
    event.stopPropagation(); // Prevent clicks inside dropdown from closing it
  }

  @HostListener('document:click', ['$event'])
  handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.help-dropdown') && !target.closest('.help-button')) {
      this.isHelpDropdownOpen = false; // Close dropdown if click is outside
    }
  }

  logout() {
    this.authService.ssoLogout();
  }

  hasRole$(roles: string[]) {
    return roles.some((role) => this.userRoles.includes(role));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // selectMenu(route: string) {
  //   this.activeRoute = route; // Track selected menu
  //   this.menuOpen = false; // Close menu after selecting
  // }

  // @HostListener('document:click', ['$event'])
  // onClickOutside(event: Event) {
  //   const targetElement = event.target as HTMLElement;
  //   if (!targetElement.closest('.menu-container')) {
  //     this.menuOpen = false;
  //   }
  // }
}
