import { Component, HostBinding, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../providers/data.service';
import { ThemeService } from '../providers/theme.service';
import { AuthenticationService } from '../providers/authentication.service';
import { MenuService } from '../providers/menu.service';
import { ApiHttpService } from '../providers/http.service';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MonitoringDashboardComponent } from '../monitoring-dashboard/monitoring-dashboard.component';
import { CmsComponent } from '../cms/cms.component';
import { LoadingSymbolComponent } from '../loading-symbol/loading-symbol.component';
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

@Component({
  selector: 'app-invoicing',
  templateUrl: './invoicing.component.html',
  styleUrls: ['./invoicing.component.css'],
  imports: [
    CommonModule,
    MatTabsModule,
    MonitoringDashboardComponent,
    CmsComponent,
    LoadingSymbolComponent,
    MenuMiniComponent,
  ],
  standalone: true,
})
export class InvoicingComponent implements OnInit {
  @HostBinding('class.dark-theme') get darkThemeClass() {
    return this.themeService.isDarkMode;
  }

  constructor(
    private dataService: DataService,
    public authService: AuthenticationService,
    private menuService: MenuService,
    private http: ApiHttpService,
    private route: ActivatedRoute,
    public themeService: ThemeService,
  ) {
    // Initialize roles and user context in constructor so they're available before template renders
    this.roles = this.authService.getUserAccessRoles();

    // Initialize userContextData with empty assignment users, will be populated in ngOnInit
    this.userContextData = {
      username: this.authService.getUserName(),
      userId: this.authService.getUserID(),
      roles: this.roles,
      apiUrl: this.authService.getHostUrl(),
      assignmentUsersFilterKey: 'I2C',
    };
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.userName = this.authService.getUserName();
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

  // ─── Auth & User State ────────────────────────────────────────────────────
  // Resolved in constructor to ensure values are available before first render.

  private userName: string = '';
  roles: string[] = [];
  userContextData: UserContext;

  // ─── Period Status ────────────────────────────────────────────────────────
  // Populated via dataService.periodStatus$ subscription in ngOnInit.

  periodStatus: any;

  // ─── Tab & Navigation Config ──────────────────────────────────────────────
  // visibleTabs defines all possible tabs with their role guards.
  // filteredTabs is the role-filtered subset actually rendered.

  visibleTabs: {
    label: string;
    component: string;
    role: string[];
    disabled?: boolean;
  }[] = [
    {
      label: 'Pre-Invoicing',
      component: 'app-pre-invoicing',
      role: [
        'ADMIN',
        'MONITORING_I2C',
        'MONITORING_REVENUE_ACCOUNTING',
        'MONITORING_I2C_ADMIN',
        'MONITORING_GL_AR',
        'MONITORING_GL_AR_ADMIN',
        'MONITORING_AIT',
        'MONITORING_AIT_ADMIN',
        'MONITORING_REVENUE_ACCOUNTING_ADMIN',
      ],
    },
    {
      label: 'Invoicing',
      component: 'app-auto-invoicing',
      role: [
        'ADMIN',
        'MONITORING_I2C',
        'MONITORING_REVENUE_ACCOUNTING',
        'MONITORING_I2C_ADMIN',
        'MONITORING_GL_AR',
        'MONITORING_GL_AR_ADMIN',
        'MONITORING_AIT',
        'MONITORING_AIT_ADMIN',
        'MONITORING_REVENUE_ACCOUNTING_ADMIN',
      ],
    },
    {
      label: 'Post-Invoicing',
      component: 'app-post-invoicing',
      role: [
        'ADMIN',
        'MONITORING_I2C',
        'MONITORING_REVENUE_ACCOUNTING',
        'MONITORING_I2C_ADMIN',
        'MONITORING_GL_AR',
        'MONITORING_GL_AR_ADMIN',
        'MONITORING_AIT',
        'MONITORING_AIT_ADMIN',
        'MONITORING_REVENUE_ACCOUNTING_ADMIN',
      ],
    },
    {
      label: 'eInvoicing',
      component: 'app-eInvoicing',
      role: [
        'ADMIN',
        'MONITORING_I2C',
        'MONITORING_REVENUE_ACCOUNTING',
        'MONITORING_I2C_ADMIN',
        'MONITORING_GL_AR',
        'MONITORING_GL_AR_ADMIN',
        'MONITORING_AIT',
        'MONITORING_AIT_ADMIN',
        'MONITORING_REVENUE_ACCOUNTING_ADMIN',
      ],
    },
    {
      label: 'Fusion',
      component: 'app-fusion',
      role: [
        'ADMIN',
        'MONITORING_I2C',
        'MONITORING_REVENUE_ACCOUNTING',
        'MONITORING_I2C_ADMIN',
        'MONITORING_GL_AR',
        'MONITORING_GL_AR_ADMIN',
        'MONITORING_AIT',
        'MONITORING_AIT_ADMIN',
        'MONITORING_REVENUE_ACCOUNTING_ADMIN',
      ],
    },
    {
      label: 'Credit Check Process',
      component: 'app-credit-card-check',
      role: [
        'ADMIN',
        'MONITORING_I2C',
        'MONITORING_REVENUE_ACCOUNTING',
        'MONITORING_I2C_ADMIN',
        'MONITORING_GL_AR',
        'MONITORING_GL_AR_ADMIN',
        'MONITORING_AIT',
        'MONITORING_AIT_ADMIN',
        'MONITORING_REVENUE_ACCOUNTING_ADMIN',
      ],
    },
    // {
    //   label: 'CMS',
    //   component: 'app-cms',
    //   role: ['ADMIN', 'CMS'],
    // },
  ];

  selectedIndex: number = 0;
  filteredTabs: { label: string; component: string; disabled?: boolean }[] = [];

  // Post-Invoicing has nested pill sub-tabs; index tracks which sub-tab is active.
  postInvoicingSubIndex: number = 0;
  postInvoicingSubTabs: string[] = [
    'CM Amortization',
    'Invoice Delivery',
    'Digital Payments',
    'SRT Process',
    'RPO Extract',
    'PCM Application',
  ];

  get menuItems(): MenuMiniItem[] {
    return this.filteredTabs.map((t) => ({
      label: t.label,
      disabled: t.disabled,
    }));
  }

  // ─── Assignment Dialog Field Config ───────────────────────────────────────
  // Defines the fields rendered in the row-assignment side panel / dialog.
  // Fields with disabled: true are read-only; disabled: 'dynamic' means
  // editability is determined at runtime based on user role.

  fieldConfig = [
    {
      controlName: 'periodName',
      label: 'Period Name',
      sourceKey: 'PERIOD_NAME',
      disabled: true,
    },
    {
      controlName: 'appName',
      label: 'Application Name',
      sourceKey: 'APPLICATION_NAME',
      disabled: true,
    },
    {
      controlName: 'processFlow',
      label: 'Process Flow',
      sourceKey: 'PROCESS_FLOW',
      disabled: true,
    },
    {
      controlName: 'orgName',
      label: 'Organization Name',
      sourceKey: 'ORG_NAME',
      disabled: true,
    },
    {
      controlName: 'creationDate',
      label: 'Transaction Date',
      sourceKey: 'TRANSACTION_DATE',
      disabled: true,
    },
    {
      controlName: 'aging',
      label: 'Aging',
      sourceKey: 'AGING',
      disabled: true,
    },
    {
      controlName: 'assignedTo',
      label: 'Assigned To',
      sourceKey: 'ASSIGNED_TO',
      disabled: 'dynamic',
      validators: [Validators.required],
    },
    { controlName: 'comments', label: 'Comments', sourceKey: 'COMMENTS' },
  ];

  // ─── Keys to Map ──────────────────────────────────────────────────────────
  // Columns surfaced in the summary row header / key display area.
  // Shared across Pre-Invoicing and Auto-Invoicing tabs.

  preAndAutoInvoiceKeysToMap: string[] = [
    'PERIOD_NAME',
    'ORG_NAME',
    'APPLICATION_NAME',
    'PROCESS_FLOW',
    'TRANSACTION_DATE',
  ];

  // ─── Filter Configurations ────────────────────────────────────────────────
  // Each array defines the filter bar for a specific tab / sub-tab.
  // All filters include the standard PROCESS_FLOW + ORG_NAME selects;
  // additional text/select filters are tab-specific.

  preInvoicingFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'PROCESS_FLOW',
      formControlName: 'processFlow',
      type: 'select',
      subAppMapping: false,
    },
    {
      columnName: 'ORG_NAME',
      formControlName: 'orgName',
      type: 'select',
      subAppMapping: false,
    },
    {
      formControlName: 'billNumber',
      columnName: 'BILL_NUMBER',
      type: 'text',
      subAppMapping: false,
    },
    {
      formControlName: 'transactionId',
      columnName: 'TRANSACTION_ID',
      type: 'text',
      subAppMapping: false,
    },
  ];

  autoInvoicingFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'PROCESS_FLOW',
      formControlName: 'processFlow',
      type: 'select',
      subAppMapping: false,
    },
    {
      columnName: 'ORG_NAME',
      formControlName: 'orgName',
      type: 'select',
      subAppMapping: false,
    },
    {
      formControlName: 'transactionId',
      columnName: 'TRANSACTION_ID',
      type: 'text',
      subAppMapping: false,
    },
  ];

  // Shared across CM Amortization, Invoice Delivery, and Digital Payments sub-tabs.
  postInvoicingFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'PROCESS_FLOW',
      formControlName: 'processFlow',
      type: 'select',
      subAppMapping: false,
    },
    {
      columnName: 'ORG_NAME',
      formControlName: 'orgName',
      type: 'select',
      subAppMapping: false,
    },
    {
      formControlName: 'transactionId',
      columnName: 'TRANSACTION_ID',
      type: 'text',
      subAppMapping: false,
    },
  ];

  srtProcessFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'PROCESS_FLOW',
      formControlName: 'processFlow',
      type: 'select',
      subAppMapping: false,
    },
    {
      columnName: 'ORG_NAME',
      formControlName: 'orgName',
      type: 'select',
      subAppMapping: false,
    },
    {
      formControlName: 'subscriptionId',
      columnName: 'SUBSCRIPTION_ID',
      type: 'text',
      subAppMapping: false,
    },
    {
      formControlName: 'transactionList',
      columnName: 'TRANSACTION_LIST',
      type: 'select',
      subAppMapping: false,
    },
  ];

  rpoExtractFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'PROCESS_FLOW',
      formControlName: 'processFlow',
      type: 'select',
      subAppMapping: false,
    },
    {
      columnName: 'ORG_NAME',
      formControlName: 'orgName',
      type: 'select',
      subAppMapping: false,
    },
    {
      formControlName: 'subscriptionId',
      columnName: 'SUBSCRIPTION_ID',
      type: 'text',
      subAppMapping: false,
    },
    {
      formControlName: 'transactionId',
      columnName: 'TRANSACTION_ID',
      type: 'text',
      subAppMapping: false,
    },
  ];

  pcmFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'PROCESS_FLOW',
      formControlName: 'processFlow',
      type: 'select',
      subAppMapping: false,
    },
    {
      columnName: 'ORG_NAME',
      formControlName: 'orgName',
      type: 'select',
      subAppMapping: false,
    },
    {
      formControlName: 'receiptNumber',
      columnName: 'RECEIPT_NUMBER',
      type: 'text',
      subAppMapping: false,
    },
    {
      formControlName: 'bankTraceId',
      columnName: 'BANK_TRACE_ID',
      type: 'text',
      subAppMapping: false,
    },
  ];

  eInvoicingFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'PROCESS_FLOW',
      formControlName: 'processFlow',
      type: 'select',
      subAppMapping: false,
    },
    {
      columnName: 'ORG_NAME',
      formControlName: 'orgName',
      type: 'select',
      subAppMapping: false,
    },
    {
      formControlName: 'transactionId',
      columnName: 'TRANSACTION_ID',
      type: 'text',
      subAppMapping: false,
    },
  ];

  fusionFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'PROCESS_FLOW',
      formControlName: 'processFlow',
      type: 'select',
      subAppMapping: false,
    },
    {
      columnName: 'ORG_NAME',
      formControlName: 'orgName',
      type: 'select',
      subAppMapping: false,
    },
    {
      formControlName: 'orderNumber',
      columnName: 'ORDER_NUMBER',
      type: 'text',
      subAppMapping: false,
    },
    {
      formControlName: 'transactionId',
      columnName: 'TRANSACTION_ID',
      type: 'text',
      subAppMapping: false,
    },
  ];

  creditCardCheckFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'PROCESS_FLOW',
      formControlName: 'processFlow',
      type: 'select',
      subAppMapping: false,
    },
    {
      columnName: 'ORG_NAME',
      formControlName: 'orgName',
      type: 'select',
      subAppMapping: false,
    },
    {
      formControlName: 'orderNumber',
      columnName: 'ORDER_NUMBER',
      type: 'text',
      subAppMapping: false,
    },
    {
      formControlName: 'icmsYN',
      columnName: 'ICMS_Y_N',
      type: 'select',
      subAppMapping: false,
    },
  ];

  // ─── API URL Maps ─────────────────────────────────────────────────────────
  // Each map provides the 7 endpoint slugs consumed by MonitoringDashboardComponent.
  // Empty string disables the feature (e.g. no webexMessageUrl = no Webex button).

  preInvoicingUrls: { [key: string]: string } = {
    summaryUrl: 'pre-invoice-error-summary',
    detailsUrl: 'pre-invoice-error-details',
    filteredDetailsUrl: 'pre-invoice-error-details-filtered',
    summaryUpdateUrl: 'pre-invoice-error-summary-update',
    webexMessageUrl: 'send-message-invoicing',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  autoInvoicingUrls: { [key: string]: string } = {
    summaryUrl: 'auto-invoice-error-summary',
    detailsUrl: 'auto-invoice-error-details',
    filteredDetailsUrl: 'auto-invoice-error-details-filtered',
    summaryUpdateUrl: 'auto-invoice-error-summary-update',
    webexMessageUrl: 'send-message-invoicing',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  // Post-Invoicing sub-tab URL maps
  cmAmortUrls: { [key: string]: string } = {
    summaryUrl: 'post-invoice-error-summary',
    detailsUrl: 'post-invoice-error-details',
    filteredDetailsUrl: 'post-invoice-error-details-filtered',
    summaryUpdateUrl: 'post-invoice-error-summary-update',
    webexMessageUrl: 'send-message-invoicing',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  printUrls: { [key: string]: string } = {
    summaryUrl: 'print-error-summary',
    detailsUrl: 'print-error-details',
    filteredDetailsUrl: 'print-error-details-filtered',
    summaryUpdateUrl: 'print-error-summary-update',
    webexMessageUrl: 'send-message-invoicing',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  creditCardUrls: { [key: string]: string } = {
    summaryUrl: 'credit-card-error-summary',
    detailsUrl: 'credit-card-error-details',
    filteredDetailsUrl: 'credit-card-error-details-filtered',
    summaryUpdateUrl: '',
    webexMessageUrl: '',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  srtProcessUrls: { [key: string]: string } = {
    summaryUrl: 'srt-process-error-summary',
    detailsUrl: 'srt-process-error-details',
    filteredDetailsUrl: 'srt-process-details-filtered',
    summaryUpdateUrl: 'srt-process-summary-update',
    webexMessageUrl: 'send-message-invoicing',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  rpoExtractUrls: { [key: string]: string } = {
    summaryUrl: 'rpo-extract-error-summary',
    detailsUrl: 'rpo-extract-error-details',
    filteredDetailsUrl: 'rpo-extract-details-filtered',
    summaryUpdateUrl: 'rpo-extract-summary-update',
    webexMessageUrl: 'send-message-invoicing',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  pcmApplicationUrls: { [key: string]: string } = {
    summaryUrl: 'pcm-application-summary',
    detailsUrl: 'pcm-application-details',
    filteredDetailsUrl: 'pcm-application-details-filtered',
    summaryUpdateUrl: 'pcm-application-summary-update',
    webexMessageUrl: '',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  // Top-level tab URL maps
  eInvoicingUrls: { [key: string]: string } = {
    summaryUrl: 'einvoicing-error-summary',
    detailsUrl: 'einvoicing-error-details',
    filteredDetailsUrl: 'einvoicing-error-details-filtered',
    summaryUpdateUrl: 'einvoicing-error-summary-update',
    webexMessageUrl: 'send-message-invoicing',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  fusionUrls: { [key: string]: string } = {
    summaryUrl: 'fusion-error-summary',
    detailsUrl: 'fusion-error-details',
    filteredDetailsUrl: 'fusion-error-details-filtered',
    summaryUpdateUrl: 'fusion-error-summary-update',
    webexMessageUrl: 'send-message-invoicing',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  creditCardCheckUrls: { [key: string]: string } = {
    summaryUrl: 'credit-card-check-summary-view',
    detailsUrl: 'credit-card-check-detail-view',
    filteredDetailsUrl: 'credit-card-check-detail-view-filtered',
    summaryUpdateUrl: 'credit-card-check-summary-update',
    webexMessageUrl: '',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  debitCardUrls: { [key: string]: string } = {
    summaryUrl: 'debit-card-error-summary',
    detailsUrl: 'debit-card-error-details',
    filteredDetailsUrl: '',
    summaryUpdateUrl: '',
    webexMessageUrl: '',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  // ─── Event Handlers ───────────────────────────────────────────────────────

  onGridMenuItemClick(index: number): void {
    this.onTabChange(index);
  }

  onTabChange(index: number) {
    this.selectedIndex = index;
    const newHeader = `Continuous Monitoring > Invoice to Cash > ${this.filteredTabs[index]?.label}`;
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

  // ─── Data & Subscription Methods ─────────────────────────────────────────

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

  /** Filters visibleTabs down to only those the current user has a role for. */
  getDefaultTabIndex() {
    this.filteredTabs = this.visibleTabs.filter((tab) =>
      tab.role.some((role) => this.roles.includes(role)),
    );
  }

  /**
   * Logs a tab visit for analytics.
   * Creates a pseudo-route like "/invoice-to-cash/pre-invoicing"
   */
  private logTabVisit(tabLabel: string): void {
    if (!tabLabel || !this.userName) return;
    const tabSlug = tabLabel.toLowerCase().replace(/\s+/g, '-');
    const pseudoRoute = `/invoice-to-cash/${tabSlug}`;
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
