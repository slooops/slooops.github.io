import { Component, OnInit } from '@angular/core';
import { DataService } from '../providers/data.service';
import { DestroyManager } from '../providers/destroy-manager.service';
import { AuthenticationService } from '../providers/authentication.service';

@Component({
  selector: 'app-operations-controls',
  templateUrl: './operations-controls.component.html',
  styleUrl: './operations-controls.component.css',
})
export class OperationsControlsComponent implements OnInit {
  constructor(
    private dataService: DataService,
    private destroyManager: DestroyManager,
    protected authService: AuthenticationService
  ) {}

  ngOnInit() {
    this.getErrorSummaryPeriodStatus();
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
