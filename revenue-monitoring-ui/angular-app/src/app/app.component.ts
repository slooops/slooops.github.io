import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, mergeMap, takeUntil } from 'rxjs/operators';
import { AuthenticationService } from './providers/authentication.service';
import { DataService } from './providers/data.service';
import { ApiHttpService } from './providers/http.service';
import { Subject } from 'rxjs/internal/Subject';
import { DestroyManager } from './providers/destroy-manager.service';
import { MenuService } from './providers/menu.service';
import { SearchContextService } from './search-context.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HelpDataComponent } from './help-data/help-data.component';
import { ChatbotComponent } from './chatbot/chatbot.component';
import { ChatbotService } from './chatbot/chatbot.service';
import { ThemeService } from './providers/theme.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorIdentificationCardBold,
  phosphorEyeBold,
  phosphorBinocularsBold,
  phosphorFolderOpenBold,
  phosphorCalendarCheckBold,
  phosphorInvoiceBold,
  phosphorChartLineUpBold,
  phosphorClipboardTextBold,
  phosphorBookOpenBold,
  phosphorPulseBold,
  phosphorPackageBold,
  phosphorSlidersHorizontalBold,
  phosphorBrainBold,
  phosphorReceiptBold,
  phosphorRepeatBold,
  phosphorLightbulbBold,
  phosphorHeartbeatBold,
  phosphorUserBold,
  phosphorFirstAidKitBold,
  phosphorSquaresFourBold,
  phosphorWarningBold,
  phosphorCrosshairBold,
  phosphorSparkleBold,
  phosphorSunBold,
  phosphorMoonBold,
  phosphorArrowClockwiseBold,
  phosphorClockCounterClockwiseBold,
  phosphorListBold,
  phosphorCaretRightBold,
  phosphorCaretUpBold,
  phosphorCaretDownBold,
  phosphorXBold,
  phosphorRocketBold,
  phosphorMegaphoneSimpleBold,
  phosphorArrowLineDownBold,
  phosphorSirenBold,
  phosphorTrendUpBold,
  phosphorClockBold,
  phosphorChartBarBold,
  phosphorWarningCircleBold,
  phosphorMagnifyingGlassBold,
  phosphorShieldCheckBold,
  phosphorChartPieSliceBold,
  phosphorPresentationChartBold,
} from '@ng-icons/phosphor-icons/bold';
import {
  phosphorIdentificationCardDuotone,
  phosphorEyeDuotone,
  phosphorBinocularsDuotone,
  phosphorFolderOpenDuotone,
  phosphorCalendarCheckDuotone,
  phosphorInvoiceDuotone,
  phosphorChartLineUpDuotone,
  phosphorBookOpenDuotone,
  phosphorPulseDuotone,
  phosphorPackageDuotone,
  phosphorBrainDuotone,
  phosphorReceiptDuotone,
  phosphorRepeatDuotone,
  phosphorLightbulbDuotone,
  phosphorHeartbeatDuotone,
  phosphorFirstAidKitDuotone,
  phosphorListDuotone,
} from '@ng-icons/phosphor-icons/duotone';
import {
  phosphorCheckFatFill,
  phosphorWarningFill,
} from '@ng-icons/phosphor-icons/fill';
import { coolExpand } from '@ng-icons/coolicons';
import { MenuComponent } from './menu/menu.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [
    DestroyManager,
    provideIcons({
      phosphorIdentificationCardBold,
      phosphorEyeBold,
      phosphorBinocularsBold,
      phosphorFolderOpenBold,
      phosphorCalendarCheckBold,
      phosphorInvoiceBold,
      phosphorChartLineUpBold,
      phosphorClipboardTextBold,
      phosphorBookOpenBold,
      phosphorPulseBold,
      phosphorPackageBold,
      phosphorSlidersHorizontalBold,
      phosphorBrainBold,
      phosphorReceiptBold,
      phosphorRepeatBold,
      phosphorLightbulbBold,
      phosphorHeartbeatBold,
      phosphorUserBold,
      phosphorFirstAidKitBold,
      phosphorSquaresFourBold,
      phosphorWarningBold,
      phosphorCrosshairBold,
      phosphorSparkleBold,
      phosphorSunBold,
      phosphorMoonBold,
      phosphorArrowClockwiseBold,
      phosphorClockCounterClockwiseBold,
      phosphorListBold,
      phosphorCaretRightBold,
      phosphorCaretUpBold,
      phosphorCaretDownBold,
      phosphorXBold,
      phosphorIdentificationCardDuotone,
      phosphorEyeDuotone,
      phosphorBinocularsDuotone,
      phosphorFolderOpenDuotone,
      phosphorCalendarCheckDuotone,
      phosphorInvoiceDuotone,
      phosphorChartLineUpDuotone,
      phosphorBookOpenDuotone,
      phosphorPulseDuotone,
      phosphorPackageDuotone,
      phosphorBrainDuotone,
      phosphorReceiptDuotone,
      phosphorRepeatDuotone,
      phosphorLightbulbDuotone,
      phosphorHeartbeatDuotone,
      phosphorFirstAidKitDuotone,
      phosphorListDuotone,
      phosphorRocketBold,
      phosphorMegaphoneSimpleBold,
      phosphorArrowLineDownBold,
      phosphorSirenBold,
      phosphorTrendUpBold,
      phosphorClockBold,
      phosphorChartBarBold,
      phosphorWarningCircleBold,
      phosphorMagnifyingGlassBold,
      phosphorShieldCheckBold,
      phosphorChartPieSliceBold,
      phosphorPresentationChartBold,
      phosphorCheckFatFill,
      phosphorWarningFill,
      coolExpand,
    }),
  ],
  imports: [
    CommonModule,
    RouterModule,
    MatTooltipModule,
    NgIcon,
    // MenuComponent,
    HelpDataComponent,
    ChatbotComponent,
    MenuComponent,
  ],
  standalone: true,
})
export class AppComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  hideNavbar = false;
  showO2cSearch = false;

  constructor(
    public router: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
    private authService: AuthenticationService,
    private dataService: DataService,
    private destroyManager: DestroyManager,
    private menuService: MenuService,
    private searchContextService: SearchContextService,
    private http: ApiHttpService,
    private chatbotService: ChatbotService,
    public themeService: ThemeService,
  ) {}

  menuOpened = false;
  header: string = '';
  subHeader: string = '';
  userName!: string;
  isHelpDropdownOpen: boolean = false;
  userRoles!: string[];
  isAdmin$!: boolean;
  showMenu: boolean = true;
  showCmMenu = false;
  showEspMenu = false;
  showMobileMenu = false;
  showNavMenu = false;
  isChatOpen = false;
  chatbotHidden = false;
  chatApiUrl: string = '';

  get showSidebar(): boolean {
    return (
      !this.router.url.includes('/home') &&
      !(
        this.router.url.includes('/caseiq') &&
        !this.router.url.includes('/caseiq-')
      )
    );
  }

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

    // MONITORING_I2C gets /invoice-to-cash
    if (
      roles.includes('MONITORING_I2C') ||
      roles.includes('MONITORING_I2C_ADMIN')
    ) {
      return '/invoice-to-cash';
    }

    // ACCOUNT_RECON or MONITORING_REVENUE_ACCOUNTING gets /revenue-accounting
    if (
      roles.includes('ACCOUNT_RECON') ||
      roles.includes('MONITORING_REVENUE_ACCOUNTING') ||
      roles.includes('MONITORING_REVENUE_ACCOUNTING_ADMIN')
    ) {
      return '/revenue-accounting';
    }

    // MONITORING_OM gets /order-management
    if (
      roles.includes('MONITORING_OM') ||
      roles.includes('MONITORING_OM_ADMIN')
    ) {
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
    return '/operations-dashboard';
  }

  /**
   * Get the Business Insights header based on user's first available role
   * Returns the header for the first tab the user has access to
   */
  getBusinessInsightsHeader(): string {
    const roles = this.authService.getUserAccessRoles();

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
    if (roles.includes('SUBSCRIPTION_LIFE_CYCLE')) {
      return 'Business Insights > O2C - 360';
    }

    // Default fallback
    return 'Business Insights > Large Deal Tracker';
  }

  userId!: string;
  ngOnInit(): void {
    // Initialize properties that depend on injected services
    this.userName = this.authService.getUserName();
    this.userId = this.authService.getUserID();
    this.userRoles = this.authService.getUserAccessRoles();
    this.chatApiUrl = this.authService.getControlTowerSupportAgentApiUrl();
    this.isAdmin$ = this.userRoles.includes('ADMIN');
    this.searchContextService.o2cSearchVisible$.subscribe((isVisible) => {
      this.showO2cSearch = isVisible;
    });

    this.chatbotService.hidden$.subscribe((hidden) => {
      this.chatbotHidden = hidden;
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
        takeUntil(this.destroy$),
      )
      .subscribe((data) => {
        this.hideNavbar = data['hideNavbar'] ?? false;
        this.showO2cSearch = data['showO2cSearch'] ?? false;
        this.titleService.setTitle(data['title']);
        this.header = data['header'];
        this.subHeader = data['subHeader'] || '';
        this.themeService.routeSupportsDarkMode =
          data['supportsDarkMode'] ?? false;
        this.dataService.setHeader(data['header']);
        const hiddenRoutes = [
          '/operations-dashboard',
          '/error',
          '/business-insights',
        ]; // Define routes where menu should be hidden
        this.showMenu = !hiddenRoutes.includes(this.router.url);
      });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // Log page visit for analytics (fire-and-forget)
        this.logPageVisit(event.urlAfterRedirects || event.url);

        if (event.url.includes('/period-close-tracking')) {
          this.menuService.updateHeader(
            'Continuous Monitoring > Period Close (Internal)',
          );
        } else if (event.url.includes('/invoice-to-cash')) {
          this.menuService.updateHeader(
            'Continuous Monitoring > Invoice to Cash > Pre-Invoicing',
          );
        } else if (event.url.includes('/revenue-accounting')) {
          this.menuService.updateHeader(
            'Continuous Monitoring > Revenue Accounting > Standard Revenue',
          );
        } else if (event.url.includes('/gl-posting')) {
          this.menuService.updateHeader(
            'Continuous Monitoring > General Ledger',
          );
        } else if (event.url.includes('/business-insights')) {
          // Set dynamic header based on user's Business Insights role
          const businessInsightsHeader = this.getBusinessInsightsHeader();
          this.menuService.updateHeader(businessInsightsHeader);
        } else if (event.url.includes('/order-management')) {
          this.menuService.updateHeader(
            'Continuous Monitoring > Order Management > Imports',
          );
        } else if (event.url.includes('/case-iq')) {
          this.menuService.updateHeader('ESP Case Manager > Case IQ');
        } else if (event.url.includes('/i2c-case-analyzer')) {
          this.menuService.updateHeader(
            'ESP Case Manager > Case Analyzer - I2C',
          );
        } else if (event.url.includes('/sbp-case-analyzer')) {
          this.menuService.updateHeader(
            'ESP Case Manager > Case Analyzer - SBP',
          );
        }
      }
    });

    this.dataService
      .getExceptionAssignmentUsers(this.destroyManager)
      .subscribe((data) => {
        this.dataService.setAssignmentUsers(data);
      });

    // Load shared period status on init
    this.dataService.loadPeriodStatus(this.destroyManager);

    this.menuService.header$.subscribe((newHeader) => {
      this.header = newHeader;
    });

    this.menuService.subHeader$.subscribe((newSubHeader) => {
      this.subHeader = newSubHeader;
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
      this.isHelpDropdownOpen = false;
    }
    if (!target.closest('.nav-dropdown') && !target.closest('.menu-item')) {
      this.showCmMenu = false;
      this.showEspMenu = false;
    }
    if (!target.closest('.navbar') && !target.closest('.hamburger')) {
      this.showMobileMenu = false;
    }
    if (!target.closest('.toolbar-nav-menu')) {
      this.showNavMenu = false;
    }
  }

  toggleCmMenu(event: Event) {
    event.stopPropagation();
    this.showCmMenu = !this.showCmMenu;
    this.showEspMenu = false;
  }

  toggleEspMenu(event: Event) {
    event.stopPropagation();
    this.showEspMenu = !this.showEspMenu;
    this.showCmMenu = false;
  }

  toggleMobileMenu(event: Event) {
    event.stopPropagation();
    this.showMobileMenu = !this.showMobileMenu;
  }

  toggleNavMenu(event: Event) {
    event.stopPropagation();
    this.showNavMenu = !this.showNavMenu;
  }

  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
  }

  navigateTo(event: { route: string; queryParams?: Record<string, string> }) {
    if (event.queryParams) {
      this.router.navigate([event.route], { queryParams: event.queryParams });
    } else {
      this.router.navigate([event.route]);
    }
    this.showCmMenu = false;
    this.showEspMenu = false;
    this.showMobileMenu = false;
    this.showNavMenu = false;
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

  /**
   * Logs a page visit for analytics.
   * Fires-and-forgets - doesn't block navigation or show errors to user.
   * Backend uses MERGE to only create one record per user+route+day.
   */
  private logPageVisit(route: string): void {
    // Skip logging for certain routes (error pages, etc.)
    const excludedRoutes = ['/error', '/'];
    if (excludedRoutes.includes(route)) {
      return;
    }

    // Fire-and-forget POST request - don't wait for response
    this.http
      .post('log-page-visit', {
        userName: this.userName,
        pageRoute: route,
      })
      .subscribe({
        // Silently handle success - no UI action needed
        next: () => {},
        // Silently swallow errors - analytics should never interrupt the user
        error: (err) =>
          console.debug('Analytics log failed (non-critical):', err),
      });
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

  routeToAdminPage() {
    if (
      this.hasRole$([
        'ADMIN',
        'I2C_SELF_HEALING_ADMIN',
        'ACCOUNT_RECON_ADMIN',
        'CASE_IQ_AIT_ADMIN',
        'CASE_IQ_CAPITAL_ADMIN',
        'CASE_IQ_FINANCE_IT_ADMIN',
        'CASE_IQ_FPP_ADMIN',
        'CASE_IQ_I2C_ADMIN',
        'CASE_IQ_MANAGER_ADMIN',
        'CASE_IQ_OM_ADMIN',
        'CASE_IQ_P2P_ADMIN',
        'CASE_IQ_SBP_ADMIN',
        'CLO_UPDATE_ADMIN',
        'CMS_ADMIN',
        'DEAL_UPLOAD_ADMIN',
        'I2C_CASE_ANALYZER_ADMIN',
        'ISSUE_APPROVAL_ADMIN',
        'ISSUE_RESOLUTION_ADMIN',
        'LARGE_DEAL_ADMIN',
        'MIDCLOSE_VOLUMES_ADMIN',
        'MONITORING_GL_AR_ADMIN',
        'MONITORING_OM_ADMIN',
        'MONITORING_AIT_ADMIN',
        'MONITORING_I2C_ADMIN',
        'MONITORING_REVENUE_ACCOUNTING_ADMIN',
        'MONITORING_WIPS_ADMIN',
        'SUBSCRIPTION_LIFE_CYCLE_ADMIN',
        'I2C_OPERATIONS_VIEW_ADMIN',
        'PERIOD_CLOSE_ADMIN',
        'SBP_CASE_ANALYZER_ADMIN',
        'SCORECARD_ADMIN',
        'WD0_ADMIN',
        'CASE_IQ_MONITORING_ADMIN',
        'EXEC_VIEW_ADMIN',
      ])
    ) {
      return true;
    }
    return false;
  }
}
