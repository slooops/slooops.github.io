import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({ providedIn: 'root' })
export class ExportService {
  exportTableToExcel(data: any[], sheetName: string, filename: string) {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }

  generateSheetName(originalName: string): string {
    const maxNameLength = 31;
    let truncatedName = originalName.substring(0, maxNameLength);
    return truncatedName;
  }
}
