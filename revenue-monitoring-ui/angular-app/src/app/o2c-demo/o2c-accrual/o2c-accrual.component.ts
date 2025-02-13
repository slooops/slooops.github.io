import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-o2c-accrual',
  templateUrl: './o2c-accrual.component.html',
  styleUrl: './o2c-accrual.component.css',
})
export class O2cAccrualComponent {
  circleStatus: { [key: string]: number } = {
    Order: 2,
    Subscription: 2,
    Accruals: 1,
    Invoicing: 0,
    AR_Accounting: 0,
  };

  circleSteps: string[] = [];

  orderId: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router) {} // ✅ Inject Router properly

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.orderId = params.get('orderId');
      console.log('Received order ID:', this.orderId);
    });
    this.circleSteps = Object.keys(this.circleStatus);
  }

  displayedColumnsSummary: string[] = [
    'Accrual_ID',
    'WebOrder_ID',
    'Subscription_Id',
    'Billing_ID',
    'Billing_Preference',
    'SubCode',
    'Term_Start_Date',
    'Term_End_Date',
    'Subscription_Start_Date',
  ];

  dataSourceSummary = new MatTableDataSource<any>([
    {
      Accrual_ID: '779988',
      WebOrder_ID: '96635062',
      Subscription_Id: 'Sub1797787',
      Billing_ID: '413587662',
      Billing_Preference: '15',
      SubCode: 'Subc88669',
      Term_Start_Date: '3/15/2024',
      Term_End_Date: '3/14/2027',
      Subscription_Start_Date: '3/15/2024',
    },
  ]);

  displayedColumnsLineSummary: string[] = [
    'Line_Ref_Number',
    'Ordered_Item',
    'SUBSKU_ITEM_NAME',
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
    'Status',
    'Source',
    'TSV_Created',
  ];

  dataSourceLineSummary = new MatTableDataSource<any>([
    {
      Line_Ref_Number: 'L12234',
      Ordered_Item: 'ETD-SEC-SUB',
      SUBSKU_ITEM_NAME: 'NA',
      Charge_Type: 'Recurring',
      OA_Flag: 'N',
      LT_Flag: 'ETD-SEC-SUB',
      Time_Bound_Cr_Flag: 'N',
      Term_St_Date: '3/15/2024',
      Term_End_Date: '3/14/2027',
      Currency: 'USD',
      Amount: 'P',
      Percentage: 'BRM/BRIM',
      Sub_SKU_Amount: 'Y',
      Status: null,
      Source: null,
      TSV_Created: null,
    },
    {
      Line_Ref_Number: 'l255667',
      Ordered_Item: 'UMB-SEC-SUB',
      SUBSKU_ITEM_NAME: 'NA',
      Charge_Type: 'Recurring',
      OA_Flag: 'N',
      LT_Flag: 'UMB-SEC-SUB',
      Time_Bound_Cr_Flag: 'N',
      Term_St_Date: '3/14/2027',
      Term_End_Date: '3/14/2027',
      Currency: 'USD',
      Amount: 'P',
      Percentage: 'BRM/BRIM',
      Sub_SKU_Amount: 'Y',
      Status: null,
      Source: null,
      TSV_Created: null,
    },
  ]);

  displayedColumnsGen: string[] = [
    'Line_Ref_Number',
    'Ordered_Item',
    'SUBSKU_ITEM_NAME',
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
    'Status',
    'Source',
    'TSV_Reversal',
  ];

  dataSourceGen = new MatTableDataSource<any>([
    {
      Line_Ref_Number: 'L12234',
      Ordered_Item: 'ETD-SEC-SUB',
      SUBSKU_ITEM_NAME: 'NA',
      Charge_Type: 'Recurring',
      OA_Flag: 'N',
      LT_Flag: 'ETD-SEC-SUB',
      Time_Bound_Cr_Flag: 'N',
      Term_St_Date: '3/15/2024',
      Term_End_Date: '3/14/2027',
      Currency: 'USD',
      Amount: 'P',
      Percentage: 'CG1AR',
      Sub_SKU_Amount: 'Y',
      Status: null,
      Source: null,
      TSV_Reversal: null,
    },
    {
      Line_Ref_Number: 'l255667',
      Ordered_Item: 'UMB-SEC-SUB',
      SUBSKU_ITEM_NAME: 'NA',
      Charge_Type: 'Recurring',
      OA_Flag: 'N',
      LT_Flag: 'UMB-SEC-SUB',
      Time_Bound_Cr_Flag: 'N',
      Term_St_Date: '3/14/2027',
      Term_End_Date: '3/14/2027',
      Currency: 'USD',
      Amount: 'P',
      Percentage: 'CG1AR',
      Sub_SKU_Amount: 'Y',
      Status: null,
      Source: null,
      TSV_Reversal: null,
    },
  ]);

  getCircleClass(step: string): string {
    const value = this.circleStatus[step];
    if (value === 2) return 'completed-circle';
    if (value === 1) return 'current-circle';
    return 'uncompleted-circle';
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

  removeUnderscores(key: string): string {
    return key.replace(/_/g, ' ');
  }
}
