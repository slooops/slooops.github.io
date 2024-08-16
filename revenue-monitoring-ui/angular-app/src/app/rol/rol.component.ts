import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ApiHttpService } from 'src/app/providers/http.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-rol',
  templateUrl: './rol.component.html',
  styleUrls: ['./rol.component.css'],
})
export class RolComponent implements OnInit {
  // Only the paginator for the second table (ROL Transaction Data)
  @ViewChild('transactionPaginator') transactionPaginator: MatPaginator;

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

  rolTransactionData: MatTableDataSource<any> = new MatTableDataSource([]);
  displayedColumns: string[] = [];

  constructor(private http: ApiHttpService) {}

  ngOnInit(): void {
    this.getRolTransactionData();
    this.getRolErrorSummaryData();
  }

  getRolErrorSummaryData() {
    console.log('Getting rol error summary data');
    this.http.get('rol-errors-summary').subscribe((data: any) => {
      this.rolErrorSummaryData.data = data;
    });
  }

  getRolTransactionData() {
    this.http.get('rol-transaction-data').subscribe((data: any) => {
      if (data.length > 0) {
        // Dynamically set displayedColumns based on keys of the first object
        this.displayedColumns = Object.keys(data[0]);

        // Filter out columns you don't want to display
        this.removeColumns(['CUSTTRXLINEID']);
      }

      this.rolTransactionData.data = data;
      this.rolTransactionData.paginator = this.transactionPaginator;
      console.log(this.rolTransactionData);
    });
  }

  removeColumns(columnsToRemove: string[]) {
    this.displayedColumns = this.displayedColumns.filter(
      (column) => !columnsToRemove.includes(column)
    );
  }

  exportTableToExcel(data: any[], sheetName: string, filename: string) {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }
}
