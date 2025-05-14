import { Component, ViewChild } from '@angular/core';
import { DestroyManager } from '../providers/destroy-manager.service';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { ApiHttpService } from '../providers/http.service';
import { DataService } from '../providers/data.service';
import { DatePipe } from '@angular/common';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-order-management',
  templateUrl: './order-management.component.html',
  styleUrl: './order-management.component.css',
  providers: [DestroyManager],
})
export class OrderManagementComponent {
  @ViewChild(MatTable) table: MatTable<any>;
  @ViewChild('detailsPaginator') detailsPaginator: MatPaginator;
  @ViewChild('summaryPaginator') summaryPaginator: MatPaginator;

  constructor(
    http: ApiHttpService,
    private destroyManager: DestroyManager,
    private dataService: DataService,
    private datePipe: DatePipe
  ) {
    this.http = http;
  }
  protected http: ApiHttpService;
  summaryDataSource: any;
  detailsDataSource: any;
  selection = new SelectionModel<any>(true, []);

  ngOnInit(): void {
    this.getOmSummaryData();
    this.getOmDetailsData();
    this.getErrorSummaryPeriodStatus();
  }

  sampleData: any[];
  summaryDisplayedColumns: string[] = [
    'select',
    'created_date',
    'data_source',
    'scenario',
    'timestamp',
    'total_count',
    'aging',
  ];

  detailsDisplayedColumns: string[] = [
    'actionable_flag',
    'closed_date',
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
    'assigned_to',
    'comments',
  ];

  summaryLoadTime: string = '';
  totalSummaryRecords: number = 0;
  getOmSummaryData() {
    this.http
      .get('om-summary-data', this.destroyManager)
      .subscribe((data: any) => {
        console.log('Summary Data:', data);
        this.summaryDataSource = new MatTableDataSource<SummaryData>(data);
        if (this.summaryPaginator) {
          if (this.summaryDataSource.paginator !== this.summaryPaginator) {
            this.summaryDataSource.paginator = this.summaryPaginator;
          }
          this.totalSummaryRecords = data.length;
        }
        this.summaryLoadTime = `Last Updated: ${new Date().toLocaleString()}`;
      });
  }

  totalRecords: number = 0;
  getOmDetailsData() {
    this.http
      .get('om-details-data', this.destroyManager)
      .subscribe((data: any) => {
        this.detailsDataSource = new MatTableDataSource<DetailsData>(data);
        if (this.detailsPaginator) {
          if (this.detailsDataSource.paginator !== this.detailsPaginator) {
            this.detailsDataSource.paginator = this.detailsPaginator;
          }
          this.totalRecords = data.length;
        }
      });
  }

  periodStatus: any;
  periodName: string;
  periodEnd: string;

  getErrorSummaryPeriodStatus() {
    this.dataService
      .getMonitoringPeriodStatus(this.destroyManager)
      .subscribe((data: any) => {
        this.periodStatus = data;
        this.periodName = this.periodStatus[0].PERIOD_NAME;
        this.periodEnd = this.dateTransform(this.periodStatus[0].END_DATE);
      });
  }

  dateTransform(dateString: string): string {
    return this.datePipe.transform(dateString, 'MM/dd/yyyy');
  }

  selectedSummaryData: any[] = [];
  isModalOpen: boolean = false;
  selectedRows: any[] = [];
  onRowSelectionChange(event: MatCheckboxChange, row: any) {
    this.selection.toggle(row);

    if (event.checked) {
      this.selectedRows.push(row);
    } else {
      this.selectedRows = this.selectedRows.filter(
        (selectedRow) => selectedRow !== row
      );
    }
  }
}

export interface SummaryData {
  created_date: string;
  data_source: string;
  scenario: string;
  timestamp: string;
  total_count: string;
  aging: string;
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
