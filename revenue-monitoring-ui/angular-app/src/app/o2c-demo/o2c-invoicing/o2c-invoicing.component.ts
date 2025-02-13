import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-o2c-invoicing',

  templateUrl: './o2c-invoicing.component.html',
  styleUrl: './o2c-invoicing.component.css',
})
export class O2cInvoicingComponent {
  circleStatus: { [key: string]: number } = {
    Order: 2,
    Subscription: 2,
    Accruals: 2,
    Invoicing: 1,
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
    'Invoice_Type',
    'Web_Order_ID',
    'Purchase_Order_Number',
    'Bill_To_Id',
    'Bill_Number',
    'Bill_Status',
    'TRX_Number',
    'Currency',
    'TRX_Class',
  ];

  dataSourceSummary = new MatTableDataSource<any>([
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
    },
  ]);

  displayedColumnsSummary2: string[] = [
    'TRX_Date',
    'Due_Date',
    'TRX_Status',
    'Amount_Due_Orginal',
    'Amount_Due_Remaining',
    'Receipt_Applied',
    'CM_Applied',
    'Write_Off_/_Adjustments',
  ];

  dataSourceSummary2 = new MatTableDataSource<any>([
    {
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

  displayedColumnsLineSummary: string[] = [
    'Trx_Line_Number',
    'SKU',
    'SKU_Description',
    'QTY',
    'Unit_selling_Price',
    'Line_Amount',
    'Tax_Amount',
  ];

  dataSourceLineSummary = new MatTableDataSource<any>([
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
