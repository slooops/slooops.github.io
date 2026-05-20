import { Component, Input } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import ExcelJS from 'exceljs';
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

  async exportTableToExcel(): Promise<void> {
    const data = this.dataSource.data;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(
      this.exportFileName.substring(0, 31),
    );

    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);
      data.forEach((row) => worksheet.addRow(headers.map((h) => row[h])));
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.exportFileName}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
