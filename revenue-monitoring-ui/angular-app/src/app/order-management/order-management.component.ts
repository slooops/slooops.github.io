import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  MenuMiniComponent,
  MenuMiniItem,
} from '../shared/menu-mini/menu-mini.component';
import { DestroyManager } from '../providers/destroy-manager.service';
import { ApiHttpService } from '../providers/http.service';
import { DataService } from '../providers/data.service';
import { DatePipe } from '@angular/common';
import { SelectionModel } from '@angular/cdk/collections';
import { AuthenticationService } from '../providers/authentication.service';
import { MenuService } from '../providers/menu.service';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MonitoringDashboardComponent } from '../monitoring-dashboard/monitoring-dashboard.component';
import { provideIcons } from '@ng-icons/core';
import { phosphorSparkleBold } from '@ng-icons/phosphor-icons/bold';
import { WipsComponent } from '../wips/wips.component';

export interface UserContext {
  username: string;
  userId: string;
  roles: string[];
  apiUrl: string;
  assignmentUsersFilterKey: string;
}

@Component({
  selector: 'app-order-management',
  templateUrl: './order-management.component.html',
  styleUrl: './order-management.component.css',
  providers: [
    DestroyManager,
    provideIcons({
      phosphorSparkleBold,
    }),
  ],
  imports: [
    CommonModule,
    MatTabsModule,
    MonitoringDashboardComponent,
    WipsComponent,
    MenuMiniComponent,
  ],
  standalone: true,
})
export class OrderManagementComponent {
  private userName: string = '';

  constructor(
    http: ApiHttpService,
    private destroyManager: DestroyManager,
    private dataService: DataService,
    private datePipe: DatePipe,
    protected authService: AuthenticationService,
    private menuService: MenuService,
    private route: ActivatedRoute,
  ) {
    this.http = http;
    // Initialize roles and user context in constructor so they're available before template renders
    this.roles = this.authService.getUserAccessRoles();
    this.userName = this.authService.getUserName();
    this.userContextData = {
      username: this.authService.getUserName(),
      userId: this.authService.getUserID(),
      roles: this.roles,
      apiUrl: this.authService.getHostUrl(),
      assignmentUsersFilterKey: 'ORDER_MANAGEMENT',
    };
  }
  protected http: ApiHttpService;
  summaryDataSource: any;
  detailsDataSource: any;
  selection = new SelectionModel<any>(true, []);
  roles: string[] = [];
  userContextData: UserContext;

  ngOnInit(): void {
    this.getErrorSummaryPeriodStatus();
    this.getDefaultTabIndex();

    // Handle tab query param from side-nav
    this.route.queryParams.subscribe((params) => {
      const tabSlug = params['tab'];
      if (tabSlug) {
        const idx = this.filteredTabs.findIndex(
          (t) => t.label.toLowerCase().replace(/\s+/g, '-') === tabSlug,
        );
        if (idx >= 0) {
          this.selectedIndex = idx;
          this.onTabChange(idx);
        }
      }
    });

    // Log initial tab visit
    if (this.filteredTabs.length > 0) {
      this.logTabVisit(this.filteredTabs[0]?.label);
    }
  }

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

  fieldConfig = [
    {
      controlName: 'timeStamp',
      label: 'Timestamp',
      sourceKey: 'timestamp',
      disabled: true,
    },
    {
      controlName: 'scneario',
      label: 'Scenario',
      sourceKey: 'scenario',
      disabled: true,
    },
    {
      controlName: 'dataSource',
      label: 'Data Source',
      sourceKey: 'data_source',
      disabled: true,
    },
    {
      controlName: 'database',
      label: 'Database',
      sourceKey: 'database',
      disabled: true,
    },
    {
      controlName: 'totalCount',
      label: 'Total Count',
      sourceKey: 'total_count',
      disabled: true,
    },
    {
      controlName: 'aging',
      label: 'Aging',
      sourceKey: 'aging',
      disabled: true,
    },
    {
      controlName: 'assignedTo',
      label: 'Assigned To',
      sourceKey: 'assigned_to',
      disabled: 'dynamic',
      validators: [Validators.required],
    },
    {
      controlName: 'status',
      label: 'Status',
      sourceKey: 'status',
      options: [
        { value: 'In Progress', label: 'In Progress' },
        { value: 'Closed', label: 'Closed' },
      ],
      validators: [Validators.required],
    },
    { controlName: 'comments', label: 'Comments', sourceKey: 'comments' },
  ];

  omImportUrls: { [key: string]: string } = {
    summaryUrl: 'om-import-summary',
    detailsUrl: 'om-import-details',
    filteredDetailsUrl: 'om-import-details-filtered',
    summaryUpdateUrl: 'om-import-summary-update',
    webexMessageUrl: '',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  omImportFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'category',
      formControlName: 'category',
      type: 'select',
      subAppMapping: false,
    },
  ];

  omHoldsUrls: { [key: string]: string } = {
    summaryUrl: 'om-holds-summary',
    detailsUrl: 'om-holds-details',
    filteredDetailsUrl: 'om-holds-details-filtered',
    summaryUpdateUrl: 'om-holds-summary-update',
    webexMessageUrl: '',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  omHoldsFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'sub_category',
      formControlName: 'subCategory',
      type: 'select',
      subAppMapping: false,
    },
  ];

  omBookingsUrls: { [key: string]: string } = {
    summaryUrl: 'om-bookings-summary',
    detailsUrl: 'om-bookings-details',
    filteredDetailsUrl: 'om-bookings-details-filtered',
    summaryUpdateUrl: 'om-bookings-summary-update',
    webexMessageUrl: '',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  omBookingsFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'sub_category',
      formControlName: 'subCategory',
      type: 'select',
      subAppMapping: false,
    },
  ];

  omWorkflowUrls: { [key: string]: string } = {
    summaryUrl: 'om-workflow-summary',
    detailsUrl: 'om-workflow-details',
    filteredDetailsUrl: 'om-workflow-details-filtered',
    summaryUpdateUrl: 'om-workflow-summary-update',
    webexMessageUrl: '',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  omWorkflowFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'sub_category',
      formControlName: 'subCategory',
      type: 'select',
      subAppMapping: false,
    },
    {
      columnName: 'category',
      formControlName: 'category',
      type: 'select',
      subAppMapping: false,
    },
  ];

  omProcessingUrls: { [key: string]: string } = {
    summaryUrl: 'om-processing-summary',
    detailsUrl: 'om-processing-details',
    filteredDetailsUrl: 'om-processing-details-filtered',
    summaryUpdateUrl: 'om-processing-summary-update',
    webexMessageUrl: '',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  omProcessingFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'sub_category',
      formControlName: 'subCategory',
      type: 'select',
      subAppMapping: false,
    },
  ];

  omDistributionUrls: { [key: string]: string } = {
    summaryUrl: 'om-distribution-summary',
    detailsUrl: 'om-distribution-details',
    filteredDetailsUrl: 'om-distribution-details-filtered',
    summaryUpdateUrl: 'om-distribution-summary-update',
    webexMessageUrl: '',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  omDistributionFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'sub_category',
      formControlName: 'subCategory',
      type: 'select',
      subAppMapping: false,
    },
    {
      columnName: 'category',
      formControlName: 'category',
      type: 'select',
      subAppMapping: false,
    },
  ];

  omAttributionUrls: { [key: string]: string } = {
    summaryUrl: 'om-attribution-summary',
    detailsUrl: 'om-attribution-details',
    filteredDetailsUrl: 'om-attribution-details-filtered',
    summaryUpdateUrl: 'om-attribution-summary-update',
    webexMessageUrl: '',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  omAttributionFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'head_1',
      formControlName: 'head1',
      type: 'select',
      subAppMapping: false,
    },
  ];

  omJobsUrls: { [key: string]: string } = {
    summaryUrl: 'om-jobs-summary',
    detailsUrl: 'om-jobs-details',
    filteredDetailsUrl: 'om-jobs-details-filtered',
    summaryUpdateUrl: 'om-jobs-summary-update',
    webexMessageUrl: '',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  omJobsFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'head_1',
      formControlName: 'head1',
      type: 'select',
      subAppMapping: false,
    },
  ];

  periodStatus: any;

  getErrorSummaryPeriodStatus() {
    this.dataService.periodStatus$.subscribe((data: any) => {
      if (data) {
        this.periodStatus = {
          ...data,
          lastUpdated: new Date().toLocaleString(),
        };
      }
    });
  }

  dateTransform(dateString: string): string {
    return this.datePipe.transform(dateString, 'MM/dd/yyyy');
  }

  visibleTabs: {
    label: string;
    component: string;
    role: string[];
    disabled?: boolean;
  }[] = [
    {
      label: 'Imports',
      component: 'app-imports',
      role: ['ADMIN', 'MONITORING_OM', 'MONITORING_OM_ADMIN'],
    },
    {
      label: 'Holds',
      component: 'app-holds',
      role: ['ADMIN', 'MONITORING_OM', 'MONITORING_OM_ADMIN'],
    },
    {
      label: 'Bookings',
      component: 'app-bookings',
      role: ['ADMIN', 'MONITORING_OM', 'MONITORING_OM_ADMIN'],
    },
    {
      label: 'Workflow',
      component: 'app-workflow',
      role: ['ADMIN', 'MONITORING_OM', 'MONITORING_OM_ADMIN'],
    },
    {
      label: 'Processing',
      component: 'app-processing',
      role: ['ADMIN', 'MONITORING_OM', 'MONITORING_OM_ADMIN'],
    },
    {
      label: 'Distribution',
      component: 'app-distribution',
      role: ['ADMIN', 'MONITORING_OM', 'MONITORING_OM_ADMIN'],
    },
    {
      label: 'Attribution',
      component: 'app-attribution',
      role: ['ADMIN', 'MONITORING_OM', 'MONITORING_OM_ADMIN'],
    },
    {
      label: 'Jobs',
      component: 'app-jobs',
      role: ['ADMIN', 'MONITORING_OM', 'MONITORING_OM_ADMIN'],
    },
    {
      label: 'DFM',
      component: 'app-wips',
      role: [
        'ADMIN',
        'MONITORING_OM',
        'MONITORING_OM_ADMIN',
        'MONITORING_WIPS',
        'MONITORING_WIPS_ADMIN',
      ],
    },
  ];

  selectedIndex: number = 0;
  filteredTabs: { label: string; component: string; disabled?: boolean }[] = [];

  getDefaultTabIndex() {
    this.filteredTabs = this.visibleTabs.filter((tab) =>
      tab.role.some((role) => this.roles.includes(role)),
    );
  }

  get menuItems(): MenuMiniItem[] {
    return this.filteredTabs.map((t) => ({
      label: t.label,
      disabled: t.disabled,
    }));
  }

  onGridMenuItemClick(index: number): void {
    this.onTabChange(index);
  }

  onTabChange(index: number) {
    this.selectedIndex = index;
    const newHeader = `Continuous Monitoring > Order Management > ${this.filteredTabs[index]?.label}`;
    this.menuService.updateHeader(newHeader);
    // Update last updated timestamp on tab switch
    if (this.periodStatus) {
      this.periodStatus = {
        ...this.periodStatus,
        lastUpdated: new Date().toLocaleString(),
      };
    }
    // Log tab visit for analytics
    this.logTabVisit(this.filteredTabs[index]?.label);
  }

  /**
   * Logs a tab visit for analytics.
   * Creates a pseudo-route like "/order-management/imports"
   */
  private logTabVisit(tabLabel: string): void {
    if (!tabLabel || !this.userName) return;
    const tabSlug = tabLabel.toLowerCase().replace(/\s+/g, '-');
    const pseudoRoute = `/order-management/${tabSlug}`;
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
}
