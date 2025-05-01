import { Component, ViewChild } from '@angular/core';
import { DestroyManager } from '../providers/destroy-manager.service';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { ExceptionLog } from '../opl/opl.component';
import { ApiHttpService } from '../providers/http.service';

@Component({
  selector: 'app-order-management',
  templateUrl: './order-management.component.html',
  styleUrl: './order-management.component.css',
  providers: [DestroyManager],
})
export class OrderManagementComponent {
  @ViewChild(MatTable) table: MatTable<any>;

  constructor(http: ApiHttpService, private destroyManager: DestroyManager) {
    this.http = http;
  }
  protected http: ApiHttpService;
  summaryDataSource: any;
  detailsDataSource: any;

  ngOnInit(): void {
    this.getOmSummaryData();
    this.getOmDetailsData();
  }

  sampleData: any[];
  summaryDisplayedColumns: string[] = [
    'created_date',
    'data_source',
    'scenario',
    'timestamp',
    'total_count',
  ];

  detailsDisplayedColumns: string[] = [
    'actionable_flag',
    'assigned_to',
    'closed_date',
    'comments',
    'count',
    'created_date',
    'data_source',
    'database',
    'head_1',
    'head_2',
    'head_3',
    'scenario',
    'status',
    'timestamp',
  ];

  getOmSummaryData() {
    this.http
      .get('om-summary-data', this.destroyManager)
      .subscribe((data: any) => {
        this.summaryDataSource = new MatTableDataSource<ExceptionLog>(data);
      });
  }

  getOmDetailsData() {
    this.http
      .get('om-details-data', this.destroyManager)
      .subscribe((data: any) => {
        this.detailsDataSource = new MatTableDataSource<ExceptionLog>(data);
      });
  }
}

export interface SummaryData {
  created_date: string;
  data_source: string;
  scenario: string;
  timestamp: string;
  total_count: string;
}

export interface DetailsData {
  actionable_flag: string;
  assigned_to: string;
  closed_date: string;
  comments: string;
  count: string;
  created_date: string;
  data_source: string;
  database: string;
  head_1: string;
  head_2: string;
  head_3: string;
  scenario: string;
  status: string;
  timestamp: string;
}
