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
    this.http
      .get('order-summary', this.destroyManager, {
        responseType: 'json',
      })
      .subscribe((data: any) => {
        console.log('Order Summary:', data);

        const orderID = '91742826';

        this.orderSummaryDataSource = new MatTableDataSource(
          data.filter((data) => data.WEB_ORDER_ID === orderID)
        );
      });

    this.http
      .get('invoice-line-summary', this.destroyManager)
      .subscribe((data: any) => {
        console.log('Invoice Lines:', data);
        this.invoiceLinesDisplayedColumns = Object.keys(data[0]);
        this.invoiceLinesDataSource = new MatTableDataSource(data);
      });
  }

  formatColumnName(column: string): string {
    const acronyms = ['id', 'sql', 'api', 'url'];
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
