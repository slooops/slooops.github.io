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
  rolErrorDisplayedColumns: string[] = [];

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
      this.rolErrorDisplayedColumns = Object.keys(data[0]);
      this.rolErrorSummaryData.data = this.formatData(data);
    });
  }

  getRolTransactionData() {
    this.http.get('rol-transaction-data').subscribe((data: any) => {
      if (data.length > 0) {
        // Dynamically set displayedColumns based on keys of the first object
        this.displayedColumns = Object.keys(data[0]);

        // Filter out columns you don't want to display
        this.removeColumns(['']);
        this.rolTransactionData.data = this.formatData(data);
        // this.rolTransactionData.paginator = this.transactionPaginator;
      }

      console.log(this.rolTransactionData);
    });
  }

  removeColumns(columnsToRemove: string[]) {
    this.displayedColumns = this.displayedColumns.filter(
      (column) => !columnsToRemove.includes(column)
    );
  }

  formatData(data: any[]): any[] {
    return data.map((row) => {
      const formattedRow = { ...row };

      // If the AMOUNT column exists, format it with dollar signs and commas, and ensure two decimal places
      if ('AMOUNT' in row) {
        formattedRow['AMOUNT'] = `$${Number(row['AMOUNT']).toLocaleString(
          undefined,
          {
            minimumFractionDigits: 2, // Always show at least two decimal places
            maximumFractionDigits: 2, // Restrict to two decimal places
          }
        )}`;
      }

      return formattedRow;
    });
  }

  // Replace underscores in column headers
  replaceUnderscore(value: string | null | undefined): string {
    if (!value) {
      return ''; // Return an empty string if value is null or undefined
    }

    const specialWords = ['name', 'num', 'year', 'code', 'org', 'sub', 'unit'];

    return value
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => {
        const lowerWord = word.toLowerCase();
        if (specialWords.includes(lowerWord)) {
          return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
        }
        return word.length > 4
          ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          : word;
      })
      .join(' ');
  }

  exportTableToExcel(data: any[], sheetName: string, filename: string) {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }
}
