import { Component, HostBinding, Input } from '@angular/core';
import * as XLSX from 'xlsx';
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
