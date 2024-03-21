import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ApiHttpService } from '../providers/http.service';
import { SelectionModel } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { FormGroup, FormControl } from '@angular/forms';
import * as XLSX from 'xlsx';
import { MatDialog } from '@angular/material/dialog';
import { OrderLifecycleSummaryComponent } from './order-lifecycle-summary/order-lifecycle-summary.component';
import { OrderLifecycleUploadComponent } from './order-lifecycle-upload/order-lifecycle-upload.component';
import { OrderLifecycleRevSummaryComponent } from './order-lifecycle-rev-summary/order-lifecycle-rev-summary.component';
import { DataService } from '../providers/data.service';

@Component({
  selector: 'app-invoice-status',
  templateUrl: './order-lifecycle.component.html',
  styleUrls: ['./order-lifecycle.component.css'],
})
export class OrderLifecycleComponent implements OnInit {
  constructor(
    http: ApiHttpService,
    private dialog: MatDialog,
    private dataService: DataService
  ) {
    this.http = http;
  }
  currentDate: Date;
  ngOnInit(): void {
    this.getOrderLifecycle();
    this.getOrderStatusDownload();
    this.updateTime();
    this.currentDate = new Date();
  }

  searchForm: FormGroup = new FormGroup({
    progName: new FormControl(''),
    account: new FormControl(''),
    orderStats: new FormControl(''),
    invoiceStats: new FormControl(''),
    salesOrdr: new FormControl(''),
    dealId: new FormControl(''),
  });

  protected http: ApiHttpService;
  length: number;

  refreshInterval = 14400000;
  timeNow: any;
  dealUpload: boolean = false;
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
  orderLifeCycleDownload: OrderLifecycleModel[];
  selectedArr: OrderLifecycleModel[];
  dataSource: any;
  selection = new SelectionModel<any>(true, []);
  selectedData: any;
  updatedData: boolean = false;
  updateClo: boolean = false;
  editingRow: OrderLifecycleModel;
  originalValue: string;
  dealUploadFlag: boolean = false;
  ifColumnSelect: boolean = false;

  columnSelect() {
    this.ifColumnSelect != this.ifColumnSelect;
  }

  getOrderStatusDownload() {
    this.http.get('order-status-download').subscribe((data: any) => {
      this.orderLifeCycleDownload = data;
      this.orderLifeCycleDownload.forEach((ele) => {
        for (const key in ele) {
          if (
            key == 'BOOK_DATE' ||
            key == 'INVOICE_DATE' ||
            key == 'FUTURE_INVOICE_RELEASE_DATE' ||
            key == 'COMMENTS'
          ) {
            continue;
          }
          if (ele[key] === null) {
            if (key == 'INVOICE_LINES') {
              ele[key] = '0';
            } else {
              ele[key] = 'TBD';
            }
          }
        }
      });
    });
  }

  getOrderLifecycle() {
    this.http.get('order-status').subscribe((data: any) => {
      this.orderLifecycleStatus = data['orderLifecycleResult'];
      this.dataSource = new MatTableDataSource<OrderLifecycleModel>(
        this.orderLifecycleStatus
      );
      this.updatedData = false;
      this.updateClo =
        this.dataService.getUserRoles().includes('ADMIN') ||
        this.dataService.getUserRoles().includes('CLO_UPDATE');

      this.dealUploadFlag =
        this.dataService.getUserRoles().includes('ADMIN') ||
        this.dataService.getUserRoles().includes('DEAL_UPLOAD');
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
          if (data[key] === null && key != 'DEAL_UPLOAD_DATE') {
            if (key == 'INVOICE_LINES') {
              data[key] = '0';
            } else {
              data[key] = 'TBD';
            }
          }
        }
      });

      this.orderLifecycleStatus.sort((a, b) => {
        const isEmptyA = a.DEAL_UPLOAD_DATE === '';
        const isEmptyB = b.DEAL_UPLOAD_DATE === '';

        if (isEmptyA && isEmptyB) {
          return 0;
        } else if (isEmptyA) {
          return 1;
        } else if (isEmptyB) {
          return -1;
        } else {
          return 0;
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
    const salesOrderMatch =
      data.SALES_ORDER.toString().indexOf(filters.salesOrderFilter) !== -1;
    const dealIdMatch =
      data.DEAL_ID.toString().indexOf(filters.dealIdFilter) !== -1;
    return (
      progNameMatch &&
      accountMatch &&
      orderStatusMatch &&
      invoiceStatusMatch &&
      salesOrderMatch &&
      dealIdMatch
    );
  };

  filter() {
    this.searchForm.valueChanges.subscribe((data) => {
      this.programNameFilter = data['progName'];
      this.accountFilter = data['account'];
      this.orderStatusFilter = data['orderStats'];
      this.invoiceStatusFilter = data['invoiceStats'];
      this.salesOrderFilter = data['salesOrdr'];
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
    this.dialog.open(OrderLifecycleSummaryComponent, {
      width: '700px',
    });
  }

  openUploadDialog() {
    const dialogRef = this.dialog.open(OrderLifecycleUploadComponent, {
      width: '600px',
    });

    dialogRef.afterClosed().subscribe((data) => {
      if (data === 'uploaded') {
        this.updatedData = true;
        this.dataSource = null;
        this.getOrderLifecycle();
      }
    });
  }

  openRevSummaryDialog() {
    this.dialog.open(OrderLifecycleRevSummaryComponent, {
      width: '1200px',
    });
  }

  isEditingCloUpdates(row: OrderLifecycleModel): boolean {
    return this.editingRow === row;
  }

  startEditing(record: OrderLifecycleModel, index: number) {
    this.editingRow = record;
    this.originalValue = record.CLO_COMMENTS;
  }

  stopEditing() {
    this.editingRow = null;
  }

  saveCloUpdates(record: OrderLifecycleModel) {
    this.dataSource = this.getOrderLifecycle();
    let cloMap = {
      dealId: record.DEAL_ID,
      orderID: record.SALES_ORDER,
      cloComments: record.CLO_COMMENTS,
    };
    this.http.post('update-clo-comments', cloMap).subscribe((data) => {});
    this.stopEditing();
  }

  rollbackCloUpdatesValue(record: OrderLifecycleModel, index: number) {
    record.CLO_COMMENTS = this.originalValue;
    this.stopEditing();
  }

  saveInvoiceEligibleDate(record: OrderLifecycleModel) {
    this.dataSource = this.getOrderLifecycle();
    let dateMap = {
      dealId: record.DEAL_ID,
      orderID: record.SALES_ORDER,
      invoiceEligibleDate: record.INVOICE_ELIGIBLE_DATE.toLocaleDateString(),
    };

    this.http
      .post('update-invoice-eligible-date', dateMap)
      .subscribe((data) => {});
  }

  displayedColumns = [
    'select',
    'PROGRAM_NAME',
    'ACCOUNT',
    'DEAL_ID',
    'DEAL_UPLOAD_DATE',
    'SALES_ORDER',
    'ORDER_VALUE',
    'TOTAL_LINE_COUNT',
    'ORDER_STATUS',
    'CONTRACT_NUMBER',
    'LINES_ON_HOLD',
    'FLEXIBLE_INVOICE_ELIGIBLE',
    'INVOICE_ELIGIBLE_DATE',
    'INVOICING_STATUS',
    'INVOICE_LINES',
    'INVOICE_DATE',
    'INVOICE_AMOUNT',
    'REV_ACCR_STATUS',
    'GL_POSTING_STATUS',
    'ACCRUALS_EXECUTION_TIME',
    'FUTURE_INVOICE_RELEASE_DATE',
    'TERM_IN_YEARS',
    'BOOK_DATE',
    'CLO_COMMENTS',
    'COMMENTS',
  ];

  columnsToDisplay: string[] = this.displayedColumns.slice();

  selectedColumnsToDisplay: string[] = [];

  logSelectedColumns(event: any) {
    const selectedShoes = event.source.selectedOptions.selected.map(
      (option) => option.value
    );
    console.log('Selected shoes:', selectedShoes);
    this.columnsDisplaySort(selectedShoes);
  }

  columnsDisplaySort(selectedShoes: string[]) {
    selectedShoes.sort((a, b) => {
      let indexA = this.displayedColumns.indexOf(a);
      let indexB = this.displayedColumns.indexOf(b);

      // If both elements exist in orderArray, sort based on their indices
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }

      // If only one of the elements exists in orderArray, prioritize the one that exists
      else if (indexA !== -1) {
        return -1; // Place 'a' before 'b'
      } else if (indexB !== -1) {
        return 1; // Place 'b' before 'a'
      }

      // If neither element exists in orderArray, maintain their original order
      else {
        return 0;
      }
    });
    this.columnsToDisplay = selectedShoes;
  }

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
      this.exportTableToExcel(this.orderLifeCycleDownload, sheetName, filename);
    } else if (!this.isAllSelected()) {
      this.selectedArr = this.orderLifeCycleDownload.filter((data) =>
        this.selection.selected.some((ele) => {
          return (
            data.DEAL_ID === ele.DEAL_ID && data.SALES_ORDER === ele.SALES_ORDER
          );
        })
      );
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
    let url = window.URL.createObjectURL(data);
    let link = document.createElement('a');
    link.href = url;
    link.download = filename + '.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  updateTime() {
    const currentDate = new Date();
    const pstDate = currentDate.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
    });
    const timestamp = Date.parse(pstDate);
    const currentPstDate = new Date(timestamp);

    const currentHour = currentPstDate.getHours();

    if (
      currentHour === 8 ||
      currentHour === 12 ||
      currentHour === 16 ||
      currentHour === 23
    ) {
      this.getOrderLifecycle();
    }

    if (currentHour >= 0 && currentHour < 8) {
      this.timeNow = 'Yesterday at ' + 11 + ' PM PST';
    } else if (currentHour >= 8 && currentHour < 12) {
      this.timeNow = 'Today at ' + 8 + ' AM PST';
    } else if (currentHour >= 12 && currentHour < 16) {
      this.timeNow = 'Today at ' + 12 + ' PM PST';
    } else if (currentHour >= 16 && currentHour < 23) {
      this.timeNow = 'Today at ' + 4 + ' PM PST';
    } else {
      if (currentHour !== 0) {
        this.timeNow = 'Today at ' + 11 + ' PM PST';
      }
    }
  }
}

export interface OrderLifecycleModel {
  select: string;
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
  FLEXIBLE_INVOICE_ELIGIBLE: string;
  FUTURE_INVOICE_RELEASE_DATE: string;
  TERM_IN_YEARS: string;
  BOOK_DATE: string;
  DEAL_ID: string;
  COMMENTS: string;
  INVOICE_ELIGIBLE_DATE: Date;
  DEAL_UPLOAD_DATE: string;
  CLO_COMMENTS: string;
}

export interface ColumnSelection {
  [columnName: string]: boolean;
}
