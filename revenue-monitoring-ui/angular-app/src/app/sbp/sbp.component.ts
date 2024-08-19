import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ApiHttpService } from 'src/app/providers/http.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-sbp',
  templateUrl: './sbp.component.html',
  styleUrls: ['./sbp.component.css'],
})
export class SbpComponent implements OnInit {
  sbpData: MatTableDataSource<any> = new MatTableDataSource([]);
  displayedColumns: string[] = [];

  constructor(private http: ApiHttpService) {}

  ngOnInit(): void {
    this.getSbpData();
  }

  getSbpData() {
    this.http.get('sbp-summary').subscribe((data: any) => {
      if (data.length > 0) {
        // Dynamically set displayedColumns based on keys of the first object
        this.displayedColumns = Object.keys(data[0]);

        // Filter out columns you don't want to display
        // this.removeColumns(['CUSTTRXLINEID']);
      }

      this.sbpData.data = data;
      console.log(this.sbpData);
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
