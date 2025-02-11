import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-o2c-details',
  templateUrl: './o2c-details.component.html',
  styleUrls: ['./o2c-details.component.css'],
})
export class O2cDetailsComponent implements OnInit {
  orderId: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.orderId = params.get('orderId');
      console.log('Received order ID:', this.orderId);
    });
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
      Partner_Name: 'IngramMicro',
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
      End_Customer_Name: 'NA',
      Reseller: 'NA',
      'Address_Details_Bill-To': 'NA',
      Address_Details_End_Customer: 'NA',
      Order_Origin: 'CCW-Q2O',
      Order_Booked_Date: 'N',
      Hybrid_Order: 'PARTNER',
      Route_to_Market: null,
      Order_Holds: null,
      Cloud_Sub_Order_Holds: null,
    },
  ]);

  displayedColumnsLineSummary: string[] = [
    'ATO_NAME',
    'Line_Ref_Number',
    'Prev_Ln_Ref_Number',
    'OPL_LineId',
    'Ordered_Item',
    'Quantity',
    'Unit_Net_Price',
    'MRR',
    'Item_Type_Code',
    'Flow_Status_Code',
  ];

  dataSourceLineSummary = new MatTableDataSource<any>([
    {
      ATO_NAME: 'ETD-SEC-SUB',
      Line_Ref_Number: '328252622',
      Prev_Ln_Ref_Number: '2114407481',
      OPL_LineId: 'ETD-SEC-SUB',
      Ordered_Item: '153.31',
      Quantity: 'MAJOR',
      Unit_Net_Price: 'CLOSED',
      MRR: null,
      Item_Type_Code: null,
      Flow_Status_Code: null,
    },
    {
      ATO_NAME: 'UMB-SEC-SUB',
      Line_Ref_Number: '328252625',
      Prev_Ln_Ref_Number: '2114407481',
      OPL_LineId: 'UMB-SEC-SUB',
      Ordered_Item: '396.03',
      Quantity: 'MAJOR',
      Unit_Net_Price: 'CLOSED',
      MRR: null,
      Item_Type_Code: null,
      Flow_Status_Code: null,
    },
  ]);

  accrualsTotals: { [key: string]: number } = {
    Order: 1, // Completed, 1 is current, 0 is uncompleted
    Subscription: 0,
    Accruals: 0,
    Invoicing: 0,
    AR_Accounting: 0,
  };

  skippedWords: string[] = ['IOL', 'AR', 'ID', 'GL', 'TSV'];

  // Define the steps array with both original keys and formatted labels
  formattedAccrualsSteps = Object.keys(this.accrualsTotals).map((key) => ({
    originalKey: key, // Store the original key for accessing dynamic totals
    label: this.formatLabel(key), // Format for display
    impact: this.accrualsTotals[key] || 'N/A', // Use dynamic data from accrualsTotals
  }));

  formatLabel(label: string): string {
    const acronyms = this.skippedWords || [];

    return label
      .toLowerCase() // Convert to lowercase
      .replace(/_/g, ' ') // Replace underscores with spaces
      .split(' ') // Split into words
      .map(
        (word) =>
          acronyms.includes(word.toUpperCase())
            ? word.toUpperCase() // Keep the word in uppercase if it's in skippedWords
            : word.charAt(0).toUpperCase() + word.slice(1) // Capitalize the first letter otherwise
      )
      .join(' '); // Join words back with spaces
  }

  getCircleClass(step: any): string {
    const value = this.accrualsTotals[step.originalKey];
    if (value === 2) return 'completed-circle'; // Completed step
    if (value === 1) return 'current-circle'; // Current step
    return 'uncompleted-circle'; // Default for uncompleted steps
  }

  getSliderBarStyle(index: number): { [key: string]: string } {
    const step = this.formattedAccrualsSteps[index];
    const value = this.accrualsTotals[step.originalKey];
    if (value === 1) {
      // Current step
      return {
        background: 'linear-gradient(to right, #16371e43, #08ace4, #16371e43)',
      };
    }
    return { background: '#16371e43' };
  }

  removeUnderscores(key: string): string {
    return key.replace(/_/g, ' ');
  }
}
