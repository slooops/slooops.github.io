import { Component, OnDestroy, OnInit, ViewChild, Input } from '@angular/core';
import { Router } from '@angular/router';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ApiHttpService } from '../../providers/http.service';
import { switchMap, startWith } from 'rxjs/operators';
import { Observable, interval } from 'rxjs';
import { SelectionModel } from '@angular/cdk/collections';
import { DataService } from '../../providers/data.service';
import { errorDashModel } from '../error-dash.component';
import { MatPaginator } from '@angular/material/paginator';
import { FormGroup, FormControl } from '@angular/forms';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-detail-view',
  templateUrl: './detail-view.component.html',
  styleUrls: ['./detail-view.component.css'],
})
export class DetailViewComponent implements OnInit {
  protected http: ApiHttpService;

  displayedColumns: string[] = [
    'select',
    // 'PERIOD_YEAR',
    'PERIOD_NAME',
    'APPLICATION_NAME',
    'SUB_APPLICATION',
    'BATCH_SOURCE',
    'ORDER_NUMBER',
    'LINE_ID',
    'ENTITY',
    'TYPE',
    'AGING',
    'AMOUNT',
    'TRXN_CURRENCY',
    'AMOUNT_USD',
    'INC_NUMBER',
    'MESSAGE_TEXT',
  ];

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  preclosePeriod: String = '';
  precloseQuarter: String = '';
  refreshInterval = 120000; //ms
  selection = new SelectionModel<any>(true, []);
  selectedData: any;
  dataSource: MatTableDataSource<errorDetailsModel>;
  errorDetailsData: errorDetailsModel[];
  errorData: errorDashModel[];
  allErrorsSelected: boolean;
  length: number;

  searchForm: FormGroup = new FormGroup({
    appName: new FormControl(''),
    batchSource: new FormControl(''),
    entity: new FormControl(''),
  });

  columns: FormControl = new FormControl('');

  appNameOptions: string[] = [];
  batchSourceOptions: string[] = [];
  entityOptions: string[] = [];

  applicationNameFilter: string[] = [];
  batchSourceFilter: string[] = [];
  entityFilter: string[] = [];

  columnFilter: string[] = this.displayedColumns;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private router: Router,
    http: ApiHttpService,
    private dataService: DataService
  ) {
    this.http = http;
  }

  ngOnInit(): void {
    // this.getPeriodQuarterStartEndTime();
    this.allErrorsSelected = this.dataService.getAllErrorsSelected();
    this.errorData = this.dataService.getErrorData();
    this.getErrorDetails();
  }

  getErrorDetails() {
    if (this.allErrorsSelected || this.errorData.length === 0) {
      this.getAllErrorDetails();
    } else {
      this.getSelectedErrorDetails();
    }
  }

  getAllErrorDetails() {
    this.http.get('error-details').subscribe((data: any) => {
      this.errorDetailsData = data;
      this.dataSource = new MatTableDataSource(this.errorDetailsData);
      this.filterData();
      this.length = this.errorDetailsData.length;
      this.setSortAndPaginator();
      this.dataSource.filterPredicate = this.filterPredicate;
    });
  }

  getSelectedErrorDetails() {
    this.http
      .post('selected-error-details', this.errorData)
      .subscribe((data: any) => {
        this.errorDetailsData = data;
        this.dataSource = new MatTableDataSource(this.errorDetailsData);
        this.filterData();
        this.length = this.errorDetailsData.length;
        this.setSortAndPaginator();
        this.dataSource.filterPredicate = this.filterPredicate;
      });
  }

  filterData() {
    let appName = [];
    let batchSource = [];
    let entity = [];
    this.errorDetailsData.forEach((data) => {
      appName.push(data.APPLICATION_NAME);
      batchSource.push(data.BATCH_SOURCE);
      entity.push(data.ENTITY);
    });
    this.appNameOptions = [...new Set(appName)];
    this.batchSourceOptions = [...new Set(batchSource)];
    this.entityOptions = [...new Set(entity)];
  }

  filterPredicate = (data: errorDetailsModel, filter: any) => {
    const filters = JSON.parse(filter);
    const appNameMatch =
      filters.applicationNameFilter.length === 0 ||
      filters.applicationNameFilter.includes(data.APPLICATION_NAME);
    const batchSourceMatch =
      filters.batchSourceFilter.length === 0 ||
      filters.batchSourceFilter.includes(data.BATCH_SOURCE);
    const entityMatch =
      filters.entityFilter.length === 0 ||
      filters.entityFilter.includes(data.ENTITY);
    return appNameMatch && batchSourceMatch && entityMatch;
  };

  filter() {
    this.searchForm.valueChanges.subscribe((data) => {
      this.applicationNameFilter = data['appName'];
      this.batchSourceFilter = data['batchSource'];
      this.entityFilter = data['entity'];
      this.dataSource.filter = JSON.stringify({
        applicationNameFilter: this.applicationNameFilter,
        batchSourceFilter: this.batchSourceFilter,
        entityFilter: this.entityFilter,
      });
    });
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

  setSortAndPaginator() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
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

interface errorDetailsModel {
  PERIOD_NAME: number;
  APPLICATION_NAME: string;
  SUB_APPLICATION: string;
  BATCH_SOURCE: string;
  ORDER_NUMBER: number;
  LINE_ID: number;
  ENTITY: string;
  TYPE: string;
  AGING: number;
  AMOUNT: number;
  TRANSACTION_TYPE: string;
  AMOUNT_USD: number;
  INC_NUMBER: any;
  NO_OF_RECORDS: number;
  MESSAGE_TEXT: string;
  TRXN_CURRENCY: string;
}
