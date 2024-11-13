import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';

@Component({
  selector: 'app-invoicing',
  templateUrl: './invoicing.component.html',
  styleUrls: ['./invoicing.component.css'],
})
export class InvoicingComponent implements OnInit {
  constructor(private http: ApiHttpService) {}
  preInvoicingProcessFlowHtml: string = '';
  preInvoicingProcessFlowcss: string = '';
  ngOnInit(): void {
    this.getErrorSummaryPeriodStatus();
  }

  preInvoicingTotals: { [key: string]: number } = {
    '1 - SBP Staging': 0,
    '2 - Invoice Orchestration Layer': 0,
  };

  autoInvoicingTotals: { [key: string]: number } = {
    '3 - Auto Invoice': 0,
  };

  periodStatus: any;

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

  getErrorSummaryPeriodStatus() {
    this.http.get('monitoring-period-status').subscribe((data: any) => {
      this.periodStatus = data;
    });
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
}
