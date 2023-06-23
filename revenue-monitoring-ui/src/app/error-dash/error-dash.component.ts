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
  selector: 'app-error-dash',
  templateUrl: './error-dash.component.html',
  styleUrls: ['./error-dash.component.css'],
})
export class ErrorDashComponent implements OnInit {
  protected http: ApiHttpService;
  length: number;

  preclosePeriod: String = '';
  precloseQuarter: String = '';
  refreshInterval = 120000; //ms

  errorDashData: errorDashModel[];
  selectedErrors: errorDashModel[];
  dataSource: any;

  constructor(
    http: ApiHttpService,
    private router: Router,
    private dataService: DataService
  ) {
    this.http = http;
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngOnInit(): void {
    // this.getPeriodQuarterStartEndTime();
    this.getErrorSummary();
  }

  getErrorSummary() {
    this.http.get('error-summary').subscribe((data: any) => {
      this.errorDashData = data;
      this.dataSource = new MatTableDataSource<errorDashModel>(
        this.errorDashData
      );
      this.length = this.errorDashData.length;
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

  selection = new SelectionModel<any>(true, []);
  selectedData: errorDashModel[] = [];

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

  // for the view details button
  viewDetails() {
    if (this.selection.hasValue()) {
      this.selectedData = this.selection.selected;
      // We can store the selected data in a service or use other means
      // to pass it to the detail view component. Idk what I'm doing lol
    }
    this.dataService.setAllErrorsSelected(this.isAllSelected());
    this.dataService.setErrorData(this.selectedData);
    // Navigate to the detail view component
    this.router.navigate(['/detail-view']);
  }

  displayedColumns: string[] = [
    'select',
    // 'PERIOD_YEAR',
    'PERIOD_NAME',
    'APPLICATION_NAME',
    'BATCH_SOURCE',
    'ENTITY',
    'TRANSACTION_TYPE',
    'AMOUNT_USD',
    'NO_OF_RECORDS',
  ];

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  setSortAndPaginator() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }
}

export interface errorDashModel {
  PERIOD_YEAR: number;
  PERIOD_NAME: number;
  APPLICATION_NAME: string;
  BATCH_SOURCE: string;
  ENTITY: string;
  TRANSACTION_TYPE: string;
  AMOUNT_USD: number;
  NO_OF_RECORDS: number;
}
