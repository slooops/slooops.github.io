import { Component, Input } from '@angular/core';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-o2c-toolbar',
    templateUrl: './o2c-toolbar.component.html',
    styleUrl: './o2c-toolbar.component.css',
    standalone: true
})
export class O2cToolbarComponent {
  @Input() data: any[] = [];
  @Input() fileName: string = 'ExportedData';

  handlePrint(): void {
    window.print();
  }

  handleDownload(
    data: any[],
    fileName: string = 'ExportedData',
    sheetName: string = 'Data'
  ): void {
    if (!data?.length) {
      console.warn('No data to export');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = {
      Sheets: { [sheetName]: worksheet },
      SheetNames: [sheetName],
    };

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }
}
