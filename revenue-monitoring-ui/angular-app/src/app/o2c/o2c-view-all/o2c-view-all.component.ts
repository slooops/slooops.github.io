import { Component, OnInit } from '@angular/core';

import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import * as XLSX from 'xlsx';
import { FiltersService } from '../../providers/filters.service';

@Component({
  selector: 'app-o2c-view-all',
  templateUrl: './o2c-view-all.component.html',
  styleUrl: './o2c-view-all.component.css',
})
export class O2cViewAllComponent implements OnInit {
  selectedTab: 'subscriptions' | 'invoices' = 'subscriptions';
  selectedTabIndex: number = 0;

  showSubscriptionLines: boolean = false;
  showInvoiceLines: boolean = false;

  orderId: string | null = null;
  subscriptionId: string | null = null;
  invoiceId: string | null = null;

  selectedSubscriptionId: string | null = null;
  selectedTransactionNumber: string | null = null;
  showInvoiceModal: boolean = false;
  amountOptions = [
    { label: 'All', value: 'all', default: true },
    { label: 'USD Equal to 0', value: 'equal to 0', default: false },
    { label: 'USD Greater than 0', value: 'greater than 0', default: false },
    { label: 'USD Less than 0', value: 'less than 0', default: false },
  ];

  postedToGLOptions = [
    { label: 'All', value: 'all', default: true },
    { label: 'Y', value: 'Y', default: false },
    { label: 'N', value: 'N', default: false },
  ];

  circleStatus: { [key: string]: number } = {
    Order: 0,
    Subscription: 0,
    Invoicing: 0,
    Accounting: 0,
    Cash: 0,
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
    'LEGAL_ENTITY',
    'BILL_TO_CUSTOMER',
    'END_CUSTOMER',
  ];
  orderSummaryDataSource = new MatTableDataSource<any>();

  financialDataLoaded: any;
  financialSummaryDataSource = new MatTableDataSource<any>([]);
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

  subscriptionSummaryDisplayedColumns: string[] = [];
  subscriptionSummaryDataSource = new MatTableDataSource<any>();

  subscriptionLinesDisplayedColumns: string[] = [];
  subscriptionLinesDataSource = new MatTableDataSource<any>();

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

  invoiceLinesDisplayedColumns: string[] = [];
  invoiceLinesDataSource = new MatTableDataSource<any>();
  invoiceLinesFilteredDataSource = new MatTableDataSource<any>();
  invoiceSummaryModalDataSource = new MatTableDataSource<any>();

  filters: { [key: string]: string } = {};
  filteredDataNotFound: boolean = false;
  originalInvoiceSummaryData: any[] = [];
  originalInvoiceLinesData: any[] = [];
  filteredOriginalInvoiceLinesData: any[] = [];
  invoiceLinesFiltered: boolean = false;
  originalSubscriptionLinesData: any[] = [];
  filteredOriginalSubscriptionLinesData: any[] = [];
  subscriptionLinesFiltered: boolean = false;
  handleFilter(
    value: string,
    column: string,
    data: any[],
    dataSourceProp:
      | 'invoiceSummaryDataSource'
      | 'orderSummaryDataSource'
      | 'subscriptionSummaryDataSource'
      | 'invoiceLinesDataSource'
      | 'invoiceLinesFilteredDataSource'
      | 'financialSummaryDataSource'
      | 'subscriptionLinesDataSource'
      | 'invoiceSummaryModalDataSource'
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

  constructor(
    private location: Location,
    private router: Router,
    private filtersService: FiltersService
  ) {}

  ngOnInit(): void {
    const navState = this.location.getState() as {
      defaultTab?: string;
      defaultTransactionNumber?: string;
      defaultSubscriptionId?: string;
      orderData?: any[];
      financialData?: any[];

      subscriptionData?: any[];
      subscriptionColumns?: string[];
      subscriptionLineData?: any[];
      subscriptionLineColumns?: string[]; // Add this

      invoiceData?: any[];
      invoiceColumns?: string[];
      invoiceLineData?: any[];
      invoiceLineColumns?: string[]; // Add this

      circleStatus?: { [key: string]: number };
    };

    this.selectedTab =
      navState.defaultTab === 'invoices' ? 'invoices' : 'subscriptions';
    this.selectedTabIndex = this.selectedTab === 'invoices' ? 1 : 0;

    if (navState?.circleStatus) {
      this.circleStatus = navState.circleStatus;
    }

    if (navState?.subscriptionData) {
      this.subscriptionSummaryDataSource.data = navState.subscriptionData;
      this.subscriptionSummaryDisplayedColumns =
        navState.subscriptionColumns || [];
      this.subscriptionId =
        this.subscriptionSummaryDataSource.data[0]?.SUBSCRIPTION_ID;
      this.subscriptionLinesDataSource.data = navState.subscriptionLineData;

      // Use the already-processed columns from o2c-360
      this.subscriptionLinesDisplayedColumns =
        navState.subscriptionLineColumns || [];

      this.originalSubscriptionLinesData = [...navState.subscriptionLineData];
      if (navState.defaultSubscriptionId) {
        this.toggleSubscriptionLinesTable(navState.defaultSubscriptionId);
      }
    }

    if (navState?.invoiceData) {
      this.originalInvoiceSummaryData = [...navState.invoiceData];
      this.invoiceSummaryDataSource.data = navState.invoiceData;
      this.invoiceSummaryDisplayedColumns = navState.invoiceColumns || [];

      this.invoiceId =
        this.invoiceSummaryDataSource.data[0]?.TRANSACTION_NUMBER;
      const sortedData = navState.invoiceLineData
        .slice()
        .sort((a: any, b: any) => (a.LINE_NUMBER ?? 0) - (b.LINE_NUMBER ?? 0));
      this.invoiceLinesDataSource.data = sortedData;

      // Use the already-processed columns from o2c-360
      this.invoiceLinesDisplayedColumns = navState.invoiceLineColumns || [];

      this.originalInvoiceLinesData = [...sortedData];

      if (navState.defaultTransactionNumber) {
        this.toggleInvoiceLinesTable(navState.defaultTransactionNumber);
      }
    }

    if (navState?.orderData) {
      this.orderSummaryDataSource.data = navState.orderData;
      this.orderId = this.orderSummaryDataSource.data[0].WEB_ORDER_ID;
    }

    if (navState?.financialData) {
      this.financialSummaryDataSource.data = navState.financialData;
    }
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
      'brm',
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

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    this.selectedTab = index === 0 ? 'subscriptions' : 'invoices';
  }

  goBack(): void {
    window.history.back();
  }

  toggleInvoiceLinesTable(TransactionNumber: string): void {
    this.invoiceLinesFiltered = true;
    this.selectedTransactionNumber = TransactionNumber;

    const filteredLines = this.invoiceLinesDataSource.data.filter(
      (line) => line.TRANSACTION_NUMBER === TransactionNumber
    );

    this.filteredOriginalInvoiceLinesData = [...filteredLines];
    this.invoiceLinesFilteredDataSource.data = filteredLines;
    this.showInvoiceLines = true;
    this.showSubscriptionLines = true;
  }

  toggleSubscriptionLinesTable(subscriptionId: string): void {
    this.subscriptionLinesFiltered = true;
    this.selectedSubscriptionId = subscriptionId;

    const filteredLines = this.subscriptionLinesDataSource.data.filter(
      (line) => line.SUBSCRIPTION_REF_ID === subscriptionId
    );

    this.filteredOriginalSubscriptionLinesData = [...filteredLines];
    this.subscriptionLinesDataSource.data = filteredLines;
    this.showSubscriptionLines = true;
    this.showInvoiceLines = false;
  }

  handleDownload(
    data: any[],
    fileName: string = 'ExportedData',
    sheetName: string = 'Data'
  ): void {
    if (!data?.length) {
      // console.warn('No data to export');
      return;
    }

    // console.log('Exporting data:', data);

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = {
      Sheets: { [sheetName]: worksheet },
      SheetNames: [sheetName],
    };

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  handlePrint(): void {
    window.print();
  }

  handleShare(): void {
    const url = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: 'O2C View All Dashboard',
          text: 'Check out this data dashboard',
          url,
        })
        .then(() => console.log('Share successful'))
        .catch((err) => console.error('Error sharing:', err));
    } else {
      navigator.clipboard
        .writeText(url)
        .then(() => alert('Link copied to clipboard'))
        .catch(() => alert('Unable to copy link'));
    }
  }

  viewInCCW(): void {
    window.open(
      'https://ccw-cstg.cisco.com/icw/pdrqo/portal.order' + this.orderId,
      '_blank'
    );
  }

  navigateToTsv(rowData: any): void {
    this.router.navigate(['/o2c-tsv'], {
      state: {
        rowData: rowData,
        orderId: this.orderId,
        circleStatus: this.circleStatus,
        subscriptionId: this.selectedSubscriptionId,
        orderData: this.orderSummaryDataSource.data || [],
        financialData: this.financialSummaryDataSource.data || [],
        source: 'view-all',
      },
    });
  }

  navigateToGl(rowData: any): void {
    this.router.navigate(['/o2c-gl'], {
      state: {
        rowData: rowData,
        orderId: this.orderId,
        circleStatus: this.circleStatus,
        subscriptionId: this.selectedSubscriptionId,
        orderData: this.orderSummaryDataSource.data || [],
        financialData: this.financialSummaryDataSource.data || [],
        source: 'view-all',
      },
      queryParams: { t: Date.now() },
    });
  }

  navigateToBillingSchedule(rowData: any): void {
    console.log('Navigating to Billing Schedule with row data:', rowData);
    this.router.navigate(['/o2c-bill-schedule'], {
      state: { rowData: rowData, orderId: this.orderId },
    });
  }
}
