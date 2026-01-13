import { Component, OnInit } from '@angular/core';
import { DataService } from '../providers/data.service';
import { DestroyManager } from '../providers/destroy-manager.service';
import { AuthenticationService } from '../providers/authentication.service';
import { ApiHttpService } from '../providers/http.service';
import { MatTabsModule } from '@angular/material/tabs';
import { MonitoringDashboardComponent } from '../monitoring-dashboard/monitoring-dashboard.component';

export interface UserContext {
  username: string;
  userId: string;
  roles: string[];
  apiUrl: string;
  assignmentUsersFilterKey: string;
}

@Component({
  selector: 'app-operations-controls',
  templateUrl: './operations-controls.component.html',
  styleUrl: './operations-controls.component.css',
  imports: [MatTabsModule, MonitoringDashboardComponent],
  standalone: true,
})
export class OperationsControlsComponent implements OnInit {
  userContextData: UserContext;
  private userName: string = '';
  selectedTabIndex: number = 0;
  tabLabels: string[] = [
    'Invoice to Cash',
    'Revenue Accounting',
    'Tax and Customs',
  ];

  constructor(
    private dataService: DataService,
    private destroyManager: DestroyManager,
    protected authService: AuthenticationService,
    private http: ApiHttpService
  ) {
    // Initialize user context in constructor so it's available before child components initialize
    this.userContextData = {
      username: this.authService.getUserName(),
      userId: this.authService.getUserID(),
      roles: this.authService.getRoles(),
      apiUrl: this.authService.getHostUrl(),
      assignmentUsersFilterKey: '',
    };
  }

  ngOnInit() {
    this.userName = this.authService.getUserName();
    this.getErrorSummaryPeriodStatus();
    // Log initial tab visit
    this.logTabVisit(this.tabLabels[0]);
  }

  onTabChange(index: number) {
    this.selectedTabIndex = index;
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
            : word.charAt(0).toUpperCase() + word.slice(1) // Capitalize the first letter otherwise
      )
      .join(' '); // Join words back with spaces
  }

  getErrorSummaryPeriodStatus() {
    this.dataService
      .getMonitoringPeriodStatus(this.destroyManager)
      .subscribe((data: any) => {
        this.periodStatus = data;
      });
  }
}
