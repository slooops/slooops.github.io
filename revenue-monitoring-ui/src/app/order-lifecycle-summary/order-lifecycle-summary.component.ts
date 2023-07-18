import { Component, OnInit, Inject, Input, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiHttpService } from '../providers/http.service';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { MatSort } from '@angular/material/sort';
import * as XLSX from 'xlsx';
import { FormGroup, FormControl } from '@angular/forms';

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
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  dataSource: any;
  total: boolean = false;

  closeDialog() {
    this.dialogRef.close(/* optional result to pass back */);
  }

  ngOnInit(): void {
    this.getOrderLifecycleSummary();
  }

  displayedColumns = [
    'select',
    'PROGRAM_NAME',
    'ORDER_COUNT',
    'STATUS',
    'COMPLETION',
  ];

  getOrderLifecycleSummary() {
    this.http.get('order-status-summary').subscribe((data: any) => {
      this.summaryModel = data;
      this.dataSource = new MatTableDataSource<OrderLifecycleSummaryModel>(
        this.summaryModel
      );

      this.dataSource.sort = this.sort;
    });
  }

  shouldDisplayCheckbox(row: any): boolean {
    // Example: Hide checkbox for rows where 'column2' value is 'hide'
    this.total = row.PROGRAM_NAME.includes('Total');
    return this.total;
  }

  export(sheetName: string, filename: string) {
    if (this.isAllSelected() || this.selection.selected.length === 0) {
      this.exportTableToExcel(this.summaryModel, sheetName, filename);
    } else if (!this.isAllSelected()) {
      this.selectedArr = this.selection.selected;
      this.exportTableToExcel(this.selectedArr, sheetName, filename);
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
    let url = window.URL.createObjectURL(data); // temp URL that points to the generated excel file data buffer
    let link = document.createElement('a'); // create link
    link.href = url;
    link.download = filename + '.xlsx';
    link.click(); // triggers the download process and save file prompt in browser
    window.URL.revokeObjectURL(url); // revoke temp URL
  }

  @Input() data: any;
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
}

export interface OrderLifecycleSummaryModel {
  PROGRAM_NAME: string;
  ORDER_COUNT: number;
  STATUS: string;
  COMPLETION: string;
}
