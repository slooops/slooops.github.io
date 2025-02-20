import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-o2c-sub',
  templateUrl: './o2c-sub.component.html',
  styleUrl: './o2c-sub.component.css',
})
export class O2cSubComponent {
  circleStatus: { [key: string]: number } = {
    Order: 2,
    Subscription: 1,
    Accruals: 0,
    Invoicing: 0,
    AR_Accounting: 0,
  };

  circleSteps: string[] = [];

  orderId: string | null = null;
  subRefId: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router) {} // ✅ Inject Router properly

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.subRefId = params.get('id');
      console.log('Received order ID:', this.subRefId);
    });
    this.route.queryParamMap.subscribe((params) => {
      this.subRefId = params.get('subRefId');
      console.log('Received SubRefId:', this.subRefId);
    });

    this.circleSteps = Object.keys(this.circleStatus);
  }

  displayedColumnsSummary: string[] = [
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

  dataSourceSummary = new MatTableDataSource<any>([
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

  displayedColumnsSummary2: string[] = [
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

  dataSourceSummary2 = new MatTableDataSource<any>([
    {
      Subscription_ID: 'Sub1797787',
      Subscription_Status: 'Active',
      WO_Number: '96635062',
      Billing_Preference: 'BDOM -15',
      Sub_Source: 'BRIM',
      Currency_Code: 'USD',
      Subscription_Start_Date: '3/15/2024',
      Subscription_End_Date: '3/14/2025',
      Billing_Model: 'Prepaid Term',
      AutoRenewal: 'No',
      Billing_Info: '3-Feb',
      Bill_Total: '4752.42',
      Early_Renewal: 'No',
      Trial: 'No',
      Invoice_Status: 'Staged/Invoiced/Error',
      Accrual_Eligibility: 'Y',
      SubCode: 'Subcode789',
      TSV_Published: 'Y',
      Accrual_ID: '4910686',
      Billing_Schedule: '1/1',
    },
  ]);

  displayedColumnsLineSummary: string[] = [
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

  dataSourceLineSummary = new MatTableDataSource<any>([
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

  displayedColumnsLine2: string[] = [
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

  dataSourceLine2 = new MatTableDataSource<any>([
    {
      WebOrder: '96635062',
      WebOrderLineId: '328252626',
      SKU: 'UMB-DNS-ADV-K9',
      SKU_Description: 'Cisco Umbrella DNS Security Advantage',
      Bill_Number: '1000728386062',
      Bill_LineReference: '1000728386062-2-348272651709556380',
      Charge_Type: 'Recurring',
      Subscription_ID: 'Sub1797787',
      QTY: '125',
      Duration: '12',
      Rate_Price: '33.06',
      Pricing_Term: '12',
      PA_Discount: '0',
      Line_Amount: '4132.5',
      Charge_Cycle_Start_Date: '3/15/2024',
      Charge_Cycle_End_Date: '3/14/2025',
      Subscription_Number: 'SubC2106420',
      Trxn_Number: '6102098772',
    },
    {
      WebOrder: '96635062',
      WebOrderLineId: '328252627',
      SKU: 'SVS-UMB-SUP-E',
      SKU_Description: 'Enhanced Support for Umbrella',
      Bill_Number: '1000728386062',
      Bill_LineReference: '1000728386062-2-348272651709556124',
      Charge_Type: 'Recurring',
      Subscription_ID: 'Sub1797787',
      QTY: '1',
      Duration: '12',
      Rate_Price: '51.66',
      Pricing_Term: '1',
      PA_Discount: '0',
      Line_Amount: '619.92',
      Charge_Cycle_Start_Date: '3/15/2024',
      Charge_Cycle_End_Date: '3/14/2025',
      Subscription_Number: 'SubC2106420',
      Trxn_Number: '6102098772',
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
    // Table Column-based navigation
    Subscription_ID: 'https://ccrc.cisco.com/subscriptions/detail/Sub1797786',
    Trxn_Number: '/o2c-invoicing',
    Accrual_ID: '/o2c-accrual',
    WO_Number: '/o2c-order',

    // for cricle nav
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
        queryParams: { id: value },
      });
    }
  }

  isNavigableColumn(column: string): boolean {
    return this.navigationMap.hasOwnProperty(column);
  }

  removeUnderscores(key: string): string {
    return key.replace(/_/g, ' ');
  }
}
