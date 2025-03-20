import { Component, OnInit } from '@angular/core';
import { DataService } from '../providers/data.service';
import { DestroyManager } from '../providers/destroy-manager.service';
import { ApiHttpService } from '../providers/http.service';
import { AuthenticationService } from '../providers/authentication.service';
import { MenuService } from '../providers/menu.service';

@Component({
  selector: 'app-invoicing',
  templateUrl: './invoicing.component.html',
  styleUrls: ['./invoicing.component.css'],
  providers: [DestroyManager],
})
export class InvoicingComponent implements OnInit {
  constructor(
    private dataService: DataService,
    private destroyManager: DestroyManager,
    private http: ApiHttpService,
    private authService: AuthenticationService,
    private menuService: MenuService
  ) {}
  preInvoicingProcessFlowHtml: string = '';
  preInvoicingProcessFlowcss: string = '';
  roles: string[] = [];
  ngOnInit(): void {
    this.getErrorSummaryPeriodStatus();
    this.roles = this.authService.getRoles();
    this.getDefaultTabIndex();
    this.menuService.updateMenuItems([
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
    ]);
  }

  preInvoicingTotals: { [key: string]: number } = {
    '1 - SBP Staging': 0,
    '2 - Invoice Orchestration Layer': 0,
  };

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

  cmAmortTotals: { [key: string]: number } = {
    'CM Amortization': 0,
  };

  printTotals: { [key: string]: number } = {
    Print: 0,
  };

  creditCardTotals: { [key: string]: number } = {
    'Credit Card Recurring': 0,
    'Credit Card One Time': 0,
  };

  debitCardTotals: { [key: string]: number } = {
    'Debit Card': 0,
  };

  autoInvoicingTotals: { [key: string]: number } = {
    '3 - Auto Invoice': 0,
  };

  eInvoicingTotals: { [key: string]: number } = {
    Bolton: 0,
    Synchro: 0,
    Esker: 0,
    SmartBill: 0,
    Sovos: 0,
  };

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
    filteredDetailsUrl: '',
    summaryUpdateUrl: '',
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

  transactionsProcessedUrls: { [key: string]: string } = {
    summaryUrl: 'transactions-processed-summary',
    detailsUrl: 'transactions-processed-details',
    filteredDetailsUrl: 'transactions-processed-details-filtered',
    summaryUpdateUrl: '',
    webexMessageUrl: '',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

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

  fusionTotals: { [key: string]: number } = {
    'Order Import': 0,
  };

  formattedFusionSteps = Object.keys(this.fusionTotals).map((key) => ({
    label: this.formatLabel(key),
    impact: key,
  }));

  formattedeInvoicingSteps = Object.keys(this.eInvoicingTotals).map((key) => ({
    label: this.formatLabel(key),
    impact: key,
  }));

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
      label: 'Pre-Invoicing',
      component: 'app-pre-invoicing',
      role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
    },
    {
      label: 'Invoicing',
      component: 'app-auto-invoicing',
      role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
    },
    {
      label: 'Post-Invoicing',
      component: 'app-post-invoicing',
      role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
    },
    {
      label: 'eInvoicing',
      component: 'app-eInvoicing',
      role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
    },
    // {
    //   label: 'CMS',
    //   component: 'app-cms',
    //   role: ['ADMIN', 'CMS'],
    //   disabled: true,
    // },
    {
      label: 'Fusion',
      component: 'app-fusion',
      role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
    },
    // {
    //   label: 'Transactions Processed',
    //   component: 'app-transactions-processed',
    //   role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
    // },
  ];

  selectedIndex: number = 0;
  filteredTabs: { label: string; component: string; disabled?: boolean }[] = [];

  getDefaultTabIndex() {
    this.filteredTabs = this.visibleTabs.filter((tab) =>
      tab.role.some((role) => this.roles.includes(role))
    );
  }

  onTabChange(index: number) {
    this.selectedIndex = index;
    const newHeader = `Continuous Monitoring > ${this.filteredTabs[index]?.label}`;
    console.log('🔹 Tab changed, updating header:', newHeader);
    this.menuService.updateHeader(newHeader);
  }

  invoicingprocessflowCss: string = `
.flowchart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 82px;

}

.slider-title {
  color: #333;
  margin-bottom: 30px;
  margin-top: 0;
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
  width: 460px;
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

  eInvprocessflowCss: string = `
.flowchart-container {
display: flex;
flex-direction: column;
align-items: center;
height: 82px;
width: 760px;
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

  fusionprocessflowCss: string = `
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
}
