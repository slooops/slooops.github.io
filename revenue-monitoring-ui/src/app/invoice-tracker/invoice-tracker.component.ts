import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ApiHttpService } from '../providers/http.service';
import { switchMap, startWith } from 'rxjs/operators';
import { Observable, interval } from 'rxjs';
import { SelectionModel } from '@angular/cdk/collections';
import { DataService } from '../providers/data.service';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-invoice-tracker',
  templateUrl: './invoice-tracker.component.html',
  styleUrls: ['./invoice-tracker.component.css'],
})
export class InvoiceTrackerComponent implements OnInit {
  constructor(
    http: ApiHttpService,
    private router: Router,
    private dataService: DataService
  ) {
    this.http = http;
  }

  ngOnInit(): void {
    this.getOrderLifecycle();
    this.getInvoiceHeader();
    this.getInvoiceLine();
  }

  protected http: ApiHttpService;
  length: number;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  orderLifecycleStatus: OrderLifecycleModel[];
  dataSource: any;

  invoiceHeader: InvoiceHeaderModel[];
  dataSourceHeader: any;

  invoiceLine: InvoiceLineModel[];
  dataSourceLine: any;

  getOrderLifecycle() {
    this.http.get('order-status').subscribe((data: any) => {
      this.orderLifecycleStatus = data;
      this.dataSource = new MatTableDataSource<OrderLifecycleModel>(
        this.orderLifecycleStatus
      );
      this.length = this.orderLifecycleStatus.length;
      this.setSortAndPaginator();
    });
  }

  getInvoiceHeader() {
    this.http.get('invoice-tracker-header').subscribe((data: any) => {
      this.invoiceHeader = data;
      console.log(data);

      this.dataSourceHeader = new MatTableDataSource<InvoiceHeaderModel>(
        this.invoiceHeader
      );
      // this.length = this.invoiceHeader.length;
      // this.setSortAndPaginator();
    });
  }

  getInvoiceLine() {
    this.http.get('invoice-tracker-line').subscribe((data: any) => {
      this.invoiceLine = data;
      console.log(data);

      this.dataSourceLine = new MatTableDataSource<InvoiceLineModel>(
        this.invoiceLine
      );
      // this.length = this.invoiceLine.length;
      // this.setSortAndPaginator();
    });
  }

  formatHeader(column: string): string {
    const replacements = {
      'SO#': 'Order Number',
      'SAF_ID#': 'SAF ID #',
      'SAF-TYPE': 'SAF-Type',
      'SUBSCRIPTION#': 'Subscription #',
    };

    // Check if there's a special replacement for the given column.
    if (replacements[column]) {
      return replacements[column];
    }

    return column
      .replace(/_/g, ' ')
      .replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );
  }

  displayedColumns: string[] = [
    'PROGRAM_NAME',
    'ACCOUNT',
    'SFDC_STATUS',
    'STATUS_AS_OF_DATE',
    'DEAL_ID',
    'SALES_ORDER',
    'EXPECTED_BOOK_DATE',
    'ACTUAL_BOOK_DATE',
    // 'LINE_TYPE',
    'ORDER_STATUS',
    'INVOICING_STATUS',
    'REV_ACCR_STATUS',
    'GL_POSTING_STATUS',
    'HOLD_RELEASE_TARGET_DATE',
    'ACCRUALS_EXECUTION_TIME',
    // 'CURRENCY',
    'ORDER_TOTAL',
    'ORDER_TOTAL_USD',
    'TOTAL_CONTRAC_VALUE',
    'SUBSCRIPTION_ID',
    'INVOICE_DATE',
    'INVOICE_AMOUNT',
    'INVOICE_LINES',
    // 'STATUS',
    'COMMENTS',
    'AGING_BOOKING',
    'AGING_HOLD_RELEASE',
    // 'LAST_UPDATE_DATE',
    // 'ENABLED_FLAG',
    // 'CURRENT_PERIOD_FLAG',
    // 'WEB_ORDER_ID',
    // 'QUOTE_NUMBER',
    // 'CONTEXT',
    // 'TOTAL_LINE_COUNT',
    // 'HEADER_ID',
    // 'ORDER_CREATION_DATE',
    // 'ORDER_LEVEL_HOLD',
    // 'LINE_LEVEL_HOLD',
    // 'CUST_PO_NUMBER',
    'TERM_IN_YEARS',
  ];

  displayedHeaderColumns: string[] = [
    'REQUEST_TYPE',
    'CONTROL_CATEGORY',
    'OPERATING_UNIT',
    'LEDGER_CURRENCY',
    'THRESHOLD_AMOUNT',
    'TRAN_AMOUNT',
    'TRX_NUMBER',
    'BATCH_SOURCE_NAME',
    'TRX_DATE',
    'TRAN_CURRENCY_CODE',
    'USD_AMOUNT',
    'SO#',
    'SUBSCRIPTION#',
    'BILL_NUMBER',
    'SAF_ID#',
    'SAF_TYPE',
    'REASON_CODE',
    'USER_NAME',
  ];

  displayedLinesColumns: string[] = [
    'REQUEST_TYPE',
    'CONTROL_CATEGORY',
    'OPERATING_UNIT',
    'LEDGER_CURRENCY',
    'THRESHOLD_AMOUNT',
    'INTERFACE_LINE_AMOUNT',
    'ORDER_NUMBER',
    'ORDER_LINE_ID',
    'BATCH_SOURCE_NAME',
    'TRANSACTION_CURRENCY_CODE',
    'USD_AMOUNT',
    'CREATION_DATE',
    'SUBSCRIPTION_NUMBER',
    'BILL_NUMBER',
    'WEB_ORDER_ID',
  ];

  headerColumns1 = [
    'BATCH_SOURCE_NAME',
    'CONTROL_CATEGORY',
    'OPERATING_UNIT',
    'LEDGER_CURRENCY',
    'TRAN_AMOUNT',
    'USD Amount',
    'TRX_NUMBER',
    'TRX_DATE',
    'TRAN_CURRENCY_CODE',
    'SO#',
    'SUBSCRIPTION#',
    'BILL_NUMBER',
    'SAF_ID#',
    'SAF-TYPE',
    'REASON_CODE',
    'USER_NAME',
  ];

  headerData1 = [
    {
      BATCH_SOURCE_NAME: 'Order Management',
      CONTROL_CATEGORY: 'INVOICE AMOUNT GREATER THAN THRESHOLD',
      OPERATING_UNIT: 'CISCO UK HOME OPERATING UNIT',
      LEDGER_CURRENCY: 'USD',
      TRAN_AMOUNT: '99,173,878.57',
      'USD Amount': ' $99,173,878.57 ',
      TRX_NUMBER: '9997267710',
      TRX_DATE: '20-Jan-23',
      TRAN_CURRENCY_CODE: 'USD',
      'SO#': '115272618',
      'SUBSCRIPTION#': '',
      BILL_NUMBER: '',
      'SAF_ID#': '',
      'SAF-TYPE': '',
      REASON_CODE: '',
      USER_NAME: '',
    },
    {
      BATCH_SOURCE_NAME: 'Order Management',
      CONTROL_CATEGORY: 'INVOICE AMOUNT GREATER THAN THRESHOLD',
      OPERATING_UNIT: 'CISCO US OPERATING UNIT',
      LEDGER_CURRENCY: 'USD',
      TRAN_AMOUNT: '32,969,475.05',
      'USD Amount': ' $32,969,475.05 ',
      TRX_NUMBER: '98054252',
      TRX_DATE: '13-Jan-23',
      TRAN_CURRENCY_CODE: 'USD',
      'SO#': '107588012',
      'SUBSCRIPTION#': '',
      BILL_NUMBER: '',
      'SAF_ID#': '',
      'SAF-TYPE': '',
      REASON_CODE: '',
      USER_NAME: '',
    },
    {
      BATCH_SOURCE_NAME: 'XAAS',
      CONTROL_CATEGORY: 'INVOICE AMOUNT GREATER THAN THRESHOLD',
      OPERATING_UNIT: 'CISCO US OPERATING UNIT',
      LEDGER_CURRENCY: 'USD',
      TRAN_AMOUNT: ' 33,716,133.56 ',
      'USD Amount': ' $33,716,133.56 ',
      TRX_NUMBER: '6101406321',
      TRX_DATE: '23-Jan-23',
      TRAN_CURRENCY_CODE: 'USD',
      'SO#': '',
      'SUBSCRIPTION#': 'Sub940579',
      BILL_NUMBER: '1000715867678',
      'SAF_ID#': '',
      'SAF-TYPE': '',
      REASON_CODE: '',
      USER_NAME: '',
    },
    {
      BATCH_SOURCE_NAME: 'XAAS',
      CONTROL_CATEGORY: 'INVOICE AMOUNT GREATER THAN THRESHOLD',
      OPERATING_UNIT: 'CISCO US OPERATING UNIT',
      LEDGER_CURRENCY: 'USD',
      TRAN_AMOUNT: ' 72,470,510.35 ',
      'USD Amount': ' $72,470,510.35 ',
      TRX_NUMBER: '6101437414',
      TRX_DATE: '28-Feb-23',
      TRAN_CURRENCY_CODE: 'USD',
      'SO#': '',
      'SUBSCRIPTION#': 'Sub1091325',
      BILL_NUMBER: '1000717105932',
      'SAF_ID#': '',
      'SAF-TYPE': '',
      REASON_CODE: '',
      USER_NAME: '',
    },
    {
      BATCH_SOURCE_NAME: 'ICMS-ADJ',
      CONTROL_CATEGORY: 'INVOICE AMOUNT GREATER THAN THRESHOLD',
      OPERATING_UNIT: 'CISCO US OPERATING UNIT',
      LEDGER_CURRENCY: 'USD',
      TRAN_AMOUNT: ' 20,679,571.49 ',
      'USD Amount': ' $20,679,571.49 ',
      TRX_NUMBER: '97657986-4792035',
      TRX_DATE: '10-Jan-23',
      TRAN_CURRENCY_CODE: 'USD',
      'SO#': '4792035',
      'SUBSCRIPTION#': '',
      BILL_NUMBER: '',
      'SAF_ID#': '4792035',
      'SAF-TYPE': 'DEBIT_REBILL',
      REASON_CODE: 'WRONG SHIP TO',
      USER_NAME: '',
    },
    {
      BATCH_SOURCE_NAME: 'MANUAL-OTHER',
      CONTROL_CATEGORY: 'INVOICE AMOUNT GREATER THAN THRESHOLD',
      OPERATING_UNIT: 'CISCO BRAZIL CA OPERATING UNIT',
      LEDGER_CURRENCY: 'BRL',
      TRAN_AMOUNT: '3,530,807.37',
      'USD Amount': ' $671,441.25 ',
      TRX_NUMBER: '13083',
      TRX_DATE: '3-Apr-23',
      TRAN_CURRENCY_CODE: 'BRL',
      'SO#': 'WELLOPES',
      'SUBSCRIPTION#': '',
      BILL_NUMBER: '',
      'SAF_ID#': '',
      'SAF-TYPE': '',
      REASON_CODE: '',
      USER_NAME: 'WELLOPES',
    },
    {
      BATCH_SOURCE_NAME: 'MANUAL-OTHER',
      CONTROL_CATEGORY: 'INVOICE AMOUNT GREATER THAN THRESHOLD',
      OPERATING_UNIT: 'CISCO GERMANY TECH OPERATING UNIT',
      LEDGER_CURRENCY: 'EUR',
      TRAN_AMOUNT: '-4,336,657.50',
      'USD Amount': ' $(4,336,657.50)',
      TRX_NUMBER: '1001000978',
      TRX_DATE: '21-Mar-23',
      TRAN_CURRENCY_CODE: 'USD',
      'SO#': 'KBABUD',
      'SUBSCRIPTION#': '',
      BILL_NUMBER: '',
      'SAF_ID#': '',
      'SAF-TYPE': '',
      REASON_CODE: '',
      USER_NAME: 'KBABUD',
    },
  ];

  lineColumns1 = [
    'REQUEST_TYPE',
    'CONTROL_CATEGORY',
    'OPERATING_UNIT',
    'LEDGER_CURRENCY',
    'THRESHOLD_AMOUNT',
    'INTERFACE_LINE_AMOUNT',
    'ORDER_NUMBER',
    'ORDER_LINE_ID',
    'BATCH_SOURCE_NAME',
    'TRANSACTION CURRENCY_CODE',
    'USD_AMOUNT',
    'CREATION_DATE',
    'SUBSCRIPTION_NUMBER',
    'BILL_NUMBER',
    'WEB_ORDER_ID',
  ];

  lineData1 = [
    {
      REQUEST_TYPE: 'PRE_AI',
      CONTROL_CATEGORY: 'LINE AMOUNT GREATER THAN THRESHOLD',
      OPERATING_UNIT: 'CISCO US OPERATING UNIT',
      LEDGER_CURRENCY: 'USD',
      THRESHOLD_AMOUNT: '20,000,000',
      INTERFACE_LINE_AMOUNT: '34,999,125.00',
      ORDER_NUMBER: '115,258,423',
      ORDER_LINE_ID: '1,169,223,268',
      BATCH_SOURCE_NAME: 'Order Management',
      'TRANSACTION CURRENCY_CODE': 'USD',
      USD_AMOUNT: '$34,999,125.00',
      CREATION_DATE: '1/23/23 9:09',
      SUBSCRIPTION_NUMBER: '',
      BILL_NUMBER: '',
      WEB_ORDER_ID: '',
      '': '',
    },
    {
      REQUEST_TYPE: 'PRE_AI',
      CONTROL_CATEGORY: 'LINE AMOUNT GREATER THAN THRESHOLD',
      OPERATING_UNIT: 'CISCO US OPERATING UNIT',
      LEDGER_CURRENCY: 'USD',
      THRESHOLD_AMOUNT: '20,000,000',
      INTERFACE_LINE_AMOUNT: '22,793,832.00',
      ORDER_NUMBER: '115,313,517',
      ORDER_LINE_ID: '1,170,226,606',
      BATCH_SOURCE_NAME: 'Order Management',
      'TRANSACTION CURRENCY_CODE': 'USD',
      USD_AMOUNT: '$22,793,832.00',
      CREATION_DATE: '1/28/23 7:57',
    },
  ];

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  setSortAndPaginator() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }
}

export interface InvoiceHeaderModel {}

export interface InvoiceLineModel {}

export interface OrderLifecycleModel {
  PROGRAM_NAME: string;
  ACCOUNT: string;
  SFDC_STATUS: string;
  STATUS_AS_OF_DATE: string;
  DEAL_ID: string;
  SALES_ORDER: string;
  EXPECTED_BOOK_DATE: string;
  ACTUAL_BOOK_DATE: string;
  // LINE_TYPE: string;
  ORDER_STATUS: string;
  INVOICING_STATUS: string;
  REV_ACCR_STATUS: string;
  GL_POSTING_STATUS: string;
  HOLD_RELEASE_TARGET_DATE: string;
  ACCRUALS_EXECUTION_TIME: string;
  // CURRENCY: string;
  ORDER_TOTAL: string;
  ORDER_TOTAL_USD: string;
  TOTAL_CONTRAC_VALUE: string;
  SUBSCRIPTION_ID: string;
  INVOICE_DATE: string;
  INVOICE_AMOUNT: string;
  INVOICE_LINES: string;
  // STATUS: string;
  COMMENTS: string;
  AGING_BOOKING: string;
  AGING_HOLD_RELEASE: string;
  // LAST_UPDATE_DATE: string;
  // ENABLED_FLAG: string;
  // CURRENT_PERIOD_FLAG: string;
  // WEB_ORDER_ID: string;
  // QUOTE_NUMBER: string;
  // CONTEXT: string;
  // TOTAL_LINE_COUNT: string;
  // HEADER_ID: string;
  // ORDER_CREATION_DATE: string;
  // ORDER_LEVEL_HOLD: string;
  // LINE_LEVEL_HOLD: string;
  // CUST_PO_NUMBER: string;
  TERM_IN_YEARS: string;
}
