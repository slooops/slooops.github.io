import { Component, Input } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-caseiq-table',
  templateUrl: './caseiq-table.component.html',
  styleUrls: ['./caseiq-table.component.css'],
})
export class CaseiqTableComponent {
  @Input() title!: string; // Table Title
  @Input() dataSource!: MatTableDataSource<any>; // Data for the table
  @Input() displayedColumns!: string[]; // Columns to display
  @Input() exportFileName!: string; // File name for export
  @Input() reportLink?: string; // Optional report link
  @Input() extraWideColumns: string[] = []; // Columns that should be wider

  removeUnderscores(key: string): string {
    return key.replace(/_/g, ' ');
  }

  exportTableToExcel(): void {
    const data = this.dataSource.data;
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = {
      Sheets: { [this.exportFileName]: worksheet },
      SheetNames: [this.exportFileName],
    };
    XLSX.writeFile(workbook, `${this.exportFileName}.xlsx`);
  }
}
