import { Component, OnInit } from '@angular/core';
import { DataService } from '../providers/data.service';
import { DestroyManager } from '../providers/destroy-manager.service';
import { ApiHttpService } from '../providers/http.service';
import { AuthenticationService } from '../providers/authentication.service';

@Component({
  selector: 'app-custom-revenue',
  templateUrl: './custom-revenue.component.html',
  styleUrl: './custom-revenue.component.css',
  providers: [DestroyManager],
})
export class CustomRevenueComponent implements OnInit {
  roles: string[] = [];
  constructor(
    private dataService: DataService,
    private destroyManager: DestroyManager,
    private http: ApiHttpService,
    private authService: AuthenticationService
  ) {}
  ngOnInit(): void {
    this.getErrorSummaryPeriodStatus();
    // this.getUserId();
    this.roles = this.authService.getRoles();
    console.log(this.roles);
    this.getDefaultTabIndex();
    this.getAssignmentUsers();
  }

  rolTotals: { [key: string]: number } = {
    XXCFIR_REV_INTERFACE_ALL: 0,
    XXCFIR_REVENUE_EXTRACT_ALL: 0,
    XXCFIR_REVENUE_DIST_ALL: 0,
    XXCFIR_ROL_XLA_SUMMARY: 0,
    XLA_AE_HEADERS: 0,
  };

  standardRevenueUrl: { [key: string]: string } = {
    summaryUrl: 'standard-revenue-errors-summary',
    detailsUrl: 'standard-revenue-error-details',
    filteredDetailsUrl: 'standard-revenue-error-details-filtered',
    summaryUpdateUrl: 'standard-revenue-summary-update',
    webexMessageUrl: 'send-message-revenue-accounting',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  standardRevenueTotals: { [key: string]: number } = {
    Adjustments: 0,
    Transactions: 0,
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

  accrualsTotals: { [key: string]: number } = {
    '1.Payload Inbound Error': 0,
    '2.Bill Ahead Of TSV': 0,
    '3.Accrual Process': 0,
    '4.Account Distributions': 0,
    '5.Account Summarization': 0,
    '6.Downstream Publish': 0,
  };

  accountsTotals: { [key: string]: number } = {
    '27041': 0,
  };

  formatStandardRevenueSteps = Object.keys(this.standardRevenueTotals).map(
    (key) => ({
      label: key,
      impact: key,
    })
  );

  formattedAccrualsSteps = Object.keys(this.accrualsTotals).map((key) => ({
    label: key,
    impact: key,
  }));

  formattedAccountsSteps = Object.keys(this.accountsTotals).map((key) => ({
    label: key,
    impact: key,
  }));

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

  assignmentUsers: any;

  getAssignmentUsers() {
    this.http
      .get('summary-assignment-users', this.destroyManager)
      .subscribe((data) => {
        this.assignmentUsers = data;
        this.dataService.setAssignmentUsers(this.assignmentUsers);
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
      component: 'app-eInvoicing',
      role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
      disabled: true,
    },
    {
      label: 'Account Recon',
      component: 'app-accounts',
      role: ['ADMIN', 'ACCOUNT_RECON'],
    },
    {
      label: 'Operations Controls',
      component: 'app-cr-operations-controls',
      role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
      disabled: true,
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
  }

  rolprocessflowCss: string = `
  .flowchart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: fit-content;
  width: 100%;
}

.slider-title {
  color: #333;
  margin-bottom: 30px;
  margin-top: 0px;
  text-align: center;
  font-weight: 500;
  font-size: 16px;
}

.slider {
  display: flex;
  align-items: center;
  margin: 10px 0;
  position: relative;
}

.slider-bar {
  width: 780px;
  height: 4px;
  background: #16371e43;
  border-radius: 5px;
}

.circle-wrapper {
  position: absolute;
  text-align: center;
  top: -20px;
}

.circle {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #828d9b;
  position: absolute;
  top: 14px;
}

.circle-caption {
  font-size: 12px;
  color: #333;
  text-align: center;
  position: relative;
  top: -12px;
}

.circle-subcaption {
  font-size: 10px;
  color: #000000;
  text-align: center;
  position: relative;
  top: 2px;
  font-weight: bold;
}

/* Specific positioning for each circle-wrapper */
.circle-wrapper-1 {
  left: 0px;
}

.circle-wrapper-2 {
  left: 150px;
}

.circle-wrapper-3 {
  left: 325px;
}

.circle-wrapper-4 {
  left: 490px;
}

.circle-wrapper-5 {
  left: 670px;
}

.circle-1 {
  left: 48px;
}

.circle-2 {
  left: 56px;
}

.circle-3 {
  left: 48px;
}

.circle-4 {
  left: 48px;
}

.circle-5 {
  left: 24px;
}

/* Chevron Arrows */
.chevron {
  position: absolute;
  top: 0px;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 2px 2px 2px 2px;
  border-color: transparent #16371e43 transparent transparent;
  transform: rotate(180deg);
  z-index: 1;
}

.chevron-white {
  position: absolute;
  top: -2px;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 4px 4px 4px 4px;
  border-color: transparent #f7f7f7 transparent transparent;
  transform: rotate(180deg);
}

.chevron-1 {
  left: 130px;
}

.chevron-1a {
  left: 130px;
}

.chevron-2 {
  left: 300px;
}

.chevron-3 {
  left: 480px;
}

.chevron-4 {
  left: 630px;
}
  `;

  accrualsprocessflowCss: string = `
  .flowchart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 82px;
  width: 910px;
  background: #ffffff;
  top: 0px;
  padding-bottom: 20px;
}

.slider-bar {
  margin-top: 40px;
  position: absolute;
  width: fit-content;
  height: 4px;
  background: #16371e43;
  border-radius: 5px;
  z-index: 0;
  display: flex;
  flex-direction: row;
}

.circle-wrapper-loop {
  align-items: center;
  text-align: center;
  position: relative;
  width: 150px;
  top: -40px;
}

.circle-loop {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #828d9b;
  position: relative;
  margin-top: -0px;
  left: 67px;
}

.circle-caption-loop {
  font-size: 12px;
  color: #333;
  text-align: center;
  height: 20px;
}

.circle-subcaption {
  font-size: 10px;
  color: #000;
  font-weight: bold;
}

.chevron-wrapper-loop {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0px; /* Matches the circle wrapper width */
  position: relative;
  top: -105px;
  left: 150px;
}

.chevron,
.chevron-white {
  width: 0;
  height: 0;
  border-style: solid;
  position: relative;
}

.chevron {
  border-width: 2px 2px 2px 2px;
  border-color: transparent #16371e43 transparent transparent;
  transform: rotate(180deg);
  z-index: 1;
  top: 0px;
}

.chevron-white {
  border-width: 8px 8px 8px 8px;
  border-color: transparent #fcfcfc transparent transparent;
  transform: rotate(180deg);
  margin-left: -4px; /* To overlay on the darker chevron */
  top: 0px;
}
  `;

  accountsprocessflowCss: string = `
  .flowchart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 82px;
  width: 170px;
  background: #ffffff;
  top: 0px;
  padding-bottom: 20px;
}

.slider-bar {
  margin-top: 40px;
  position: absolute;
  width: fit-content;
  height: 4px;
  background: #16371e43;
  border-radius: 5px;
  z-index: 0;
  display: flex;
  flex-direction: row;
}

.circle-wrapper-loop {
  align-items: center;
  text-align: center;
  position: relative;
  width: 150px;
  top: -40px;
}

.circle-loop {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #828d9b;
  position: relative;
  margin-top: -0px;
  left: 67px;
}

.circle-caption-loop {
  font-size: 12px;
  color: #333;
  text-align: center;
  height: 20px;
}

.circle-subcaption {
  font-size: 10px;
  color: #000;
  font-weight: bold;
}

.chevron-wrapper-loop {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0px; /* Matches the circle wrapper width */
  position: relative;
  top: -105px;
  left: 150px;
}

.chevron,
.chevron-white {
  width: 0;
  height: 0;
  border-style: solid;
  position: relative;
}

.chevron {
  border-width: 2px 2px 2px 2px;
  border-color: transparent #16371e43 transparent transparent;
  transform: rotate(180deg);
  z-index: 1;
  top: 0px;
}

.chevron-white {
  border-width: 8px 8px 8px 8px;
  border-color: transparent #fcfcfc transparent transparent;
  transform: rotate(180deg);
  margin-left: -4px; /* To overlay on the darker chevron */
  top: 0px;
}
  `;

  standardRevenueprocessflowCss: string = `
  .flowchart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 82px;
  width: 330px;
  background: #ffffff;
  top: 0px;
  padding-bottom: 20px;
}

.slider-bar {
  margin-top: 40px;
  position: absolute;
  width: fit-content;
  height: 4px;
  background: #16371e43;
  border-radius: 5px;
  z-index: 0;
  display: flex;
  flex-direction: row;
}

.circle-wrapper-loop {
  align-items: center;
  text-align: center;
  position: relative;
  width: 150px;
  top: -40px;
}

.circle-loop {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #828d9b;
  position: relative;
  margin-top: -0px;
  left: 67px;
}

.circle-caption-loop {
  font-size: 12px;
  color: #333;
  text-align: center;
  height: 20px;
}

.circle-subcaption {
  font-size: 10px;
  color: #000;
  font-weight: bold;
}

.chevron-wrapper-loop {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0px; /* Matches the circle wrapper width */
  position: relative;
  top: -105px;
  left: 150px;
}

.chevron,
.chevron-white {
  width: 0;
  height: 0;
  border-style: solid;
  position: relative;
}

.chevron {
  border-width: 2px 2px 2px 2px;
  border-color: transparent #16371e43 transparent transparent;
  transform: rotate(180deg);
  z-index: 1;
  top: 0px;
}

.chevron-white {
  border-width: 8px 8px 8px 8px;
  border-color: transparent #fcfcfc transparent transparent;
  transform: rotate(180deg);
  margin-left: -4px; /* To overlay on the darker chevron */
  top: 0px;
}
  `;
}
