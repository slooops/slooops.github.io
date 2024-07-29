import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from 'src/app/providers/http.service';
import { MatTableDataSource } from '@angular/material/table';
import { switchMap, startWith } from 'rxjs/operators';
import { Observable, interval } from 'rxjs';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-cms',
  templateUrl: './cms.component.html',
  styleUrls: ['./cms.component.css'],
})
export class CmsComponent implements OnInit {
  protected http: ApiHttpService;
  //refreshInterval = 300000; //ms

  unpostedSummaryData: MatTableDataSource<any> = new MatTableDataSource([]);
  receiptErrorSummaryData: MatTableDataSource<any> = new MatTableDataSource([]);

  unpostedAmount: MatTableDataSource<any> = new MatTableDataSource([]);
  extractDetailsData: MatTableDataSource<any> = new MatTableDataSource([]);

  collectionsErrorSummaryData: MatTableDataSource<any> = new MatTableDataSource(
    []
  );
  latestRequestStatus: MatTableDataSource<any> = new MatTableDataSource([]);
  interfaceErrors: MatTableDataSource<any> = new MatTableDataSource([]);

  unpostedSummaryDisplayedColumns: string[] = [
    'OPERATING_UNIT',
    'NO_OF_PAYMENTS',
    'REMITTANCE_AMOUNT_USD',
  ];

  receiptErrorSummaryDisplayedColumns: string[] = [
    'OPERATING_UNIT',
    'NO_OF_PAYMENTS',
    'UNAPPLIED_AMOUNT_USD',
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
    'FILE_NAME',
    'FILE_REC_COUNT',
    'SOURCE_TYPE',
    'STATUS',
    'STG_REC_COUNT',
    'TOTAL_ELIGIBLE_REC_COUNT',
  ];

  collectionsErrorSummaryDisplayedColumns: string[] = ['EXTRACT_TYPE', 'COUNT'];

  interfaceErrorsDisplayedColumns: string[] = ['OPERATING_UNIT', 'TOTAL'];

  ctmStatus: any[] = [];
  ctmDetails: any[] = [];
  boomiStatus: any[] = [];
  boomiDetails: any[] = [];

  interfaceErrorCount: number;
  extractCount: number;

  colorMapping: { [key: string]: string } = {
    BLUE: '#049fd9',
    RED: '#ef2828',
    YELLOW: '#efc920',
    GREEN: '#12e370',
  };

  constructor(http: ApiHttpService) {
    this.http = http;
  }

  ngOnInit(): void {
    this.getUnpostedSummary();
    this.getReceiptErrorSummary();
    this.getCtmStatus();
    this.getCtmDetails();
    this.getBoomiStatus();
    this.getBoomiDetails();
    this.getExtractCount();
    this.getExtractDetails();
    this.getUnpostedAmount();
    this.getInterfaceErrorCount();
    this.getCollectionsErrorSummary();
    this.getLatestRequestStatus();
    this.getInterfaceErrors();
  }

  //not working, returns null
  getUnpostedAmount() {
    this.getEndpointData('unpostedTotalAmount').subscribe((data: any) => {
      this.unpostedAmount = data;
      console.log('unposted amount: ', this.unpostedAmount);
    });
  }

  //not working, returns null
  getInterfaceErrorCount() {
    this.getEndpointData('interfaceErrorCountInXHrs').subscribe((data: any) => {
      this.interfaceErrorCount = data;
      console.log('interface error count: ', this.interfaceErrorCount);
    });
  }

  //not working, likely issue with DB
  getInterfaceErrors() {
    console.log('getting interface errors');
    this.getEndpointData('interfaceErrors').subscribe((data: any) => {
      this.interfaceErrors.data = data;
      console.log('interface errors: ', this.interfaceErrors);
    });
  }

  // this is for extract status apparently?
  getCollectionsErrorSummary() {
    this.getEndpointData('collectionsErrorSummary').subscribe((data: any) => {
      // Rename the column 'COUNT(*)' to 'COUNT'
      const mappedData = data.map((item: any) => ({
        COUNT: item['COUNT(*)'],
        EXTRACT_TYPE: item.EXTRACT_TYPE,
      }));
      this.collectionsErrorSummaryData.data = mappedData;
    });
  }

  getLatestRequestStatus() {
    this.getEndpointData('latestRequestStatus').subscribe((data: any) => {
      this.latestRequestStatus.data = data;
      console.log('latest request status: ', this.latestRequestStatus);
    });
  }

  getExtractCount() {
    this.getEndpointData('extractCount').subscribe((data: any) => {
      this.extractCount = data[0].ERROR_CODE;
    });
  }

  //not currently used, because I thought this was extract status
  getExtractDetails() {
    this.getEndpointData('extractDetails').subscribe((data: any) => {
      // Map the data to only include the desired fields
      const mappedData = data.map((item: any) => ({
        BOOMI_STATUS: item.BOOMI_STATUS,
        CTM_STATUS: item.CTM_STATUS,
        EXTRACT_NAME: item.EXTRACT_NAME,
        FILE_NAME: item.FILE_NAME,
        FILE_REC_COUNT: item.FILE_REC_COUNT,
        HRC_COUNT: item.HRC_COUNT,
        REQUEST_ID: item.REQUEST_ID,
        STG_REC_COUNT: item.STG_REC_COUNT,
        TOTAL_ELIGIBLE_REC_COUNT: item.TOTAL_ELIGIBLE_REC_COUNT,
      }));
      this.extractDetailsData.data = mappedData;
    });
  }

  getUnpostedSummary() {
    // this.unpostedSummaryLoading = true;
    this.getEndpointData('unpostedSummary').subscribe((data: any) => {
      this.unpostedSummaryData.data = data;
      // this.unpostedSummaryLoading = false;
    });
  }

  //no longer used
  getReceiptErrorSummary() {
    // this.receiptErrorSummaryLoading = true;
    this.getEndpointData('receiptErrorSummary').subscribe((data: any) => {
      this.receiptErrorSummaryData.data = data;

      // this.receiptErrorSummaryLoading = false;
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
    console.log(data);
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

  refreshUnpostedSummary() {
    this.getUnpostedSummary();
  }

  refreshReceiptErrorSummary() {
    this.getReceiptErrorSummary();
  }
}
