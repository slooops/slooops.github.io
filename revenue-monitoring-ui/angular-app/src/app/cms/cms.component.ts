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

  unpostedSummaryData = new MatTableDataSource<any>();
  unpostedDetailsData: any[] = [];
  receiptErrorSummaryData = new MatTableDataSource<any>();

  ctmStatus: any[] = [];
  ctmDetails: any[] = [];
  boomiStatus: any[] = [];
  boomiDetails: any[] = [];

  colorMapping: { [key: string]: string } = {
    BLUE: '#049fd9',
    RED: '#ef2828',
    YELLOW: '#efc920',
    GREEN: '#12e370',
  };

  unpostedSummaryDisplayedColumns: string[] = [
    'ORG_ID',
    'NO_OF_PAYMENTS',
    'REMITTANCE_AMOUNT_USD',
  ];

  receiptErrorSummaryDisplayedColumns: string[] = [
    'OPERATING_UNIT',
    'NO_OF_PAYMENTS',
    'UNAPPLIED_AMOUNT_USD',
  ];

  constructor(http: ApiHttpService) {
    this.http = http;
  }

  ngOnInit(): void {
    this.getUnPostedSummary();
    // this.getUnPostedDetails(); //query taking time to execute
    this.getReceiptErrorSummary();
    //this.getReceiptErrorDetails(); //query taking time to execute
    this.getCtmStatus();
    this.getCtmDetails();
    this.getBoomiStatus();
    this.getBoomiDetails();
  }

  getUnPostedSummary() {
    this.getEndpointData('unpostedSummary').subscribe((data: any) => {
      this.unpostedSummaryData.data = data;
      console.log('unposted summary', data);
    });
  }

  getUnPostedDetails() {
    this.getEndpointData('unpostedDetails').subscribe((data: any) => {
      this.unpostedDetailsData = data;
      console.log(data);
    });
  }

  getReceiptErrorSummary() {
    this.getEndpointData('receiptErrorSummary').subscribe((data: any) => {
      this.receiptErrorSummaryData.data = data;
      console.log('reciept error summary', data);
    });
  }

  getReceiptErrorDetails() {
    this.getEndpointData('receiptErrorDetails').subscribe((data: any) => {
      console.log(data);
    });
  }

  getCtmStatus() {
    this.getEndpointData('ctmStatus').subscribe((data: any) => {
      this.ctmStatus = data;
      console.log('ctm status', data);
    });
  }

  getCtmDetails() {
    this.getEndpointData('ctmDetails').subscribe((data: any) => {
      this.ctmDetails = data;
      console.log('ctm deets', data);
    });
  }

  getBoomiStatus() {
    this.getEndpointData('boomiStatus').subscribe((data: any) => {
      this.boomiStatus = data;
      console.log('boomi status', data);
    });
  }

  getBoomiDetails() {
    this.getEndpointData('boomiDetails').subscribe((data: any) => {
      this.boomiDetails = data;
      console.log('boomi details', data);
    });
  }

  getColorCode(colorName: string): string {
    return this.colorMapping[colorName] || '#6993a2a1'; // Default to Cisco blue if color not found
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
}
