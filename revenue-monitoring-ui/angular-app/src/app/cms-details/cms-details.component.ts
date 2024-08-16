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

  currentData: MatTableDataSource<any> = new MatTableDataSource([]);
  currentDisplayedColumns: string[] = [];

  constructor(http: ApiHttpService, private route: ActivatedRoute) {
    this.http = http;
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.extractType = params['extractType'];
      this.loadDataBasedOnExtractType();
    });
  }

  loadDataBasedOnExtractType(): void {
    const extractTypeMapping = {
      'Invoice Extract': this.getInvoiceExtractErr.bind(this),
      'Invoice PDF': this.getInvoicePdfExtractErr.bind(this),
      'Customer Extract': this.getCustomerMasterErr.bind(this),
      'Alternate Payer': this.getAlternatePayerErr.bind(this),
      'Sales Invoice Header Extract':
        this.getSalesInvoiceHeaderExtractErr.bind(this),
      'Sales Invoice Item Extract':
        this.getSalesInvoiceItemExtractErr.bind(this),
      'Customer Contacts': this.getCustomerContactsErr.bind(this),
    };

    const loadDataFunction = extractTypeMapping[this.extractType];

    if (loadDataFunction) {
      loadDataFunction();
    } else {
      console.error('Unknown extract type:', this.extractType);
    }
  }

  getInvoiceExtractErr() {
    this.getEndpointData('invoiceExtractErr').subscribe((data: any) => {
      this.setCurrentData(data);
    });
  }

  getInvoicePdfExtractErr() {
    this.getEndpointData('invoicePdfExtractErr').subscribe((data: any) => {
      this.setCurrentData(data);
    });
  }

  getCustomerMasterErr() {
    this.getEndpointData('customerMasterErr').subscribe((data: any) => {
      this.setCurrentData(data);
    });
  }

  getAlternatePayerErr() {
    this.getEndpointData('alternatePayerErr').subscribe((data: any) => {
      this.setCurrentData(data);
    });
  }

  getSalesInvoiceHeaderExtractErr() {
    this.getEndpointData('salesInvoiceHeaderExtractErr').subscribe(
      (data: any) => {
        this.setCurrentData(data);
      }
    );
  }

  getCustomerContactsErr() {
    this.getEndpointData('customerContactsErr').subscribe((data: any) => {
      this.setCurrentData(data);
    });
  }

  getSalesInvoiceItemExtractErr() {
    this.getEndpointData('salesInvoiceItemExtractErr').subscribe(
      (data: any) => {
        this.setCurrentData(data);
      }
    );
  }

  setCurrentData(data: any[]) {
    this.currentData.data = data;
    this.currentDisplayedColumns = this.getDisplayedColumns(data);
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
    return data && data.length > 0 ? Object.keys(data[0]) : [];
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
