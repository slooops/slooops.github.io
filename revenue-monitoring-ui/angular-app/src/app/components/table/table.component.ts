import { Component, HostBinding, Input } from '@angular/core';
import ExcelJS from 'exceljs';
import { CommonModule } from '@angular/common';
import { LoadingSymbolComponent } from '../../loading-symbol/loading-symbol.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorArrowLineDownBold } from '@ng-icons/phosphor-icons/bold';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
  imports: [CommonModule, LoadingSymbolComponent, NgIcon],
  providers: [provideIcons({ phosphorArrowLineDownBold })],
  standalone: true,
})
export class TableComponent {
  @Input() title!: string;
  @Input() dataSource!: { data: any[] };
  @Input() displayedColumns!: string[];
  @Input() exportFileName!: string;
  @Input() reportLink?: string;
  @Input() serviceNowLink?: string;
  @Input() extraWideColumns: string[] = [];
  @Input() set darkMode(val: boolean) {
    this._darkMode = val;
  }
  @HostBinding('class.dark-theme') _darkMode = false;

  removeUnderscores(key: string): string {
    return key.replace(/_/g, ' ');
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
