import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-wd0-historical-data',
  templateUrl: './wd0-historical-data.component.html',
  styleUrls: ['./wd0-historical-data.component.css'],
})
export class Wd0HistoricalDataComponent implements OnInit {
  protected http: ApiHttpService;

  constructor(http: ApiHttpService) {
    this.http = http;
  }

  displayedColumns: string[] = [];
  historicalData: HistoricalDataModel[];
  dataSource: any;

  ngOnInit(): void {
    this.getHistoricalData();
  }

  getHistoricalData() {
    this.http.get('wd0-historical-data').subscribe((data: any) => {
      this.historicalData = data;
      this.displayedColumns = Object.keys(this.historicalData[0]);

      this.dataSource = new MatTableDataSource<HistoricalDataModel>(
        this.historicalData
      );
    });
  }
  formatColumnHeader(columnName: string): string {
    return columnName.replace(/_/g, ' ');
  }
}

export interface HistoricalDataModel {
  APR_20: string;
  APR_21: string;
  APR_22: string;
  APR_23: string;
  AUG_20: string;
  DEC_20: string;
  ENTITY: string;
  FEB_20: string;
  JAN_20: string;
  JAN_21: string;
  JAN_22: string;
  JAN_23: string;
  JUL_19: string;
  JUL_20: string;
  JUL_21: string;
  JUL_22: string;
  JUL_23: string;
  JUN_19: string;
  LINE_TYPE: string;
  NOV_20: string;
  OCT_20: string;
  OCT_21: string;
  OCT_22: string;
  OCT_23: string;
  OCT_24: string | null;
  SEP_20: string;
}
