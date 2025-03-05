import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-o2c-order',
  templateUrl: './o2c-order.component.html',
  styleUrl: './o2c-order.component.css',
})
export class O2cOrderComponent {
  circleStatus: { [key: string]: number } = {
    Order: 1,
    Subscription: 0,
    Accruals: 0,
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
  ];

  dataSourceSummary = new MatTableDataSource<any>([
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
    },
  ]);

  displayedColumnsSummary2: string[] = [
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

  dataSourceSummary2 = new MatTableDataSource<any>([
    {
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

  displayedColumnsLineSummary: string[] = [
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

  dataSourceLineSummary = new MatTableDataSource<any>([
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

  removeUnderscores(key: string): string {
    return key.replace(/_/g, ' ');
  }

  navigationMap: { [key: string]: string } = {
    // Column-based navigation
    SubRefId: 'o2c-sub',
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

  navigateToRoute(identifier: string, value: string | number) {
    if (this.navigationMap[identifier].startsWith('http')) {
      window.open(this.navigationMap[identifier], '_blank');
    } else {
      this.router.navigate([this.navigationMap[identifier]], {
        queryParams: { subRefId: value },
      });
    }
  }

  isNavigableColumn(column: string): boolean {
    return this.navigationMap.hasOwnProperty(column);
  }
}
