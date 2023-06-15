import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ApiHttpService } from '../providers/http.service';
import { map } from 'rxjs';
import { DatePipe } from '@angular/common';
import { MatSelect } from '@angular/material/select';
import { TimeagoClock } from 'ngx-timeago';
import { switchMap, startWith } from 'rxjs/operators';
import { Observable, interval, Subscription } from 'rxjs';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-error-dash',
  templateUrl: './error-dash.component.html',
  styleUrls: ['./error-dash.component.css'],
})
export class ErrorDashComponent implements OnInit {
  protected http: ApiHttpService;

  constructor(http: ApiHttpService) {
    this.http = http;

    window.onbeforeunload = function () {
      localStorage.clear();
      return '';
    };
  }
  ngOnInit(): void {
    this.getPeriodQuarterStartEndTime();
  }

  preclosePeriod: String = '';
  precloseQuarter: String = '';
  refreshInterval = 120000; //ms

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
}
