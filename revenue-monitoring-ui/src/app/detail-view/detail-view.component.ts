import { Component, OnDestroy, OnInit, ViewChild, Input } from '@angular/core';
import { Router } from '@angular/router';
import { MatSort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTableDataSource } from '@angular/material/table';
import { FormControl } from '@angular/forms';
import { ApiHttpService } from '../providers/http.service';
import { map } from 'rxjs';
import { DatePipe } from '@angular/common';
import { MatSelect } from '@angular/material/select';
import { switchMap, startWith } from 'rxjs/operators';
import { Observable, interval, Subscription } from 'rxjs';
import * as XLSX from 'xlsx';
import { SelectionModel } from '@angular/cdk/collections';
import { HttpClient } from '@angular/common/http';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSortModule } from '@angular/material/sort';

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
  dataSource = new MatTableDataSource<any>();

  constructor(
    private apiHttpService: ApiHttpService,
    private router: Router,
    private httpClient: HttpClient
  ) {
    window.onbeforeunload = function () {
      localStorage.clear();
      return '';
    };
  }

  ngOnInit(): void {
    this.getPeriodQuarterStartEndTime();
    this.httpClient.get<any[]>('assets/detail-view.json').subscribe((data) => {
      this.dataSource.data = data;
    });
  }

  getEndpointData(endpoint: string): Observable<any> {
    const polling$ = interval(this.refreshInterval).pipe(
      startWith(0), // Emit initial value immediately
      switchMap(() => this.apiHttpService.get(endpoint))
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
    'INTERFACE_LINE_ID',
    'ENTITY',
    'TYPE',
    'AGING',
    'AMOUNT_USD',
    'MESSAGE_TEXT',
  ];

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  ngAfterViewInit() {
    // this.dataSource.sort = this.sort;
  }
}
