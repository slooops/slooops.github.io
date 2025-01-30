import {
  Component,
  ViewChild,
  ViewChildren,
  QueryList,
  ChangeDetectorRef,
} from '@angular/core';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import * as XLSX from 'xlsx';
import { MatTabGroup } from '@angular/material/tabs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-o2c-demo',
  templateUrl: './o2c-demo.component.html',
  styleUrl: './o2c-demo.component.css',
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class O2cDemoComponent {
  @ViewChild('outerSort', { static: true }) sort: MatSort;
  @ViewChildren('innerSort') innerSort: QueryList<MatSort>;
  @ViewChildren('innerTables') innerTables: QueryList<MatTable<Address>>;
  @ViewChild('tabGroup') tabGroup: MatTabGroup;

  data: User[] = USERS;

  dataSource: MatTableDataSource<User>;
  usersData: User[] = [];
  columnsToDisplay = ['Step', 'Account', 'Subscription_Line'];
  innerDisplayedColumns = ['Order_Summary', 'Order_ID', 'Order_Status'];
  innerInnerDisplayedColumns = ['comment', 'commentStatus'];
  expandedElement: User | null;
  expandedElements: any[] = [];

  constructor(private cd: ChangeDetectorRef, private router: Router) {}

  displayedColumnsOld: string[] = [
    'Web_Order_ID',
    'Purchase_Order_Number',
    'Order_Status',
    'Deal_ID',
    'Order_Total',
    'Created_By',
    'Creation_Date',
    'Partner_Name',
    'End_Customer_Name',
  ];

  dataSourceOld = new MatTableDataSource<any>([
    {
      Web_Order_ID: '92389536',
      Order_Status: 'CLOSED',
      Purchase_Order_Number: 'RR1063098',
      Deal_ID: '54621189',
      Order_Total: '$9,731.92',
      Created_By: 'Isabel Rosen',
      Creation_Date: '27-May-22',
      Partner_Name: 'INGRAM MICRO',
      End_Customer_Name: 'PELTIER AUTOMOTIVE',
    },
  ]);

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
    'Operating_Unit',
    'WebOrder_ID',
    'Sales_Order',
    'Order_Creation_Date',
    'Order_Status',
    'Purchase_Order_Num',
    'Deal_ID',
    'Order_Total',
    'Price_list',
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
    {
      Operating_Unit: 'CISCO US OPERATING UNIT',
      WebOrder_ID: '96635062',
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
      Order_Booked_Date: '18-Mar-2024',
      Hybrid_Order: 'N',
      Route_to_Market: 'PARTNER',
      Order_Holds: 'None',
      Cloud_Sub_Order__Holds: 'Hold Reason1',
    },
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

  ngOnInit() {
    USERS.forEach((user) => {
      if (
        user.addresses &&
        Array.isArray(user.addresses) &&
        user.addresses.length
      ) {
        this.usersData = [
          ...this.usersData,
          { ...user, addresses: new MatTableDataSource(user.addresses) },
        ];
      } else {
        this.usersData = [...this.usersData, user];
      }
    });
    this.dataSource = new MatTableDataSource(this.usersData);
    this.dataSource.sort = this.sort;
  }

  goToOrdersTab() {
    this.tabGroup.selectedIndex = 1; // 1 is the index of the Orders tab
  }

  goToO2cDetails(row: any) {
    this.router.navigate(['/o2c-details'], {
      queryParams: { orderId: row.WebOrder_ID },
    });
    console.log('Navigating to O2C details for order ID:', row.WebOrder_ID);
  }

  applyFilter(filterValue: string) {
    this.innerTables.forEach(
      (table, index) =>
        ((table.dataSource as MatTableDataSource<Address>).filter = filterValue
          .trim()
          .toLowerCase())
    );
  }

  toggleRow(element: User) {
    element.addresses &&
    (element.addresses as MatTableDataSource<Address>).data.length
      ? this.toggleElement(element)
      : null;
    this.cd.detectChanges();
    this.innerTables.forEach(
      (table, index) =>
        ((table.dataSource as MatTableDataSource<Address>).sort =
          this.innerSort.toArray()[index])
    );
  }

  isExpanded(row: User): string {
    const index = this.expandedElements.findIndex((x) => x.Step == row.Step);
    if (index !== -1) {
      return 'expanded';
    }
    return 'collapsed';
  }

  toggleElement(row: User) {
    const index = this.expandedElements.findIndex((x) => x.Step == row.Step);
    if (index === -1) {
      this.expandedElements.push(row);
    } else {
      this.expandedElements.splice(index, 1);
    }

    //console.log(this.expandedElements);
  }

  onSearch(searchValue: string): void {
    console.log('Search value:', searchValue);
    // Implement your search logic here
  }

  skippedWords: string[] = ['IOL', 'AR', 'ID', 'GL', 'TSV'];

  accrualsTotals: { [key: string]: number } = {
    Order: 2, // Completed
    Revenue_Accruals: 2,
    Invoice: 2, // Current step
    Revenue_Accounting: 1,
    GL_Transfer_and_Posting: 0,
  };

  // Define the steps array with both original keys and formatted labels
  formattedAccrualsSteps = Object.keys(this.accrualsTotals).map((key) => ({
    originalKey: key, // Store the original key for accessing dynamic totals
    label: this.formatLabel(key), // Format for display
    impact: this.accrualsTotals[key] || 'N/A', // Use dynamic data from accrualsTotals
  }));

  // Function to format the label
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

  // Helper to determine the class for a circle based on the accrualsTotals value
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

  exportTableToExcel(data: any[], sheetName: string, fileName: string): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = {
      Sheets: { [sheetName]: worksheet },
      SheetNames: [sheetName],
    };
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }
}

export interface User {
  Step: string;
  Account: string;
  Subscription_Line: string;
  addresses?: Address[] | MatTableDataSource<Address>;
}

export interface Comment {
  commenID: number;
  comment: string;
  commentStatus: string;
}

export interface Address {
  Order_Summary: string;
  Order_ID: string;
  Order_Status: string;
  comments?: Comment[] | MatTableDataSource<Comment>;
}

const USERS: User[] = [
  {
    Step: 'Order',
    Account: 'cisco@test.com',
    Subscription_Line: '9864785214',
    addresses: [
      {
        Order_Summary: 'Order Summary 1',
        Order_ID: '78542',
        Order_Status: 'Lost',
        comments: [
          {
            commenID: 1,
            comment: 'Test',
            commentStatus: 'Open',
          },
          {
            commenID: 2,
            comment: 'Test',
            commentStatus: 'Open',
          },
          {
            commenID: 3,
            comment: 'Test',
            commentStatus: 'Closed',
          },
        ],
      },
      {
        Order_Summary: 'Order Summary 2',
        Order_ID: '78554',
        Order_Status: 'Pending',
        comments: [
          {
            commenID: 4,
            comment: 'Test',
            commentStatus: 'Open',
          },
          {
            commenID: 5,
            comment: 'Test',
            commentStatus: 'Open',
          },
          {
            commenID: 6,
            comment: 'Test',
            commentStatus: 'Closed',
          },
        ],
      },
    ],
  },
  {
    Step: 'Subscription',
    Account: 'deloitte@test.com',
    Subscription_Line: '8786541234',
    addresses: [
      {
        Order_Summary: 'Order_Summary 5',
        Order_ID: '23547',
        Order_Status: 'Utah',
        comments: [
          {
            commenID: 7,
            comment: 'Test',
            commentStatus: 'Open',
          },
          {
            commenID: 8,
            comment: 'Test',
            commentStatus: 'Open',
          },
          {
            commenID: 9,
            comment: 'Test',
            commentStatus: 'Closed',
          },
        ],
      },
      {
        Order_Summary: 'Order_Summary 5',
        Order_ID: '23547',
        Order_Status: 'Ohio',
        comments: [
          {
            commenID: 19,
            comment: 'Test',
            commentStatus: 'Open',
          },
          {
            commenID: 11,
            comment: 'Test',
            commentStatus: 'Open',
          },
          {
            commenID: 12,
            comment: 'Test',
            commentStatus: 'Closed',
          },
        ],
      },
    ],
  },
  {
    Step: 'Accruals',
    Account: 'asdf@cisco.com',
    Subscription_Line: '7856452187',
    addresses: [
      {
        Order_Summary: 'Order_Summary 1425',
        Order_ID: '23547',
        Order_Status: 'Blocked',
        comments: [
          {
            commenID: 13,
            comment: 'Test',
            commentStatus: 'Open',
          },
          {
            commenID: 14,
            comment: 'Test',
            commentStatus: 'Open',
          },
          {
            commenID: 15,
            comment: 'Test',
            commentStatus: 'Closed',
          },
        ],
      },
      {
        Order_Summary: 'Order_Summary 5935',
        Order_ID: '23547',
        Order_Status: 'Unknown',
        comments: [
          {
            commenID: 16,
            comment: 'Test',
            commentStatus: 'Open',
          },
          {
            commenID: 17,
            comment: 'Test',
            commentStatus: 'Open',
          },
          {
            commenID: 18,
            comment: 'Test',
            commentStatus: 'Closed',
          },
        ],
      },
    ],
  },
  {
    Step: 'Invoicing & Payments',
    Account: 'happyHolidays@test.com',
    Subscription_Line: '7856452187',
    addresses: [
      {
        Order_Summary: 'Order_Summary 52971',
        Order_ID: '23547',
        Order_Status: 'In Progress',
        comments: [
          {
            commenID: 13,
            comment: 'Test',
            commentStatus: 'Open',
          },
          {
            commenID: 14,
            comment: 'Test',
            commentStatus: 'Open',
          },
          {
            commenID: 15,
            comment: 'Test',
            commentStatus: 'Closed',
          },
        ],
      },
      {
        Order_Summary: 'Order_Summary 2054',
        Order_ID: '23547',
        Order_Status: 'Unknown',
        comments: [
          {
            commenID: 16,
            comment: 'Test',
            commentStatus: 'Open',
          },
          {
            commenID: 17,
            comment: 'Test',
            commentStatus: 'Open',
          },
          {
            commenID: 18,
            comment: 'Test',
            commentStatus: 'Closed',
          },
        ],
      },
    ],
  },
];
