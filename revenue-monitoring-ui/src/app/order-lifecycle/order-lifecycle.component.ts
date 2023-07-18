import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
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
import { MatDialog } from '@angular/material/dialog';
import { OrderLifecycleSummaryComponent } from '../order-lifecycle-summary/order-lifecycle-summary.component';

@Component({
  selector: 'app-invoice-status',
  templateUrl: './order-lifecycle.component.html',
  styleUrls: ['./order-lifecycle.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class OrderLifecycleComponent implements OnInit {
  constructor(
    http: ApiHttpService,
    private router: Router,
    private dataService: DataService,
    private dialog: MatDialog
  ) {
    this.http = http;
  }

  ngOnInit(): void {
    this.getOrderLifecycle();
    this.getCurrentTime();
  }

  searchForm: FormGroup = new FormGroup({
    progName: new FormControl(''),
    account: new FormControl(''),
    orderStats: new FormControl(''),
    invoiceStats: new FormControl(''),
    flexibleInvoice: new FormControl(''),
    salesOrdr: new FormControl(''),
  });

  protected http: ApiHttpService;
  length: number;

  refreshInterval = 3600000; //ms
  timeNow: any;

  progNameOptions: string[] = [];
  accountOptions: string[] = [];
  orderStatusOptions: string[] = [];
  invoiceStatusOptions: string[] = [];
  flexibleInvoiceOptions: string[] = [];

  programNameFilter: string[] = [];
  accountFilter: string[] = [];
  orderStatusFilter: string[] = [];
  invoiceStatusFilter: string[] = [];
  flexibleInvoiceFilter: string[] = [];
  salesOrderFilter: string = '';

  @ViewChild(MatPaginator) paginator: MatPaginator;

  orderLifecycleStatus: OrderLifecycleModel[];
  selectedArr: OrderLifecycleModel[];
  dataSource: any;
  selection = new SelectionModel<any>(true, []);
  selectedData: any;

  getOrderLifecycle() {
    this.getEndpointData('order-status').subscribe((data: any) => {
      this.orderLifecycleStatus = data['orderLifecycleResult'];
      this.dataSource = new MatTableDataSource<OrderLifecycleModel>(
        this.orderLifecycleStatus
      );
      this.orderLifecycleStatus.forEach((data) => {
        for (const key in data) {
          if (
            key == 'STATUS_AS_OF_DATE' ||
            key == 'ACTUAL_BOOK_DATE' ||
            key == 'INVOICE_DATE' ||
            key == 'FUTURE_INVOICE_RELEASE_DATE' ||
            key == 'COMMENTS'
          ) {
            continue;
          }

          if (data[key] === null) {
            if (
              key == 'SALES_ORDER' ||
              key == 'ORDER_VALUE' ||
              key == 'INVOICE_AMOUNT' ||
              key == 'DEAL_ID' ||
              key == 'TOTAL_LINE_COUNT' ||
              key == 'LINES_ON_HOLD' ||
              key == 'INVOICE_LINES'
            ) {
              data[key] = 'NA';
            } else {
              data[key] = 'TBD';
            }
          }
        }
      });

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
    let invoiceStatus = [];
    let flexibleInvoice = [];
    this.orderLifecycleStatus.forEach((data) => {
      progName.push(data.PROGRAM_NAME);
      account.push(data.ACCOUNT);
      orderStatus.push(data.ORDER_STATUS);
      invoiceStatus.push(data.INVOICING_STATUS);
      flexibleInvoice.push(data.FLEXIBLE_INVOICE_ELIGIBLE);
    });

    this.progNameOptions = [...new Set(progName)];
    this.accountOptions = [...new Set(account)];
    this.orderStatusOptions = [...new Set(orderStatus)];
    this.invoiceStatusOptions = [...new Set(invoiceStatus)];
    this.flexibleInvoiceOptions = [...new Set(flexibleInvoice)];
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
    const invoiceStatusMatch =
      filters.invoiceStatusFilter.length === 0 ||
      filters.invoiceStatusFilter.includes(data.INVOICING_STATUS);
    const flexibleInvoiceMatch =
      filters.flexibleInvoiceFilter.length === 0 ||
      filters.flexibleInvoiceFilter.includes(data.FLEXIBLE_INVOICE_ELIGIBLE);
    const salesOrderMatch =
      data.SALES_ORDER.toString()
        .toLowerCase()
        .indexOf(filters.salesOrderFilter) !== -1;
    return (
      progNameMatch &&
      accountMatch &&
      orderStatusMatch &&
      invoiceStatusMatch &&
      flexibleInvoiceMatch &&
      salesOrderMatch
    );
  };

  filter() {
    this.searchForm.valueChanges.subscribe((data) => {
      this.programNameFilter = data['progName'];
      this.accountFilter = data['account'];
      this.orderStatusFilter = data['orderStats'];
      this.invoiceStatusFilter = data['invoiceStats'];
      this.flexibleInvoiceFilter = data['flexibleInvoice'];
      this.salesOrderFilter = data['salesOrdr'];
      this.applyFilter();
    });
  }

  applyFilter() {
    this.salesOrderFilter = this.searchForm.get('salesOrdr').value;
    this.dataSource.filter = JSON.stringify({
      progNameFilter: this.programNameFilter,
      accountFilter: this.accountFilter,
      orderStatusFilter: this.orderStatusFilter,
      invoiceStatusFilter: this.invoiceStatusFilter,
      flexibleInvoiceFilter: this.flexibleInvoiceFilter,
      salesOrderFilter: this.salesOrderFilter,
    });
  }

  openDialog() {
    const dialogRef = this.dialog.open(OrderLifecycleSummaryComponent, {
      width: '700px',
    });
  }

  displayedColumns = [
    'select',
    'STATUS_AS_OF_DATE',
    'PROGRAM_NAME',
    'ACCOUNT',
    'SALES_ORDER',
    'ORDER_VALUE',
    'TOTAL_LINE_COUNT',
    'ORDER_STATUS',
    'CONTRACT_NUMBER',
    'LINES_ON_HOLD',
    'INVOICE_LINES',
    'INVOICE_DATE',
    'INVOICING_STATUS',
    'INVOICE_AMOUNT',
    'REV_ACCR_STATUS',
    'GL_POSTING_STATUS',
    'ACCRUALS_EXECUTION_TIME',
    'SUBSCRIPTION_ID',
    'FLEXIBLE_INVOICE_ELIGIBLE',
    'FUTURE_INVOICE_RELEASE_DATE',
    'TERM_IN_YEARS',
    'BOOK_DATE',
    'DEAL_ID',
    'COMMENTS',
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
      this.exportTableToExcel(this.orderLifecycleStatus, sheetName, filename);
    } else if (!this.isAllSelected()) {
      this.selectedArr = this.selection.selected;
      this.exportTableToExcel(this.selectedArr, sheetName, filename);
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

  getCurrentTime() {
    this.getEndpointData('dashboard-timestamp').subscribe((data: any) => {
      this.timeNow = new Date(data['timeNow']).toLocaleString('en-us', {
        hour: 'numeric',
        minute: 'numeric',
      });
    });
  }

  getEndpointData(endpoint: string): Observable<any> {
    let uniqueId = Date.now();
    let cacheBustingUrl = `${endpoint}?cacheBuster=${uniqueId}`;

    const polling$ = interval(this.refreshInterval).pipe(
      startWith(0), // Emit initial value immediately
      switchMap(() => this.http.get(cacheBustingUrl))
    );
    return polling$;
  }
}

export interface OrderLifecycleModel {
  select: string;
  STATUS_AS_OF_DATE: string;
  PROGRAM_NAME: string;
  ACCOUNT: string;
  SALES_ORDER: string;
  ORDER_VALUE: string;
  TOTAL_LINE_COUNT: string;
  ORDER_STATUS: string;
  CONTRACT_NUMBER: string;
  LINES_ON_HOLD: string;
  INVOICE_LINES: string;
  INVOICE_DATE: string;
  INVOICING_STATUS: string;
  INVOICE_AMOUNT: string;
  REV_ACCR_STATUS: string;
  GL_POSTING_STATUS: string;
  ACCRUALS_EXECUTION_TIME: string;
  SUBSCRIPTION_ID: string;
  FLEXIBLE_INVOICE_ELIGIBLE: string;
  FUTURE_INVOICE_RELEASE_DATE: string;
  TERM_IN_YEARS: string;
  BOOK_DATE: string;
  DEAL_ID: string;
  COMMENTS: string;
}
