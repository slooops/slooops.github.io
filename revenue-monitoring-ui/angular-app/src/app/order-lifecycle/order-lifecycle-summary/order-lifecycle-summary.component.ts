import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiHttpService } from '../../providers/http.service';
import { MatTableDataSource } from '@angular/material/table';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-order-lifecycle-summary',
  templateUrl: './order-lifecycle-summary.component.html',
  styleUrls: ['./order-lifecycle-summary.component.css'],
})
export class OrderLifecycleSummaryComponent implements OnInit {
  selectedArr: OrderLifecycleSummaryModel[];
  constructor(
    public dialogRef: MatDialogRef<OrderLifecycleSummaryComponent>,
    @Inject(MAT_DIALOG_DATA) public injectData: any,
    http: ApiHttpService
  ) {
    this.http = http;
  }

  protected http: ApiHttpService;
  summaryModel: OrderLifecycleSummaryModel[];

  dataSource: any;
  total: boolean = false;

  closeDialog() {
    this.dialogRef.close();
  }

  ngOnInit(): void {
    this.getOrderLifecycleSummary();
  }

  displayedColumns = ['PROGRAM_NAME', 'ORDER_COUNT', 'STATUS', 'COMPLETION'];

  getOrderLifecycleSummary() {
    this.http.get('order-status-summary').subscribe((data: any) => {
      this.summaryModel = data;
      this.dataSource = new MatTableDataSource<OrderLifecycleSummaryModel>(
        this.summaryModel
      );
    });
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
