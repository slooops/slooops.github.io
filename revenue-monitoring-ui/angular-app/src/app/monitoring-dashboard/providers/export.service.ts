import { Injectable } from '@angular/core';
import ExcelJS from 'exceljs';

@Injectable({ providedIn: 'root' })
export class ExportService {
  async exportTableToExcel(data: any[], sheetName: string, filename: string) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName.substring(0, 31));

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
    a.download = `${filename}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  generateSheetName(originalName: string): string {
    const maxNameLength = 31;
    let truncatedName = originalName.substring(0, maxNameLength);
    return truncatedName;
  }
}
