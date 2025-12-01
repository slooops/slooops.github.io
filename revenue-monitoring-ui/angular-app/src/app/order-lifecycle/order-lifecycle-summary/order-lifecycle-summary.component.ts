import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiHttpService } from '../../providers/http.service';
import { MatTableDataSource } from '@angular/material/table';
import * as XLSX from 'xlsx';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { MatPaginator } from '@angular/material/paginator';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { ExportToExcelService } from 'src/app/providers/export-to-excel.service';

@Component({
    selector: 'app-order-lifecycle-summary',
    templateUrl: './order-lifecycle-summary.component.html',
    styleUrls: ['./order-lifecycle-summary.component.css'],
    providers: [DestroyManager],
    standalone: false
})
export class OrderLifecycleSummaryComponent implements OnInit {
  selectedArr: OrderLifecycleSummaryModel[];
  constructor(
    public dialogRef: MatDialogRef<OrderLifecycleSummaryComponent>,
    @Inject(MAT_DIALOG_DATA) public injectData: any,
    http: ApiHttpService,
    private destroyManager: DestroyManager,
    private exportToExcelService: ExportToExcelService
  ) {
    this.http = http;
  }

  protected http: ApiHttpService;
  summaryModel: OrderLifecycleSummaryModel[];
  summaryModelByAccount: OrderLifecycleSummaryModelByAccount[];

  dataSource: any;
  dataSourceByAccount: any;
  total: boolean = false;

  selectedTabIndex: number = 0;
  closeDialog() {
    this.dialogRef.close();
  }

  ngOnInit(): void {
    this.getOrderLifecycleSummary();
  }

  displayedColumns = ['PROGRAM_NAME', 'ORDER_COUNT', 'STATUS', 'COMPLETION'];

  displayedColumnsByAccount = [
    'ACCOUNT',
    'ORDER_COUNT',
    'STATUS',
    'COMPLETION',
  ];

  getOrderLifecycleSummary() {
    this.http
      .get('order-status-summary', this.destroyManager)
      .subscribe((data: any) => {
        this.summaryModel = data;
        this.dataSource = new MatTableDataSource<OrderLifecycleSummaryModel>(
          this.summaryModel
        );
      });

    this.http
      .get('large-deal-summary-account', this.destroyManager)
      .subscribe((data: any) => {
        this.summaryModelByAccount = data;
        this.dataSourceByAccount =
          new MatTableDataSource<OrderLifecycleSummaryModelByAccount>(
            this.summaryModelByAccount
          );
      });
  }

  onTabChange(event: MatTabChangeEvent) {
    this.selectedTabIndex = event.index;
  }

  exportByTab() {
    if (this.selectedTabIndex == 0) {
      this.exportTableToExcel(
        this.summaryModel,
        'Large Deal Summary By Program',
        'large_deal_summary_by_program'
      );
    } else {
      this.exportTableToExcel(
        this.summaryModelByAccount,
        'Large Deal Summary By Account',
        'large_deal_summary_by_account'
      );
    }
  }

  exportTableToExcel(data: any[], sheetName: string, filename: string) {
    this.exportToExcelService.exportTableToExcel(data, sheetName, filename);
  }
}

export interface OrderLifecycleSummaryModel {
  PROGRAM_NAME: string;
  ORDER_COUNT: number;
  STATUS: string;
  COMPLETION: string;
}

export interface OrderLifecycleSummaryModelByAccount {
  ACCOUNT: string;
  ORDER_COUNT: number;
  STATUS: string;
  COMPLETION: string;
}
