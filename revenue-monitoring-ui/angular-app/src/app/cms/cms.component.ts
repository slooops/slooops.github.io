import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from 'src/app/providers/http.service';
import { MatTableDataSource } from '@angular/material/table';
import { switchMap, startWith } from 'rxjs/operators';
import { Observable, interval } from 'rxjs';
import * as XLSX from 'xlsx';
import { Router } from '@angular/router';

import { MatDialog } from '@angular/material/dialog';
import { CmsModalComponent } from '../cms-modal/cms-modal.component';
import { CmsSftpModalComponent } from '../cms-sftp-modal/cms-sftp-modal.component';

import { th } from 'date-fns/locale';

@Component({
  selector: 'app-cms',
  templateUrl: './cms.component.html',
  styleUrls: ['./cms.component.css'],
})
export class CmsComponent implements OnInit {
  protected http: ApiHttpService;
  //refreshInterval = 300000; //ms
  isModalOpen = false;

  collectionsErrorSummaryData: MatTableDataSource<any> = new MatTableDataSource(
    []
  );
  latestRequestStatus: MatTableDataSource<any> = new MatTableDataSource([]);

  interfaceErrors: MatTableDataSource<any> = new MatTableDataSource([]);
  unpostedSummaryData: MatTableDataSource<any> = new MatTableDataSource([]);
  receiptErrorSummaryData: MatTableDataSource<any> = new MatTableDataSource([]);

  apiStatus: any[] = [];
  sftpStatus: any[] = [];
  ctmStatus: any[] = [];
  ctmDetails: any[] = [];
  boomiStatus: any[] = [];
  boomiDetails: any[] = [];
  boomiStatusFromHr: any[] = [];
  boomiDetailsFromHr: any[] = [];

  extractCount: number;
  totalReconciliationError: number;

  interfaceErrorCount: number;
  unpostedAmount: string | null = null;
  unappliedAmount: string | null = null;

  colorMapping: { [key: string]: string } = {
    BLUE: '#049fd9',
    RED: '#ef2828',
    YELLOW: '#efc920',
    GREEN: '#12e370',
  };

  unpostedSummaryDisplayedColumns: string[] = [
    'OPERATING_UNIT',
    'NO_OF_PAYMENTS',
    'REMITTANCE_AMOUNT_USD',
  ];

  receiptErrorSummaryDisplayedColumns: string[] = [
    'ORG_ID',
    'BAI2_FILE_NAME',
    'DEPOSIT_DATE',
    'RECEIPT_DATE',
    'RECEIPT_AMOUNT',
  ];

  extractDetailsDisplayedColumns: string[] = [
    'BOOMI_STATUS',
    'CTM_STATUS',
    'EXTRACT_NAME',
    'FILE_NAME',
    'FILE_REC_COUNT',
    'HRC_COUNT',
    'REQUEST_ID',
    'STG_REC_COUNT',
    'TOTAL_ELIGIBLE_REC_COUNT',
  ];

  latestRequestStatusDisplayedColumns: string[] = [
    'EXTRACT_NAME',
    // 'FILE_NAME',
    // 'FILE_REC_COUNT',
    'SOURCE_TYPE',
    'STATUS',
    // 'STG_REC_COUNT',
    // 'TOTAL_ELIGIBLE_REC_COUNT',
  ];

  collectionsErrorSummaryDisplayedColumns: string[] = ['EXTRACT_TYPE', 'COUNT'];

  interfaceErrorsDisplayedColumns: string[] = ['OPERATING_UNIT', 'TOTAL'];

  constructor(
    http: ApiHttpService,
    private router: Router,
    public dialog: MatDialog
  ) {
    this.http = http;
  }

  ngOnInit(): void {
    this.getUnpostedSummary();
    this.getCtmStatus();
    this.getCtmDetails();
    this.getBoomiStatus();
    this.getBoomiDetails();
    this.getExtractCount();
    this.getUnpostedAmount();
    this.getInterfaceErrorCount();
    this.getCollectionsErrorSummary();
    this.getLatestRequestStatus();
    this.getInterfaceErrors();
    this.getApiStatus();
    this.getBoomiStatusFromHr();
    this.getBoomiDetailsFromHr();
    this.getUnappliedErrorSummary();
    this.getTotalUnappliedAmount();
    this.getTotalReconciliationError();
    this.getSftpStatus();
    // this.openSftpModal();
  }

  // collections widgets
  getExtractCount() {
    this.getEndpointData('extractCount').subscribe((data: any) => {
      this.extractCount = data[0].ERROR_CODE;
    });
  }

  getTotalReconciliationError() {
    this.getEndpointData('totalReconciliationError').subscribe((data: any) => {
      this.totalReconciliationError = data[0].TOTAL_RECONCILIATION_ERROR;
    });
  }

  // collections tables
  // this is extract status apparently?
  getCollectionsErrorSummary() {
    this.getEndpointData('collectionsErrorSummary').subscribe((data: any) => {
      if (data && Array.isArray(data)) {
        // Rename the column 'COUNT(*)' to 'COUNT'
        const mappedData = data.map((item: any) => ({
          COUNT: item['COUNT(*)'],
          EXTRACT_TYPE: item.EXTRACT_TYPE,
        }));
        this.collectionsErrorSummaryData.data = mappedData;
      } else {
        this.collectionsErrorSummaryData.data = [];
      }
    });
  }

  getLatestRequestStatus() {
    this.getEndpointData('latestRequestStatus').subscribe((data: any) => {
      this.latestRequestStatus.data = data;
    });
  }

  //cash app widgets
  getInterfaceErrorCount() {
    this.getEndpointData('interfaceErrorCountInXHrs').subscribe((data: any) => {
      this.interfaceErrorCount = data[0]?.INTERFACE_ERROR_COUNT;
    });
  }

  getTotalUnappliedAmount() {
    this.getEndpointData('totalUnappliedAmount').subscribe((data: any) => {
      const amount = data[0]?.UNAPPLIED_AMOUNT;
      this.unappliedAmount = amount ? amount.toLocaleString() : null;
    });
  }

  getUnpostedAmount() {
    this.getEndpointData('unpostedTotalAmount').subscribe((data: any) => {
      const amount = data[0]?.TOTAL_UNPOSTED_AMOUNT;
      this.unpostedAmount = amount ? this.formatAmount(amount) : null;
    });
  }

  //cash app tables
  getInterfaceErrors() {
    this.getEndpointData('interfaceErrors').subscribe((data: any) => {
      this.interfaceErrors.data = data;
    });
  }

  getUnpostedSummary() {
    // this.unpostedSummaryLoading = true;
    this.getEndpointData('unpostedSummary').subscribe((data: any) => {
      this.unpostedSummaryData.data = data;
    });
  }

  getUnappliedErrorSummary() {
    this.getEndpointData('unappliedErrorSummary').subscribe((data: any) => {
      this.receiptErrorSummaryData.data = data;
    });
  }

  // top bar app status and api status
  getApiStatus() {
    this.getEndpointData('apiStatus').subscribe((data: any) => {
      this.apiStatus = data;
    });
  }

  getSftpStatus() {
    this.getEndpointData('sftpStatus').subscribe((data: any) => {
      console.log(data);
      this.sftpStatus = this.processData(data);
    });
  }

  getCtmStatus() {
    this.getEndpointData('ctmStatus').subscribe((data: any) => {
      this.ctmStatus = data;
    });
  }

  getCtmDetails() {
    this.getEndpointData('ctmDetails').subscribe((data: any) => {
      this.ctmDetails = data;
    });
  }

  getBoomiStatus() {
    this.getEndpointData('boomiStatus').subscribe((data: any) => {
      this.boomiStatus = data;
    });
  }

  getBoomiDetails() {
    this.getEndpointData('boomiDetails').subscribe((data: any) => {
      this.boomiDetails = data;
    });
  }

  getBoomiStatusFromHr() {
    this.getEndpointData('boomiStatusFromHr').subscribe((data: any) => {
      this.boomiStatusFromHr = data;
    });
  }

  getBoomiDetailsFromHr() {
    this.getEndpointData('boomiDetailsFromHr').subscribe((data: any) => {
      this.boomiDetailsFromHr = data;
    });
  }

  getColorCode(colorName: string): string {
    return this.colorMapping[colorName] || '#6993a2a1'; // Default to offline color if not found
  }

  getEndpointData(queryParam: string): Observable<any> {
    let uniqueId = Date.now();
    //let cacheBustingUrl = `${endpoint}?cacheBuster=${uniqueId}`;
    let endpoint = 'cms/getdata';
    let url = `${endpoint}?query=${queryParam}`;
    //let url = `${endpoint}`;

    return this.http.get(url);

    // const polling$ = interval(this.refreshInterval).pipe(
    //   startWith(0), // Emit initial value immediately
    //   switchMap(() => this.http.get(url))
    // );
    // return polling$;
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

  openFullTableModal() {
    this.dialog.open(CmsModalComponent, {
      width: '80%',
      data: this.latestRequestStatus.data,
    });
  }

  openSftpModal() {
    this.dialog.open(CmsSftpModalComponent, {
      width: '80%',
      data: this.sftpStatus,
    });
  }

  replaceUnderscore(value: string | null | undefined): string {
    if (!value) {
      return ''; // Return an empty string if value is null or undefined
    }

    const specialWords = ['data', 'file', 'no', 'unit', 'tech', 'home'];

    return value
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => {
        const lowerWord = word.toLowerCase();
        if (specialWords.includes(lowerWord)) {
          return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
        }
        return word.length > 4
          ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          : word;
      })
      .join(' ');
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.isHighRadiusModalOpen = false;
    this.isHighRadiusToCG1ModalOpen = false;
  }

  isHighRadiusModalOpen = false;
  isHighRadiusToCG1ModalOpen = false;

  openHighRadiusModal() {
    this.isHighRadiusModalOpen = true;
  }

  openHighRadiusToCG1Modal() {
    this.isHighRadiusToCG1ModalOpen = true;
  }

  processData(data: any[]): any[] {
    return data[0]?.['SFTP Status']?.CiscoSFTPUnprocessedFiles || [];
  }

  formatAmount(amount: number): string {
    const millions = amount / 1_000_000;
    return millions.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  navigateToDetails(extractType: string): void {
    const url = `/cms-details?extractType=${encodeURIComponent(extractType)}`;
    window.open(url, '_blank');
  }
}
