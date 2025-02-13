import { Component } from '@angular/core';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import * as XLSX from 'xlsx';
import { Router } from '@angular/router';

@Component({
  selector: 'app-o2c-demo',
  templateUrl: './o2c-demo.component.html',
  styleUrl: './o2c-demo.component.css',
})
export class O2cDemoComponent {
  selectedTable: 'order' | 'sub' | 'accrual' | 'invoice' | null = null; // Track which table is visible
  circleSteps: string[] = [];

  constructor(private router: Router) {}

  displayedColumnsBusinessRules: string[] = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
  ];

  dataSourceBusinessRules = new MatTableDataSource<any>([
    {
      '1': 'Order',
      '2': 'Credit Holds Released, Order Not Booked',
      '3': 'RSD passed, Order Not Booked',
      '4': 'Order Booked, RSD passed, Fulfillment Incomplete',
      '5': 'Contract creation past due',
      '6': 'Fulfillment Complete, Pending Sub. Activation\nSub2101012 & Sub2102723',
      '7': 'TCV != Booked Amount\nNumber Of Orders :\nOrder Value in USD :',
      '8': 'Activation Complete, Pending FOE (Final Order Fulfillment)',
    },
    {
      '1': 'Sub',
      '2': 'Order Requested  \nStart Date and End Date is Diff Vs Sub. Term St and Term End Date',
      '3': 'Billing Model Vs Billing Schedules (1, 12, 24, 36)',
      '4': 'Bill Not Generated on BDOM/SSD',
      '5': 'End Of Term Cancellation DeProvisioning InComplete (Orderless Transaction)',
      '6': '',
      '7': '',
      '8': '',
    },
    {
      '1': 'Accrual',
      '2': 'BRIM/BRM TSV Payload Generated Y/N',
      '3': 'Accrual Eligible Vs Accrual lines created',
      '4': 'Posted Y/N',
      '5': 'Accrual Eligible / Accrual Posted account/value',
      '6': 'Post Invoice Reversal Validation',
      '7': '',
      '8': '',
    },
    {
      '1': 'Invoicing',
      '2': 'Bill line Amount to Inv Line Amount',
      '3': 'Total Billing Amount to Invoice Amount',
      '4': 'Installment line amount Split = Line Amount',
      '5': 'Tax Category, Tax Code, Tax Rate, eService/eInvoice',
      '6': 'BillTo and Country compliance Validation',
      '7': 'Print Validation (B2B, SFTP, CCW, Remittance)',
      '8': 'Back update to BRM/BRIM',
    },
    {
      '1': 'AR Accounting',
      '2': 'Accounting Rule on SKU and Transaction is not same',
      '3': 'Suspense Account Transaction Exceptions',
      '4': 'GL Transfer Exceptions',
      '5': 'GL Posting Warning',
      '6': 'GL Transfer Transferred to Posted by Batch',
      '7': '',
      '8': '',
    },
  ]);

  displayedColumnsOrders: string[] = [
    'Deal_ID',
    'Purchase_Order_Num',

    'Operating_Unit',
    'WebOrder_ID',
    'Order_Creation_Date',

    // 'Sales_Order',
    'Order_Status',
    'Order_Total',
    // 'Price_list',
    'Billing_ID',
    'Partner_Name',
    'Order_Origin',
    'Order_Booked_Date',
    'Hybrid_Order',
    'Route_to_Market',
    'Order_Holds',
    'Cloud_Sub_Order__Holds',
  ];

  dataSourceOrders = new MatTableDataSource<any>([
    // {
    //   Operating_Unit: 'CISCO US OPERATING UNIT',
    //   WebOrder_ID: '96635062',
    //   Sales_Order: '2598271',
    //   Order_Creation_Date: '15-Mar-2024',
    //   Order_Status: 'Activation Complete',
    //   Purchase_Order_Num: '2598271',
    //   Deal_ID: '75947116',
    //   Order_Total: 'USD 6,592.16',
    //   Price_list: 'Global Price List USD',
    //   Billing_ID: '413587662',
    //   Partner_Name: 'IngramMicro',
    //   Order_Origin: 'CCW-Q2O',
    //   Order_Booked_Date: '18-Mar-2024',
    //   Hybrid_Order: 'N',
    //   Route_to_Market: 'PARTNER',
    //   Order_Holds: 'None',
    //   Cloud_Sub_Order__Holds: 'Hold Reason1',
    // },
    {
      Operating_Unit: 'CISCO US OPERATING UNIT',
      WebOrder_ID: '96635063',
      Sales_Order: '2598271',
      Order_Creation_Date: '15-Mar-2024',
      Order_Status: 'Activation Complete',
      Purchase_Order_Num: '2598271',
      Deal_ID: '75947116',
      Order_Total: 'USD 6,592.16',
      Price_list: 'Global Price List USD',
      Billing_ID: '413587662',
      Partner_Name: 'IngramMicro',
      Order_Origin: 'CCW-Q2O',
      Order_Booked_Date: '18-Mar-2025',
      Hybrid_Order: 'N',
      Route_to_Market: 'PARTNER',
      Order_Holds: 'None',
      Cloud_Sub_Order__Holds: 'Hold Reason2',
    },
    {
      Operating_Unit: 'CISCO US OPERATING UNIT',
      WebOrder_ID: '96635064',
      Sales_Order: '2598271',
      Order_Creation_Date: '15-Mar-2024',
      Order_Status: 'Activation Complete',
      Purchase_Order_Num: '2598271',
      Deal_ID: '75947116',
      Order_Total: 'USD 6,592.16',
      Price_list: 'Global Price List USD',
      Billing_ID: '413587662',
      Partner_Name: 'IngramMicro',
      Order_Origin: 'CCW-Q2O',
      Order_Booked_Date: '18-Mar-2026',
      Hybrid_Order: 'N',
      Route_to_Market: 'PARTNER',
      Order_Holds: 'None',
      Cloud_Sub_Order__Holds: 'Hold Reason3',
    },
    {
      Operating_Unit: 'CISCO US OPERATING UNIT',
      WebOrder_ID: '96635065',
      Sales_Order: '2598271',
      Order_Creation_Date: '15-Mar-2024',
      Order_Status: 'Activation Complete',
      Purchase_Order_Num: '2598271',
      Deal_ID: '75947116',
      Order_Total: 'USD 6,592.16',
      Price_list: 'Global Price List USD',
      Billing_ID: '413587662',
      Partner_Name: 'IngramMicro',
      Order_Origin: 'CCW-Q2O',
      Order_Booked_Date: '18-Mar-2027',
      Hybrid_Order: 'N',
      Route_to_Market: 'PARTNER',
      Order_Holds: 'None',
      Cloud_Sub_Order__Holds: 'Hold Reason4',
    },
    {
      Operating_Unit: 'CISCO US OPERATING UNIT',
      WebOrder_ID: '96635069',
      Sales_Order: '2598271',
      Order_Creation_Date: '15-Mar-2024',
      Order_Status: 'Activation Complete',
      Purchase_Order_Num: '2598271',
      Deal_ID: '75947116',
      Order_Total: 'USD 6,592.16',
      Price_list: 'Global Price List USD',
      Billing_ID: '413587662',
      Partner_Name: 'IngramMicro',
      Order_Origin: 'CCW-Q2O',
      Order_Booked_Date: '18-Mar-2028',
      Hybrid_Order: 'N',
      Route_to_Market: 'PARTNER',
      Order_Holds: 'None',
      Cloud_Sub_Order__Holds: 'Hold Reason5',
    },
  ]);

  displayedColumnsSub: string[] = [
    'Operating_Unit',
    'WebOrder_ID',
    'SubRefId',
    '"Subscription_Creation_Date"',
    'Subscription_Status',
    '"BDOM/SSD"',
    '"Subscription_St_Date_-_End_Date"',
    'TCV',
    'Billing_Model',
    'AutoRenewal',
    'Billing_Info',
    'Order_Origin',
    'Hybrid_Order',
    'Route_to_Market',
  ];

  dataSourceSub = new MatTableDataSource<any>([
    {
      Operating_Unit: 'CISCO US OPERATING UNIT',
      WebOrder_ID: '96635062',
      SubRefId: 'Sub7890',
      Subscription_Creation_Date: '15-Mar-2024',
      Subscription_Status: 'Activation Complete',
      'BDOM/SSD': '2598271',
      'Subscription_St_Date_-_End_Date': '01-Jan-2025 - 31-Dec-2025',
      TCV: 'USD 6,592.16',
      Billing_Model: 'Global Price List USD',
      AutoRenewal: 'N',
      Billing_Info: 'IngramMicro',
      Order_Origin: 'CCW-Q2O',
      Hybrid_Order: 'N',
      Route_to_Market: '1-Tier',
    },
    {
      Operating_Unit: 'CISCO US OPERATING UNIT',
      WebOrder_ID: '96635062',
      SubRefId: 'Sub66889',
      Subscription_Creation_Date: '15-Mar-2024',
      Subscription_Status: 'Activation Complete',
      'BDOM/SSD': '2598271',
      'Subscription_St_Date_-_End_Date': '75947116',
      TCV: 'USD 6,592.16',
      Billing_Model: 'Global Price List USD',
      AutoRenewal: 'N',
      Billing_Info: 'CompuNet',
      Order_Origin: 'CCW-Q2O',
      Hybrid_Order: 'N',
      Route_to_Market: '1-Tier',
    },
    {
      Operating_Unit: 'CISCO US OPERATING UNIT',
      WebOrder_ID: '96635062',
      SubRefId: 'Sub99886',
      Subscription_Creation_Date: '15-Mar-2024',
      Subscription_Status: 'Activation Complete',
      'BDOM/SSD': '2598271',
      'Subscription_St_Date_-_End_Date': '75947116',
      TCV: 'USD 6,592.16',
      Billing_Model: 'Global Price List USD',
      AutoRenewal: 'N',
      Billing_Info: 'British Telecom',
      Order_Origin: 'CCW-Q2O',
      Hybrid_Order: 'N',
      Route_to_Market: 'Disti',
    },
    {
      Operating_Unit: 'CISCO US OPERATING UNIT',
      WebOrder_ID: '96635062',
      SubRefId: 'Sub66668',
      Subscription_Creation_Date: '15-Mar-2024',
      Subscription_Status: 'Activation Complete',
      'BDOM/SSD': '2598271',
      'Subscription_St_Date_-_End_Date': '75947116',
      TCV: 'USD 6,592.16',
      Billing_Model: 'Global Price List USD',
      AutoRenewal: 'Y',
      Billing_Info: 'AT&T',
      Order_Origin: 'CCW-Q2O',
      Hybrid_Order: 'N',
      Route_to_Market: 'Direct',
    },
    {
      Operating_Unit: 'CISCO US OPERATING UNIT',
      WebOrder_ID: '96635062',
      SubRefId: 'Sub99887',
      Subscription_Creation_Date: '15-Mar-2024',
      Subscription_Status: 'Activation Complete',
      'BDOM/SSD': '2598271',
      'Subscription_St_Date_-_End_Date': '75947116',
      TCV: 'USD 6,592.16',
      Billing_Model: 'Global Price List USD',
      AutoRenewal: 'N',
      Billing_Info: 'Zuora',
      Order_Origin: 'CCW-Q2O',
      Hybrid_Order: 'N',
      Route_to_Market: 'CCE-Direct',
    },
  ]);

  displayedColumnsAccruals: string[] = [
    'Line_Ref_Number',
    'Ordered_Item',
    'SUBSKU_ITEM_NAME',
    'Billing_Model',
    'Charge_Type',
    'OA_Flag',
    'LT_Flag',
    'Time_Bound_Cr_Flag',
    'Term_St_Date',
    'Term_End_Date',
    'Currency',
    'Amount',
    'Percentage',
    'Sub_SKU_Amount',
    'Accrual_Status',
    'GL_Posting',
  ];

  dataSourceAccruals = new MatTableDataSource<any>([
    {
      Line_Ref_Number: 'L12234',
      Ordered_Item: 'ETD-SEC-SUB',
      SUBSKU_ITEM_NAME: 'Active',
      Billing_Model: 'PrePaid',
      Charge_Type: 'Recurring',
      OA_Flag: 'N',
      LT_Flag: 'ETD-SEC-SUB',
      Time_Bound_Cr_Flag: '153.31',
      Term_St_Date: '3/15/2024',
      Term_End_Date: '3/14/2027',
      Currency: 'USD',
      Amount: 'I',
      Percentage: 'In Process',
      Sub_SKU_Amount: null,
      Accrual_Status: null,
      GL_Posting: null,
    },
    {
      Line_Ref_Number: 'l255667',
      Ordered_Item: 'UMB-SEC-SUB',
      SUBSKU_ITEM_NAME: 'Filfillment Eligible',
      Billing_Model: 'PrePaid',
      Charge_Type: 'Recurring',
      OA_Flag: 'N',
      LT_Flag: 'UMB-SEC-SUB',
      Time_Bound_Cr_Flag: '396.03',
      Term_St_Date: '3/14/2027',
      Term_End_Date: '3/14/2027',
      Currency: 'USD',
      Amount: 'I',
      Percentage: 'In Process',
      Sub_SKU_Amount: null,
      Accrual_Status: null,
      GL_Posting: null,
    },
    {
      Line_Ref_Number: 'l255669',
      Ordered_Item: 'APPD-SEC-SUB',
      SUBSKU_ITEM_NAME: 'Filfillment Eligible',
      Billing_Model: 'PrePaid',
      Charge_Type: 'Recurring',
      OA_Flag: 'N',
      LT_Flag: 'UMB-SEC-SUB',
      Time_Bound_Cr_Flag: '396.03',
      Term_St_Date: '3/14/2027',
      Term_End_Date: '3/14/2027',
      Currency: 'USD',
      Amount: 'P',
      Percentage: 'Processed',
      Sub_SKU_Amount: null,
      Accrual_Status: null,
      GL_Posting: null,
    },
  ]);

  displayedColumnsInvoice: string[] = [
    'WebOrder_ID',
    'Sub_Ref_Id',
    'Creation_Date',
    'Trxn_Number',
    'Trxn_Date',
    'Trxn_Amount',
    'Print_Status',
    'E-Inv_Status',
    'Exception',
  ];

  dataSourceInvoice = new MatTableDataSource<any>([
    {
      WebOrder_ID: '96635062, 8877990',
      Sub_Ref_Id: 'Sub123, sub879',
      Creation_Date: '15-Mar-2024',
      Trxn_Number: '67889',
      Trxn_Date: '15-Mar-2024',
      Trxn_Amount: '10000',
      Print_Status: 'Pending',
      'E-Inv_Status': 'Failed',
      Exception: '500 - Exception IRP error',
    },
    {
      WebOrder_ID: '96635063',
      Sub_Ref_Id: 'Sub345',
      Creation_Date: '15-Mar-2024',
      Trxn_Number: '99887',
      Trxn_Date: '15-Mar-2024',
      Trxn_Amount: '10000',
      Print_Status: 'E-Del Exception',
      'E-Inv_Status': 'Completed',
      Exception: 'E-Del email setup missing',
    },
  ]);

  ngOnInit() {
    this.circleSteps = Object.keys(this.circleStatus);
  }

  toggleTable(rowType: string) {
    if (rowType === 'Sub') {
      this.selectedTable = 'sub';
      this.circleStatus = {
        Order: 2, // Completed
        Subscription: 1, // Current step
        Accruals: 0,
        Invoicing: 0,
        AR_Accounting: 0,
      };
    } else if (rowType === 'Order') {
      this.selectedTable = 'order';
      this.circleStatus = {
        Order: 1, // Current step
        Subscription: 0,
        Accruals: 0,
        Invoicing: 0,
        AR_Accounting: 0,
      };
    } else if (rowType === 'Accrual') {
      this.selectedTable = 'accrual';
      this.circleStatus = {
        Order: 2, // Completed
        Subscription: 2, // Completed
        Accruals: 1, // Current step
        Invoicing: 0,
        AR_Accounting: 0,
      };
    } else if (rowType === 'Invoicing') {
      this.selectedTable = 'invoice';
      this.circleStatus = {
        Order: 2, // Completed
        Subscription: 2, // Completed
        Accruals: 2, // Completed
        Invoicing: 1, // Current step
        AR_Accounting: 0,
      };
    }
  }

  goToO2cDetails(row: any) {
    this.router.navigate(['/o2c-details'], {
      queryParams: { orderId: row.WebOrder_ID },
    });
    console.log('Navigating to O2C details for order ID:', row.WebOrder_ID);
  }

  goToO2cOrder(row: any) {
    this.router.navigate(['/o2c-order'], {
      queryParams: {
        orderId: row.WebOrder_ID,
        purchaseOrderNum: row.Purchase_Order_Num,
      },
    });
    console.log(
      'Navigating to O2C Order Details for Order ID:',
      row.WebOrder_ID,
      'Purchase Order:',
      row.Purchase_Order_Num
    );
  }

  goToO2cSub(row: any) {
    this.router.navigate(['/o2c-sub'], {
      queryParams: { subId: row.SubRefId, startDate: row.Start_Date },
    });
    console.log(
      'Navigating to O2C Subscription Details for Sub ID:',
      row.Subscription_ID
    );
  }

  goToO2cAccrual(row: any) {
    this.router.navigate(['/o2c-accrual'], {
      queryParams: { accrualId: row.Accrual_ID, posted: row.Posted_YN },
    });
    console.log(
      'Navigating to O2C Accrual Details for Accrual ID:',
      row.Accrual_ID
    );
  }

  goToO2cInvoicing(row: any) {
    this.router.navigate(['/o2c-invoicing'], {
      queryParams: { invoiceId: row.Invoice_ID, totalAmount: row.Total_Amount },
    });
    console.log(
      'Navigating to O2C Invoicing Details for Invoice ID:',
      row.Invoice_ID
    );
  }

  navigateToStep(step: string) {
    switch (step) {
      case 'Order':
        this.router.navigate(['/o2c-order']);
        console.log('Navigating to O2C Order Page');
        break;

      case 'Subscription':
        this.router.navigate(['/o2c-sub']);
        console.log('Navigating to O2C Subscription Page');
        break;

      case 'Accruals':
        this.router.navigate(['/o2c-accrual']);
        console.log('Navigating to O2C Accruals Page');
        break;

      case 'Invoicing':
        this.router.navigate(['/o2c-invoicing']);
        console.log('Navigating to O2C Invoicing Page');
        break;

      default:
        console.log('No matching route found for:', step);
    }
  }

  onSearch(searchValue: string): void {
    console.log('Search value:', searchValue);
    // Implement your search logic here
  }

  circleStatus: { [key: string]: number } = {
    Order: 1, // Initial state: Order is current
    Subscription: 0,
    Accruals: 0,
    Invoicing: 0,
    AR_Accounting: 0,
  };

  // Helper to determine the class for a circle based on the circleStatus value
  getCircleClass(step: string): string {
    const value = this.circleStatus[step];
    if (value === 2) return 'completed-circle'; // Completed step
    if (value === 1) return 'current-circle'; // Current step
    return 'uncompleted-circle'; // Default for uncompleted steps
  }

  getSliderBarStyle(index: number): { [key: string]: string } {
    const step = this.circleSteps[index];
    const value = this.circleStatus[step];
    return {
      background:
        value === 1
          ? 'linear-gradient(to right, #16371e43, #08ace4, #16371e43)'
          : '#16371e43',
    };
  }

  removeUnderscores(key: string): string {
    return key.replace(/_/g, ' ');
  }

  exportTableToExcel(data: any[], sheetName: string, fileName: string): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = {
      Sheets: { [sheetName]: worksheet },
      SheetNames: [sheetName],
    };
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }
}
