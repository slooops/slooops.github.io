import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { DestroyManager } from '../providers/destroy-manager.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { SidebarService } from '../sidebar.service';
import { ActivatedRoute, Router } from '@angular/router';

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

  searchValue: string | null = null;
  searchType: string | null = null;

  orderId: string = '';
  subRefIds: string[] = [];
  invoiceIds: string[] = [];

  showDetailsModal = false;

  showSubscriptionModal = false;
  selectedSubscriptionId: string | null = null;
  selectedWebOrderId: string | null = null;

  showInvoiceModal = false;
  selectedTransactionNumber: string | null = null;

  invoiceDataLoaded = false;
  subscriptionDataLoaded = false;

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
  orderSummaryDataSource = new MatTableDataSource<any>();

  subscriptionSummaryDisplayedColumns: string[] = [];
  subscriptionSummaryDataSource = new MatTableDataSource<any>();

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
  displayedColumnsInvoicePrintStatus: string[] = [
    'INVOICE_DELIVERY_METHOD',
    'PRINT_DATE',
    'PRINT_STATUS',
    'EMAIL_ADDRESS',
    'SFTP',
    'B2B',
    'SRT_CONTACT_EMAIL',
  ];
  displayedColumnsInvoiceStatus: string[] = [
    'EINVOICING_STATUS',
    'IRN_UUID',
    'IRN_UUID_DATE',
    'PREVIOUS_IRN_UUID',
    'COLLECTOR',
  ];
  displayedColumnsInvoiceCash: string[] = [
    'RECEIPT_APPLIED',
    'CM_APPLIED',
    'WRITEOFF_ADJUSTMENTS',
  ];
  invoiceSummaryDataSource = new MatTableDataSource<any>();
  invoiceSummaryModalDataSource = new MatTableDataSource<any>();

  displayedColumnsSubscriptionModal: string[] = [
    'WEBORDER_LINEID',
    'SKU_DESCRIPTION',
    'CHARGE_TYPE',
    'QTY',
    'UNIT_SELLING_PRICE',
    'DURATION',
    'LINE_AMOUNT',
    'BILL_LINEREFERENCE',
    'CHARGE_CYCLE',
    'TSV_CREATED',
    'POSTED_TO_GL',
    'GL_DATE',
  ];
  subscriptionLinesDataSource = new MatTableDataSource<any>();

  invoiceLinesDisplayedColumns: string[] = [];
  invoiceLinesDataSource = new MatTableDataSource<any>();

  constructor(
    private http: ApiHttpService,
    private destroyManager: DestroyManager,
    private sidebarService: SidebarService,
    private route: ActivatedRoute,
    private router: Router
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

    this.route.queryParamMap.subscribe((params) => {
      console.log('Query Params:', params);

      this.orderId = params.get('orderId') || '91742826';
      const orderIdList = this.orderId ? [this.orderId] : [];
      this.subRefIds = params.get('subRefIds')?.split(',') || ['Sub1126960'];
      this.invoiceIds = params.get('invoiceIds')?.split(',') || [
        '6101427996',
        '6101129079',
      ];

      console.log('Received in O2C-360:');
      console.log('Order:', this.orderId);
      console.log('Subscriptions:', this.subRefIds);
      console.log('Invoices:', this.invoiceIds);

      this.getOrderSummary(orderIdList);
      this.getSubscriptionSummary(this.subRefIds);
      this.getSubscriptionLineSummary(this.subRefIds);
      this.getInvoiceSummary(this.invoiceIds);
      this.getInvoiceLineSummary(this.invoiceIds);

      // Use these to filter your tables or trigger fetches
    });

    // this.getO2cConnector();
  }

  handleSearch(value: string, type: string) {
    console.log(`Searching for ${type}: ${value}`);
    // ➕ Insert your filtering logic here
    // Example: filter your dataSource, call API, etc.
  }

  private getOrderSummary(orderIdList: any): void {
    const payload = {
      orderIds: orderIdList,
    };

    this.http
      .get('order-summary', this.destroyManager, {
        params: payload,
      })
      .subscribe((data: any) => {
        this.orderSummaryDataSource = new MatTableDataSource(data);
        this.navTotals[0].count = data.length;
      });
  }

  private getSubscriptionSummary(subRefIds: any): void {
    const payload = {
      subRefIds: subRefIds,
    };
    this.http
      .get('subscription-summary', this.destroyManager, {
        params: payload,
      })
      .subscribe((data: any) => {
        this.subscriptionSummaryDisplayedColumns = this.removeColumns(
          Object.keys(data[0]),
          ['EFFECTIVE_START_DATE', 'EFFECTIVE_END_DATE']
        );
        this.subscriptionSummaryDataSource = new MatTableDataSource(data);
        this.navTotals[1].count = data.length;
        this.subscriptionDataLoaded = true;
      });
  }

  private getSubscriptionLineSummary(subRefIds: any): void {
    const payload = {
      subRefIds: subRefIds,
    };
    this.http
      .get('subscription-line-summary', this.destroyManager, {
        params: payload,
      })
      .subscribe((data: any) => {
        // console.log('Subscription Lines:', data);
        this.subscriptionLinesDataSource = new MatTableDataSource(data);
      });
  }

  private getInvoiceSummary(invoiceIds: any): void {
    const payload = {
      invoiceIds: invoiceIds,
    };
    this.http
      .get('invoice-summary', this.destroyManager, {
        params: payload,
      })
      .subscribe((data: any) => {
        console.log('Invoice Summary:', data);
        this.invoiceSummaryDataSource = new MatTableDataSource(data);
        this.navTotals[2].count = data.length;
      });
  }

  private getInvoiceLineSummary(invoiceIds: any): void {
    const payload = {
      invoiceIds: invoiceIds,
    };
    this.http
      .get('invoice-line-summary', this.destroyManager, {
        params: payload,
      })
      .subscribe((data: any) => {
        console.log('Invoice Lines:', data);
        this.invoiceLinesDisplayedColumns = Object.keys(data[0]);
        this.invoiceLinesDataSource = new MatTableDataSource(data);
        this.invoiceDataLoaded = true;
      });
  }

  private getO2cConnector() {
    this.http
      .get('o2c-connector', this.destroyManager)
      .subscribe((data: any) => {
        console.log('o2cConnector:', data);
      });
  }

  formatColumnName(column: string): string {
    const acronyms = [
      'id',
      'irn',
      'uuid',
      'cm',
      'sftp',
      'b2b',
      'srt',
      'e-del',
      'irn/uuid',
      'ar',
      'usp',
      '(usd)',
      'sku',
      'qty',
      'tsv',
      'gl',
    ];
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

  openSubscriptionModal(subId: string): void {
    this.selectedSubscriptionId = subId;

    const allLines = this.subscriptionLinesDataSource.data;
    const filteredLines = allLines.filter(
      (line: any) => line.SUBSCRIPTION_REF_ID === subId
    );
    this.subscriptionLinesDataSource = new MatTableDataSource(filteredLines);

    this.showSubscriptionModal = true;
  }

  openInvoiceModal(transactionNumber: string): void {
    this.selectedTransactionNumber = transactionNumber;

    const allInvoices = this.invoiceSummaryDataSource.data;
    const filtered = allInvoices.filter(
      (row) => row.TRANSACTION_NUMBER === transactionNumber
    );

    this.invoiceSummaryModalDataSource = new MatTableDataSource(filtered);

    this.showInvoiceModal = true;
  }

  viewAllSubscriptions(): void {
    if (!this.subscriptionSummaryDataSource?.data?.length) return;

    this.router.navigate(['/o2c-sub'], {
      state: {
        subscriptionData: this.subscriptionSummaryDataSource.data,
        subscriptionColumns: this.subscriptionSummaryDisplayedColumns,
        orderData: this.orderSummaryDataSource.data,
      },
    });
  }

  viewAllInvoices(): void {
    if (!this.invoiceLinesDataSource?.data?.length) return;

    this.router.navigate(['/o2c-invoice'], {
      state: {
        invoiceLinesDisplayedColumns: this.invoiceLinesDisplayedColumns,
        invoiceLinesData: this.invoiceLinesDataSource.data,
        orderSummaryData: this.orderSummaryDataSource.data,
      },
    });
  }
}
