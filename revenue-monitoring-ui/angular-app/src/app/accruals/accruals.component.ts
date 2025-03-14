import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../providers/authentication.service';
import { DataService } from '../providers/data.service';
import { DestroyManager } from '../providers/destroy-manager.service';

@Component({
  selector: 'app-accruals',
  templateUrl: './accruals.component.html',
  styleUrl: './accruals.component.css',
  providers: [DestroyManager],
})
export class AccrualsComponent implements OnInit {
  roles: string[] = [];
  constructor(
    private dataService: DataService,
    private destroyManager: DestroyManager,
    private authService: AuthenticationService
  ) {}
  ngOnInit(): void {
    this.getErrorSummaryPeriodStatus();
    this.roles = this.authService.getRoles();
  }

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

  skippedWords: string[] = ['IOL', 'AR', 'ID', 'GL', 'TSV'];

  accrualsTotals: { [key: string]: number } = {
    '1.Payload Inbound Error': 0,
    '2.Bill Ahead Of TSV': 0,
    '3.Accrual Process': 0,
    '4.Account Distributions': 0,
    '5.Account Summarization': 0,
    '6.Downstream Publish': 0,
  };

  formattedAccrualsSteps = Object.keys(this.accrualsTotals).map((key) => ({
    label: key,
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

  rolAndAccrualsKeysToMap: string[] = [
    'PERIOD_NAME',
    'ORG_NAME',
    'APPLICATION_NAME',
    'PROCESS_FLOW',
    'SEQUENCE_NUM',
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

  periodStatus: any;

  rolSummaryFieldstoRemove: string[] = ['SEQUENCE_NUM'];
  rolDetailsFieldstoRemove: string[] = ['SEQUENCE_NUM'];

  getErrorSummaryPeriodStatus() {
    this.dataService
      .getMonitoringPeriodStatus(this.destroyManager)
      .subscribe((data: any) => {
        this.periodStatus = data;
      });
  }

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
}
