import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ApiHttpService } from 'src/app/providers/http.service';
import * as XLSX from 'xlsx';
import { DestroyManager } from '../providers/destroy-manager.service';

@Component({
  selector: 'app-sbp',
  templateUrl: './sbp.component.html',
  styleUrls: ['./sbp.component.css'],
  providers: [DestroyManager],
})
export class SbpComponent implements OnInit {
  sbpSummaryData: MatTableDataSource<any> = new MatTableDataSource([]);
  summaryColumns: string[] = [];

  private originalDetailsData: any[] = [];
  sbpDetailsData: MatTableDataSource<any> = new MatTableDataSource([]);
  detailsColumns: string[] = [];

  summaryLoading = true;
  detailsLoading = true;

  constructor(
    private http: ApiHttpService,
    private destroyManager: DestroyManager
  ) {}

  ngOnInit(): void {
    this.getSbpSummaryData();
    this.getSbpDetailData();
  }

  getSbpSummaryData() {
    this.http.get('sbp-summary', this.destroyManager).subscribe((data: any) => {
      console.log('summary', data);
      if (data.length > 0) {
        // Dynamically set summaryColumns based on keys of the first object
        this.summaryColumns = Object.keys(data[0]);

        // Filter out columns you don't want to display
        // this.removeColumns(['CUSTTRXLINEID']);
      }

      this.sbpSummaryData.data = this.formatData(data);
      this.summaryLoading = false;
    });
  }

  getSbpDetailData() {
    this.http.get('sbp-details', this.destroyManager).subscribe((data: any) => {
      console.log('detail', data);
      if (data.length > 0) {
        this.detailsColumns = Object.keys(data[0]);
      }

      this.originalDetailsData = this.formatData(data); // Save original data
      this.sbpDetailsData.data = [...this.originalDetailsData];

      this.detailsLoading = false;
    });
  }

  filterDetails(entity: string, statusColumn: string) {
    console.log('entity', entity), console.log('statusColumn', statusColumn);
    // Filter the details data based on ENTITY and RECON_STATUS

    this.sbpDetailsData.data = [...this.originalDetailsData];

    this.sbpDetailsData.data = this.sbpDetailsData.data.filter(
      (row: any) =>
        row['ENTITY'] === entity && row['RECON_STATUS'] === statusColumn
    );
  }

  removeColumns(columnsToRemove: string[]) {
    this.summaryColumns = this.summaryColumns.filter(
      (column) => !columnsToRemove.includes(column)
    );
  }

  formatData(data: any[]): any[] {
    const columnsToFormat = ['BILL_TOTAL', 'INVOICED']; // List of columns to format

    return data.map((row) => {
      const formattedRow = { ...row };

      columnsToFormat.forEach((column) => {
        if (column in row) {
          formattedRow[column] = `${Number(row[column]).toLocaleString(
            undefined,
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )}`;
        }
      });

      return formattedRow;
    });
  }

  // Replace underscores in column headers
  replaceUnderscore(value: string | null | undefined): string {
    if (!value) {
      return ''; // Return an empty string if value is null or undefined
    }

    const specialWords = [
      'bill',
      'home',
      'tech',
      'unit',
      'for',
      'next',
      'run',
      'hold',
    ];

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
