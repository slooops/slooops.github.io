import {
  Component,
  HostListener,
  Input,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { ApiHttpService } from '../../providers/http.service';
import { DestroyManager } from '../../providers/destroy-manager.service';
import { MatTableDataSource } from '@angular/material/table';
import { SidebarService } from '../../sidebar.service';
import { ActivatedRoute, Router } from '@angular/router';
import { O2cSearchResult } from '../../search-context.service';
import { FiltersService } from '../../providers/filters.service';

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

  showWelcomeOverlay = false;
  hasSearched = false;

  orderId: string = '';
  subRefIds: string[] = [];
  invoiceIds: string[] = [];
  subCodes: string[] = [];

  showDetailsModal = false;
  orderExceptionMessage: string = '';
  subscriptionExceptionMessage: string = '';
  invoiceExceptionMessage: string = '';

  selectedSubscriptionId: string | null = null;
  selectedWebOrderId: string | null = null;
  showInvoiceModal = false;
  selectedTransactionNumber: string | null = null;

  orderDataLoaded = false;
  subscriptionDataLoaded = false;
  subscriptionLinesDataLoaded = false;
  invoiceDataLoaded = false;
  invoiceLinesDataLoaded = false;

  // Consolidated loading state tracker
  get allDataLoaded(): boolean {
    return (
      this.orderDataLoaded &&
      this.subscriptionDataLoaded &&
      this.subscriptionLinesDataLoaded &&
      this.invoiceDataLoaded &&
      this.invoiceLinesDataLoaded
      // && this.financialDataLoaded
    );
  }

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
    'LEGAL_ENTITY',
    'BILL_TO_CUSTOMER',
    'END_CUSTOMER',
  ];
  orderSummaryDataSource = new MatTableDataSource<any>();

  subscriptionSummaryDisplayedColumns: string[] = [];
  subscriptionSummaryDataSource = new MatTableDataSource<any>();

  invoiceSummaryDisplayedColumns: string[] = [];
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

  subscriptionLinesDisplayedColumns: string[] = [];
  subscriptionLinesDataSource = new MatTableDataSource<any>();

  invoiceLinesDisplayedColumns: string[] = [];
  invoiceLinesDataSource = new MatTableDataSource<any>();

  financialDataLoaded: true;
  financialSummaryDataSource = new MatTableDataSource<any>([
    {
      ORDER_TSV: 'USD 0.00',
      TOTAL_SUBSCRIPTION_TSV: 'USD 0.00',
      BILLING_MODEL: 'Prepaid',
      BILLED: 'USD 0.00',
      UNBILLED: 'USD 0.00',
      REVENUE_RECOGNITION: 'USD 0.00',
      REVENUE_TO_BE_RECOGNIZED: 'USD 0.00',
      CASH: 'Paid',
      actions: 'View in CCW', // Placeholder for actions column
    },
  ]);
  financialSummaryDisplayedColumns: string[] = [
    'ORDER_TSV',
    // 'TOTAL_SUBSCRIPTION_TSV',
    'BILLING_MODEL',
    'BILLED',
    'UNBILLED',
    'REVENUE_RECOGNITION',
    'REVENUE_TO_BE_RECOGNIZED',
    'CASH',
    'actions',
  ];

  constructor(
    private http: ApiHttpService,
    private destroyManager: DestroyManager,
    private sidebarService: SidebarService,
    private route: ActivatedRoute,
    private router: Router,
    private filtersService: FiltersService
  ) {}

  sidebarExpanded = true;
  @Input() searchParams: O2cSearchResult | null = null;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['searchParams']?.currentValue) {
      const { searchType, orderId, subRefIds, invoiceIds, subCodes } =
        this.searchParams!;
      this.loadData(orderId, subRefIds, invoiceIds, subCodes);

      this.showWelcomeOverlay = false;
      console.log('show overlay from ng on changes:', this.showWelcomeOverlay);
      this.expanded = {
        subscription: false,
        invoice: false,
      };

      if (searchType === 'subscription') {
        this.expanded.subscription = true;
      } else if (searchType === 'invoice') {
        this.expanded.invoice = true;
      }
    }
  }

  ngOnInit(): void {
    this.sidebarService.isExpanded$.subscribe((isExpanded) => {
      this.sidebarExpanded = isExpanded;

      if (!isExpanded) {
        this.expanded.subscription = true;
        this.expanded.invoice = true;
      } else if (isExpanded) {
        this.expanded.subscription = false;
        this.expanded.invoice = false;
      }
    });

    this.sidebarService.activeItem$.subscribe((item) => {
      if (item === 'Subscriptions') {
        this.expanded.subscription = true;
        this.expanded.invoice = false;
      } else if (item === 'Invoices') {
        this.expanded.invoice = true;
        this.expanded.subscription = false;
      } else if (item === 'Orders') {
        this.expanded.subscription = false;
        this.expanded.invoice = false;
      }
    });

    // Only listen to query params if this wasn't initialized via @Input()
    if (!this.searchParams) {
      this.route.queryParamMap.subscribe((params) => {
        const orderId = params.get('orderId') || 'Search to get an';
        const subRefIds = params.get('subRefIds')?.split(',') || [''];
        const invoiceIds = params.get('invoiceIds')?.split(',') || [];
        const subCodes = params.get('subCodes')?.split(',') || [];

        this.loadData(orderId, subRefIds, invoiceIds, subCodes);

        this.showWelcomeOverlay =
          !this.router.url.includes('?searchType=') &&
          this.orderId.includes('Search to get an');

        const searchType = params.get('searchType');
        if (searchType === 'subscription') {
          this.expanded.subscription = true;
        } else if (searchType === 'invoice') {
          this.expanded.invoice = true;
        }
      });
    }
  }

  private loadData(
    orderId: string,
    subRefIds: string[],
    invoiceIds: string[],
    subCodes: string[]
  ): void {
    this.orderId = orderId || 'Search to get an';
    this.subRefIds = subRefIds;
    this.invoiceIds = invoiceIds;
    this.subCodes = subCodes;

    this.getOrderSummary([orderId]);
    this.getSubscriptionSummary(subRefIds, subCodes);
    this.getSubscriptionLineSummary(subRefIds, subCodes);
    this.getInvoiceSummary(invoiceIds);
    this.getInvoiceLineSummary(invoiceIds);
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

  private getSubscriptionSummary(subRefIds: any, subCodes: any): void {
    if (!subRefIds || !subRefIds.length || subRefIds[0] === '') {
      console.warn('No subscription IDs provided');
      this.subscriptionSummaryDataSource = new MatTableDataSource([]);
      this.subscriptionDataLoaded = true;
      return;
    }
    const payload = {
      subRefIds: subRefIds,
      subCodes: subCodes,
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
        // console.log(
        //   'Subscription Summary Exception:',
        //   this.subscriptionExceptionMessage
        // );

        if (Array.isArray(data) && data.length > 0) {
          this.subscriptionSummaryDisplayedColumns = this.removeColumns(
            Object.keys(data[0]),
            [
              'TERM_START_DATE',
              'TERM_END_DATE',
              'LAST_UPDATE_DATE',
              'RUN_DATE',
              'BILLING_FREQ_TYPE',
            ]
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

  private getSubscriptionLineSummary(subRefIds: any, subCodes: any): void {
    if (!subRefIds || !subRefIds.length || subRefIds[0] === '') {
      console.warn('No subscription IDs provided');
      this.subscriptionLinesDataSource = new MatTableDataSource([]);
      this.subscriptionLinesDataLoaded = true;
      return;
    }
    const payload = {
      subRefIds: subRefIds,
      subCodes: subCodes,
    };
    this.http
      .get('subscription-line-summary', this.destroyManager, {
        params: payload,
      })
      .subscribe((data: any) => {
        console.log('Subscription Lines:', data);

        if (Array.isArray(data) && data.length > 0) {
          this.subscriptionLinesDisplayedColumns = this.removeColumns(
            Object.keys(data[0]),
            [
              'CHARGE_CYCLE_FROM',
              'CHARGE_CYCLE_TO',
              'OBJ_ID0',
              'SUBSCRIPTION_REF_ID',
              'SUBSCRIPTION_NO',
              'WEB_ORDER_ID',
              'LAST_UPDATE_DATE',
              'RUN_DATE',
              'SKU',
              'INVOICE_STATUS',
            ]
          );
        } else {
          this.subscriptionLinesDisplayedColumns = [];
        }

        this.subscriptionLinesDataSource = new MatTableDataSource(data);
        if (this.sortColumn) {
          this.sortTable(this.sortColumn);
        }
        this.subscriptionLinesDataLoaded = true;
      });
  }

  originalInvoiceSummaryData: any[] = [];

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
        // console.log(
        //   'Invoice Summary Circle Status:',
        //   this.circleStatus['Invoice']
        // );
        this.invoiceExceptionMessage = hasException
          ? data.find((row: any) => row.EXCEPTION_DETAILS)?.EXCEPTION_DETAILS ||
            ''
          : '';
        // console.log('Invoice Summary Exception:', this.invoiceExceptionMessage);
        this.originalInvoiceSummaryData = [...data];

        if (Array.isArray(data) && data.length > 0) {
          this.invoiceSummaryDisplayedColumns = this.removeColumns(
            Object.keys(data[0]),
            [
              'TRX_TYPE',
              'INVOICE_DELIVERY_METHOD',
              'PRINT_DATE',
              'PRINT_STATUS',
              'EMAIL_ADDRESS',
              'SFTP',
              'B2B',
              'SRT_CONTACT_EMAIL',
              'EINVOICING_STATUS',
              'IRN_UUID',
              'IRN_UUID_DATE',
              'PREVIOUS_IRN_UUID',
              'COLLECTOR',
              'RECEIPT_APPLIED',
              'CM_APPLIED',
              'WRITEOFF_ADJUSTMENTS',
            ]
          );
        } else {
          this.invoiceSummaryDisplayedColumns = [];
        }

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

        if (Array.isArray(data) && data.length > 0) {
          this.invoiceLinesDisplayedColumns = this.removeColumns(
            Object.keys(data[0]),
            [
              'CUSTOMER_TRX_ID',
              'CUSTOMER_TRX_LINE_ID',
              'RULE_START_DATE',
              'RULE_END_DATE',
              // 'BRM_BILL_NUMBER',
              // 'BRM_BILL_LINE_NUMBER',
              // 'PREVIOUS_BILL_NUMBER',
              // 'PREVIOUS_BILL_LINE_NUMBER',
              'UNIQUE_ID',
              'LAST_UPDATE_DATE',
              'WEB_ORDER_ID',
              'RUN_DATE',
              'OA_FLAG',
              'SUBSCRIPTION_NUMBER',
              'BATCH_SOURCE',
              'TRANSACTION_NUMBER',
            ]
          );
        } else {
          this.invoiceLinesDisplayedColumns = [];
        }

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
    // Determine if exceptions exist
    const hasOrderException = !!this.orderExceptionMessage;
    const hasSubException = !!this.subscriptionExceptionMessage;
    const hasInvoiceException = !!this.invoiceExceptionMessage;

    // Data existence checks
    const subscriptionDataExists =
      this.subscriptionSummaryDataSource?.data?.length > 0;
    const invoiceDataExists = this.invoiceSummaryDataSource?.data?.length > 0;

    // Step 1: Order status
    // Order is either good (2) or has an error (-1)
    this.circleStatus['Order'] = hasOrderException ? -1 : 2;

    // Step 2: Subscription status
    // Subscription depends on its own exceptions, not order
    this.circleStatus['Subscription'] = !subscriptionDataExists
      ? 0 // No data = pending
      : hasSubException
      ? -1 // Has exception = error
      : 2; // No exception = good

    // Step 3: Invoicing status
    // Invoicing shows warning if previous step had error
    this.circleStatus['Invoicing'] =
      hasOrderException || hasSubException
        ? 0 // Previous error = pending
        : !invoiceDataExists
        ? 0 // No data = pending
        : hasInvoiceException
        ? -1 // Has exception = error
        : 2; // No exception = good

    // Step 4: Accounting status
    // Accounting depends on invoice data
    this.circleStatus['Accounting'] =
      hasOrderException || hasSubException || hasInvoiceException
        ? 0 // Previous error = pending
        : !invoiceDataExists
        ? 0 // No data = pending
        : 2; // Otherwise good

    // Step 5: Cash status (special handling)
    // Cash is good only if all invoices are closed
    const allClosed =
      invoiceDataExists &&
      !hasOrderException &&
      !hasSubException &&
      !hasInvoiceException &&
      this.invoiceSummaryDataSource.data.every(
        (row: any) => row.STATUS === 'Closed'
      );

    this.circleStatus['Cash'] = allClosed ? 2 : 0;

    console.log('Circle status updated:', this.circleStatus);
  }

  viewAll(type: 'subscriptions' | 'invoices', id?: string): void {
    if (!this.allDataLoaded) {
      console.warn('Not all data has loaded. Please wait.');
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

    this.router.navigate(['/o2c-view-all'], {
      state: {
        defaultTab: type,
        defaultTransactionNumber: isInvoice ? id : undefined,
        defaultSubscriptionId: isSubscription ? id : undefined,

        orderData: this.orderSummaryDataSource.data,
        financialData: this.financialSummaryDataSource.data,

        subscriptionData: this.subscriptionSummaryDataSource.data,
        subscriptionColumns: this.subscriptionSummaryDisplayedColumns,
        subscriptionLineData: this.subscriptionLinesDataSource?.data || [],
        subscriptionLineColumns: this.subscriptionLinesDisplayedColumns,

        invoiceData: this.invoiceSummaryDataSource.data,
        invoiceColumns: this.invoiceSummaryDisplayedColumns,
        invoiceLineData: this.invoiceLinesDataSource?.data || [],
        invoiceLineColumns: this.invoiceLinesDisplayedColumns,

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

  dismissOverlay(): void {
    this.showWelcomeOverlay = false;
  }

  // Add these properties to your component
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  // Add this method to handle sorting
  sortTable(column: string): void {
    console.log('Sorting by column:', column);
    // If clicking the same column, toggle direction
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New column, default to ascending
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    // Clone the data array
    const data = [...this.subscriptionLinesDataSource.data];

    // Sort the data
    data.sort((a, b) => {
      const aValue = a[column];
      const bValue = b[column];

      // Handle date comparison for TSV_CREATED
      if (column === 'TSV_CREATED') {
        const dateA = new Date(aValue).getTime();
        const dateB = new Date(bValue).getTime();
        return this.sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }

      // Handle numeric comparison for UNIT_SELLING_PRICE
      if (column === 'UNIT_SELLING_PRICE') {
        const numA = parseFloat(aValue) || 0;
        const numB = parseFloat(bValue) || 0;
        return this.sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      // Default string comparison
      return this.sortDirection === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

    // Update the data source
    this.subscriptionLinesDataSource = new MatTableDataSource(data);
  }

  // Helper method to show sort icons
  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return '↕'; // or use a neutral icon
    }
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  viewInCCW(): void {
    window.open(
      'https://ccw-cstg.cisco.com/icw/pdrqo/portal.order' + this.orderId,
      '_blank'
    );
  }

  navigateToBillingSchedule(rowData: any): void {
    console.log('Navigating to Billing Schedule with row data:', rowData);
    this.router.navigate(['/o2c-bill-schedule'], {
      state: { rowData: rowData, orderId: this.orderId },
    });
  }

  filters: { [key: string]: string } = {};
  filteredDataNotFound: boolean = false;
  amountOptions = [
    { label: 'All', value: 'all', default: true },
    { label: 'USD Equal to 0', value: 'equal to 0', default: false },
    { label: 'USD Greater than 0', value: 'greater than 0', default: false },
    { label: 'USD Less than 0', value: 'less than 0', default: false },
  ];

  handleFilter(
    value: string,
    column: string,
    data: any[],
    dataSourceProp:
      | 'orderSummaryDataSource'
      | 'subscriptionSummaryDataSource'
      | 'invoiceSummaryDataSource'
      | 'invoiceSummaryModalDataSource'
      | 'subscriptionLinesDataSource'
      | 'invoiceLinesDataSource'
      | 'financialSummaryDataSource'
  ) {
    if (value === 'all') {
      delete this.filters[column];
    } else {
      this.filters[column] = value;
    }
    let tableData = this.filtersService.applyFilters(data, this.filters);
    if (tableData.length === 0) {
      this.filteredDataNotFound = true;
      setTimeout(() => {
        this.filteredDataNotFound = false;
      }, 5000);
    } else {
      this.filteredDataNotFound = false;
      (this[dataSourceProp] as MatTableDataSource<any>).data = tableData;
    }
  }
}
