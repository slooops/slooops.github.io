import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ApiHttpService } from '../providers/http.service';
import { switchMap, startWith } from 'rxjs/operators';
import { Observable, interval } from 'rxjs';
import { SelectionModel } from '@angular/cdk/collections';
import { DataService } from '../providers/data.service';
import { MatPaginator } from '@angular/material/paginator';
import { FormGroup, FormControl } from '@angular/forms';
import * as XLSX from 'xlsx';

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

  searchForm: FormGroup = new FormGroup({
    progName: new FormControl(''),
    account: new FormControl(''),
    orderStats: new FormControl(''),
  });

  protected http: ApiHttpService;
  length: number;

  progNameOptions: string[] = [];
  accountOptions: string[] = [];
  orderStatusOptions: string[] = [];

  programNameFilter: string[] = [];
  accountFilter: string[] = [];
  orderStatusFilter: string[] = [];
  @ViewChild(MatPaginator) paginator: MatPaginator;

  orderLifecycleStatus: OrderLifecycleModel[];
  dataSource: any;
  selection = new SelectionModel<any>(true, []);
  selectedData: any;

  getOrderLifecycle() {
    this.http.get('order-status').subscribe((data: any) => {
      this.orderLifecycleStatus = data;
      this.dataSource = new MatTableDataSource<OrderLifecycleModel>(
        this.orderLifecycleStatus
      );
      this.filterData();
      this.length = this.orderLifecycleStatus.length;
      this.setSortAndPaginator();
      this.dataSource.filterPredicate = this.filterPredicate;
    });
  }

  filterData() {
    let progName = [];
    let account = [];
    let orderStatus = [];
    this.orderLifecycleStatus.forEach((data) => {
      progName.push(data.PROGRAM_NAME);
      account.push(data.ACCOUNT);
      orderStatus.push(data.ORDER_STATUS);
    });
    this.progNameOptions = [...new Set(progName)];
    this.accountOptions = [...new Set(account)];
    this.orderStatusOptions = [...new Set(orderStatus)];
  }

  filterPredicate = (data: OrderLifecycleModel, filter: any) => {
    const filters = JSON.parse(filter);
    const progNameMatch =
      filters.progNameFilter.length === 0 ||
      filters.progNameFilter.includes(data.PROGRAM_NAME);
    const accountMatch =
      filters.accountFilter.length === 0 ||
      filters.accountFilter.includes(data.ACCOUNT);
    const orderStatusMatch =
      filters.orderStatusFilter.length === 0 ||
      filters.orderStatusFilter.includes(data.ORDER_STATUS);
    return progNameMatch && accountMatch && orderStatusMatch;
  };

  filter() {
    this.searchForm.valueChanges.subscribe((data) => {
      this.programNameFilter = data['progName'];
      this.accountFilter = data['account'];
      this.orderStatusFilter = data['orderStats'];
      this.dataSource.filter = JSON.stringify({
        progNameFilter: this.programNameFilter,
        accountFilter: this.accountFilter,
        orderStatusFilter: this.orderStatusFilter,
      });
    });
  }

  displayedColumns: string[] = [
    'select',
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

  @Input() data: any;

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  onRowClicked(row: any) {
    this.selectedData = row;
  }

  export(sheetName: string, filename: string) {
    if (this.isAllSelected() || this.selection.selected.length === 0) {
      this.exportTableToExcel(
        this.dataSource.filteredData,
        sheetName,
        filename
      );
    } else if (!this.isAllSelected()) {
      this.exportTableToExcel(this.selection.selected, sheetName, filename);
    }
  }
  exportTableToExcel(data: any[], sheetName: string, filename: string) {
    let worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    let workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    let excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    this.saveAsExcelFile(excelBuffer, filename);
  }

  saveAsExcelFile(buffer: any, filename: string) {
    let data: Blob = new Blob([buffer], { type: 'application/octet-stream' });
    let url = window.URL.createObjectURL(data); // temp URL that points to the generated excel file data buffer
    let link = document.createElement('a'); // create link
    link.href = url;
    link.download = filename + '.xlsx';
    link.click(); // triggers the download process and save file prompt in browser
    window.URL.revokeObjectURL(url); // revoke temp URL
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
