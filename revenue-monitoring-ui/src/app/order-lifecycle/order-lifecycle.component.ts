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
  selector: 'app-invoice-status',
  templateUrl: './order-lifecycle.component.html',
  styleUrls: ['./order-lifecycle.component.css'],
})
export class OrderLifecycleComponent implements OnInit {
  constructor(
    http: ApiHttpService,
    private router: Router,
    private dataService: DataService
  ) {
    this.http = http;
  }

  ngOnInit(): void {
    this.getOrderLifecycle();
  }

  protected http: ApiHttpService;
  length: number;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  orderLifecycleStatus: OrderLifecycleModel[];
  dataSource: any;

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

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  setSortAndPaginator() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }
}

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
