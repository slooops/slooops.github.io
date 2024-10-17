import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-auto-invoicing',
  templateUrl: './auto-invoicing.component.html',
  styleUrls: ['./auto-invoicing.component.css'],
})
export class AutoInvoicingComponent implements OnInit {
  autoInvoicingSummary: AutoInvoicingErrorSummary[];

  summaryDatasource: any;
  constructor(private http: ApiHttpService, private datePipe: DatePipe) {}
  ngOnInit(): void {
    this.getAutoInvoiceErrorSummary();
    this.getAutoInvoiceErrorDetails();
  }

  summaryColumns: string[] = [
    'PERIOD_NAME',
    'APPLICATION_NAME',
    'PROCESS_FLOW',
    'ORG_NAME',
    'AMOUNT',
    'CREATION_DATE',
    'AGING',
    'ASSIGNED_TO',
    'ASSIGNED_DATE',
    'COMMENTS',
  ];

  summaryDisplayedColumns: string[] = [];

  selection = new SelectionModel<any>(true, []);
  selectedData: any;
  getAutoInvoiceErrorSummary() {
    this.http.get('auto-invoice-error-summary').subscribe((data: any) => {
      console.log(data);
      this.summaryDisplayedColumns = ['select', ...this.summaryColumns];
      this.autoInvoicingSummary = this.formatData(data);
      this.autoInvoicingSummary.forEach((row) => {
        row.CREATION_DATE = this.dateTransform(row.CREATION_DATE);
      });
      this.summaryDatasource =
        new MatTableDataSource<AutoInvoicingErrorSummary>(
          this.autoInvoicingSummary
        );
    });
  }

  dateTransform(dateString: string): string {
    return this.datePipe.transform(dateString, 'MM/dd/yyyy');
  }

  formatData(data: any[]): any[] {
    return data.map((row) => {
      const formattedRow = { ...row };
      const amountKey =
        'AMOUNT' in row ? 'AMOUNT' : 'amount' in row ? 'amount' : null;

      if (amountKey) {
        formattedRow[amountKey] = `$${Number(row[amountKey]).toLocaleString(
          undefined,
          {
            minimumFractionDigits: 2, // Always show at least two decimal places
            maximumFractionDigits: 2, // Restrict to two decimal places
          }
        )}`;
      }

      return formattedRow;
    });
  }

  onRowSelectionChange(event: MatCheckboxChange, row: any) {
    this.selection.toggle(row);

    // if (event.checked) {
    //   this.selectedRows.push(row);
    // } else {
    //   this.selectedRows = this.selectedRows.filter(
    //     (selectedRow) => selectedRow !== row
    //   );
    // }

    // if (this.selectedRows.length > 0) {
    //   this.getTransactionDataFiltered(this.selectedRows);
    // } else {
    //   this.isFiltered = false;
    //   this.dataSource = new MatTableDataSource<RolTransactionData>(
    //     this.rolTransactionData
    //   );
    //   this.filtereddataSource = null;
    //   this.cdr.detectChanges();
    // }
  }

  dataSource: any;
  autoInvocingErrorDetails: AutoInvoicingErrorDetails[];
  autoInvocingErrorDetailsFiltered: AutoInvoicingErrorDetails[];

  detailsDisplayedColumns: string[] = [
    'AR_INTERFACE',
    'AR_INTERFACE_ERROR',
    'BILL_NUMBER',
    'BILL_TOTAL',
    'ENTITY',
    'INVOICED',
    'IOL_ERROR',
    'IOL_HOLD',
    'IOL_PENDING',
    'PAYLOAD_STATUS',
    'PERIOD_NAME',
    'PERIOD_NUM',
    'PERIOD_YEAR',
    'RECON_STATUS',
    'RECON_SUB_STATUS',
    'SBP_STAGING_STATUS',
    'STATUS',
    'SUBSCRIPTION_ID',
  ];

  isFiltered: boolean = false;
  filtereddataSource: any;

  getAutoInvoiceErrorDetails() {
    this.isFiltered = false;
    this.http.get('auto-invoice-error-details').subscribe((data: any) => {
      console.log(data);
      this.autoInvocingErrorDetails = data;
      this.dataSource = new MatTableDataSource<AutoInvoicingErrorDetails>(
        this.autoInvocingErrorDetails
      );
    });
  }

  replaceUnderscore(value: string | null | undefined): string {
    if (!value) {
      return ''; // Return an empty string if value is null or undefined
    }

    const specialWords = [
      'name',
      'amount',
      'interface',
      'error',
      'number',
      'total',
      'hold',
      'pending',
      'status',
      'num',
      'year',
      'status',
      'sub',
      'staging',
      'id',
    ];

    return value
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => {
        const lowerWord = word.toLowerCase();
        if (specialWords.includes(lowerWord)) {
          return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }
}

interface AutoInvoicingErrorSummary {
  PERIOD_NAME: string;
  APPLICATION_NAME: string;
  PROCESS_FLOW: string;
  ORG_NAME: string;
  AMOUNT: string;
  AGING: string;
  ASSIGNED_TO: string;
  COMMENTS: string;
  CREATION_DATE: string;
  ASSIGNED_DATE: string;
}

export interface AutoInvoicingErrorDetails {
  AMOUNT: string;
  AMOUNT_USD: string;
  BATCH_SOURCE_NAME: string;
  BID: string;
  CREATION_DATE: string;
  CURRENCY_CODE: string;
  CUSTOMER_NAME: string;
  ERROR_MESSAGE: string;
  INTERFACE_LINE_ID: string;
  INTERFACE_STATUS: string;
  LOAD_TIME: string;
  NAME: string;
  PERIOD_NAME: string;
  PERIOD_NUM: string;
  PERIOD_YEAR: string;
  SALES_ORDER: string;
  SALES_ORDER_LINE: string;
  SID: string;
}
