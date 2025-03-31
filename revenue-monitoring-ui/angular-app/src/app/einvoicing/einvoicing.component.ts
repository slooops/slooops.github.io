import { Component, OnInit } from '@angular/core';
import { DataService } from '../providers/data.service';
import { AuthenticationService } from '../providers/authentication.service';
import { DestroyManager } from '../providers/destroy-manager.service';
import { ApiHttpService } from '../providers/http.service';
import { MenuService } from '../providers/menu.service';

@Component({
  selector: 'app-einvoicing',
  templateUrl: './einvoicing.component.html',
  styleUrl: './einvoicing.component.css',
})
export class EinvoicingComponent implements OnInit {
  constructor(
    private dataService: DataService,
    private destroyManager: DestroyManager,
    private http: ApiHttpService,
    private authService: AuthenticationService,
    private menuService: MenuService
  ) {}

  roles: string[] = [];
  ngOnInit(): void {
    this.getErrorSummaryPeriodStatus();
    this.roles = this.authService.getRoles();
    this.menuService.updateMenuItems([
      {
        category: 'Period Close Tracking',
        items: [
          {
            label: 'Pre close',
            route: '/period-close-tracking-preclose',
            role: ['ADMIN', 'PERIOD_CLOSE'],
          },
          {
            label: 'Mid close',
            route: '/period-close-tracking-midclose',
            role: ['ADMIN', 'PERIOD_CLOSE'],
          },
        ],
      },
      {
        category: 'Invoice to Cash',
        items: [
          {
            label: 'Pre Invoicing',
            route: '/pre-invoicing',
            role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          },
          {
            label: 'Invoicing',
            route: '/invoicing',
            role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          },
          {
            label: 'Post Invoicing',
            route: '/post-invoicing',
            role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          },
          {
            label: 'eInvoicing',
            route: '/einvoicing',
            role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          },
          {
            label: 'Fusion',
            route: '/fusion',
            role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          },
        ],
      },
      {
        category: 'Revenue Accounting',
        items: [
          {
            label: 'Standard Revenue',
            route: '/standard-revenue',
            role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          },
          {
            label: 'Rol',
            route: '/rol',
            role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          },
          {
            label: 'Accruals',
            route: '/accruals',
            role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          },
          {
            label: 'Accounts',
            route: '/accounts',
            role: ['ADMIN', 'ACCOUNT_RECON'],
          },
        ],
      },
      {
        category: 'GL Posting',
        items: [
          {
            label: 'General Ledger',
            route: '/general-ledger',
            role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          },
        ],
      },
      {
        category: 'Operations Controls',
        items: [
          {
            label: 'Invoice to Cash',
            route: '',
            role: ['ADMIN'],
          },
          {
            label: 'Revenue',
            route: '',
            role: ['ADMIN'],
          },
        ],
      },
    ]);
  }

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

  eInvoicingUrls: { [key: string]: string } = {
    summaryUrl: 'einvoicing-error-summary',
    detailsUrl: 'einvoicing-error-details',
    filteredDetailsUrl: 'einvoicing-error-details-filtered',
    summaryUpdateUrl: 'einvoicing-error-summary-update',
    webexMessageUrl: 'send-message-invoicing',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

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
}
