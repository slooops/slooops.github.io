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
    accrual: false,
    accrual2: false,
    invoicing: false,
  };

  circleStatus: { [key: string]: number } = {
    Order: 0,
    Subscription: 0,
    Accruals: 0,
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
    this.expandedSections[section] = !this.expandedSections[section];
    // Update the corresponding circle status based on the section
    switch (section) {
      case 'order':
        this.circleStatus['Order'] = this.expandedSections[section] ? 1 : 0;
        break;
      case 'subscription':
        this.circleStatus['Subscription'] = this.expandedSections[section]
          ? 1
          : 0;
        break;
      case 'accrual':
        this.circleStatus['Accruals'] = this.expandedSections[section] ? 1 : 0;
        break;
      case 'invoicing':
        this.circleStatus['Invoicing'] = this.expandedSections[section] ? 1 : 0;
        break;
    }
  }

  displayedColumnsOrder: string[] = [
    'Deal_ID',
    'WebOrder_ID',
    'Order_Creation_Date',
    'Order_Status',
    'Purchase_Order_Num',
    'Order_Total',
    'Price_list',
    'Offer_Name',
    'Created_By',
    'Partner_Name',
    'Billing_ID',
    'End_Customer_Name',
    'Reseller',
    'Address_Details_Bill-To',
    'Address_Details_End_Customer',
    'Order_Origin',
    'Order_Booked_Date',
    'Hybrid_Order',
    'Route_to_Market',
    'Order_Holds',
    'Cloud_Sub_Order__Holds',
  ];
  displayedColumnsOrderDetails: string[] = [
    'ATO_NAME',
    'SubRefId',
    'Subscription_Status',
    'Line_Ref_Number',
    'Prev_Ln_Ref_Number',
    'OPL_LineId',
    'Ordered_Item',
    'Subscription_TCV',
    'Item_Type_Code',
    'Flow_Status_Code',
    'Order_Additional_Info',
  ];

  displayedColumnsSubscription: string[] = [
    'Subscription_ID',
    'Subscription_Status',
    'WO_Number',
    'Billing_Preference',
    'Sub_Source',
    'Currency_Code',
    'Subscription_Start_Date',
    'Subscription_End_Date',
    'Billing_Model',
    'AutoRenewal',
    'Billing_Info',
    'Bill_Total',
    'Early_Renewal',
    'Trial',
    'Invoice_Status',
    'Accrual_Eligibility',
    'SubCode',
    'TSV_Published',
    'Accrual_ID',
    'Billing_Schedule',
  ];
  displayedColumnsSubscriptionDetails: string[] = [
    'WebOrder',
    'WebOrderLineId',
    'SKU',
    'SKU_Description',
    'Bill_Number',
    'Bill_LineReference',
    'Charge_Type',
    'Subscription_ID',
    'QTY',
    'Duration',
    'Rate_Price',
    'Pricing_Term',
    'PA_Discount',
    'Line_Amount',
    'Charge_Cycle_Start_Date',
    'Charge_Cycle_End_Date',
    'Subscription_Number',
    'Trxn_Number',
  ];

  displayedColumnsAccrual: string[] = [
    'Accrual_ID',
    'WebOrder_ID',
    'Subscription_Id',
    'Billing_ID',
    'BDOM',
    'SubCode',
    'Term_Start_Date',
    'Term_End_Date',
    'Subscription_Start_Date',
  ];
  displayedColumnsAccrualDetails: string[] = [
    'Line_Ref_Number',
    'Ordered_Item',
    'Charge_Type',
    'Term_St_Date',
    'Term_End_Date',
    'Currency',
    'Amount',
    'Status',
    'TSV_Created',
    'TSV_Reversal',
    'Amount_Posted_to_GL',
    'Account_Posted_to',
    'Total_Revenue',
    'Recognized_Revenue',
    'Accrued_Revenue',
  ];

  displayedColumnsInvoicing: string[] = [
    'Invoice_Type',
    'Web_Order_ID',
    'Purchase_Order_Number',
    'Bill_To_Id',
    'Bill_Number',
    'Bill_Status',
    'TRX_Number',
    'Currency',
    'TRX_Class',
    'TRX_Date',
    'Due_Date',
    'TRX_Status',
    'Amount_Due_Orginal',
    'Amount_Due_Remaining',
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
    'QTY',
    'Unit_selling_Price',
    'Line_Amount',
    'Tax_Amount',
  ];
  displayedColumnsInvoicingDetails2: string[] = [
    'Subscription_ID',
    'Charge_Cycle_Start_Date',
    'Charge_Cycle_End_Date',
    'Contract_Start_Date',
    'Contract_End_Date',
    'Bill_Number',
    'Bill_Line_Number',
    'Previous_Bill_Number',
    'Previous_Bill_Line_Number',
    'Tax_Code',
    'Tax_Rate',
    'Tax_Amount',
    'Amount_Posted_to_GL',
    'Account_Posted_To',
    'Total_Revenue',
    'Recognized_Revenue',
    'Accrued_Revenue',
  ];

  dataSourceOrder = new MatTableDataSource<any>([
    {
      Deal_ID: '75947116',
      WebOrder_ID: '96635062',
      Order_Creation_Date: '15-Mar-2024',
      Order_Status: 'Activation Complete',
      Purchase_Order_Num: '2598271',
      Order_Total: 'USD 6,592.16',
      Price_list: 'Global Price List US Availability USD',
      Offer_Name: 'CMD_SECURITY , UMBRELLA',
      Created_By: 'Richard Niven on 15-Mar-2024',
      Partner_Name: 'PC CONNECTION INC',
      Billing_ID: '413587662',
      End_Customer_Name: 'GENEVA SUPPLY INC',
      Reseller: 'NA',
      'Address_Details_Bill-To':
        'DBA CONNECTION, 730 MILFORD ROAD, MS 333, HILLSBOROUGH, MERRIMACK, NH, 03054, United States',
      Address_Details_End_Customer:
        '1501 E WISCONSIN ST, UNIT 1, WALWORTH, DELAVAN, WI, 53115, United States',
      Order_Origin: 'CCW-Q2O',
      Order_Booked_Date: null,
      Hybrid_Order: 'N',
      Route_to_Market: 'PARTNER',
      Order_Holds: null,
      Cloud_Sub_Order__Holds: null,
    },
  ]);
  dataSourceOrderDetails = new MatTableDataSource<any>([
    {
      ATO_NAME: 'ETD-SEC-SUB',
      SubRefId: 'Sub1797786',
      Subscription_Status: 'Active',
      Line_Ref_Number: '328252622',
      Prev_Ln_Ref_Number: null,
      OPL_LineId: '2114407481',
      Ordered_Item: 'ETD-SEC-SUB',
      Subscription_TCV: '153.31',
      Item_Type_Code: 'MAJOR',
      Flow_Status_Code: 'CLOSED',
      Order_Additional_Info: 'Link to commerce for order line',
    },
    {
      ATO_NAME: 'UMB-SEC-SUB',
      SubRefId: 'Sub1797787',
      Subscription_Status: 'Active',
      Line_Ref_Number: '328252625',
      Prev_Ln_Ref_Number: null,
      OPL_LineId: '2114407481',
      Ordered_Item: 'UMB-SEC-SUB',
      Subscription_TCV: '396.03',
      Item_Type_Code: 'MAJOR',
      Flow_Status_Code: 'CLOSED',
      Order_Additional_Info: 'Link to commerce for order line',
    },
  ]);

  dataSourceSubscription = new MatTableDataSource<any>([
    {
      Subscription_ID: 'Sub1797786',
      Subscription_Status: 'Active',
      WO_Number: '96635062',
      Billing_Preference: 'BDOM -1',
      Sub_Source: 'BRIM',
      Currency_Code: 'USD',
      Subscription_Start_Date: '3/15/2024',
      Subscription_End_Date: '3/14/2025',
      Billing_Model: 'Prepaid Term',
      AutoRenewal: 'No',
      Billing_Info: '24-Jun',
      Bill_Total: '1893.73',
      Early_Renewal: 'No',
      Trial: 'No',
      Invoice_Status: 'Staged/Invoiced/Error',
      Accrual_Eligibility: 'Y',
      SubCode: 'Subcode123',
      TSV_Published: 'Y',
      Accrual_ID: '4910695',
      Billing_Schedule: '1/1',
    },
  ]);
  dataSourceSubscriptionDetails = new MatTableDataSource<any>([
    {
      WebOrder: '96635062',
      WebOrderLineId: '328252623',
      SKU: 'ETD-ESS-LIC',
      SKU_Description: 'Cisco Email Threat Defense Essential License',
      Bill_Number: '1000728386177',
      Bill_LineReference: '1000728386177-3-348272651709527498',
      Charge_Type: 'Recurring',
      Subscription_ID: 'Sub1797786',
      QTY: '125',
      Duration: '12',
      Rate_Price: '12.46',
      Pricing_Term: '12',
      PA_Discount: '0',
      Line_Amount: '1557.49',
      Charge_Cycle_Start_Date: '3/15/2024',
      Charge_Cycle_End_Date: '3/14/2025',
      Subscription_Number: 'SubC2106419',
      Trxn_Number: '6102098772',
    },
    {
      WebOrder: '96635062',
      WebOrderLineId: '328252624',
      SKU: 'SVS-ETD-SUP-E',
      SKU_Description: 'Enhanced Support for Email Threat Defense',
      Bill_Number: '1000728386177',
      Bill_LineReference: '1000728386177-3-348272651709528010',
      Charge_Type: 'Recurring',
      Subscription_ID: 'Sub1797786',
      QTY: '1',
      Duration: '12',
      Rate_Price: '23.52',
      Pricing_Term: '1',
      PA_Discount: '0',
      Line_Amount: '282.24',
      Charge_Cycle_Start_Date: '3/15/2024',
      Charge_Cycle_End_Date: '3/14/2025',
      Subscription_Number: 'SubC2106419',
      Trxn_Number: '6102098772',
    },
  ]);

  dataSourceAccrual = new MatTableDataSource<any>([
    {
      Accrual_ID: '4910686',
      WebOrder_ID: '96635062',
      Subscription_Id: 'Sub1797787',
      Billing_ID: '413587662',
      BDOM: '15',
      SubCode: 'SubC2106420',
      Term_Start_Date: '3/15/2024',
      Term_End_Date: '3/14/2027',
      Subscription_Start_Date: '3/15/2024',
    },
  ]);
  dataSourceAccrual2 = new MatTableDataSource<any>([
    {
      Accrual_ID: '4910695',
      WebOrder_ID: '96635062',
      Subscription_Id: 'Sub1797786',
      Billing_ID: '413587662',
      BDOM: '15',
      SubCode: 'SubC2106419',
      Term_Start_Date: '3/15/2024',
      Term_End_Date: '3/14/2027',
      Subscription_Start_Date: '3/15/2024',
    },
  ]);

  dataSourceAccrualDetails = new MatTableDataSource<any>([
    {
      Line_Ref_Number: '328252626',
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
    {
      Line_Ref_Number: '328252627',
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
      Line_Ref_Number: '328252623',
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
    {
      Line_Ref_Number: '328252624',
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
      Invoice_Type: 'Subscription',
      Web_Order_ID: '96635062',
      Purchase_Order_Number: '2598271',
      Bill_To_Id: '413587662',
      Bill_Number: '1000728386177 , 1000728386062',
      Bill_Status: 'Invoiced',
      TRX_Number: '6102098772',
      Currency: 'USD',
      TRX_Class: 'INV',
      TRX_Date: '15/Mar/24',
      Due_Date: '14/Apr/24',
      TRX_Status: 'Closed',
      Amount_Due_Orginal: '6592.15',
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
      'Print_Status_/_Exception': 'n123@cisco.com, sh123@cisco.com',
      'E-DEL_email_address': 'Customer Account Num',
      SFTP: 'TP ID 123',
      B2B: null,
      SRT_Contact_Email_address: null,
    },
  ]);

  dataSourceInvoicing3 = new MatTableDataSource<any>([
    {
      'eInvoicing_Status/Exception': 'US_PARTNER_9',
      'IRN/UUID': null,
      IRN_Date: null,
      'Previous_IRN_/_UUID': null,
      Collector: null,
      Partner_Name: null,
      End_Customer: null,
    },
  ]);
  dataSourceInvoicingDetails = new MatTableDataSource<any>([
    {
      Trx_Line_Number: '1',
      SKU: 'ETD-ESS-LIC',
      SKU_Description: 'Cisco Email Threat Defense Essential License',
      QTY: '125',
      Unit_selling_Price: '12.45992',
      Line_Amount: '1557.49',
      Tax_Amount: '0',
    },
    {
      Trx_Line_Number: '2',
      SKU: 'SVS-ETD-SUP-E',
      SKU_Description: 'Enhanced Support for Email Threat Defense',
      QTY: '1',
      Unit_selling_Price: '282.24',
      Line_Amount: '282.24',
      Tax_Amount: '0',
    },
    {
      Trx_Line_Number: '3',
      SKU: 'SVS-UMB-SUP-E',
      SKU_Description: 'Enhanced Support for Umbrella',
      QTY: '1',
      Unit_selling_Price: '619.92',
      Line_Amount: '619.92',
      Tax_Amount: '0',
    },
    {
      Trx_Line_Number: '4',
      SKU: 'UMB-DNS-ADV-K9',
      SKU_Description: 'Cisco Umbrella DNS Security Advantage',
      QTY: '125',
      Unit_selling_Price: '33.06',
      Line_Amount: '4132.5',
      Tax_Amount: '0',
    },
  ]);
  dataSourceInvoicingDetails2 = new MatTableDataSource<any>([
    {
      Subscription_ID: 'Sub1797786',
      Charge_Cycle_Start_Date: '15-Mar-24',
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
    {
      Subscription_ID: 'Sub1797786',
      Charge_Cycle_Start_Date: '15-Mar-24',
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
    {
      Subscription_ID: 'Sub1797787',
      Charge_Cycle_Start_Date: '15-Mar-24',
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
    {
      Subscription_ID: 'Sub1797787',
      Charge_Cycle_Start_Date: '15-Mar-24',
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
    WO_Number: '/o2c-order',
    WebOrder_ID: '/o2c-order',
    SubRefId: '/o2c-sub',
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
