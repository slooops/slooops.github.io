import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-cms-sftp-details',
  templateUrl: './cms-sftp-details.component.html',
  styleUrls: ['./cms-sftp-details.component.css'],
})
export class CmsSftpDetailsComponent implements OnInit {
  displayedColumns: string[] = [
    'directory',
    'extract',
    'fileName',
    'timeStamp',
  ];
  data: any[] = [];

  constructor(private route: ActivatedRoute) {}

  isDataLoaded: boolean = false;

  ngOnInit(): void {
    const raw = localStorage.getItem('sftpDetails');
    if (raw) {
      this.data = JSON.parse(raw);
      localStorage.removeItem('sftpDetails');
    }
    if (this.data.length === 0) {
      console.warn('No SFTP details found in localStorage');
    } else {
      this.isDataLoaded = true;
      console.log('CMS SFTP Details data loaded:', this.data);
    }

    console.log('CMS SFTP Details component initialized.');
  }

  formatTimestamp(timestamp: string): string {
    // Format timestamp as needed
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  exportTableToExcel(data: any[], sheetName: string, filename: string) {
    let worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    let workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    let excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    this.saveAsExcelFile(excelBuffer, filename);
  }

  saveAsExcelFile(buffer: any, filename: string) {
    let data: Blob = new Blob([buffer], { type: 'application/octet-stream' });
    let url = window.URL.createObjectURL(data); // temp URL that points to the generated excel file data buffer
    let link = document.createElement('a'); // create link
    link.href = url;
    link.download = filename + '.xlsx';
    link.click(); // triggers the download process and save file prompt in browser
    window.URL.revokeObjectURL(url); // revoke temp URL
  }
}
