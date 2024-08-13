import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from 'src/app/providers/http.service';
import { MatTableDataSource } from '@angular/material/table';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-rol',
  templateUrl: './rol.component.html',
  styleUrls: ['./rol.component.css'],
})
export class RolComponent implements OnInit {
  rolTransactionData: MatTableDataSource<any> = new MatTableDataSource([]);
  displayedColumns: string[] = [
    'ACCOUNT_CLASS',
    'AMOUNT',
    'DIST_TYPE',
    'SEGMENT4',
    'TRANSACTION_ID',
  ];

  rolErrorSummaryData: MatTableDataSource<any> = new MatTableDataSource([]);
  rolErrorDisplayedColumns: string[] = [
    'AMOUNT',
    'APPLICATION_NAME',
    'CURRENCY_CODE',
    'ERROR_APPLICATION',
    'ORG_ID',
    'PERIOD_NUM',
    'PERIOD_YEAR',
    'SUB_APPLICATION',
  ];

  http: ApiHttpService;

  constructor(http: ApiHttpService) {
    this.http = http;
  }

  ngOnInit(): void {
    this.getRolTransactionData();
    this.getRolErrorSummaryData();
  }

  getRolTransactionData() {
    console.log('Getting rol transaction data');
    this.http.get('rol-transaction-data').subscribe((data: any) => {
      this.rolTransactionData.data = data;
      console.log(this.rolTransactionData);
    });
  }

  getRolErrorSummaryData() {
    console.log('Getting rol error summary data');
    this.http.get('rol-errors-summary').subscribe((data: any) => {
      this.rolErrorSummaryData.data = data;
    });
  }

  exportTableToExcel(data: any[], sheetName: string, filename: string) {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }
}
