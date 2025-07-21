import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ExportToExcelService } from 'src/app/providers/export-to-excel.service';
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

  constructor(
    private route: ActivatedRoute,
    private exportToExcelService: ExportToExcelService
  ) {}

  isDataLoaded: boolean = false;

  ngOnInit(): void {
    const raw = localStorage.getItem('sftpDetails');
    if (raw) {
      this.data = JSON.parse(raw);
      localStorage.removeItem('sftpDetails');
    }
    // Check if data is empty
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
    this.exportToExcelService.exportTableToExcel(data, sheetName, filename);
  }
}
