import { Component, OnInit, signal } from '@angular/core';
import { DataService } from '../providers/data.service';
import { DestroyManager } from '../providers/destroy-manager.service';
import { AuthenticationService } from '../providers/authentication.service';
import { ApiHttpService } from '../providers/http.service';
import { MatTabsModule } from '@angular/material/tabs';
import { MonitoringDashboardComponent } from '../monitoring-dashboard/monitoring-dashboard.component';
import { ExceptionDetailsComponent } from '../self-healing/exception-details/exception-details.component';
import { provideIcons } from '@ng-icons/core';
import { phosphorSparkleBold } from '@ng-icons/phosphor-icons/bold';
import {
  MenuMiniComponent,
  MenuMiniItem,
} from '../shared/menu-mini/menu-mini.component';

export interface UserContext {
  username: string;
  userId: string;
  roles: string[];
  apiUrl: string;
  assignmentUsersFilterKey: string;
}

interface TabDef {
  label: string;
  key: string;
  role: string;
}

@Component({
  selector: 'app-operations-controls',
  templateUrl: './operations-controls.component.html',
  styleUrl: './operations-controls.component.css',
  standalone: true,
  providers: [
    DestroyManager,
    provideIcons({
      phosphorSparkleBold,
    }),
  ],
  imports: [
    MatTabsModule,
    MonitoringDashboardComponent,
    ExceptionDetailsComponent,
    MenuMiniComponent,
  ],
})
export class OperationsControlsComponent implements OnInit {
  userContextData: UserContext;
  private userName: string = '';
  selectedTabIndex: number = 0;

  private allTabs: TabDef[] = [
    {
      label: 'Invoice to Cash',
      key: 'i2c',
      role: 'MONITORING_OPS_CONTROLS_I2C',
    },
    {
      label: 'Revenue Accounting',
      key: 'rev',
      role: 'MONITORING_OPS_CONTROLS_REVENUE',
    },
    {
      label: 'Tax and Customs',
      key: 'gtc',
      role: 'MONITORING_OPS_CONTROLS_GTC',
    },
  ];

  visibleTabs: TabDef[] = [];
  tabLabels: string[] = [];
  private isAdmin: boolean = false;
  periodInfo = signal<any>(null);
  roles: string[] = [];

  constructor(
    private dataService: DataService,
    private destroyManager: DestroyManager,
    protected authService: AuthenticationService,
    private http: ApiHttpService,
  ) {
    // Initialize user context in constructor so it's available before child components initialize
    this.userContextData = {
      username: this.authService.getUserName(),
      userId: this.authService.getUserID(),
      roles: this.authService.getUserAccessRoles(),
      apiUrl: this.authService.getHostUrl(),
      assignmentUsersFilterKey: '',
    };
  }

  ngOnInit() {
    this.userName = this.authService.getUserName();
    const userRoles: string[] = this.authService.getUserAccessRoles() || [];
    this.roles = userRoles;
    this.isAdmin = userRoles.includes('ADMIN');

    // Filter tabs based on user roles
    this.visibleTabs = this.isAdmin
      ? [...this.allTabs]
      : this.allTabs.filter((t) => userRoles.includes(t.role));
    this.tabLabels = this.visibleTabs.map((t) => t.label);

    this.getErrorSummaryPeriodStatus();
    // Log initial tab visit
    if (this.tabLabels.length > 0) {
      this.logTabVisit(this.tabLabels[0]);
    }
  }

  /** Returns the key of the currently selected visible tab */
  get activeTabKey(): string {
    return this.visibleTabs[this.selectedTabIndex]?.key || '';
  }

  get menuItems(): MenuMiniItem[] {
    const items: MenuMiniItem[] = this.tabLabels.map((label) => ({ label }));
    items.push({ label: 'Deferrals', disabled: true });
    return items;
  }

  onGridMenuItemClick(index: number): void {
    this.onTabChange(index);
  }

  onTabChange(index: number) {
    this.selectedTabIndex = index;
    // Update last updated timestamp on tab switch
    const current = this.periodInfo();
    if (current) {
      this.periodInfo.set({
        ...current,
        lastUpdated: new Date().toLocaleString(),
      });
    }
    this.logTabVisit(this.tabLabels[index]);
  }

  /**
   * Logs a tab visit for analytics.
   * Creates a pseudo-route like "/operations-controls/invoice-to-cash"
   */
  private logTabVisit(tabLabel: string): void {
    if (!tabLabel || !this.userName) return;
    const tabSlug = tabLabel.toLowerCase().replace(/\s+/g, '-');
    const pseudoRoute = `/operations-controls/${tabSlug}`;
    this.http
      .post('log-page-visit', {
        userName: this.userName,
        pageRoute: pseudoRoute,
      })
      .subscribe({
        next: () => {},
        error: (err) => console.debug('Tab analytics log failed:', err),
      });
  }

  preInvoicingFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'ORG_NAME',
      formControlName: 'orgName',
      type: 'select',
      subAppMapping: false,
    },
    {
      formControlName: 'transactionId',
      columnName: 'CUSTOMER_TRX_ID',
      type: 'text',
      subAppMapping: false,
    },
  ];

  revControlsFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'ORG_NAME',
      formControlName: 'orgName',
      type: 'select',
      subAppMapping: false,
    },
    {
      formControlName: 'transactionId',
      columnName: 'CUSTOMER_TRX_ID',
      type: 'text',
      subAppMapping: false,
    },
  ];

  GtcControlsFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'BOOKING_ENTITY_NAME',
      formControlName: 'bookingEntityName',
      type: 'select',
      subAppMapping: false,
    },
    {
      formControlName: 'orderNumber',
      columnName: 'ORDER_NUMBER',
      type: 'text',
      subAppMapping: false,
    },
  ];

  preAndAutoInvoiceKeysToMap: string[] = [
    'PERIOD_NAME',
    'ORG_NAME',
    'APPLICATION_NAME',
    'PROCESS_FLOW',
    'TRANSACTION_DATE',
  ];

  periodStatus: any;

  specialWords: string[] = [
    'name',
    'amount',
    'interface',
    'error',
    'number',
    'total',
    'hold',
    'pending',
    'status',
    'num',
    'year',
    'status',
    'sub',
    'staging',
    'id',
    'line',
  ];

  skippedWords: string[] = ['IOL', 'AR', 'ID'];

  preInvoicingUrls: { [key: string]: string } = {
    summaryUrl: 'i2c-controls-errors-summary',
    detailsUrl: 'i2c-controls-error-details',
    filteredDetailsUrl: 'i2c-controls-error-details-filtered',
    summaryUpdateUrl: '',
    webexMessageUrl: '',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  revControlsUrls: { [key: string]: string } = {
    summaryUrl: 'rev-controls-errors-summary',
    detailsUrl: 'rev-controls-error-details',
    filteredDetailsUrl: 'rev-controls-error-details-filtered',
    summaryUpdateUrl: '',
    webexMessageUrl: '',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  gtcControlsUrls: { [key: string]: string } = {
    summaryUrl: 'gtc-controls-errors-summary',
    detailsUrl: 'gtc-controls-error-details',
    filteredDetailsUrl: 'gtc-controls-error-details-filtered',
    summaryUpdateUrl: '',
    webexMessageUrl: '',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  // Function to format the label
  formatLabel(label: string): string {
    const acronyms = this.skippedWords || [];

    return label
      .toLowerCase() // Convert to lowercase
      .replace(/_/g, ' ') // Replace underscores with spaces
      .split(' ') // Split into words
      .map(
        (word) =>
          acronyms.includes(word.toUpperCase())
            ? word.toUpperCase()
            : word.charAt(0).toUpperCase() + word.slice(1), // Capitalize the first letter otherwise
      )
      .join(' '); // Join words back with spaces
  }

  getErrorSummaryPeriodStatus() {
    this.dataService.periodStatus$.subscribe({
      next: (periodData) => {
        if (periodData) {
          this.periodInfo.set({
            ...periodData,
            lastUpdated: new Date().toLocaleString(),
          });
        }
      },
      error: (error) => {
        console.error('Error loading period info:', error);
        this.periodInfo.set({
          periodName: '',
          periodEndDate: '',
          lastUpdated: new Date().toLocaleString(),
        });
      },
    });
  }
}
