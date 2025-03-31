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
      1: 'Order',
      2: 'Credit Holds Released, Order Not Booked',
      3: 'RSD passed, Order Not Booked',
      4: 'Order Booked, RSD passed, Fullfilment Incomplete',
      5: 'Contract creation past due',
      6: 'Fullfillment Complete , Pending Sub. Activation',
      7: 'TCV != Booked Amount',
      8: 'Activation Complete, Pending Final Order Fullfilment',
    },
    {
      1: 'Sub',
      2: 'Requested  Start Date and End Date Not Matching Sub. Term St and Term End Date',
      3: 'Billing Model Vs Billing Schedues',
      4: 'Bill(s) Not Generated on BDOM/SSD',
      5: 'End Of Term Cancellation DeProvisoining InComplete',
      6: 'Contacts Update not in Sync with CG1',
      7: null,
      8: null,
    },
    {
      1: 'Accrual',
      2: 'Subsciption Activated TSV Payload Not Generated',
      3: 'Accrual Eligible Vs Accrual lines created',
      4: 'Posted Y/N',
      5: 'TSV Eligible Vs TSV Accounted',
      6: 'Post Invoice Generation, TSV Reversal',
      7: null,
      8: null,
    },
    {
      1: 'Invoicing',
      2: 'Bill line Amount Vs Inv Line Amount',
      3: 'Total Billing Amount Vs  Invoice Amount',
      4: 'Bill Line Amount Vs Installat line amount',
      5: 'eService Eligibility Vs  eService Invoice',
      6: 'BillTo and Country compliance  Validation',
      7: 'Print Validation (eInvoie, B2B, SFTP, CCW, Remittance)',
      8: null,
    },
    {
      1: 'AR Accounting',
      2: 'Forward Invoice Vs ReBill Invoice Accounting  Not Matching',
      3: 'GL Transfer Exceptions',
      4: null,
      5: null,
      6: null,
      7: null,
      8: null,
    },
  ]);

  displayedColumnsOrders: string[] = [
    'Deal_ID',
    'WebOrder_ID',
    'Order_Creation_Date',
    'Sub_Ref_Id',
    'Order_Status',
    'Purchase_Order_Num',
    'Order_Total',
    'Price_list',
    'Partner_Name',
    'Billing_ID',
    'Order_Origin',
    'Order_Booked_Date',
    'Hybrid_Order',
    'Route_to_Market',
    'Order_Holds',
    'Cloud_Sub_Order__Holds',
  ];

  dataSourceOrders = new MatTableDataSource<any>([
    {
      Deal_ID: '413587662',
      WebOrder_ID: '96635062',
      Order_Creation_Date: '15-Mar-2024',
      Sub_Ref_Id: 'Sub1797786',
      Order_Status: 'Activation Complete',
      Purchase_Order_Num: '2598271',
      Order_Total: 'USD 6,592.16',
      Price_list: 'Global Price List USD',
      Partner_Name: 'IngramMicro',
      Billing_ID: '413587662',
      Order_Origin: 'CCW-Q2O',
      Order_Booked_Date: '15-Mar-2024',
      Hybrid_Order: 'N',
      Route_to_Market: 'PARTNER',
      Order_Holds: 'Hold1',
      Cloud_Sub_Order__Holds: 'Hold Reason1',
    },
    {
      Deal_ID: '413587662',
      WebOrder_ID: '96635063',
      Order_Creation_Date: '15-Mar-2024',
      Sub_Ref_Id: 'Sub1797787',
      Order_Status: 'Activation Complete',
      Purchase_Order_Num: '2598271',
      Order_Total: 'USD 6,592.16',
      Price_list: 'Global Price List USD',
      Partner_Name: 'IngramMicro',
      Billing_ID: '413587662',
      Order_Origin: 'CCW-Q2O',
      Order_Booked_Date: '15-Mar-2024',
      Hybrid_Order: 'N',
      Route_to_Market: 'PARTNER',
      Order_Holds: 'Hold2',
      Cloud_Sub_Order__Holds: 'Hold Reason2',
    },
  ]);

  displayedColumnsSub: string[] = [
    'WebOrder_ID',
    'Sub_Ref_Id',
    'Activation_Date',
    'Billing_Prefence',
    'Bill_Day',
    'BID_(Bill_To_Id)',
    'Sub_Start_Date',
    'Sub_End__Date',
    'Sub_Status',
    'Billing_Source',
    'Billing_Model',
    'Billing_Scheduled_Not_billed',
  ];

  dataSourceSub = new MatTableDataSource<any>([
    {
      WebOrder_ID: '96635062',
      Sub_Ref_Id: 'Sub1797786',
      Activation_Date: '15-Mar-2024',
      Billing_Prefence: 'BDOM',
      Bill_Day: '3',
      'BID_(Bill_To_Id)': '413587662',
      Sub_Start_Date: '15-Mar-24',
      Sub_End__Date: '14-Mar-24',
      Sub_Status: 'Acive',
      Billing_Source: 'BRM',
      Billing_Model: 'Monthly',
      Billing_Scheduled_Not_billed: 'Schedule #',
    },
    {
      WebOrder_ID: '96635063',
      Sub_Ref_Id: 'Sub1797787',
      Activation_Date: '15-Mar-2024',
      Billing_Prefence: 'SSD',
      Bill_Day: '15',
      'BID_(Bill_To_Id)': '413587662',
      Sub_Start_Date: '15-Mar-24',
      Sub_End__Date: '14-Mar-27',
      Sub_Status: 'Acive',
      Billing_Source: 'BRIM',
      Billing_Model: 'Annual',
      Billing_Scheduled_Not_billed: 'Schedule #',
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
    // this.router.navigate(['/o2c-order'], {
    //   queryParams: {
    //     orderId: row.WebOrder_ID,
    //     purchaseOrderNum: row.Purchase_Order_Num,
    //   },
    // });
    // console.log(
    //   'Navigating to O2C Order Details for Order ID:',
    //   row.WebOrder_ID,
    //   'Purchase Order:',
    //   row.Purchase_Order_Num
    // );
    this.router.navigate(['/o2c-overview']);
  }

  goToO2cSub(row: any) {
    // this.router.navigate(['/o2c-sub'], {
    //   queryParams: { subId: row.SubRefId, startDate: row.Start_Date },
    // });
    // console.log(
    //   'Navigating to O2C Subscription Details for Sub ID:',
    //   row.Subscription_ID
    // );
    this.router.navigate(['/o2c-overview']);
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

  goToO2cOverview() {
    this.router.navigate(['/o2c-overview']);
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
