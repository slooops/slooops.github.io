import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { DestroyManager } from '../providers/destroy-manager.service';
import { MatTableDataSource } from '@angular/material/table';
@Component({
  selector: 'app-o2c-invoice',
  templateUrl: './o2c-invoice.component.html',
  styleUrl: './o2c-invoice.component.css',
})
export class O2cInvoiceComponent implements OnInit {
  constructor(
    private http: ApiHttpService,
    private destroyManager: DestroyManager
  ) {}

  circleStatus: { [key: string]: number } = {
    Order: 2,
    Subscription: -1,
    Invoicing: 2,
    Accounting: 2,
    Cash: 2,
  };

  orderSummaryDisplayedColumns1: string[] = [
    'WEB_ORDER_ID',
    'DEAL_ID',
    'CREATION_DATE',
    'STATUS',
    'PURCHASE_ORDER',
    'ORDER_TOTAL',
    'BILLING_ID',
    'ORDER_ORIGIN',
    'ORDER_BOOKED_DATE',
  ];
  orderSummaryDisplayedColumns2: string[] = [
    'HYBRID_ORDER',
    'ROUTE_TO_MARKET',
    'ORDER_HOLDS',
    'CLOUD_SUB_ORDER_HOLDS',
    'FLOW_STATUS_CODE',
    'PARTNER',
    'END_CUSTOMER',
  ];
  orderSummaryDataSource = new MatTableDataSource<any>();

  invoiceLinesDisplayedColumns: string[] = [];
  invoiceLinesDataSource = new MatTableDataSource<any>();

  ngOnInit(): void {
    const state = history.state;

    if (state?.invoiceLinesDisplayedColumns && state?.invoiceLinesData) {
      this.invoiceLinesDisplayedColumns = state.invoiceLinesDisplayedColumns;
      this.invoiceLinesDataSource = new MatTableDataSource(
        state.invoiceLinesData
      );
      this.orderSummaryDataSource = new MatTableDataSource(
        state.orderSummaryData
      );
    } else {
      // fallback for direct page load
      console.warn('No data passed to o2c-sub, consider not being here');
    }
  }

  formatColumnName(column: string): string {
    const acronyms = ['id', 'sku', 'qty', 'tsv', 'gl'];
    const name = column.replace(/_/g, ' ').toLowerCase();
    return name
      .split(' ')
      .map((word) => {
        // If the word is in the list of acronyms, return it in uppercase
        if (acronyms.includes(word)) {
          return word.toUpperCase();
        }
        // Otherwise, capitalize only the first letter
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }
}
