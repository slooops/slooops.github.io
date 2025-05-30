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
  orderExceptionMessage: string = '';
  subscriptionExceptionMessage: string = '';
  invoiceExceptionMessage: string = '';

  showSubscriptionModal = false;
  selectedSubscriptionId: string | null = null;

  selectedWebOrderId: string | null = null;

  showInvoiceModal = false;
  selectedTransactionNumber: string | null = null;

  orderDataLoaded = false;
  subscriptionDataLoaded = false;
  subscriptionLinesDataLoaded = false;
  invoiceDataLoaded = false;
  invoiceLinesDataLoaded = false;

  circleStatus: { [key: string]: number } = {
    Order: 2,
    Subscription: 0,
    Invoicing: 0,
    Accounting: 0,
    Cash: 0,
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
    'CLOUD_SUB_ORDER_HOLDS',
    'FLOW_STATUS_CODE',
    'BILL_TO_CUSTOMER',
    'END_CUSTOMER',
  ];
  orderSummaryDataSource = new MatTableDataSource<any>();

  subscriptionSummaryDisplayedColumns: string[] = [];
  subscriptionSummaryDataSource = new MatTableDataSource<any>();

  invoiceSummaryDisplayedColumns: string[] = [
    'TRANSACTION_NUMBER',
    'TRANSACTION_CLASS',
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

  subscriptionLinesDisplayedColumns: string[] = [
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
      } else if (item === 'Invoices') {
        this.expanded.invoice = true;
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

      if (params.get('searchType') === 'subscription') {
        this.expanded.subscription = true;
      } else if (params.get('searchType') === 'invoice') {
        this.expanded.invoice = true;
      }

      console.log('Received in O2C-360:');
      console.log('Order:', this.orderId);
      console.log('Subscriptions:', this.subRefIds);
      console.log('Invoices:', this.invoiceIds);

      this.getOrderSummary(orderIdList);
      this.getSubscriptionSummary(this.subRefIds);
      this.getSubscriptionLineSummary(this.subRefIds);
      this.getInvoiceSummary(this.invoiceIds);
      this.getInvoiceLineSummary(this.invoiceIds);
    });
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
        console.log('Order Summary:', data);

        const hasException = data.some((row: any) => !!row.EXCEPTION_DETAILS);
        this.orderExceptionMessage = hasException
          ? data.find((row: any) => row.EXCEPTION_DETAILS)?.EXCEPTION_DETAILS ||
            ''
          : '';
        console.log('Order Summary Exception:', this.orderExceptionMessage);
        this.updateCircleStatus();

        this.orderSummaryDataSource = new MatTableDataSource(data);
        this.navTotals[0].count = data.length;
        this.orderDataLoaded = true;

        if (this.orderSummaryDataSource.data.length === 0) {
          this.circleStatus['Order'] = 0;
          this.circleStatus['Subscription'] = 0;
          this.circleStatus['Invoicing'] = 0;
          this.circleStatus['Accounting'] = 0;
        }
      });
  }

  private getSubscriptionSummary(subRefIds: any): void {
    if (!subRefIds || !subRefIds.length || subRefIds[0] === '') {
      console.warn('No subscription IDs provided');
      this.subscriptionSummaryDataSource = new MatTableDataSource([]);
      this.subscriptionDataLoaded = true;
      return;
    }
    const payload = {
      subRefIds: subRefIds,
    };
    this.http
      .get('subscription-summary', this.destroyManager, {
        params: payload,
      })
      .subscribe((data: any) => {
        console.log('Subscription Summary:', data);

        const hasException = data.some((row: any) => !!row.EXCEPTION_DETAILS);
        this.subscriptionExceptionMessage = hasException
          ? data.find((row: any) => row.EXCEPTION_DETAILS)?.EXCEPTION_DETAILS ||
            ''
          : '';
        console.log(
          'Subscription Summary Exception:',
          this.subscriptionExceptionMessage
        );

        if (Array.isArray(data) && data.length > 0) {
          this.subscriptionSummaryDisplayedColumns = this.removeColumns(
            Object.keys(data[0]),
            ['EFFECTIVE_START_DATE', 'EFFECTIVE_END_DATE', 'EXCEPTION_DETAILS']
          );
        } else {
          this.subscriptionSummaryDisplayedColumns = [];
        }
        this.subscriptionSummaryDataSource = new MatTableDataSource(data);
        this.navTotals[1].count = data.length;
        this.updateCircleStatus();
        this.subscriptionDataLoaded = true;
      });
  }

  private getSubscriptionLineSummary(subRefIds: any): void {
    if (!subRefIds || !subRefIds.length || subRefIds[0] === '') {
      console.warn('No subscription IDs provided');
      this.subscriptionLinesDataSource = new MatTableDataSource([]);
      this.subscriptionLinesDataLoaded = true;
      return;
    }
    const payload = {
      subRefIds: subRefIds,
    };
    this.http
      .get('subscription-line-summary', this.destroyManager, {
        params: payload,
      })
      .subscribe((data: any) => {
        console.log('Subscription Lines:', data);
        this.subscriptionLinesDataSource = new MatTableDataSource(data);
        this.subscriptionLinesDataLoaded = true;
      });
  }

  private getInvoiceSummary(invoiceIds: any): void {
    if (!invoiceIds || !invoiceIds.length || invoiceIds[0] === '') {
      console.warn('No invoice IDs provided');
      this.invoiceSummaryDataSource = new MatTableDataSource([]);
      this.invoiceDataLoaded = true;
      return;
    }

    const payload = {
      invoiceIds: invoiceIds,
    };
    this.http
      .get('invoice-summary', this.destroyManager, {
        params: payload,
      })
      .subscribe((data: any) => {
        console.log('Invoice Summary:', data);
        const hasException = data.some((row: any) => !!row.EXCEPTION_DETAILS);
        console.log(
          'Invoice Summary Circle Status:',
          this.circleStatus['Invoice']
        );
        this.invoiceExceptionMessage = hasException
          ? data.find((row: any) => row.EXCEPTION_DETAILS)?.EXCEPTION_DETAILS ||
            ''
          : '';
        console.log('Invoice Summary Exception:', this.invoiceExceptionMessage);

        this.invoiceSummaryDataSource = new MatTableDataSource(data);
        this.navTotals[2].count = data.length;

        this.updateCircleStatus();
        this.invoiceDataLoaded = true;
      });
  }

  private getInvoiceLineSummary(invoiceIds: any): void {
    if (!invoiceIds || !invoiceIds.length || invoiceIds[0] === '') {
      console.warn('No invoice IDs provided');
      this.invoiceLinesDataSource = new MatTableDataSource([]);
      this.invoiceLinesDataLoaded = true;
      return;
    }
    const payload = {
      invoiceIds: invoiceIds,
    };
    this.http
      .get('invoice-line-summary', this.destroyManager, {
        params: payload,
      })
      .subscribe((data: any) => {
        console.log('Invoice Lines:', data);
        this.invoiceLinesDataSource = new MatTableDataSource(data);
        this.invoiceLinesDataLoaded = true;
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

  get limitedInvoiceData() {
    return this.invoiceSummaryDataSource.data.slice(0, 5);
  }
  get limitedSubscriptionData() {
    return this.subscriptionSummaryDataSource.data.slice(0, 5);
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

  //needs more work
  private updateCircleStatus(): void {
    const hasOrderException = !!this.orderExceptionMessage;
    const hasSubException = !!this.subscriptionExceptionMessage;
    const hasInvoiceException = !!this.invoiceExceptionMessage;

    const subscriptionDataExists =
      this.subscriptionSummaryDataSource?.data?.length > 0;
    const invoiceDataExists = this.invoiceSummaryDataSource?.data?.length > 0;

    const orderGood = !hasOrderException;
    const subGood = orderGood && !hasSubException;
    const invoiceGood = subGood && !hasInvoiceException && invoiceDataExists;

    this.circleStatus['Subscription'] = hasOrderException ? -1 : 2;

    this.circleStatus['Invoicing'] = hasOrderException
      ? 0
      : !subscriptionDataExists
      ? 0
      : hasSubException
      ? -1
      : 2;

    this.circleStatus['Accounting'] = !subGood
      ? 0
      : !invoiceDataExists
      ? 0
      : hasInvoiceException
      ? -1
      : 2;

    // Special handling for cash:
    const allClosed =
      invoiceGood &&
      this.invoiceSummaryDataSource.data.every(
        (row: any) => row.STATUS === 'Closed'
      );

    this.circleStatus['Cash'] = allClosed ? 2 : 0;
  }

  viewAll(type: 'subscriptions' | 'invoices', billNumber?: string): void {
    if (!this.subscriptionLinesDataLoaded || !this.invoiceLinesDataLoaded) {
      return;
    }

    const isInvoice = type === 'invoices';
    const isSubscription = type === 'subscriptions';

    if (
      (isInvoice && !this.invoiceSummaryDataSource?.data?.length) ||
      (isSubscription && !this.subscriptionSummaryDataSource?.data?.length)
    ) {
      console.warn(
        `No ${type} data available to view all. Please check the data source.`
      );
      return;
    }

    console.log('View All inv lines:', this.invoiceLinesDataSource.data);

    this.router.navigate(['/o2c-view-all'], {
      state: {
        defaultTab: type,
        defaultTransactionNumber: billNumber,
        orderData: this.orderSummaryDataSource.data,

        subscriptionData: this.subscriptionSummaryDataSource.data,
        subscriptionColumns: this.subscriptionSummaryDisplayedColumns,
        subscriptionLineData: this.subscriptionLinesDataSource?.data || [],

        invoiceData: this.invoiceSummaryDataSource.data,
        invoiceColumns: this.invoiceSummaryDisplayedColumns,
        invoiceLineData: this.invoiceLinesDataSource?.data || [],

        circleStatus: this.circleStatus,
      },
    });
  }

  hasExceptions(): boolean {
    return (
      !!this.orderExceptionMessage ||
      !!this.subscriptionExceptionMessage ||
      !!this.invoiceExceptionMessage
    );
  }
}
