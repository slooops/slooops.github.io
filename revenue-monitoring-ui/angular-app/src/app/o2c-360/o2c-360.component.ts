import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { DestroyManager } from '../providers/destroy-manager.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { SidebarService } from '../sidebar.service';

@Component({
  selector: 'app-o2c-360',
  templateUrl: './o2c-360.component.html',
  styleUrls: ['./o2c-360.component.css'],
  providers: [DestroyManager],
})
export class O2c360Component implements OnInit {
  expanded = {
    subscription: false,
    invoice: false,
  };

  circleStatus: { [key: string]: number } = {
    Order: 2,
    Subscription: -1,
    Invoicing: 2,
    Accounting: 2,
    Cash: 2,
  };

  navTotals = [
    { label: 'Orders', icon: 'cart-icon', count: null },
    { label: 'Subscriptions', icon: 'bookmark-icon', count: null },
    { label: 'Invoices', icon: 'receipt-icon', count: null },
  ];

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
    // 'CLOUD_SUB_ORDER_HOLDS',
    'CLOUD_SUB_ORDER _HOLDS',
    'FLOW_STATUS_CODE',
    'PARTNER',
    'END_CUSTOMER',
  ];
  orderSummaryDisplayedColumns: string[] = [];
  orderSummaryDataSource = new MatTableDataSource<any>();

  subscriptionSummaryDisplayedColumns: string[] = [];
  subscriptionSummaryDataSource = new MatTableDataSource<any>();

  subscriptionLinesDisplayedColumns: string[] = [];
  subscriptionLinesDataSource = new MatTableDataSource<any>();

  invoiceSummaryDisplayedColumns: string[] = [
    'TRANSACTION_NUMBER',
    'TRANSACTION_CLASS',
    'TRANSACTION_STATUS',
    'TRANSACTION_DATE',
    'DUE_DATE',
    'STATUS',
    'AMOUNT_DUE_ORIGINAL',
    'AMOUNT_DUE_REMAINING',
    'BILL_NUMBER',
    'OTHER_DETAILS',
  ];
  invoiceSummaryDataSource = new MatTableDataSource<any>();

  invoiceLinesDisplayedColumns: string[] = [];
  invoiceLinesDataSource = new MatTableDataSource<any>();

  constructor(
    private http: ApiHttpService,
    private destroyManager: DestroyManager,
    private sidebarService: SidebarService
  ) {}

  sidebarExpanded = true;

  ngOnInit(): void {
    this.sidebarService.isExpanded$.subscribe((isExpanded) => {
      this.sidebarExpanded = isExpanded;
    });

    this.sidebarService.activeItem$.subscribe((item) => {
      if (item === 'Subscriptions') {
        this.expanded.subscription = true;
        this.expanded.invoice = false;
      } else if (item === 'Invoices') {
        this.expanded.invoice = true;
        this.expanded.subscription = false;
      } else {
        // collapse both for "Orders" or anything else
        this.expanded.subscription = false;
        this.expanded.invoice = false;
      }
    });

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
        this.navTotals[0].count = data.length;
      });

    this.http
      .get('subscription-summary', this.destroyManager)
      .subscribe((data: any) => {
        console.log('Subscription Summary:', data.length, data);

        this.subscriptionSummaryDisplayedColumns = this.removeColumns(
          Object.keys(data[0]),
          ['EFFECTIVE_START_DATE', 'EFFECTIVE_END_DATE']
        );
        this.subscriptionSummaryDataSource = new MatTableDataSource(data);
        this.navTotals[1].count = data.length;
      });

    this.http
      .get('subscription-line-summary', this.destroyManager)
      .subscribe((data: any) => {
        console.log('Subscription Lines:', data);

        this.subscriptionLinesDisplayedColumns = Object.keys(data[0]);
        this.subscriptionLinesDataSource = new MatTableDataSource(data);
      });

    this.http
      .get('invoice-summary', this.destroyManager)
      .subscribe((data: any) => {
        console.log('Invoice Summary:', data);
        this.invoiceSummaryDataSource = new MatTableDataSource(data);
        this.navTotals[2].count = data.length;
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

  removeColumns(columns: string[], columnsToRemove: string[]): string[] {
    return columns.filter((column) => !columnsToRemove.includes(column));
  }

  toggleAccordion(section: 'subscription' | 'invoice') {
    this.expanded[section] = !this.expanded[section];
  }

  get invoiceContainerWidth(): string {
    if (!this.expanded.invoice && !this.expanded.subscription) return '100%';
    return this.sidebarExpanded ? 'calc(100% - 255px)' : 'calc(100% - 71px)';
  }
}
