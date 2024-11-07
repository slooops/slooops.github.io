import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';

@Component({
  selector: 'app-invoicing',
  templateUrl: './invoicing.component.html',
  styleUrls: ['./invoicing.component.css'],
})
export class InvoicingComponent implements OnInit {
  constructor(private http: ApiHttpService) {}
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
    'BILL_NUMBER',
    'TRANSACTION_TYPE',
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
    'SALES_ORDER',
    'INTERFACE_LINE_ID',
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

  preInvoicingUrls: { [key: string]: string } = {
    summaryUrl: 'pre-invoice-error-summary',
    detailsUrl: 'pre-invoice-error-details',
    filteredDetailsUrl: 'pre-invoice-error-details-filtered',
    summaryUpdateUrl: 'pre-invoice-error-summary-update',
    webexMessageUrl: 'send-message-invoicing',
  };

  autoInvoicingUrls: { [key: string]: string } = {
    summaryUrl: 'auto-invoice-error-summary',
    detailsUrl: 'auto-invoice-error-details',
    filteredDetailsUrl: 'auto-invoice-error-details-filtered',
    summaryUpdateUrl: 'auto-invoice-error-summary-update',
    webexMessageUrl: 'send-message-invoicing',
  };

  getErrorSummaryPeriodStatus() {
    this.http.get('monitoring-period-status').subscribe((data: any) => {
      this.periodStatus = data;
    });
  }
}
