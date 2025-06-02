import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { DataService } from '../providers/data.service';
import { DestroyManager } from '../providers/destroy-manager.service';
import { AuthenticationService } from '../providers/authentication.service';
import { MenuService } from '../providers/menu.service';
import { Validators } from '@angular/forms';

@Component({
  selector: 'app-gl-posting',
  templateUrl: './gl-posting.component.html',
  styleUrl: './gl-posting.component.css',
  providers: [DestroyManager],
})
export class GlPostingComponent implements OnInit {
  constructor(
    private dataService: DataService,
    private destroyManager: DestroyManager,
    private authService: AuthenticationService,
    private menuService: MenuService
  ) {}
  roles: string[] = [];

  ngOnInit() {
    this.getErrorSummaryPeriodStatus();
    this.roles = this.authService.getRoles();
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

  glTotals: { [key: string]: number } = {
    '2 - GL Interface': 0,
  };

  glFilters: {
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
      columnName: 'LEDGER_NAME',
      formControlName: 'ledgerName',
      type: 'select',
      subAppMapping: false,
    },
    {
      formControlName: 'glBatchName',
      columnName: 'GL_BATCH_NAME',
      type: 'text',
      subAppMapping: false,
    },
    {
      formControlName: 'accountSeg',
      columnName: 'ACCOUNT_SEG',
      type: 'text',
      subAppMapping: false,
    },
  ];

  glKeysToMap: string[] = [
    'PERIOD_NAME',
    'APPLICATION_NAME',
    'PROCESS_FLOW',
    'LEDGER_NAME',
    'GL_BATCH_NAME',
    'TRANSACTION_DATE',
  ];

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
      label: 'Ledger Name',
      sourceKey: 'LEDGER_NAME',
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

  skippedWords: string[] = ['IOL', 'AR', 'ID'];

  glUrls: { [key: string]: string } = {
    summaryUrl: 'gl-error-summary',
    detailsUrl: 'gl-error-details',
    filteredDetailsUrl: 'gl-details-filtered',
    summaryUpdateUrl: 'gl-summary-update',
    webexMessageUrl: 'send-message-gl',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  formattedglSteps = Object.keys(this.glTotals).map((key) => ({
    label: this.formatLabel(key),
    impact: key,
  }));

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

  periodStatus: any;

  getErrorSummaryPeriodStatus() {
    this.dataService
      .getMonitoringPeriodStatus(this.destroyManager)
      .subscribe((data: any) => {
        this.periodStatus = data;
      });
  }

  glflowCss: string = `
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
