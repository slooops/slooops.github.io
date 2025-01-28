import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiHttpService } from '../../providers/http.service';
import { MatTableDataSource } from '@angular/material/table';
import * as XLSX from 'xlsx';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { MatPaginator } from '@angular/material/paginator';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';

@Component({
  selector: 'app-order-lifecycle-summary',
  templateUrl: './order-lifecycle-summary.component.html',
  styleUrls: ['./order-lifecycle-summary.component.css'],
  providers: [DestroyManager],
})
export class OrderLifecycleSummaryComponent implements OnInit {
  selectedArr: OrderLifecycleSummaryModel[];
  constructor(
    public dialogRef: MatDialogRef<OrderLifecycleSummaryComponent>,
    @Inject(MAT_DIALOG_DATA) public injectData: any,
    http: ApiHttpService,
    private destroyManager: DestroyManager
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
    let worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    let workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    let excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    this.saveAsExcelFile(excelBuffer, filename);
  }

  saveAsExcelFile(buffer: any, filename: string) {
    let data: Blob = new Blob([buffer], { type: 'application/octet-stream' });
    let url = window.URL.createObjectURL(data);
    let link = document.createElement('a');
    link.href = url;
    link.download = filename + '.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
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
