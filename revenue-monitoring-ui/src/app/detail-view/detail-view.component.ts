import { Component, OnDestroy, OnInit, ViewChild, Input } from '@angular/core';
import { Router } from '@angular/router';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ApiHttpService } from '../providers/http.service';
import { switchMap, startWith } from 'rxjs/operators';
import { Observable, interval } from 'rxjs';
import { SelectionModel } from '@angular/cdk/collections';
import { DataService } from '../providers/data.service';
import { errorDashModel } from '../error-dash/error-dash.component';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-detail-view',
  templateUrl: './detail-view.component.html',
  styleUrls: ['./detail-view.component.css'],
})
export class DetailViewComponent implements OnInit {
  protected http: ApiHttpService;

  preclosePeriod: String = '';
  precloseQuarter: String = '';
  refreshInterval = 120000; //ms
  selection = new SelectionModel<any>(true, []);
  selectedData: any;
  dataSource: any;
  errorDetailsData: errorDetailsModel[];
  errorData: errorDashModel[];
  allErrorsSelected: boolean;
  length: number;

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
      this.dataSource = new MatTableDataSource<errorDetailsModel>(
        this.errorDetailsData
      );
      this.length = this.errorDetailsData.length;
      this.setSortAndPaginator();
    });
  }

  getSelectedErrorDetails() {
    this.http
      .post('selected-error-details', this.errorData)
      .subscribe((data: any) => {
        this.errorDetailsData = data;
        this.dataSource = new MatTableDataSource<errorDetailsModel>(
          this.errorDetailsData
        );
        this.length = this.errorDetailsData.length;
        this.setSortAndPaginator();
      });
  }

  getEndpointData(endpoint: string): Observable<any> {
    const polling$ = interval(this.refreshInterval).pipe(
      startWith(0), // Emit initial value immediately
      switchMap(() => this.http.get(endpoint))
    );
    return polling$;
  }

  getPeriodQuarterStartEndTime() {
    this.getEndpointData('preclose-start-end-time').subscribe((data: any) => {
      data.forEach((row) => {
        if (row['CLOSE_TYPE'] == 'PRECLOSE') {
          this.preclosePeriod = row['PERIOD_NAME'];
          this.precloseQuarter = row['QUARTER'];
        }
      });
    });
  }

  extractDatePrettify(date: string) {
    let dateParts = date.split('T')[0].split('-');
    let year = dateParts[0];
    let month = dateParts[1];
    let day = dateParts[2];

    let timeParts = date.split('T')[1].split('.');
    let time = timeParts[0];

    let prettyDate = `${month}/${day}/${year} ${time} PST`;
    return prettyDate;
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

  // for the view details button
  viewSummary() {
    this.router.navigate(['/error-dash']);
  }

  displayedColumns: string[] = [
    'select',
    // 'PERIOD_YEAR',
    'PERIOD_NAME',
    'APPLICATION_NAME',
    'BATCH_SOURCE',
    'ORDER_NUMBER',
    'ENTITY',
    'TYPE',
    'AGING',
    'AMOUNT_USD',
    'MESSAGE_TEXT',
  ];

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  setSortAndPaginator() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }
}

interface errorDetailsModel {
  PERIOD_NAME: number;
  APPLICATION_NAME: string;
  BATCH_SOURCE: string;
  ORDER_NUMBER: number;
  ENTITY: string;
  TRANSACTION_TYPE: string;
  AMOUNT_USD: number;
  NO_OF_RECORDS: number;
  AGING: number;
  AMOUNT: number;
  LINE_ID: number;
  MESSAGE_TEXT: string;
  SUB_APPLICATION: string;
  TRXN_CURRENCY: string;
  TYPE: string;
}
