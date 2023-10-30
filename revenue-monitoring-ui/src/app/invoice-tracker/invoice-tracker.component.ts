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
import { FormControl, FormGroup } from '@angular/forms';

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
    this.getInvoiceLine();
    this.getInvoiceHeader();
  }

  protected http: ApiHttpService;

  invoiceLine: InvoiceLineModel[];
  dataSourceLine: any;
  @ViewChild('lineSort', { static: true }) lineSort: MatSort;
  @ViewChild('linePaginator') linePaginator: MatPaginator;
  lengthLine: number;

  invoiceHeader: InvoiceHeaderModel[];
  dataSourceHeader: any;
  @ViewChild('headerSort', { static: true }) headerSort: MatSort;
  @ViewChild('headerPaginator') headerPaginator: MatPaginator;
  lengthHeader: number;

  getInvoiceLine() {
    this.http.get('invoice-tracker-line').subscribe((data: any) => {
      this.invoiceLine = data;
      this.dataSourceLine = new MatTableDataSource<InvoiceLineModel>(
        this.invoiceLine
      );
      this.lengthLine = this.invoiceLine.length;
      this.setLineSortAndPaginator();
    });
  }

  getInvoiceHeader() {
    this.http.get('invoice-tracker-header').subscribe((data: any) => {
      this.invoiceHeader = data;
      this.dataSourceHeader = new MatTableDataSource<InvoiceHeaderModel>(
        this.invoiceHeader
      );
      this.lengthHeader = this.invoiceHeader.length;
      this.setHeaderSortAndPaginator();
    });
  }

  // Filter Code Variables
  searchForm: FormGroup = new FormGroup({
    // appName: new FormControl(''),
    // batchSource: new FormControl(''),
    entity: new FormControl(''),
  });

  invoiceLineData: InvoiceLineModel[];
  selectedErrors: InvoiceLineModel[];

  appNameOptions: string[] = [];
  batchSourceOptions: string[] = [];
  entityOptions: string[] = [];

  applicationNameFilter: string[] = [];
  batchSourceFilter: string[] = [];
  entityFilter: string[] = [];

  formatHeader(column: string): string {
    const replacements = {
      SO: 'Order Number',
      SAF_ID: 'SAF ID #',
      SAF_TYPE: 'SAF-Type',
      SUBSCRIPTION: 'Subscription #',
      TRX_NUMBER: 'TRX Number',
      TRX_DATE: 'TRX Date',
      'USD Amount': 'USD Amount',
      USD_AMOUNT: 'USD Amount',
      ORDER_LINE_ID: 'Order Line ID',
      WEB_ORDER_ID: 'Web Order ID',
      'TRANSACTION CURRENCY_CODE': 'Transaction Currency',
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

  formatColumn(column: string, value: any): string {
    if (column === 'CREATION_DATE') {
      // Format as a date
      return new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } else if (column === 'USD AMOUNT' || column === 'INTERFACE_LINE_AMOUNT') {
      // Add a dollar sign
      return `$${value}`;
    } else if (
      column === 'ORDER_NUMBER' ||
      column === 'ORDER_LINE_ID' ||
      column === 'WEB_ORDER_ID'
    ) {
      // Remove commas
      return value ? value.toString().replace(/,/g, '') : '';
    } else {
      // Default: Return value as is
      return value;
    }
  }

  setLineSortAndPaginator() {
    this.dataSourceLine.sort = this.lineSort;
    this.dataSourceLine.paginator = this.linePaginator;
  }

  setHeaderSortAndPaginator() {
    this.dataSourceHeader.sort = this.headerSort;
    this.dataSourceHeader.paginator = this.headerPaginator;
  }

  headerColumns: string[] = [
    'BATCH_SOURCE_NAME',
    'CONTROL_CATEGORY',
    'OPERATING_UNIT',
    'LEDGER_CURRENCY',
    'TRAN_AMOUNT',
    'USD Amount',
    'TRX_NUMBER',
    'TRX_DATE',
    'TRAN_CURRENCY_CODE',
    'SO',
    'SUBSCRIPTION',
    'BILL_NUMBER',
    'SAF_ID',
    'SAF_TYPE',
    'REASON_CODE',
    'USER_NAME',
  ];

  lineColumns: string[] = [
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

  lineData = [
    {
      REQUEST_TYPE: 'PRE_AI',
      CONTROL_CATEGORY: 'LINE AMOUNT GREATER THAN THRESHOLD',
      OPERATING_UNIT: 'CISCO US OPERATING UNIT',
      LEDGER_CURRENCY: 'USD',
      THRESHOLD_AMOUNT: '20,000,000',
      INTERFACE_LINE_AMOUNT: '34,999,125.00',
      'USD AMOUNT': '$34,999,125.00',
      ORDER_NUMBER: '115,258,423',
      ORDER_LINE_ID: '1,169,223,268',
      BATCH_SOURCE_NAME: 'Order Management',
      'TRANSACTION CURRENCY_CODE': 'USD',
      USD_AMOUNT: '$34,999,125.00',
      CREATION_DATE: '1/23/23 9:09',
      SUBSCRIPTION_NUMBER: '',
      BILL_NUMBER: '',
      WEB_ORDER_ID: '',
      'SAF_ID#': '',
      'SAF-TYPE': '',
      REASON_CODE: '',
    },
    {
      REQUEST_TYPE: 'PRE_AI',
      CONTROL_CATEGORY: 'LINE AMOUNT GREATER THAN THRESHOLD',
      OPERATING_UNIT: 'CISCO US OPERATING UNIT',
      LEDGER_CURRENCY: 'USD',
      THRESHOLD_AMOUNT: '20,000,000',
      INTERFACE_LINE_AMOUNT: '22,793,832.00',
      'USD AMOUNT': '$22,793,832.00',
      ORDER_NUMBER: '115,313,517',
      ORDER_LINE_ID: '1,170,226,606',
      BATCH_SOURCE_NAME: 'Order Management',
      'TRANSACTION CURRENCY_CODE': 'USD',
      USD_AMOUNT: '$22,793,832.00',
      CREATION_DATE: '1/28/23 7:57',
      SUBSCRIPTION_NUMBER: '',
      BILL_NUMBER: '',
      WEB_ORDER_ID: '',
      'SAF_ID#': '',
      'SAF-TYPE': '',
      REASON_CODE: '',
    },
    {
      REQUEST_TYPE: 'PRE_AI',
      CONTROL_CATEGORY: 'LINE AMOUNT GREATER THAN THRESHOLD',
      OPERATING_UNIT: 'CISCO US OPERATING UNIT',
      LEDGER_CURRENCY: 'USD',
      THRESHOLD_AMOUNT: '20,000,000',
      INTERFACE_LINE_AMOUNT: '34,999,125.00',
      'USD AMOUNT': '$34,999,125.00',
      ORDER_NUMBER: '115,258,423',
      ORDER_LINE_ID: '1,169,223,268',
      BATCH_SOURCE_NAME: 'Order Management',
      'TRANSACTION CURRENCY_CODE': 'USD',
      USD_AMOUNT: '$34,999,125.00',
      CREATION_DATE: '1/23/23 9:09',
      SUBSCRIPTION_NUMBER: 'Sub1091325',
      BILL_NUMBER: '1000717105932',
      WEB_ORDER_ID: '94,087,094',
      'SAF_ID#': '',
      'SAF-TYPE': '',
      REASON_CODE: '',
    },
    {
      REQUEST_TYPE: 'PRE_AI',
      CONTROL_CATEGORY: 'LINE AMOUNT GREATER THAN THRESHOLD',
      OPERATING_UNIT: 'CISCO US OPERATING UNIT',
      LEDGER_CURRENCY: 'USD',
      THRESHOLD_AMOUNT: '20,000,000',
      INTERFACE_LINE_AMOUNT: '22,793,832.00',
      'USD AMOUNT': '$22,793,832.00',
      ORDER_NUMBER: '115,313,517',
      ORDER_LINE_ID: '1,170,226,606',
      BATCH_SOURCE_NAME: 'Order Management',
      'TRANSACTION CURRENCY_CODE': 'USD',
      USD_AMOUNT: '$22,793,832.00',
      CREATION_DATE: '1/28/23 7:57',
      SUBSCRIPTION_NUMBER: 'Sub1091325',
      BILL_NUMBER: '1000717105932',
      WEB_ORDER_ID: '94,087,094',
    },
  ];
}

export interface InvoiceLineModel {
  REQUEST_TYPE: string;
  CONTROL_CATEGORY: string;
  OPERATING_UNIT: string;
  LEDGER_CURRENCY: string;
  THRESHOLD_AMOUNT: string;
  INTERFACE_LINE_AMOUNT: string;
  ORDER_NUMBER: string;
  ORDER_LINE_ID: string;
  BATCH_SOURCE_NAME: string;
  TRANSACTION_CURRENCY_CODE: string;
  USD_AMOUNT: string;
  CREATION_DATE: string;
  SUBSCRIPTION_NUMBER: string;
  BILL_NUMBER: string;
  WEB_ORDER_ID: string;
}

export interface InvoiceHeaderModel {
  BATCH_SOURCE_NAME: string;
  CONTROL_CATEGORY: string;
  OPERATING_UNIT: string;
  LEDGER_CURRENCY: string;
  TRAN_AMOUNT: string;
  USD_AMOUNT: string; // Note: I renamed 'USD Amount' to 'USD_AMOUNT' to keep consistent naming convention
  TRX_NUMBER: string;
  TRX_DATE: string;
  TRAN_CURRENCY_CODE: string;
  SO: string; // Note: 'SO#' was transformed to 'SO' for valid variable naming
  SUBSCRIPTION: string; // Note: 'SUBSCRIPTION#' was transformed to 'SUBSCRIPTION'
  BILL_NUMBER: string;
  SAF_ID: string; // Note: 'SAF_ID#' was transformed to 'SAF_ID'
  SAF_TYPE: string; // Note: 'SAF-TYPE' was transformed to 'SAF_TYPE'
  REASON_CODE: string;
  USER_NAME: string;
}
