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

  http: ApiHttpService;

  constructor(http: ApiHttpService) {
    this.http = http;
  }

  ngOnInit(): void {
    this.getRolTransactionData();
  }

  getRolTransactionData() {
    console.log('Getting rol transaction data');
    this.http.get('rol-transaction-data').subscribe((data: any) => {
      this.rolTransactionData.data = data;
      console.log(this.rolTransactionData);
    });
  }

  exportTableToExcel(data: any[], sheetName: string, filename: string) {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }
}
