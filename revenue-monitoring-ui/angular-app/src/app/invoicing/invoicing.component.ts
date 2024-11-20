import { Component, OnInit } from '@angular/core';
import { DataService } from '../providers/data.service';

@Component({
  selector: 'app-invoicing',
  templateUrl: './invoicing.component.html',
  styleUrls: ['./invoicing.component.css'],
})
export class InvoicingComponent implements OnInit {
  constructor(private dataService: DataService) {}
  preInvoicingProcessFlowHtml: string = '';
  preInvoicingProcessFlowcss: string = '';
  roles: string[] = [];
  ngOnInit(): void {
    this.getErrorSummaryPeriodStatus();
    this.getUserId();
  }

  getUserId() {
    this.dataService.setLoading(true);
    this.dataService.getUserId().subscribe((data) => {
      let username = data['auth_user'];
      this.getUserRoles(username);
    });
  }

  getUserRoles(username: string) {
    this.dataService.getRoles(username).subscribe((data) => {
      this.roles = data['userRoles'];
    });
  }

  preInvoicingTotals: { [key: string]: number } = {
    '1 - SBP Staging': 0,
    '2 - Invoice Orchestration Layer': 0,
  };

  autoInvoicingTotals: { [key: string]: number } = {
    '3 - Auto Invoice': 0,
  };

  eInvoicingTotals: { [key: string]: number } = {
    'ICMS-ADJ': 0,
    XAAS: 0,
    'SAAS-RIMG-ONL': 0,
    'XAAS-CCE': 0,
    'Order Management': 0,
  };
  periodStatus: any;

  summaryInputColumns: string[] = [
    'PERIOD_NAME',
    'APPLICATION_NAME',
    'PROCESS_FLOW',
    'ORG_NAME',
    'AMOUNT',
    'TRANSACTION_DATE',
    'AGING',
    'ASSIGNED_TO',
    'ASSIGNED_DATE',
    'COMMENTS',
  ];

  preInvoicingDetailsColumns: string[] = [
    'PERIOD_NAME',
    'APPLICATION_NAME',
    'PROCESS_FLOW',
    'ORG_NAME',
    'TRANSACTION_TYPE',
    'BILL_NUMBER',
    'SUBSCRIPTION_ID',
    'BILL_TOTAL',
    'PAYLOAD_STATUS',
    'SBP_STAGING_STATUS',
    'IOL_HOLD',
    'IOL_PENDING',
    'IOL_ERROR',
    'AR_INTERFACE',
    'AR_INTERFACE_ERROR',
    'INVOICED',
    'ERROR_MESSAGE',
  ];

  autoInvoicingDetailsColumns: string[] = [
    'PERIOD_NAME',
    'APPLICATION_NAME',
    'PROCESS_FLOW',
    'ORG_NAME',
    'AMOUNT',
    'TRANSACTION_DATE',
    'TRANSACTION_ID',
    'ERROR_MESSAGE',
  ];

  einvoicingSummaryInputColumns: string[] = [
    'PERIOD_NAME',
    'BATCH_SOURCE',
    'ENTITY_NAME',
    'TYPE',
    'USD_AMOUNT',
    'AGING',
    'ASSIGNED_TO',
    'ASSIGNED_DATE',
    'COMMENTS',
  ];

  einvoicingDetailsColumns: string[] = [
    'PERIOD_NAME',
    'BATCH_SOURCE',
    'ENTITY_NAME',
    'TRX_NUMBER',
    'TRX_DATE',
    'TYPE',
    'USD_AMOUNT',
    'RESP_ERR_MSG',
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

  eInvoicingUrls: { [key: string]: string } = {
    summaryUrl: 'einvoicing-error-summary',
    detailsUrl: 'einvoicing-error-details',
    filteredDetailsUrl: '',
    summaryUpdateUrl: '',
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
    this.dataService.getMonitoringPeriodStatus().subscribe((data: any) => {
      this.periodStatus = data;
    });
  }

  activeTabIndex: number = 0;

  onTabChange(index: number) {
    this.activeTabIndex = index;
    // You can trigger data loading here if needed based on the active tab
  }

  invoicingprocessflowCss: string = `
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
  width: 620px;
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
width: 1350px;
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
