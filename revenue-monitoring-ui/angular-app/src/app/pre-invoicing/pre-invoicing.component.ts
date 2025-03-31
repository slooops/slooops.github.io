import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../providers/authentication.service';
import { DataService } from '../providers/data.service';
import { DestroyManager } from '../providers/destroy-manager.service';
import { ApiHttpService } from '../providers/http.service';
import { MenuService } from '../providers/menu.service';

@Component({
  selector: 'app-pre-invoicing',
  templateUrl: './pre-invoicing.component.html',
  styleUrl: './pre-invoicing.component.css',
  providers: [DestroyManager],
})
export class PreInvoicingComponent implements OnInit {
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
}
