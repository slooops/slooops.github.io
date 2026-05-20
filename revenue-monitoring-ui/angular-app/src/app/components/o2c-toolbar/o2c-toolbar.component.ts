import { Component, Input } from '@angular/core';
import ExcelJS from 'exceljs';

@Component({
  selector: 'app-o2c-toolbar',
  templateUrl: './o2c-toolbar.component.html',
  styleUrl: './o2c-toolbar.component.css',
  standalone: true,
})
export class O2cToolbarComponent {
  @Input() data: any[] = [];
  @Input() fileName: string = 'ExportedData';

  handlePrint(): void {
    window.print();
  }

  async handleDownload(
    data: any[],
    fileName: string = 'ExportedData',
    sheetName: string = 'Data',
  ): Promise<void> {
    if (!data?.length) {
      console.warn('No data to export');
      return;
    }
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName.substring(0, 31));

    const headers = Object.keys(data[0]);
    worksheet.addRow(headers);
    data.forEach((row) => worksheet.addRow(headers.map((h) => row[h])));

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
