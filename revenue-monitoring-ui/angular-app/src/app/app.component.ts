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

  /**
   * Determine the default route based on user roles
   * Priority order: ADMIN > PERIOD_CLOSE > EXCEPTION_* > ACCOUNT_RECON > Other roles
   */
  getDefaultRouteForRoles(roles: string[]): string {
    if (!roles || roles.length === 0) {
      return '/error';
    }

    // ADMIN gets /period-close-tracking
    if (roles.includes('ADMIN')) {
      return '/period-close-tracking';
    }

    // PERIOD_CLOSE gets /period-close-tracking
    if (roles.includes('PERIOD_CLOSE')) {
      return '/period-close-tracking';
    }

    // EXCEPTION_ADMIN or EXCEPTION_READ_ONLY gets /invoice-to-cash
    if (
      roles.includes('EXCEPTION_ADMIN') ||
      roles.includes('EXCEPTION_READ_ONLY')
    ) {
      return '/invoice-to-cash';
    }

    // ACCOUNT_RECON gets /revenue-accounting
    if (roles.includes('ACCOUNT_RECON')) {
      return '/revenue-accounting';
    }

    // ORDER_MANAGEMENT gets /order-management
    if (roles.includes('ORDER_MANAGEMENT')) {
      return '/order-management';
    }

    // Case IQ roles get /esp-home
    if (
      roles.includes('CASE_IQ_MANAGER') ||
      roles.includes('CASE_IQ_OM') ||
      roles.includes('CASE_IQ_SBP') ||
      roles.includes('CASE_IQ_I2C') ||
      roles.includes('CASE_IQ_AIT') ||
      roles.includes('CASE_IQ_FPP') ||
      roles.includes('CASE_IQ_P2P') ||
      roles.includes('CASE_IQ_CAPITAL')
    ) {
      return '/case-iq';
    }

    // Business Insights roles
    if (
      roles.includes('LARGE_DEAL') ||
      roles.includes('WD0') ||
      roles.includes('MIDCLOSE_VOLUMES') ||
      roles.includes('ISSUE_RESOLUTION')
    ) {
      return '/business-insights';
    }

    // Default fallback
    return '/home';
  }

  /**
   * Get the Business Insights header based on user's first available role
   * Returns the header for the first tab the user has access to
   */
  getBusinessInsightsHeader(): string {
    const roles = this.authService.getRoles();

    // Priority order matching the business-insights component tabs
    if (roles.includes('ADMIN') || roles.includes('LARGE_DEAL')) {
      return 'Business Insights > Large Deal Tracker';
    }
    if (roles.includes('WD0')) {
      return 'Business Insights > Midclose Status';
    }
    if (roles.includes('MIDCLOSE_VOLUMES')) {
      return 'Business Insights > Midclose Volumes';
    }
    if (
      roles.includes('ISSUE_RESOLUTION') ||
      roles.includes('ISSUE_APPROVAL')
    ) {
      return 'Business Insights > Active Incidents';
    }
    if (roles.includes('O360')) {
      return 'Business Insights > O2C - 360';
    }

    // Default fallback
    return 'Business Insights > Large Deal Tracker';
  }

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
            'Continuous Monitoring > Period Close (Internal)'
          );
        } else if (event.url.includes('/invoice-to-cash')) {
          this.menuService.updateHeader(
            'Continuous Monitoring > Invoice to Cash > Pre-Invoicing'
          );
        } else if (event.url.includes('/revenue-accounting')) {
          this.menuService.updateHeader(
            'Continuous Monitoring > Revenue Accounting > Standard Revenue'
          );
        } else if (event.url.includes('/gl-posting')) {
          this.menuService.updateHeader(
            'Continuous Monitoring > General Ledger'
          );
        } else if (event.url.includes('/business-insights')) {
          // Set dynamic header based on user's Business Insights role
          const businessInsightsHeader = this.getBusinessInsightsHeader();
          this.menuService.updateHeader(businessInsightsHeader);
        } else if (event.url.includes('/order-management')) {
          this.menuService.updateHeader(
            'Continuous Monitoring > Order Management > Imports'
          );
        } else if (event.url.includes('/case-iq')) {
          this.menuService.updateHeader('ESP Case Manager > Case IQ');
        } else if (event.url.includes('/i2c-case-analyzer')) {
          this.menuService.updateHeader(
            'ESP Case Manager > Case Analyzer - I2C'
          );
        } else if (event.url.includes('/sbp-case-analyzer')) {
          this.menuService.updateHeader(
            'ESP Case Manager > Case Analyzer - SBP'
          );
        }
      }
    });

    this.dataService
      .getExceptionAssignmentUsers(this.destroyManager)
      .subscribe((data) => {
        this.dataService.setAssignmentUsers(data);
      });

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
