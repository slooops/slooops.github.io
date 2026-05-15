import { Component, Input } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import * as XLSX from 'xlsx';
import { CommonModule, DatePipe } from '@angular/common';
import { LoadingSymbolComponent } from '../../../loading-symbol/loading-symbol.component';
import { TitleCaseWithExceptionsPipe } from '../../../title-case-with-exceptions.pipe';

@Component({
  selector: 'app-atmf-table',
  templateUrl: './atmf-table.component.html',
  styleUrls: ['./atmf-table.component.css'],
  imports: [
    CommonModule,
    LoadingSymbolComponent,
    TitleCaseWithExceptionsPipe,
    DatePipe,
  ],
  standalone: true,
})
export class AtmfTableComponent {
  @Input() title!: string; // Table Title
  @Input() dataSource!: MatTableDataSource<any>; // Data for the table
  @Input() displayedColumns!: string[]; // Columns to display
  @Input() exportFileName: string; // File name for export

  removeUnderscores(key: string): string {
    return key.replace(/_/g, ' ');
  }

  isDateColumn(column: string): boolean {
    return column.includes('TIME') || column.includes('DATE');
  }

  isPercentColumn(column: string): boolean {
    return column.includes('%');
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
