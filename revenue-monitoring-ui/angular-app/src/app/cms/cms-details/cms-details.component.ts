import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiHttpService } from 'src/app/providers/http.service';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import * as XLSX from 'xlsx';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { ExportToExcelService } from 'src/app/providers/export-to-excel.service';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { LoadingSymbolComponent } from '../../loading-symbol/loading-symbol.component';

@Component({
    selector: 'app-cms-details',
    templateUrl: './cms-details.component.html',
    styleUrls: ['./cms-details.component.css'],
    providers: [DestroyManager],
    imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    LoadingSymbolComponent
  ],
  standalone: true
})
export class CmsDetailsComponent implements OnInit {
  protected http: ApiHttpService;
  extractType: string;

  currentData: MatTableDataSource<any> = new MatTableDataSource([]);
  currentDisplayedColumns: string[] = [];

  constructor(
    http: ApiHttpService,
    private route: ActivatedRoute,
    private destroyManager: DestroyManager,
    private exportToExcelService: ExportToExcelService
  ) {
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

    return this.http.get(url, this.destroyManager);
  }

  getDisplayedColumns(data: any[]): string[] {
    return data && data.length > 0 ? Object.keys(data[0]) : [];
  }

  replaceUnderscore(value: string | null | undefined): string {
    if (!value) {
      return ''; // Return an empty string if value is null or undefined
    }

    const specialWords = [
      'data',
      'file',
      'no',
      'unit',
      'cash',
      'citi',
      'tech',
      'code',
      'home',
    ];

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

  exportTableToExcel(data: any[], sheetName: string, filename: string) {
    this.exportToExcelService.exportTableToExcel(data, sheetName, filename);
  }
}
