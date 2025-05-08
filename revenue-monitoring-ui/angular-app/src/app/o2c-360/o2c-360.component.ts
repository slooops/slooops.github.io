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

  showDetailsModal = false;

  showSubscriptionModal = false;
  selectedSubscriptionId: string | null = null;
  selectedWebOrderId: string | null = null;

  showInvoiceModal = false;
  selectedTransactionNumber: string | null = null;
  selectedInvoiceOrderId: string | null = null;

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

  orderID: string = '91742826';

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

  displayedColumnsSubscriptionModal: string[] = [
    // 'Subscription_ID',
    // 'WebOrder',
    'Web_Order_Line_ID',
    // 'SKU',
    'SKU_Description',
    'Charge_Type',
    'Quantity',
    'Duration',
    'Line_Amount',
    'Bill_Line_Reference',
    'Billing_Frequency',
    'USP_(USD)',
    'Pricing_Term',
    'Charge_Cycle',
    // 'Charge_Cycle_End_Date',
    'Bill_Number',
    'AR_Trxn_Number',
  ];
  dataSourceSubscriptionModal = new MatTableDataSource<any>([
    {
      Subscription_ID: 'Sub1797786',
      WebOrder: '96635062',
      Web_Order_Line_ID: '328252623',
      SKU: 'ETD-ESS-LIC',
      SKU_Description: 'Cisco Email Threat Defense Essential License',
      Charge_Type: 'Recurring',
      Quantity: '125',
      Duration: '12',
      Billing_Frequency: 'Prepaid',
      'USP_(USD)': '12.46',
      Pricing_Term: '12',
      Line_Amount: '1557.49',
      Charge_Cycle: '3/15/2024 - 3/14/2025',
      Charge_Cycle_End_Date: '3/14/2025',
      Bill_Number: '1000728386177',
      Bill_Line_Reference: '3-348272651709527498',
      AR_Trxn_Number: '6102098772',
    },

    {
      Subscription_ID: 'Sub1797786',
      WebOrder: '96635062',
      Web_Order_Line_ID: '328252624',
      SKU: 'SVS-ETD-SUP-E',
      SKU_Description: 'Enhanced Support for Email Threat Defense',
      Charge_Type: 'Recurring',
      Quantity: '1',
      Duration: '12',
      Billing_Frequency: 'Prepaid',
      'USP_(USD)': '23.52',
      Pricing_Term: '1',
      Line_Amount: '282.24',
      Charge_Cycle: '3/15/2024 - 3/14/2025',
      Charge_Cycle_End_Date: '3/14/2025',
      Bill_Number: '1000728386177',
      Bill_Line_Reference: '3-348272651709528010',
      AR_Trxn_Number: '6102098772',
    },

    {
      Subscription_ID: 'Sub1797787',
      WebOrder: '96635062',
      Web_Order_Line_ID: '328252626',
      SKU: 'UMB-DNS-ADV-K9',
      SKU_Description: 'Cisco Umbrella DNS Security Advantage',
      Charge_Type: 'Recurring',
      Quantity: '125',
      Duration: '12',
      Billing_Frequency: 'Prepaid',
      'USP_(USD)': '33.06',
      Pricing_Term: '12',
      Line_Amount: '4132.5',
      Charge_Cycle: '3/15/2024 - 3/14/2025',
      Charge_Cycle_End_Date: '3/14/2025',
      Bill_Number: '1000728386062',
      Bill_Line_Reference: '2-348272651709556380',
      AR_Trxn_Number: '6102098772',
    },

    {
      Subscription_ID: 'Sub1797787',
      WebOrder: '96635062',
      Web_Order_Line_ID: '328252627',
      SKU: 'SVS-UMB-SUP-E',
      SKU_Description: 'Enhanced Support for Umbrella',
      Charge_Type: 'Recurring',
      Quantity: '1',
      Duration: '12',
      Billing_Frequency: 'Prepaid',
      'USP_(USD)': '51.66',
      Pricing_Term: '1',
      Line_Amount: '619.92',
      Charge_Cycle: '3/15/2024 - 3/14/2025',
      Charge_Cycle_End_Date: '3/14/2025',
      Bill_Number: '1000728386062',
      Bill_Line_Reference: '2-348272651709556124',
      AR_Trxn_Number: '6102098772',
    },
  ]);

  displayedColumnsInvoicePrintStatus: string[] = [
    'Invoice_Delivery_Method',
    'Print_Date',
    // 'Previous_Trx_Num',
    'Print_Status_/_Exception',
    'E-DEL_email_address',
    'SFTP',
    'B2B',
    'SRT_Contact_Email_address',
  ];
  dataSourceInvoicePrintStatus = new MatTableDataSource<any>([
    {
      Invoice_Delivery_Method: 'EDELIV, SFTP, B2B, FTP, Image',
      Print_Date: '15/Mar/24',
      Previous_Trx_Num: 'Completed',
      'Print_Status_/_Exception': 'John@pccoonectionsinc.com',
      'E-DEL_email_address': 'Customer Account Num',
      SFTP: 'TP ID 123',
      B2B: null,
      SRT_Contact_Email_address: null,
    },
  ]);

  displayedColumnsInvoiceStatus: string[] = [
    'eInvoicing_Status/Exception',
    'IRN/UUID',
    'IRN_Date',
    'Previous_IRN_/_UUID',
    'Collector',
    // 'Partner_Name',
    // 'End_Customer',
  ];
  dataSourceInvoiceStatus = new MatTableDataSource<any>([
    {
      'eInvoicing_Status/Exception': 'idk man gimme data',
      'IRN/UUID': 'what is this?',
      IRN_Date: '08/Mar/24',
      'Previous_IRN_/_UUID': 'None',
      Collector: 'US_PARTNER_9',
      Partner_Name: 'Jack Sloop',
      End_Customer: 'Jacks Patisserie',
    },
  ]);

  displayedColumnsInvoiceCash: string[] = [
    'Receipt_Applied',
    'CM_Applied',
    'Write_Off_/_Adjustments',
  ];
  dataSourceInvoiceCash = new MatTableDataSource<any>([
    {
      Transaction_Number: '6102098772',
      Invoice_Type: 'Subscription',
      Web_Order_ID: '96635062',
      Purchase_Order: '2598271',
      Bill_To_Id: '413587662',
      Bill_Number: '1000728386177 , 1000728386062',
      Invoice_Status: 'Invoiced',
      TRX_Number: '6102098772',
      Currency: 'USD',
      Transaction_Class: 'INV',
      Transaction_Date: '15/Mar/24',
      Due_Date: '14/Apr/24',
      TRX_Status: 'Closed',
      Amount_Due_Original: '6592.15',
      Amount_Due_Remaining: '0',
      Receipt_Applied: 'WIRE1234',
      CM_Applied: 'CM123',
      'Write_Off_/_Adjustments': 'Adjustment Id 123',
    },
  ]);

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

        this.orderSummaryDataSource = new MatTableDataSource(
          data.filter((data) => data.WEB_ORDER_ID === this.orderID)
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

    this.getO2cConnector();
  }

  getO2cConnector() {
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
    this.selectedWebOrderId = this.orderID;
    this.showSubscriptionModal = true;
  }

  openInvoiceModal(transactionNumber: string): void {
    this.selectedTransactionNumber = transactionNumber;
    this.selectedInvoiceOrderId = this.orderID;
    this.showInvoiceModal = true;
  }
}
