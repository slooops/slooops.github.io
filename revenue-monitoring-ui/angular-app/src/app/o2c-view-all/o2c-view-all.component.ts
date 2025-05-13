import { Component, OnInit } from '@angular/core';

import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-o2c-view-all',
  templateUrl: './o2c-view-all.component.html',
  styleUrl: './o2c-view-all.component.css',
})
export class O2cViewAllComponent implements OnInit {
  selectedTab: 'subscriptions' | 'invoices' = 'subscriptions';
  selectedTabIndex: number = 0;

  showInvoiceLines: boolean = false;
  selectedBillNumber: string | null = null;

  orderId: string | null = null;
  subscriptionId: string | null = null;
  invoiceId: string | null = null;

  selectedSubscriptionId: string | null = null;
  selectedTransactionNumber: string | null = null;
  showSubscriptionModal: boolean = false;
  showInvoiceModal: boolean = false;

  circleStatus: { [key: string]: number } = {
    Order: 2,
    Subscription: 2,
    Invoicing: -1,
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
    'FLOW_STATUS_CODE',
    'PARTNER',
    'END_CUSTOMER',
  ];
  orderSummaryDataSource = new MatTableDataSource<any>();

  subscriptionSummaryDisplayedColumns: string[] = [];
  subscriptionSummaryDataSource = new MatTableDataSource<any>();

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

  invoiceLinesDisplayedColumns: string[] = [
    'LINE_NUMBER', // Trx Line#
    'SKU',
    'DESCRIPTION', // SKU Description
    'QTY',
    'UNIT_SELLING_PRICE',
    'LINE_AMOUNT',
    'TAX_AMOUNT',
    'EXTENDED_AMOUNT', // Extended Line Amount (Including Tax)
    'SUBSCRIPTION_ID',
    'CHARGE_CYCLE_START_DATE',
    'CHARGE_CYCLE_END_DATE',
    'BRM_BILL_NUMBER', // Updated from BILL_NUMBER
    'BRM_BILL_LINE_NUMBER', // Updated from BILL_LINE_NUMBER
    'PREVIOUS_BILL_NUMBER',
    'PREVIOUS_BILL_LINE_NUMBER',
    'POSTED_TO_GL',
    'GL_DATE',
  ];
  invoiceLinesDataSource = new MatTableDataSource<any>();
  invoiceLinesFilteredDataSource = new MatTableDataSource<any>();
  invoiceSummaryModalDataSource = new MatTableDataSource<any>();

  constructor(private location: Location, private router: Router) {}

  ngOnInit(): void {
    const navState = this.location.getState() as {
      defaultTab?: string;
      defaultBillNumber?: string;
      orderData?: any[];

      subscriptionData?: any[];
      subscriptionColumns?: string[];
      subscriptionLineData?: any[];

      invoiceData?: any[];
      invoiceColumns?: string[];
      invoiceLineData?: any[];
    };

    this.selectedTab =
      navState.defaultTab === 'invoices' ? 'invoices' : 'subscriptions';
    this.selectedTabIndex = this.selectedTab === 'invoices' ? 1 : 0;

    if (navState?.subscriptionData) {
      this.subscriptionSummaryDataSource.data = navState.subscriptionData;
      this.subscriptionSummaryDisplayedColumns =
        navState.subscriptionColumns || [];
      this.subscriptionId =
        this.subscriptionSummaryDataSource.data[0].SUBSCRIPTION_ID;
      this.subscriptionLinesDataSource.data = navState.subscriptionLineData;
    }

    if (navState?.invoiceData) {
      this.invoiceSummaryDataSource.data = navState.invoiceData;
      this.invoiceSummaryDisplayedColumns = navState.invoiceColumns || [];
      this.invoiceId = this.invoiceSummaryDataSource.data[0].TRANSACTION_NUMBER;
      this.invoiceLinesDataSource.data = navState.invoiceLineData;

      if (navState.defaultBillNumber) {
        this.toggleInvoiceLinesTable(navState.defaultBillNumber);
      }
    }

    if (navState?.orderData) {
      this.orderSummaryDataSource.data = navState.orderData;
      this.orderId = this.orderSummaryDataSource.data[0].WEB_ORDER_ID;
    }
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

  toggleInvoiceLinesTable(billNumber: string): void {
    console.log('Bill Number:', billNumber);
    console.log('Invoice Lines Data Source:', this.invoiceLinesDataSource.data);

    this.selectedBillNumber = billNumber;

    const filteredLines = this.invoiceLinesDataSource.data.filter(
      (line) => line.BRM_BILL_NUMBER === billNumber
    );

    console.log('Filtered Lines:', filteredLines);

    this.invoiceLinesFilteredDataSource.data = filteredLines;
    this.showInvoiceLines = true;
  }

  handleDownload(
    data: any[],
    fileName: string = 'ExportedData',
    sheetName: string = 'Data'
  ): void {
    if (!data?.length) {
      console.warn('No data to export');
      return;
    }

    console.log('Exporting data:', data);

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
}
