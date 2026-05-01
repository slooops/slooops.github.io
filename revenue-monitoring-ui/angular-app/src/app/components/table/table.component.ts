import { Component, Input } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import * as XLSX from 'xlsx';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { LoadingSymbolComponent } from '../../loading-symbol/loading-symbol.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorArrowLineDownBold } from '@ng-icons/phosphor-icons/bold';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
  imports: [CommonModule, MatTableModule, LoadingSymbolComponent, NgIcon],
  providers: [provideIcons({ phosphorArrowLineDownBold })],
  standalone: true,
})
export class TableComponent {
  @Input() title!: string; // Table Title
  @Input() dataSource!: MatTableDataSource<any>; // Data for the table
  @Input() displayedColumns!: string[]; // Columns to display
  @Input() exportFileName!: string; // File name for export
  @Input() reportLink?: string; // Optional report link
  @Input() serviceNowLink?: string; // Optional ServiceNow link
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
