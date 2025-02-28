import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

@Component({
  selector: 'app-o2c-overview',
  templateUrl: './o2c-overview.component.html',
  styleUrls: ['./o2c-overview.component.css'],
  animations: [
    trigger('expandCollapse', [
      state(
        'collapsed',
        style({
          height: '0px',
          opacity: 0,
          overflow: 'hidden',
        })
      ),
      state(
        'expanded',
        style({
          height: '*',
          opacity: 1,
          overflow: 'hidden',
        })
      ),
      transition('collapsed <=> expanded', animate('300ms ease')),
    ]),
  ],
})
export class O2cOverviewComponent {
  expandedSections: { [key: string]: boolean } = {
    order: false,
    subscription: false,
    subscription2: false,
    accrual: false,
    accrual2: false,
    invoicing: false,
  };

  circleStatus: { [key: string]: number } = {
    Order: 0,
    Subscription: 0,
    // Accruals: 0,
    Invoicing: 0,
  };

  showMoreSummary = false;
  showMoreDetails = false;

  toggleShowMoreSummary(): void {
    this.showMoreSummary = !this.showMoreSummary;
  }

  // Toggle additional detail tables
  toggleShowMoreDetails(): void {
    this.showMoreDetails = !this.showMoreDetails;
  }

  toggleSection(section: string): void {
    // Toggle section visibility
    this.expandedSections[section] = !this.expandedSections[section];

    // Update the corresponding circle status based on the section
    if (section.startsWith('subscription')) {
      this.circleStatus['Subscription'] = this.expandedSections[section]
        ? 1
        : 0;
    } else if (section.startsWith('accrual')) {
      this.circleStatus['Accruals'] = this.expandedSections[section] ? 1 : 0;
    } else if (section === 'order') {
      this.circleStatus['Order'] = this.expandedSections[section] ? 1 : 0;
    } else if (section === 'invoicing') {
      this.circleStatus['Invoicing'] = this.expandedSections[section] ? 1 : 0;
    }

    // Handle special cases for summary/details expansion
    if (section === 'summary') {
      this.showMoreSummary = !this.showMoreSummary;
    } else if (section === 'details') {
      this.showMoreDetails = !this.showMoreDetails;
    }
  }

  displayedColumnsOrder: string[] = [
    'Deal_ID',
    'Web_Order_ID',
    'Creation_Date',
    'Order_Status',
    'Booked_Date',

    'Purchase_Order',
    'Order_Total',
    // 'Price_list',
    'Offer_Name',
    // 'Created_By',
    // 'Partner_Name/Disti',
    // 'Billing_ID',
    // 'End_Customer_Name',
    // 'Reseller',
    // 'Bill-To',
    // 'Address_Details_End_Customer',
    // 'Order_Origin',
    // 'Hybrid_Order',
    // 'Route_to_Market',
    // 'Order_Holds',
    // 'Cloud_Sub_Order__Holds',
    // 'Order_Additional_Info',
  ];
  displayedColumnsOrder2: string[] = [
    // 'Deal_ID',
    // 'Web_Order_ID',
    // 'Creation_Date',
    // 'Order_Status',
    // 'Purchase_Order',
    // 'Order_Total',
    // 'Price_list',
    // 'Offer_Name',
    // 'Created_By',
    'Billing_ID',
    'Bill-To',
    'End_Customer',
    // 'Reseller',
    // 'Address_Details_End_Customer',
    // 'Booked_Date',
    'Hybrid_Order',
    'Route_to_Market',
    'Partner_Name/Disti',
    'Order_Origin',

    // 'Order_Holds',
    // 'Cloud_Sub_Order__Holds',
    // 'Order_Additional_Info',
  ];
  displayedColumnsOrderDetails: string[] = [
    'ATO_Name',
    'Order_Line_Number',
    'Order_Status',

    'Subscription_ID',
    'Subscription_TCV',

    'Subscription_Status',
    // 'Prev_Ln_Ref_Number',
    // 'OPL_LineId',
    // 'Ordered_Item',

    // 'Item_Type_Code',
    // 'Order_Additional_Info',
  ];

  displayedColumnsSubscription: string[] = [
    // 'Subscription_ID',
    'SubCode',
    'Effective_For',

    'Subscription_Status',
    // 'Web_Order_ID',
    'Billing_Preference',
    // 'Start_Date',
    // 'End_Date',
    // 'Billing_Model',
    'Billing_Frequency',
    'Billing_Schedule',
    'Bill_Number',

    // 'Billing_Info',
    // 'Bill_Total',
    'Invoice_Status',
    // 'Accrual_ID',
  ];
  displayedColumnsSubscriptionDetails: string[] = [
    // 'Subscription_ID',
    // 'WebOrder',
    'Web_Order_Line_ID',
    'SKU',
    'Charge_Type',

    // 'SKU_Description',
    // 'Charge_Type',
    'Quantity',
    'Duration',
    // 'Billing_Frequency',
    'USP_(USD)',
    'Pricing_Term',
    'Line_Amount',
    // 'Charge_Cycle',
    // 'Charge_Cycle_End_Date',
    // 'Bill_Number',
    'Bill_Line_Reference',
    // 'AR_Trxn_Number',
  ];

  displayedColumnsAccrual: string[] = [
    'Accrual_ID',
    'Web_Order_ID',
    'Subscription_Id',
    'Billing_ID',
    'BDOM',
    'SubCode',
    'Term_Start_Date',
    'Term_End_Date',
    'Start_Date',
  ];
  displayedColumnsAccrualDetails: string[] = [
    'Charge_Cycle',
    // 'Charge_Cycle_End_Date',
    // 'Order_Line_Number',
    // 'Ordered_Item',
    // 'Charge_Type',
    // 'Term_St_Date',
    // 'Term_End_Date',
    // 'Currency',
    // 'Amount',
    // 'Status',
    'TSV_Created',
    'TSV_Reversal',
    'Total_Revenue',
    'Recognized_Revenue',
    'Deferred Revenue',

    // 'Amount_Posted_to_GL',
    // 'Account_Posted_to',
    // 'Accrued_Revenue',
  ];

  displayedColumnsInvoicing: string[] = [
    'Transaction_Number',
    'Transaction_Class',
    'Invoice_Status',
    'Transaction_Date',
    'Due_Date',
    'TRX_Status',
    'Amount_Due_Original',
    'Amount_Due_Remaining',

    // 'Invoice_Type',
    // 'Web_Order_ID',
    // 'Purchase_Order',
    // 'Bill_To_Id',
    'Bill_Number',
    // 'TRX_Number',
    // 'Currency',
    // 'Receipt_Applied',
    // 'CM_Applied',
    // 'Write_Off_/_Adjustments',
  ];
  displayedColumnsInvoicing1: string[] = [
    // 'Invoice_Type',
    // 'Web_Order_ID',
    // 'Purchase_Order',
    // 'Bill_To_Id',
    // 'Bill_Number',
    // 'Invoice_Status',
    // 'TRX_Number',
    // 'Currency',
    // 'Transaction_Class',
    // 'Transaction_Date',
    // 'Due_Date',
    // 'TRX_Status',
    // 'Amount_Due_Original',
    // 'Amount_Due_Remaining',
    'Receipt_Applied',
    'CM_Applied',
    'Write_Off_/_Adjustments',
  ];
  displayedColumnsInvoicing2: string[] = [
    'Invoice_Delivery_Method',
    'Print_Date',
    'Previous_Trx_Num',
    'Print_Status_/_Exception',
    'E-DEL_email_address',
    'SFTP',
    'B2B',
    'SRT_Contact_Email_address',
  ];
  displayedColumnsInvoicing3: string[] = [
    'eInvoicing_Status/Exception',
    'IRN/UUID',
    'IRN_Date',
    'Previous_IRN_/_UUID',
    'Collector',
    'Partner_Name',
    'End_Customer',
  ];

  displayedColumnsInvoicingDetails: string[] = [
    'Trx_Line_Number',
    'SKU',
    'SKU_Description',
    'Quantity',
    'Unit_selling_Price',
    'Line_Amount',
    'Tax_Amount',
    'Extended_Line_Amount',
  ];
  displayedColumnsInvoicingDetails2: string[] = [
    'Subscription_ID',
    'Charge_Cycle',
    'Charge_Cycle_End_Date',
    'Contract_Start_Date',
    'Contract_End_Date',
    'Bill_Number',
    'Bill_Line_Number',
    'Previous_Bill_Number',
    // 'Previous_Bill_Line_Number',
    // 'Tax_Code',
    // 'Tax_Rate',
    // 'Tax_Amount',
    // 'Amount_Posted_to_GL',
    // 'Account_Posted_To',
    // 'Total_Revenue',
    // 'Recognized_Revenue',
    // 'Accrued_Revenue',
  ];

  // Data for the tables

  dataSourceOrder = new MatTableDataSource<any>([
    {
      Deal_ID: '75947116',
      Web_Order_ID: '96635062',
      Creation_Date: '15-Mar-2024',
      Order_Status: 'Activation Complete',
      Purchase_Order: '2598271',
      Order_Total: 'USD 6,592.16',
      Price_list: 'Global Price List US Availability USD',
      Offer_Name: 'CMD_SECURITY , UMBRELLA',
      Created_By: 'Richard Niven on 15-Mar-2024',
      'Partner_Name/Disti': 'PC CONNECTION INC',
      Billing_ID: '413587662',
      End_Customer:
        'GENEVA SUPPLY INC, 1501 E WISCONSIN ST, UNIT 1, WALWORTH, DELAVAN, WI, 53115, United States',

      Reseller: 'NA',
      'Bill-To':
        'DBA CONNECTION, 730 MILFORD ROAD, MS 333, HILLSBOROUGH, MERRIMACK, NH, 03054, United States',
      Address_Details_End_Customer:
        '1501 E WISCONSIN ST, UNIT 1, WALWORTH, DELAVAN, WI, 53115, United States',
      Order_Origin: 'CCW-Q2O',
      Booked_Date: null,
      Hybrid_Order: 'N',
      Route_to_Market: 'PARTNER',
      Order_Holds: null,
      Cloud_Sub_Order__Holds: null,
      Order_Additional_Info: 'Link to commerce for order line',
    },
  ]);
  dataSourceOrderDetails = new MatTableDataSource<any>([
    {
      ATO_Name: 'ETD-SEC-SUB',
      Subscription_ID: 'Sub1797786',
      Subscription_Status: 'ACTIVE',
      Order_Line_Number: '328252622',
      Prev_Ln_Ref_Number: null,
      OPL_LineId: '2114407481',
      Ordered_Item: 'ETD-SEC-SUB',
      Subscription_TCV: 'USD 1,839.74',
      Item_Type_Code: 'MAJOR',
      Order_Status: 'CLOSED',
      Order_Additional_Info: 'Link to commerce for order line',
    },
    {
      ATO_Name: 'UMB-SEC-SUB',
      Subscription_ID: 'Sub1797787',
      Subscription_Status: 'ACTIVE',
      Order_Line_Number: '328252625',
      Prev_Ln_Ref_Number: null,
      OPL_LineId: '2114407481',
      Ordered_Item: 'UMB-SEC-SUB',
      Subscription_TCV: 'USD 4,752.42',
      Item_Type_Code: 'MAJOR',
      Order_Status: 'CLOSED',
      Order_Additional_Info: 'Link to commerce for order line',
    },
  ]);

  dataSourceSubscription = new MatTableDataSource<any>([
    {
      Subscription_ID: 'Sub1797786',
      Subscription_Status: 'Active',
      Web_Order_ID: '96635062',
      Billing_Preference: 'SSD 1',
      Effective_For: '3/15/2024-3/14/2025',
      Charge_Type: 'Recurring',

      Start_Date: '3/15/2024',
      End_Date: '3/14/2025',
      Billing_Model: 'Recurring',
      Billing_Info: '"2/3"',
      Bill_Total: 'USD 1893.73',
      Invoice_Status: 'Invoiced',
      SubCode: 'SubC2106419',
      Accrual_ID: '4910695',
      Billing_Schedule: '1/1',
      Bill_Number: '1000728386177',
      Billing_Frequency: 'Prepaid',
    },
  ]);
  dataSourceSubscription2 = new MatTableDataSource<any>([
    {
      Subscription_ID: 'Sub1797787',
      Subscription_Status: 'Active',
      Web_Order_ID: '96635062',
      Billing_Preference: 'SSD 1',
      Effective_For: '3/15/2024-3/14/2025',
      Charge_Type: 'Recurring',

      Start_Date: '3/15/2024',
      End_Date: '3/14/2025',
      Billing_Model: 'Prepaid Term',
      Billing_Info: '"2/3"',
      Bill_Total: 'USD 4752.42',
      Invoice_Status: 'Invoiced',
      SubCode: 'SubC2106420',
      Accrual_ID: '4910686',
      Billing_Schedule: '1/1',
      Bill_Number: '1000728386062',
      Billing_Frequency: 'Prepaid',
    },
  ]);
  dataSourceSubscriptionDetails = new MatTableDataSource<any>([
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
  ]);

  dataSourceSubscriptionDetails1 = new MatTableDataSource<any>([
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
  ]);
  dataSourceSubscriptionDetails2 = new MatTableDataSource<any>([
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
  ]);

  dataSourceSubscriptionDetails3 = new MatTableDataSource<any>([
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

  dataSourceAccrual = new MatTableDataSource<any>([
    {
      Accrual_ID: '4910686',
      Web_Order_ID: '96635062',
      Subscription_Id: 'Sub1797787',
      Billing_ID: '413587662',
      BDOM: '15',
      SubCode: 'SubC2106420',
      Term_Start_Date: '3/15/2024',
      Term_End_Date: '3/14/2027',
      Start_Date: '3/15/2024',
    },
  ]);
  dataSourceAccrual2 = new MatTableDataSource<any>([
    {
      Accrual_ID: '4910695',
      Web_Order_ID: '96635062',
      Subscription_Id: 'Sub1797786',
      Billing_ID: '413587662',
      BDOM: '15',
      SubCode: 'SubC2106419',
      Term_Start_Date: '3/15/2024',
      Term_End_Date: '3/14/2027',
      Start_Date: '3/15/2024',
    },
  ]);

  dataSourceAccrualDetails = new MatTableDataSource<any>([
    {
      Charge_Cycle: '3/15/2024 - 3/14/2025',
      Charge_Cycle_End_Date: '3/14/2025',
      Order_Line_Number: '328252626',
      Ordered_Item: 'UMB-DNS-ADV-K9',
      Charge_Type: 'Recurring',
      Term_St_Date: '3/15/2024',
      Term_End_Date: '3/14/2025',
      Currency: 'USD',
      Amount: '4132.5',
      Status: 'P',
      TSV_Created: 'Y',
      TSV_Reversal: 'Y',
      Amount_Posted_to_GL: null,
      Account_Posted_To: null,
      Total_Revenue: null,
      Recognized_Revenue: null,
      Accrued_Revenue: null,
    },
  ]);
  dataSourceAccrualDetails1 = new MatTableDataSource<any>([
    {
      Charge_Cycle: '3/15/2024 - 3/14/2025',
      Charge_Cycle_End_Date: '3/14/2025',
      Order_Line_Number: '328252627',
      Ordered_Item: 'SVS-UMB-SUP-E',
      Charge_Type: 'Recurring',
      Term_St_Date: '3/15/2024',
      Term_End_Date: '3/14/2025',
      Currency: 'USD',
      Amount: '619.92',
      Status: 'P',
      TSV_Created: 'Y',
      TSV_Reversal: 'Y',
      Amount_Posted_to_GL: null,
      Account_Posted_To: null,
      Total_Revenue: null,
      Recognized_Revenue: null,
      Accrued_Revenue: null,
    },
  ]);

  dataSourceAccrualDetails2 = new MatTableDataSource<any>([
    {
      Charge_Cycle: '3/15/2024 - 3/14/2025',
      Charge_Cycle_End_Date: '3/14/2025',
      Order_Line_Number: '328252623',
      Ordered_Item: 'ETD-ESS-LIC',
      Charge_Type: 'Recurring',
      Term_St_Date: '3/15/2024',
      Term_End_Date: '3/14/2025',
      Currency: 'USD',
      Amount: '1557.49',
      Status: 'P',
      TSV_Created: 'Y',
      TSV_Reversal: 'Y',
      Amount_Posted_to_GL: null,
      Account_Posted_to: null,
      Total_Revenue: null,
      Recognized_Revenue: null,
      Accrued_Revenue: null,
    },
  ]);
  dataSourceAccrualDetails3 = new MatTableDataSource<any>([
    {
      Charge_Cycle: '3/15/2024 - 3/14/2025',
      Charge_Cycle_End_Date: '3/14/2025',
      Order_Line_Number: '328252624',
      Ordered_Item: 'SVS-ETD-SUP-E',
      Charge_Type: 'Recurring',
      Term_St_Date: '3/15/2024',
      Term_End_Date: '3/14/2025',
      Currency: 'USD',
      Amount: '282.24',
      Status: 'P',
      TSV_Created: 'Y',
      TSV_Reversal: 'Y',
      Amount_Posted_to_GL: null,
      Account_Posted_to: null,
      Total_Revenue: null,
      Recognized_Revenue: null,
      Accrued_Revenue: null,
    },
  ]);

  dataSourceInvoicing = new MatTableDataSource<any>([
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

  dataSourceInvoicing2 = new MatTableDataSource<any>([
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

  dataSourceInvoicing3 = new MatTableDataSource<any>([
    {
      'eInvoicing_Status/Exception': null,
      'IRN/UUID': null,
      IRN_Date: null,
      'Previous_IRN_/_UUID': null,
      Collector: 'US_PARTNER_9',
      Partner_Name: null,
      End_Customer: null,
    },
  ]);

  dataSourceInvoicingDetails = new MatTableDataSource<any>([
    {
      Trx_Line_Number: '1',
      SKU: 'ETD-ESS-LIC',
      SKU_Description: 'Cisco Email Threat Defense Essential License',
      Quantity: '125',
      Unit_selling_Price: '12.45992',
      Line_Amount: '1557.49',
      Tax_Amount: '0',
      Extended_Line_Amount: '1557.49',
    },
  ]);
  dataSourceInvoicingDetails1 = new MatTableDataSource<any>([
    {
      Trx_Line_Number: '2',
      SKU: 'SVS-ETD-SUP-E',
      SKU_Description: 'Enhanced Support for Email Threat Defense',
      Quantity: '1',
      Unit_selling_Price: '282.24',
      Line_Amount: '282.24',
      Tax_Amount: '0',
      Extended_Line_Amount: '282.24',
    },
  ]);
  dataSourceInvoicingDetails2 = new MatTableDataSource<any>([
    {
      Trx_Line_Number: '3',
      SKU: 'SVS-UMB-SUP-E',
      SKU_Description: 'Enhanced Support for Umbrella',
      Quantity: '1',
      Unit_selling_Price: '619.92',
      Line_Amount: '619.92',
      Tax_Amount: '0',
      Extended_Line_Amount: '619.92',
    },
  ]);
  dataSourceInvoicingDetails3 = new MatTableDataSource<any>([
    {
      Trx_Line_Number: '4',
      SKU: 'UMB-DNS-ADV-K9',
      SKU_Description: 'Cisco Umbrella DNS Security Advantage',
      Quantity: '125',
      Unit_selling_Price: '33.06',
      Line_Amount: '4132.5',
      Tax_Amount: '0',
      Extended_Line_Amount: '4132.50',
    },
  ]);
  dataSourceInvoicingDetails00 = new MatTableDataSource<any>([
    {
      Subscription_ID: 'Sub1797786',
      Charge_Cycle: '15-Mar-24',
      Charge_Cycle_End_Date: '14-Mar-25',
      Contract_Start_Date: '15-Mar-24',
      Contract_End_Date: '14-Mar-25',
      Bill_Number: '1000728386177',
      Bill_Line_Number: '3-348272651709527498',
      Previous_Bill_Number: null,
      Previous_Bill_Line_Number: null,
      Tax_Code: null,
      Tax_Rate: null,
      Tax_Amount: null,
      Amount_Posted_to_GL: null,
      Account_Posted_To: null,
      Total_Revenue: null,
      Recognized_Revenue: null,
      Accrued_Revenue: null,
    },
  ]);
  dataSourceInvoicingDetails11 = new MatTableDataSource<any>([
    {
      Subscription_ID: 'Sub1797786',
      Charge_Cycle: '15-Mar-24',
      Charge_Cycle_End_Date: '14-Mar-25',
      Contract_Start_Date: '15-Mar-24',
      Contract_End_Date: '14-Mar-25',
      Bill_Number: '1000728386177',
      Bill_Line_Number: '3-348272651709528010',
      Previous_Bill_Number: null,
      Previous_Bill_Line_Number: null,
      Tax_Code: null,
      Tax_Rate: null,
      Tax_Amount: null,
      Amount_Posted_to_GL: null,
      Account_Posted_To: null,
      Total_Revenue: null,
      Recognized_Revenue: null,
      Accrued_Revenue: null,
    },
  ]);

  dataSourceInvoicingDetails22 = new MatTableDataSource<any>([
    {
      Subscription_ID: 'Sub1797787',
      Charge_Cycle: '15-Mar-24',
      Charge_Cycle_End_Date: '14-Mar-25',
      Contract_Start_Date: '15-Mar-24',
      Contract_End_Date: '14-Mar-25',
      Bill_Number: '1000728386062',
      Bill_Line_Number: '2-348272651709556124',
      Previous_Bill_Number: null,
      Previous_Bill_Line_Number: null,
      Tax_Code: null,
      Tax_Rate: null,
      Tax_Amount: null,
      Amount_Posted_to_GL: null,
      Account_Posted_To: null,
      Total_Revenue: null,
      Recognized_Revenue: null,
      Accrued_Revenue: null,
    },
  ]);
  dataSourceInvoicingDetails33 = new MatTableDataSource<any>([
    {
      Subscription_ID: 'Sub1797787',
      Charge_Cycle: '15-Mar-24',
      Charge_Cycle_End_Date: '14-Mar-25',
      Contract_Start_Date: '15-Mar-24',
      Contract_End_Date: '14-Mar-25',
      Bill_Number: '1000728386062',
      Bill_Line_Number: '2-348272651709556380',
      Previous_Bill_Number: null,
      Previous_Bill_Line_Number: null,
      Tax_Code: null,
      Tax_Rate: null,
      Tax_Amount: null,
      Amount_Posted_to_GL: null,
      Account_Posted_To: null,
      Total_Revenue: null,
      Recognized_Revenue: null,
      Accrued_Revenue: null,
    },
  ]);

  navigationMap: { [key: string]: string } = {
    // Table Column-based navigation
    Subscription_ID: 'https://ccrc.cisco.com/subscriptions/detail/Sub1797786',
    Trxn_Number: '/o2c-invoicing',
    // Accrual_ID: '/o2c-accrual',
    Accrual_ID:
      'https://apps.cisco.com/ICW/PDR/ControllerNoAuth/rest/quoting/open?NDc1MTkwMjU1Mg==@NDczOTc3OTkxOA==',
    Web_Order_ID:
      'https://apps.cisco.com/qtc/viewstat/open.order?flow=nextgen&orderId=&coId=27025774&localeChanged=en_US',
    Invoice_ID: '/o2c-invoicing',
    Deal_ID:
      'https://apps.cisco.com/ICW/PDR/ControllerNoAuth/rest/quoting/open?NDc1MTkwMjU1Mg==@NDczOTc3OTkxOA==',
    Order_Additional_Info:
      'https://apps.cisco.com/qtc/viewstat/open.order?flow=nextgen&orderId=&coId=27025774',

    // for cricle nav
    Order: '/o2c-order',
    Subscription: '/o2c-sub',
    Accruals: '/o2c-accrual',
    Invoicing: '/o2c-invoicing',
  };
}
