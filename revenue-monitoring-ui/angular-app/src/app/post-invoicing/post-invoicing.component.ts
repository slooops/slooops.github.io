import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../providers/authentication.service';
import { DataService } from '../providers/data.service';
import { DestroyManager } from '../providers/destroy-manager.service';
import { ApiHttpService } from '../providers/http.service';

@Component({
  selector: 'app-post-invoicing',
  templateUrl: './post-invoicing.component.html',
  styleUrl: './post-invoicing.component.css',
  providers: [DestroyManager],
})
export class PostInvoicingComponent implements OnInit {
  constructor(
    private dataService: DataService,
    private destroyManager: DestroyManager,
    private http: ApiHttpService,
    private authService: AuthenticationService
  ) {}

  roles: string[] = [];
  ngOnInit(): void {
    this.getErrorSummaryPeriodStatus();
    this.roles = this.authService.getRoles();
  }

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
}
