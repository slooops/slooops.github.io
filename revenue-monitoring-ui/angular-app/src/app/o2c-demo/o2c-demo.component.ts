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

  data: User[] = USERS;

  dataSource: MatTableDataSource<User>;
  usersData: User[] = [];
  columnsToDisplay = ['Step', 'Account', 'Subscription_Line'];
  innerDisplayedColumns = ['Order_Summary', 'Order_ID', 'Order_Status'];
  innerInnerDisplayedColumns = ['comment', 'commentStatus'];
  expandedElement: User | null;
  expandedElements: any[] = [];

  constructor(private cd: ChangeDetectorRef) {}

  displayedColumnsHome: string[] = [
    'Web_Order_ID',
    'Deal_ID',

    'Purchase_Order_Number',

    'Sales_Order',
    'Order_Status',
    'Currency',

    'Order_Total',
    'Created_By',
    'Creation_date',
  ];

  dataSourceHome = new MatTableDataSource<any>([
    {
      Web_Order_ID: '92389536',
      Sales_Order: '92389536',
      Currency: 'USD',
      Order_Status: 'CLOSED',
      Purchase_Order_Number: 'RR1063098',
      Deal_ID: '54621189',
      Order_Total: '9,731.92',
      Created_By: 'Isabel Rosen',
      Creation_date: '27-May-22',
    },
  ]);

  displayedColumnsHome2: string[] = [
    'Partner_Name',
    'End_Customer_Name',
    'SubrefId',
    'Subscription_ID',
    'Subscription_Status',
    'Subscription_St_Date',
    'Subscription_End_Date',
    'Billing_Model',
    'AutoRenewal',
  ];

  dataSourceHome2 = new MatTableDataSource<any>([
    {
      Partner_Name: 'INGRAM MICRO',
      End_Customer_Name: 'PELTIER AUTOMOTIVE',
      SubrefId: 'Sub942735',
      Subscription_ID: 'SubC1009908',
      Subscription_Status: 'INACTIVE',
      Subscription_St_Date: '13-Aug-21',
      Subscription_End_Date: '13-Aug-24',
      Billing_Model: 'Annual Billing',
      AutoRenewal: 'N',
    },
  ]);

  displayedColumnsOrder: string[] = [
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

  dataSourceOrder = new MatTableDataSource<any>([
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

  displayedColumnsRAL: string[] = [
    'WebOrder_ID',
    'Sales_Order',
    'SubRefId',
    'Offer_Type',
    'Accrual_Eligible',
    'DealId',
    'Creation_Date',
    'Opeating_Unit',
    'Processed',
    'Revenue_Accrual_Total',
    'Currency',
  ];

  dataSourceRAL = new MatTableDataSource<any>([
    {
      WebOrder_ID: '96686180',
      Sales_Order: '7890012',
      SubRefId: 'SR789012',
      Offer_Type: 'EA 3.0, ELA 2, Wifi7',
      Accrual_Eligible: 'Y/N',
      DealId: '97997',
      Creation_Date: '11/22/24',
      Opeating_Unit: 'CISCO US OPERATING UNIT',
      Processed: 'Yes',
      Revenue_Accrual_Total: null,
      Currency: 'USD',
    },
  ]);

  displayedColumnsInvoicing: string[] = [
    'Web_Order_ID',
    'Purchase_Order_Number',

    'Invoice_Type',
    'TRX_Number',
    'TRX_Date',
    'Due_Date',
    'Currency',
    'TRX_Class',
    'TRX_Status',
    'Amount_Due_Orginal',
    'Amount_Due_Remaining',
    'Invoice_Delivery_Method',
  ];

  dataSourceInvoicing = new MatTableDataSource<any>([
    {
      Web_Order_ID: '90198022',
      Purchase_Order_Number: 'RR1063098',

      Invoice_Type: 'INV',
      TRX_Number: '6101077254',
      TRX_Date: '13-Jan-22',
      Due_Date: '12-Feb-22',
      Currency: 'USD',
      TRX_Class: 'INV',
      TRX_Status: 'CL',
      Amount_Due_Orginal: '$113',
      Amount_Due_Remaining: '$0',
      Invoice_Delivery_Method: 'eDelivery',
    },
  ]);

  displayedColumnsInvoicing2: string[] = [
    'TRX_Number',
    'Print_Date',
    'Previous_Trx_Number',
    'Print_Status',
    'eInvoicing',
    'Collector',
    'Partner_Name',
    'Class',
    'Type',
    'Number',
    'Apply_Date',
    'Amount_Applied',
    'Activity_Date',
    'Created_by',
    'BDOM_SSD',
  ];

  dataSourceInvoicing2 = new MatTableDataSource<any>([
    {
      TRX_Number: '6101077254',
      Print_Date: '13-Jan-22',
      Previous_Trx_Number: '0',
      Print_Status: 'Completed',
      eInvoicing: 'Approved',
      Collector: 'HIGH_VOLUME_ING1',
      Partner_Name: 'INGRAM MICRO',
      Class: 'Payment',
      Type: 'CHECK',
      Number: '9194615',
      Apply_Date: '26-Aug-22',
      Amount_Applied: '113',
      Activity_Date: '26-Aug-22',
      Created_by: null,
      BDOM_SSD: null,
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
