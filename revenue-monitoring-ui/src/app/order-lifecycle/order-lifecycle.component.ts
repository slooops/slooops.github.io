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
    subscriptionId: new FormControl(''),
    dealId: new FormControl(''),
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
  progNameTemp: string[] = [];
  accountTemp: string[] = [];
  orderStatusTemp: string[] = [];
  invoiceStatusTemp: string[] = [];

  programNameFilter: string[] = [];
  accountFilter: string[] = [];
  orderStatusFilter: string[] = [];
  invoiceStatusFilter: string[] = [];
  flexibleInvoiceFilter: string[] = [];
  salesOrderFilter: string = '';
  subscriptionIdFilter: string = '';
  dealIdFilter: string = '';

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
            if (key == 'INVOICE_LINES') {
              data[key] = '0';
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
    this.orderLifecycleStatus.forEach((data) => {
      this.progNameTemp.push(data.PROGRAM_NAME);
      this.accountTemp.push(data.ACCOUNT);
      this.orderStatusTemp.push(data.ORDER_STATUS);
      this.invoiceStatusTemp.push(data.INVOICING_STATUS);
    });
    this.progNameOptions = [...new Set(this.progNameTemp)];
    this.accountOptions = [...new Set(this.accountTemp)];
    this.orderStatusOptions = [...new Set(this.orderStatusTemp)];
    this.invoiceStatusOptions = [...new Set(this.invoiceStatusTemp)];
    // this.flexibleInvoiceOptions = [...new Set(flexibleInvoice)];
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
    // const flexibleInvoiceMatch =
    //   filters.flexibleInvoiceFilter.length === 0 ||
    //   filters.flexibleInvoiceFilter.includes(data.FLEXIBLE_INVOICE_ELIGIBLE);
    const salesOrderMatch =
      data.SALES_ORDER.toString().indexOf(filters.salesOrderFilter) !== -1;
    // const subscriptionIdMatch =
    //   data.SALES_ORDER.toString().indexOf(filters.subscriptionIdFilter) !== -1;
    const dealIdMatch =
      data.DEAL_ID.toString().toLowerCase().indexOf(filters.dealIdFilter) !==
      -1;
    return (
      progNameMatch &&
      accountMatch &&
      orderStatusMatch &&
      invoiceStatusMatch &&
      // flexibleInvoiceMatch &&
      salesOrderMatch &&
      // subscriptionIdMatch &&
      dealIdMatch
    );
  };

  filter() {
    this.searchForm.valueChanges.subscribe((data) => {
      this.programNameFilter = data['progName'];
      this.accountFilter = data['account'];
      this.orderStatusFilter = data['orderStats'];
      this.invoiceStatusFilter = data['invoiceStats'];
      // this.flexibleInvoiceFilter = data['flexibleInvoice'];
      this.salesOrderFilter = data['salesOrdr'];
      // this.subscriptionIdFilter = data['subscriptionId'];
      this.dealIdFilter = data['dealId'];
      if (
        this.programNameFilter.length > 0 &&
        this.accountFilter.length === 0
      ) {
        const filteredAccounts = this.filterAccountByProgramNames(
          this.orderLifecycleStatus,
          this.programNameFilter
        );
        this.accountOptions = [...new Set(filteredAccounts)];
      } else if (
        this.programNameFilter.length > 0 &&
        this.accountFilter.length > 0
      ) {
        const filteredAccounts = this.filterAccountByProgramNames(
          this.orderLifecycleStatus,
          this.programNameFilter
        );

        this.accountFilter.forEach((data) => {
          if (!filteredAccounts.includes(data)) {
            this.accountFilter = this.accountFilter.filter(
              (ele) => ele !== data
            );
          }
          this.accountOptions = [...new Set(filteredAccounts)];
        });
      } else {
        this.accountOptions = [...new Set(this.accountTemp)];
      }
      this.applyFilter();
    });
  }

  applyFilter() {
    this.salesOrderFilter = this.searchForm.get('salesOrdr').value;
    // this.subscriptionIdFilter = this.searchForm.get('subscriptionId').value;
    this.dealIdFilter = this.searchForm.get('dealId').value;
    this.dataSource.filter = JSON.stringify({
      progNameFilter: this.programNameFilter,
      accountFilter: this.accountFilter,
      orderStatusFilter: this.orderStatusFilter,
      invoiceStatusFilter: this.invoiceStatusFilter,
      salesOrderFilter: this.salesOrderFilter,
      dealIdFilter: this.dealIdFilter,
    });
  }

  filterAccountByProgramNames(
    data: OrderLifecycleModel[],
    programNames: string[]
  ): string[] {
    return data
      .filter((order) => programNames.includes(order.PROGRAM_NAME))
      .map((order) => order.ACCOUNT);
  }

  clearFilters() {
    this.dataSource.filter = '';
    this.searchForm.reset();
  }

  openDialog() {
    const dialogRef = this.dialog.open(OrderLifecycleSummaryComponent, {
      width: '700px',
    });
  }

  displayedColumns = [
    'select',
    // 'STATUS_AS_OF_DATE',
    'PROGRAM_NAME',
    'ACCOUNT',
    'DEAL_ID',
    'SALES_ORDER',
    'ORDER_VALUE',
    'TOTAL_LINE_COUNT',
    'ORDER_STATUS',
    'CONTRACT_NUMBER',
    'LINES_ON_HOLD',
    'FLEXIBLE_INVOICE_ELIGIBLE',
    'INVOICING_STATUS',
    'INVOICE_LINES',
    'INVOICE_DATE',
    'INVOICE_AMOUNT',
    'REV_ACCR_STATUS',
    'GL_POSTING_STATUS',
    'ACCRUALS_EXECUTION_TIME',
    // 'SUBSCRIPTION_ID',
    'FUTURE_INVOICE_RELEASE_DATE',
    'TERM_IN_YEARS',
    'BOOK_DATE',
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
  // STATUS_AS_OF_DATE: string;
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
