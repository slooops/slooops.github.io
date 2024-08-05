import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiHttpService } from 'src/app/providers/http.service';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-cms-details',
  templateUrl: './cms-details.component.html',
  styleUrls: ['./cms-details.component.css'],
})
export class CmsDetailsComponent implements OnInit {
  protected http: ApiHttpService;
  extractType: string;

  apiStatus: any[] = [];

  // MatTableDataSource for all endpoints
  invoicePdfExtractErrData: MatTableDataSource<any> = new MatTableDataSource(
    []
  );
  invoiceExtractErrData: MatTableDataSource<any> = new MatTableDataSource([]);
  customerMasterErrData: MatTableDataSource<any> = new MatTableDataSource([]);
  alternatePayerErrData: MatTableDataSource<any> = new MatTableDataSource([]);
  salesInvoiceHeaderExtractErrData: MatTableDataSource<any> =
    new MatTableDataSource([]);
  customerContactsErrData: MatTableDataSource<any> = new MatTableDataSource([]);
  salesInvoiceItemExtractErrData: MatTableDataSource<any> =
    new MatTableDataSource([]);

  // Columns to be displayed in the tables (dynamically set)
  invoicePdfExtractErrDisplayedColumns: string[] = [];
  invoiceExtractErrDisplayedColumns: string[] = [];
  customerMasterErrDisplayedColumns: string[] = [];
  alternatePayerErrDisplayedColumns: string[] = [];
  salesInvoiceHeaderExtractErrDisplayedColumns: string[] = [];
  customerContactsErrDisplayedColumns: string[] = [];
  salesInvoiceItemExtractErrDisplayedColumns: string[] = [];

  constructor(http: ApiHttpService, private route: ActivatedRoute) {
    this.http = http;
  }

  ngOnInit(): void {
    // Fetch data from all endpoints
    this.getInvoicePdfExtractErr();
    this.getInvoiceExtractErr();
    this.getCustomerMasterErr();
    this.getAlternatePayerErr();
    this.getSalesInvoiceHeaderExtractErr();
    this.getCustomerContactsErr();
    this.getSalesInvoiceItemExtractErr();

    this.route.queryParams.subscribe((params) => {
      this.extractType = params['extractType'];
      this.loadDataBasedOnExtractType();
    });
  }

  loadDataBasedOnExtractType(): void {
    switch (this.extractType) {
      case 'Invoice Extract':
        this.getInvoiceExtractErr();
        break;
      // Add cases for other extract types as needed
      default:
        console.error('Unknown extract type:', this.extractType);
    }
  }

  getInvoicePdfExtractErr() {
    this.getEndpointData('invoicePdfExtractErr').subscribe((data: any) => {
      this.invoicePdfExtractErrData.data = data;
      console.log('invoice pdf extract error: ', data);

      this.invoicePdfExtractErrDisplayedColumns =
        this.getDisplayedColumns(data);
    });
  }

  getInvoiceExtractErr() {
    this.getEndpointData('invoiceExtractErr').subscribe((data: any) => {
      this.invoiceExtractErrData.data = data;
      this.invoiceExtractErrDisplayedColumns = this.getDisplayedColumns(data);
      console.log('invoice extract error: ', data);
    });
  }

  getCustomerMasterErr() {
    this.getEndpointData('customerMasterErr').subscribe((data: any) => {
      this.customerMasterErrData.data = data;
      this.customerMasterErrDisplayedColumns = this.getDisplayedColumns(data);
      console.log('customer master error: ', data);
    });
  }

  getAlternatePayerErr() {
    this.getEndpointData('alternatePayerErr').subscribe((data: any) => {
      this.alternatePayerErrData.data = data;
      this.alternatePayerErrDisplayedColumns = this.getDisplayedColumns(data);
      console.log('alternate payer error: ', data);
    });
  }

  getSalesInvoiceHeaderExtractErr() {
    this.getEndpointData('salesInvoiceHeaderExtractErr').subscribe(
      (data: any) => {
        this.salesInvoiceHeaderExtractErrData.data = data;
        this.salesInvoiceHeaderExtractErrDisplayedColumns =
          this.getDisplayedColumns(data);
        console.log('sales invoice header extract error: ', data);
      }
    );
  }

  getCustomerContactsErr() {
    this.getEndpointData('customerContactsErr').subscribe((data: any) => {
      this.customerContactsErrData.data = data;
      this.customerContactsErrDisplayedColumns = this.getDisplayedColumns(data);
      console.log('customer contacts error: ', data);
    });
  }

  getSalesInvoiceItemExtractErr() {
    this.getEndpointData('salesInvoiceItemExtractErr').subscribe(
      (data: any) => {
        this.salesInvoiceItemExtractErrData.data = data;
        this.salesInvoiceItemExtractErrDisplayedColumns =
          this.getDisplayedColumns(data);
        console.log('sales invoice item extract error: ', data);
      }
    );
  }

  getEndpointData(queryParam: string): Observable<any> {
    let uniqueId = Date.now();
    //let cacheBustingUrl = `${endpoint}?cacheBuster=${uniqueId}`;
    let endpoint = 'cms/getdata';
    let url = `${endpoint}?query=${queryParam}`;
    //let url = `${endpoint}`;

    return this.http.get(url);
  }

  getDisplayedColumns(data: any[]): string[] {
    if (data && data.length > 0) {
      return Object.keys(data[0]);
    }
    return [];
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
    let url = window.URL.createObjectURL(data);
    let link = document.createElement('a');
    link.href = url;
    link.download = filename + '.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
