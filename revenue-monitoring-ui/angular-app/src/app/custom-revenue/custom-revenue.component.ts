import { Component, OnInit } from '@angular/core';
import { DataService } from '../providers/data.service';
import { DestroyManager } from '../providers/destroy-manager.service';
import { AuthenticationService } from '../providers/authentication.service';
import { MenuService } from '../providers/menu.service';
import { Validators } from '@angular/forms';

@Component({
    selector: 'app-custom-revenue',
    templateUrl: './custom-revenue.component.html',
    styleUrl: './custom-revenue.component.css',
    providers: [DestroyManager],
    standalone: false
})
export class CustomRevenueComponent implements OnInit {
  roles: string[] = [];
  constructor(
    private dataService: DataService,
    private destroyManager: DestroyManager,
    protected authService: AuthenticationService,
    private menuService: MenuService
  ) {}
  ngOnInit(): void {
    this.getErrorSummaryPeriodStatus();
    this.roles = this.authService.getRoles();
    this.getDefaultTabIndex();
  }

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

  standardRevenueUrl: { [key: string]: string } = {
    summaryUrl: 'standard-revenue-errors-summary',
    detailsUrl: 'standard-revenue-error-details',
    filteredDetailsUrl: 'standard-revenue-error-details-filtered',
    summaryUpdateUrl: 'standard-revenue-summary-update',
    webexMessageUrl: 'send-message-revenue-accounting',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  rolUrls: { [key: string]: string } = {
    summaryUrl: 'rol-errors-summary',
    detailsUrl: 'rol-transaction-data',
    filteredDetailsUrl: 'rol-transaction-data-filter',
    summaryUpdateUrl: 'rol-errors-summary-update',
    webexMessageUrl: 'send-message-revenue-accounting',
    chartTotalsUrl: 'rol-chart-totals',
    chartDetailsUrl: 'rol-chart-details',
  };

  subApplicationMapping = {
    XXCFIR_REV_INTERFACE_ALL: '1. Interface',
    XXCFIR_REVENUE_EXTRACT_ALL: '2. Extraction',
    XXCFIR_REVENUE_DIST_ALL: '3. Distribution',
    XXCFIR_ROL_XLA_SUMMARY: '4. Summarization',
    XLA_AE_HEADERS: '5. SLA',
  };

  standardRevenueFilters: {
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

  rolFilters: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[] = [
    {
      columnName: 'PROCESS_FLOW',
      formControlName: 'processFlow',
      type: 'select',
      subAppMapping: true,
    },
    {
      columnName: 'ORG_NAME',
      formControlName: 'orgName',
      type: 'select',
      subAppMapping: false,
    },
    {
      formControlName: 'orderLineId',
      columnName: 'ORDER_LINE_ID',
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

  accrualsFilters: {
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
      formControlName: 'subref/orderNum',
      columnName: 'SUBREF/ORDER NUMBER',
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

  accountsFilters: {
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
      formControlName: 'subref/orderNum',
      columnName: 'SUBREF/ORDER NUMBER',
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

  skippedWords: string[] = ['IOL', 'AR', 'ID', 'GL', 'TSV'];

  accountsUrls: { [key: string]: string } = {
    summaryUrl: 'tsp-account-summary-view',
    detailsUrl: 'tsp-account-detail-view',
    filteredDetailsUrl: 'accounts-details-filtered',
    summaryUpdateUrl: 'tsp-account-summary-update',
    webexMessageUrl: 'send-message-revenue-accounting',
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
            ? word.toUpperCase() // Keep the word in uppercase if it's in skippedWords
            : word.charAt(0).toUpperCase() + word.slice(1) // Capitalize the first letter otherwise
      )
      .join(' '); // Join words back with spaces
  }

  rolAndAccrualsKeysToMap: string[] = [
    'PERIOD_NAME',
    'ORG_NAME',
    'APPLICATION_NAME',
    'PROCESS_FLOW',
    'SEQUENCE_NUM',
  ];

  periodStatus: any;

  rolSummaryFieldstoRemove: string[] = ['SEQUENCE_NUM'];
  rolDetailsFieldstoRemove: string[] = ['SEQUENCE_NUM'];

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
    'sub',
    'staging',
    'id',
    'line',
    'code',
    'org',
    'unit',
    'process',
  ];

  accrualsUrls: { [key: string]: string } = {
    summaryUrl: 'accruals-summary',
    detailsUrl: 'accruals-details',
    filteredDetailsUrl: 'accruals-details-filtered',
    summaryUpdateUrl: 'accruals-summary-update',
    webexMessageUrl: 'send-message-revenue-accounting',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  getErrorSummaryPeriodStatus() {
    this.dataService
      .getMonitoringPeriodStatus(this.destroyManager)
      .subscribe((data: any) => {
        this.periodStatus = data;
      });
  }

  visibleTabs: {
    label: string;
    component: string;
    role: string[];
    disabled?: boolean;
  }[] = [
    {
      label: 'Standard Revenue',
      component: 'app-standard-revenue',
      role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
    },
    {
      label: 'Revenue Orchestration Layer',
      component: 'app-rol',
      role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
    },
    {
      label: 'Accruals',
      component: 'app-accruals',
      role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
    },

    {
      label: 'Meraki',
      component: 'app-meraki',
      role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
      disabled: true,
    },
    {
      label: 'Clearing Account Balance',
      component: 'app-accounts',
      role: ['ADMIN', 'ACCOUNT_RECON'],
    },
  ];

  selectedIndex: number = 0;
  filteredTabs: { label: string; component: string; disabled?: boolean }[] = [];

  getDefaultTabIndex() {
    this.filteredTabs = this.visibleTabs.filter((tab) =>
      tab.role.some((role) => this.roles.includes(role))
    );

    if (this.filteredTabs.length <= 1) {
      this.selectedIndex = 0;
    }
  }

  onTabChange(index: number) {
    this.selectedIndex = index;
    const newHeader = `Continuous Monitoring > Revenue Accounting > ${this.filteredTabs[index]?.label}`;
    console.log('🔹 Tab changed, updating header:', newHeader);
    this.menuService.updateHeader(newHeader);
  }
}
