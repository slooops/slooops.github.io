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

  accrualId: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router) {} // ✅ Inject Router properly

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.accrualId = params.get('id');
      console.log('Received accrual ID:', this.accrualId);
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
      Accrual_ID: '4910686',
      WebOrder_ID: '96635062',
      Subscription_Id: 'Sub1797787',
      Billing_ID: '413587662',
      Billing_Preference: '15',
      SubCode: 'SubC2106420',
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
      Line_Ref_Number: '328252626',
      Ordered_Item: 'UMB-DNS-ADV-K9',
      SUBSKU_ITEM_NAME: 'NA',
      Charge_Type: 'Recurring',
      OA_Flag: 'N',
      Time_Bound_Cr_Flag: 'N',
      Term_St_Date: '3/15/2024',
      Term_End_Date: '3/14/2025',
      Currency: 'USD',
      Amount: '4132.5',
      Percentage: 'NA',
      Sub_SKU_Amount: 'NA',
      Status: 'P',
      Source: 'SBP',
      TSV_Created: 'Y',
    },
    {
      Line_Ref_Number: '328252627',
      Ordered_Item: 'SVS-UMB-SUP-E',
      SUBSKU_ITEM_NAME: 'NA',
      Charge_Type: 'Recurring',
      OA_Flag: 'N',
      Time_Bound_Cr_Flag: 'N',
      Term_St_Date: '3/15/2024',
      Term_End_Date: '3/14/2025',
      Currency: 'USD',
      Amount: '619.92',
      Percentage: 'NA',
      Sub_SKU_Amount: 'NA',
      Status: 'P',
      Source: 'SBP',
      TSV_Created: 'Y',
    },
  ]);

  displayedColumnsGen: string[] = [
    'Line_Ref_Number',
    'Ordered_Item',
    'SUBSKU_ITEM_NAME',
    'Charge_Type',
    'OA_Flag',
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
      Line_Ref_Number: '328252626',
      Ordered_Item: 'UMB-DNS-ADV-K9',
      SUBSKU_ITEM_NAME: 'NA',
      Charge_Type: 'Recurring',
      OA_Flag: 'N',
      Time_Bound_Cr_Flag: 'N',
      Term_St_Date: '3/15/2024',
      Term_End_Date: '3/14/2025',
      Currency: 'USD',
      Amount: '4132.5',
      Percentage: 'NA',
      Sub_SKU_Amount: 'NA',
      Status: 'P',
      Source: 'AR',
      TSV_Reversal: 'Y',
    },
    {
      Line_Ref_Number: '328252627',
      Ordered_Item: 'SVS-UMB-SUP-E',
      SUBSKU_ITEM_NAME: 'NA',
      Charge_Type: 'Recurring',
      OA_Flag: 'N',
      Time_Bound_Cr_Flag: 'N',
      Term_St_Date: '3/15/2024',
      Term_End_Date: '3/14/2025',
      Currency: 'USD',
      Amount: '619.92',
      Percentage: 'NA',
      Sub_SKU_Amount: 'NA',
      Status: 'P',
      Source: 'AR',
      TSV_Reversal: 'Y',
    },
  ]);

  dataSourceSummary2 = new MatTableDataSource<any>([
    {
      Accrual_ID: '4910695',
      WebOrder_ID: '96635062',
      Subscription_Id: 'Sub1797786',
      Billing_ID: '413587662',
      Billing_Preference: '15',
      SubCode: 'SubC2106419',
      Term_Start_Date: '3/15/2024',
      Term_End_Date: '3/14/2027',
      Subscription_Start_Date: '3/15/2024',
    },
  ]);

  dataSourceLineSummary2 = new MatTableDataSource<any>([
    {
      Line_Ref_Number: '328252623',
      Ordered_Item: 'ETD-ESS-LIC',
      SUBSKU_ITEM_NAME: 'Yes',
      Charge_Type: 'Recurring',
      OA_Flag: 'Y',
      Time_Bound_Cr_Flag: 'N',
      Term_St_Date: '3/15/2024',
      Term_End_Date: '3/14/2025',
      Currency: 'USD',
      Amount: '1557.49',
      Percentage: 'NA',
      Sub_SKU_Amount: 'NA',
      Status: 'P',
      Source: 'SBP',
      TSV_Created: 'Y',
    },
    {
      Line_Ref_Number: '328252624',
      Ordered_Item: 'SVS-ETD-SUP-E',
      SUBSKU_ITEM_NAME: 'NA',
      Charge_Type: 'Recurring',
      OA_Flag: 'N',
      Time_Bound_Cr_Flag: 'N',
      Term_St_Date: '3/15/2024',
      Term_End_Date: '3/14/2025',
      Currency: 'USD',
      Amount: '282.24',
      Percentage: 'NA',
      Sub_SKU_Amount: 'NA',
      Status: 'P',
      Source: 'SBP',
      TSV_Created: 'Y',
    },
  ]);

  dataSourceGen2 = new MatTableDataSource<any>([
    {
      Line_Ref_Number: '328252623',
      Ordered_Item: 'ETD-ESS-LIC',
      SUBSKU_ITEM_NAME: 'Yes',
      Charge_Type: 'Recurring',
      OA_Flag: 'Y',
      Time_Bound_Cr_Flag: 'N',
      Term_St_Date: '3/15/2024',
      Term_End_Date: '3/14/2025',
      Currency: 'USD',
      Amount: '1557.49',
      Percentage: 'NA',
      Sub_SKU_Amount: 'NA',
      Status: 'P',
      Source: 'AR',
      TSV_Reversal: 'Y',
    },
    {
      Line_Ref_Number: '328252624',
      Ordered_Item: 'SVS-ETD-SUP-E',
      SUBSKU_ITEM_NAME: 'NA',
      Charge_Type: 'Recurring',
      OA_Flag: 'N',
      Time_Bound_Cr_Flag: 'N',
      Term_St_Date: '3/15/2024',
      Term_End_Date: '3/14/2025',
      Currency: 'USD',
      Amount: '282.24',
      Percentage: 'NA',
      Sub_SKU_Amount: 'NA',
      Status: 'P',
      Source: 'AR',
      TSV_Reversal: 'Y',
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

  navigationMap: { [key: string]: string } = {
    // Column-based navigation
    SubRefId: '/o2c-sub',
    Trxn_Number: '/o2c-invoicing',
    Accrual_ID:
      'https://apps.cisco.com/ICW/PDR/ControllerNoAuth/rest/quoting/open?NDc1MTkwMjU1Mg==@NDczOTc3OTkxOA==',
    WebOrder_ID: '/o2c-order',
    Subscription_Id: '/o2c-sub',

    // Step-based navigation
    Order: '/o2c-order',
    Subscription: '/o2c-sub',
    Accruals: '/o2c-accrual',
    Invoicing: '/o2c-invoicing',
  };

  navigateToRoute(identifier: string, value: string | number) {
    if (this.navigationMap[identifier].startsWith('http')) {
      window.open(this.navigationMap[identifier], '_blank');
    } else {
      this.router.navigate([this.navigationMap[identifier]], {
        queryParams: {
          // Ensure we pass "subRefId" if navigating to Sub
          subRefId: identifier === 'Subscription_Id' ? value : undefined,
          id: identifier !== 'Subscription_Id' ? value : undefined,
        },
      });
    }
  }

  isNavigableColumn(column: string): boolean {
    return this.navigationMap.hasOwnProperty(column);
  }

  // Define which columns should be double width
  wideColumns: string[] = ['SubCode'];

  isWideColumn(column: string): boolean {
    return this.wideColumns.includes(column);
  }

  removeUnderscores(key: string): string {
    return key.replace(/_/g, ' ');
  }
}
