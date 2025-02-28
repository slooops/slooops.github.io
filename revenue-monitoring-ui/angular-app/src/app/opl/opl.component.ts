import { Component, OnInit, ViewChild } from '@angular/core';
import { DestroyManager } from '../providers/destroy-manager.service';
import { ApiHttpService } from '../providers/http.service';
import { MatTable, MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-opl',
  templateUrl: './opl.component.html',
  styleUrls: ['./opl.component.css'],
  providers: [DestroyManager],
})
export class OplComponent implements OnInit {
  @ViewChild(MatTable) table: MatTable<any>;

  constructor(http: ApiHttpService, private destroyManager: DestroyManager) {
    this.http = http;
  }
  protected http: ApiHttpService;
  dataSource: any;
  summaryColumns: string[] = [];

  ngOnInit(): void {
    this.getOplData();
  }

  sampleData: any[];
  displayedColumns: string[] = [
    'crDt',
    'eventId',
    'eventNm',
    'eventTm',
    'eventTyp',
    'exceptionType',
    'offset',
    'ordNum',
    'partition',
    'processCrDt',
    'processErrorMsg',
    'processStatus',
    'processUpdDt',
    'status',
    'subscriber',
    'topic',
    'updDt',
  ];

  getOplData() {
    this.http.get('opl-data', this.destroyManager).subscribe((data: any) => {
      this.dataSource = new MatTableDataSource<ExceptionLog>(data);
    });
  }
}

export interface ExceptionLog {
  crDt: string;
  eventId: number;
  eventNm: string;
  eventTm: string;
  eventTyp: string;
  exceptionType: string;
  offset: number;
  ordNum: string;
  partition: number;
  processCrDt: string;
  processErrorMsg: string;
  processStatus: string;
  processUpdDt: string;
  status: string;
  subscriber: string;
  topic: string;
  updDt: string;
}
