import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FormControl } from '@angular/forms';
import { ApiHttpService } from '../providers/http.service';
import { map } from 'rxjs';
import { DatePipe } from '@angular/common';
import { MatSelect } from '@angular/material/select';
import { TimeagoClock } from 'ngx-timeago';
import { switchMap, startWith } from 'rxjs/operators';
import { Observable, interval, Subscription } from 'rxjs';
import * as XLSX from 'xlsx';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-error-dash',
  templateUrl: './error-dash.component.html',
  styleUrls: ['./error-dash.component.css'],
})
export class ErrorDashComponent implements OnInit {
  protected http: ApiHttpService;

  preclosePeriod: String = '';
  precloseQuarter: String = '';
  refreshInterval = 120000; //ms

  constructor(http: ApiHttpService, private router: Router) {
    this.http = http;

    window.onbeforeunload = function () {
      localStorage.clear();
      return '';
    };
  }

  ngOnInit(): void {
    this.getPeriodQuarterStartEndTime();
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
  selectedData: any;

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
  viewDetails() {
    if (this.selection.hasValue()) {
      this.selectedData = this.selection.selected;
      // We can store the selected data in a service or use other means
      // to pass it to the detail view component. Idk what I'm doing lol
    }
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
  dataSource = new MatTableDataSource([
    {
      PERIOD_YEAR: 2023,
      PERIOD_NAME: 1687478400000,
      APPLICATION_NAME: 'AI_ERROR',
      BATCH_SOURCE: 'ORDER ENTRY',
      ENTITY: 'CISCO BRAZIL CA OPERATING UNIT',
      TRANSACTION_TYPE: 'CM',
      AMOUNT_USD: -2890.65,
      NO_OF_RECORDS: 3,
    },
    {
      PERIOD_YEAR: 2023,
      PERIOD_NAME: 1687478400000,
      APPLICATION_NAME: 'AI_ERROR',
      BATCH_SOURCE: 'ICMS-XAAS-CCE',
      ENTITY: 'CISCO CANADA OPERATING UNIT',
      TRANSACTION_TYPE: 'CM',
      AMOUNT_USD: -1086.27,
      NO_OF_RECORDS: 3,
    },
    {
      PERIOD_YEAR: 2023,
      PERIOD_NAME: 1687478400000,
      APPLICATION_NAME: 'AI_ERROR',
      BATCH_SOURCE: 'SAAS-RIMG-ONL',
      ENTITY: 'CISCO IN CCIPL OPERATING UNIT',
      TRANSACTION_TYPE: 'CM',
      AMOUNT_USD: -31.22,
      NO_OF_RECORDS: 6,
    },
    {
      PERIOD_YEAR: 2023,
      PERIOD_NAME: 1687478400000,
      APPLICATION_NAME: 'AI_ERROR',
      BATCH_SOURCE: 'ORDER ENTRY',
      ENTITY: 'CISCO ITALY SRL OPERATING UNIT',
      TRANSACTION_TYPE: 'INV',
      AMOUNT_USD: 916.86,
      NO_OF_RECORDS: 2,
    },
    {
      PERIOD_YEAR: 2023,
      PERIOD_NAME: 1687478400000,
      APPLICATION_NAME: 'AI_ERROR',
      BATCH_SOURCE: 'SAAS-RIMG-ONL',
      ENTITY: 'CISCO JAPAN OPERATING UNIT',
      TRANSACTION_TYPE: 'CM',
      AMOUNT_USD: -16.99,
      NO_OF_RECORDS: 2,
    },
    {
      PERIOD_YEAR: 2023,
      PERIOD_NAME: 1687478400000,
      APPLICATION_NAME: 'AI_ERROR',
      BATCH_SOURCE: 'DCA TWO TIER',
      ENTITY: 'CISCO UK HOME OPERATING UNIT',
      TRANSACTION_TYPE: 'CM',
      AMOUNT_USD: -1638471.3899999999,
      NO_OF_RECORDS: 811,
    },
    {
      PERIOD_YEAR: 2023,
      PERIOD_NAME: 1687478400000,
      APPLICATION_NAME: 'AI_ERROR',
      BATCH_SOURCE: 'ORDER ENTRY',
      ENTITY: 'CISCO UK HOME OPERATING UNIT',
      TRANSACTION_TYPE: 'CM',
      AMOUNT_USD: -2602058.4100000001,
      NO_OF_RECORDS: 108,
    },
    {
      PERIOD_YEAR: 2023,
      PERIOD_NAME: 1687478400000,
      APPLICATION_NAME: 'AI_ERROR',
      BATCH_SOURCE: 'ORDER ENTRY',
      ENTITY: 'CISCO UK HOME OPERATING UNIT',
      TRANSACTION_TYPE: 'INV',
      AMOUNT_USD: 2105168.9700000002,
      NO_OF_RECORDS: 1016,
    },
    {
      PERIOD_YEAR: 2023,
      PERIOD_NAME: 1687478400000,
      APPLICATION_NAME: 'AI_ERROR',
      BATCH_SOURCE: 'SAAS-RIMG-ONL',
      ENTITY: 'CISCO UK HOME OPERATING UNIT',
      TRANSACTION_TYPE: 'CM',
      AMOUNT_USD: -180.76,
      NO_OF_RECORDS: 4,
    },
    {
      PERIOD_YEAR: 2023,
      PERIOD_NAME: 1687478400000,
      APPLICATION_NAME: 'AI_ERROR',
      BATCH_SOURCE: 'XAAS',
      ENTITY: 'CISCO UK HOME OPERATING UNIT',
      TRANSACTION_TYPE: 'INV',
      AMOUNT_USD: 23925.12,
      NO_OF_RECORDS: 8,
    },
    {
      PERIOD_YEAR: 2023,
      PERIOD_NAME: 1687478400000,
      APPLICATION_NAME: 'AI_ERROR',
      BATCH_SOURCE: 'ICMS-XAAS',
      ENTITY: 'CISCO US OPERATING UNIT',
      TRANSACTION_TYPE: 'CM',
      AMOUNT_USD: 0.0,
      NO_OF_RECORDS: 1,
    },
    {
      PERIOD_YEAR: 2023,
      PERIOD_NAME: 1687478400000,
      APPLICATION_NAME: 'AI_ERROR',
      BATCH_SOURCE: 'ICMS-XAAS-CCE',
      ENTITY: 'CISCO US OPERATING UNIT',
      TRANSACTION_TYPE: 'CM',
      AMOUNT_USD: -2.4,
      NO_OF_RECORDS: 69,
    },
    {
      PERIOD_YEAR: 2023,
      PERIOD_NAME: 1687478400000,
      APPLICATION_NAME: 'AI_ERROR',
      BATCH_SOURCE: 'ORDER ENTRY',
      ENTITY: 'CISCO US OPERATING UNIT',
      TRANSACTION_TYPE: 'INV',
      AMOUNT_USD: 42650.61,
      NO_OF_RECORDS: 16,
    },
    {
      PERIOD_YEAR: 2023,
      PERIOD_NAME: 1687478400000,
      APPLICATION_NAME: 'AI_ERROR',
      BATCH_SOURCE: 'XAAS',
      ENTITY: 'CISCO US OPERATING UNIT',
      TRANSACTION_TYPE: 'INV',
      AMOUNT_USD: 34375.8,
      NO_OF_RECORDS: 20,
    },
    {
      PERIOD_YEAR: 2023,
      PERIOD_NAME: 1687478400000,
      APPLICATION_NAME: 'AI_ERROR',
      BATCH_SOURCE: 'XAAS-CCE',
      ENTITY: 'CISCO US OPERATING UNIT',
      TRANSACTION_TYPE: 'INV',
      AMOUNT_USD: 0.0,
      NO_OF_RECORDS: 2,
    },
    {
      PERIOD_YEAR: 2023,
      PERIOD_NAME: 1687478400000,
      APPLICATION_NAME: 'AI_ERROR',
      BATCH_SOURCE: 'ORDER ENTRY',
      ENTITY: 'NETHERLANDS Operating',
      TRANSACTION_TYPE: 'INV',
      AMOUNT_USD: 1570.41,
      NO_OF_RECORDS: 8,
    },
  ]);

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }
}
