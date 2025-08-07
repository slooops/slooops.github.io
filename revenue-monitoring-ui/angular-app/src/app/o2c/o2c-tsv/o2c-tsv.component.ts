import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { SidebarService } from '../../sidebar.service';
import * as XLSX from 'xlsx';
import { Router } from '@angular/router';

@Component({
  selector: 'app-o2c-tsv',
  templateUrl: './o2c-tsv.component.html',
  styleUrl: './o2c-tsv.component.css',
})
export class O2cTsvComponent {
  orderId = '28221819418344'; // Placeholder for order ID
  subRefId = 'Sub2822413'; // Placeholder for subscription reference ID
  invoiceId = '32219418347'; // Placeholder for invoice ID

  circleStatus: { [key: string]: number } = {
    Order: 2,
    Subscription: 0,
    Invoicing: 0,
    Accounting: 0,
    Cash: 0,
  };

  navTotals = [
    { label: 'Orders', icon: 'cart-icon', count: null },
    { label: 'Subscriptions', icon: 'bookmark-icon', count: null },
    { label: 'Invoices', icon: 'receipt-icon', count: null },
  ];

  orderSummaryDisplayedColumns1: string[] = [
    'WEB_ORDER_ID',
    'DEAL_ID',
    'CREATION_DATE',
    'STATUS',
    'PURCHASE_ORDER',
    'ORDER_TOTAL',
    'BILLING_ID',
    'ORDER_ORIGIN',
    'ORDER_BOOKED_DATE',
  ];
  orderSummaryDisplayedColumns2: string[] = [
    'HYBRID_ORDER',
    'ROUTE_TO_MARKET',
    'ORDER_HOLDS',
    'CLOUD_SUB_ORDER_HOLDS',
    'LEGAL_ENTITY',
    'BILL_TO_CUSTOMER',
    'END_CUSTOMER',
  ];
  orderSummaryDataSource = new MatTableDataSource<any>();

  financialDataLoaded: any;
  financialSummaryDisplayedColumns: string[] = [
    'ORDER_TSV',
    'TOTAL_SUBSCRIPTION_TSV',
    'BILLING_MODEL',
    'BILLED',
    'UNBILLED',
    'REVENUE_RECOGNITION',
    'REVENUE_TO_BE_RECOGNIZED',
    'CASH',
    'actions',
  ];
  financialSummaryDataSource = new MatTableDataSource<any>([]);

  table1Loaded = true; // Set to false when implementing real data loading
  table1DisplayedColumns: string[] = [
    'SKU_TYPE',
    'TOTAL_SALES_VALUE',
    'SSD',
    'SED',
    'BDOM',
    'CHANGE_START_DATE',
    'CHANGE_END_DATE',
    'CHARGE_TYPE',
    'LINE_TYPE',
  ];
  table1DataSource = new MatTableDataSource<any>([
    {
      SKU_TYPE: 'Product',
      TOTAL_SALES_VALUE: 2500.0,
      SSD: 1000.0,
      SED: 500.0,
      BDOM: 100.0,
      CHANGE_START_DATE: '2023-10-15',
      CHANGE_END_DATE: '2024-10-15',
      CHARGE_TYPE: 'Recurring',
      LINE_TYPE: 'Subscription',
    },
  ]);

  table2Loaded = true; // Set to false when implementing real data loading
  table2DisplayedColumns: string[] = [
    'ON_PREM_TOP_SKU',
    'SPLIT_PERCENTAGE',
    'ACC_RULE',
    'CHANGE_START_DATE',
    'CHANGE_END_DATE',
    'AMOUNT_(USD)',
  ];
  table2DataSource = new MatTableDataSource<any>([
    {
      ON_PREM_TOP_SKU: 'Cisco Webex',
      SPLIT_PERCENTAGE: '80%',
      ACC_RULE: 'Recurring',
      CHANGE_START_DATE: '2023-10-15',
      CHANGE_END_DATE: '2024-10-15',
      'AMOUNT_(USD)': 1250.0,
    },
    {
      ON_PREM_TOP_SKU: 'Cisco Webex',
      SPLIT_PERCENTAGE: '20%',
      ACC_RULE: 'One-Time',
      CHANGE_START_DATE: '2023-10-15',
      CHANGE_END_DATE: '2024-10-15',
      'AMOUNT_(USD)': 250.0,
    },
    {
      ON_PREM_TOP_SKU: 'Cisco Webex',
      SPLIT_PERCENTAGE: '100%',
      ACC_RULE: 'Recurring',
      CHANGE_START_DATE: '2023-10-15',
      CHANGE_END_DATE: '2024-10-15',
      'AMOUNT_(USD)': 1000.0,
    },
  ]);

  table3Loaded = true; // Set to false when implementing real data loading
  table3DisplayedColumns: string[] = [
    'ACCOUNT',
    'ACCOUNT_CLASS',
    'DR_(USD)',
    'CR_(USD)',
  ];
  table3DataSource = new MatTableDataSource<any>([
    {
      ACCOUNT: '110-060-000000-13630-000-000000',
      ACCOUNT_CLASS: 'Contract Assets',
      'DR_(USD)': 1000.0,
      'CR_(USD)': '-',
    },
    {
      ACCOUNT: '110-060-000000-13630-000-000001',
      ACCOUNT_CLASS: 'Deferred Revenue',
      'DR_(USD)': '-',
      'CR_(USD)': 3040.0,
    },
  ]);

  rowData: any = null;
  sourceComponent: string | null = null;
  isTsvCreated: boolean = false;

  constructor(private location: Location, private router: Router) {}

  ngOnInit(): void {
    const navState = this.location.getState() as {
      rowData?: any;
      orderId?: string;
      circleStatus?: { [key: string]: number };
      subscriptionId?: string;
      orderData?: any[];
      financialData?: any[];
      source?: string;
    };

    if (!navState || Object.keys(navState).length === 0) {
      console.warn('No navigation state received in o2c-gl');
      return;
    }

    // Assign passed values with basic fallbacks
    this.rowData = navState.rowData || null;
    this.orderId = navState.orderId || this.orderId;
    this.subRefId = navState.subscriptionId || this.subRefId;
    this.sourceComponent = navState.source || null;
    this.circleStatus = navState.circleStatus || this.circleStatus;

    if (this.rowData?.TSV_CREATED === 'Y') {
      this.isTsvCreated = true;
    }

    if (Array.isArray(navState.orderData) && navState.orderData.length > 0) {
      this.orderSummaryDataSource.data = navState.orderData;
    }

    if (
      Array.isArray(navState.financialData) &&
      navState.financialData.length > 0
    ) {
      this.financialSummaryDataSource.data = navState.financialData;
    }
  }

  formatColumnName(column: string): string {
    const acronyms = [
      'cr',
      'dr',
      'sed',
      'ssd',
      'bdom',
      'acc',
      'id',
      'irn',
      'uuid',
      'cm',
      'sftp',
      'b2b',
      'srt',
      'e-del',
      'irn/uuid',
      'ar',
      'usp',
      '(usd)',
      'sku',
      'qty',
      'tsv',
      'gl',
    ];
    const name = column.replace(/_/g, ' ').toLowerCase();
    return name
      .split(' ')
      .map((word) => {
        // If the word is in the list of acronyms, return it in uppercase
        if (acronyms.includes(word)) {
          return word.toUpperCase();
        }
        // Otherwise, capitalize only the first letter
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }

  goBack() {
    window.history.back();
  }

  handleDownload(
    data: any[],
    fileName: string = 'ExportedData',
    sheetName: string = 'Data'
  ): void {
    if (!data?.length) {
      console.warn('No data to export');
      return;
    }

    console.log('Exporting data:', data);

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = {
      Sheets: { [sheetName]: worksheet },
      SheetNames: [sheetName],
    };

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  handlePrint(): void {
    window.print();
  }

  handleShare(): void {
    const url = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: 'O2C View All Dashboard',
          text: 'Check out this data dashboard',
          url,
        })
        .then(() => console.log('Share successful'))
        .catch((err) => console.error('Error sharing:', err));
    } else {
      navigator.clipboard
        .writeText(url)
        .then(() => alert('Link copied to clipboard'))
        .catch(() => alert('Unable to copy link'));
    }
  }

  navigateToBillDetails(rowData: any): void {
    console.log('Navigating to bill details with data:', rowData);

    // Navigate to the bill details page with the data
    this.router.navigate(['/o2c-bill-details'], {
      state: {
        billData: rowData,
        orderId: this.orderId,
        subRefId: this.subRefId,
      },
    });
  }

  viewInCCW(): void {
    window.open(
      'https://ccw-cstg.cisco.com/icw/pdrqo/portal.order' + this.orderId,
      '_blank'
    );
  }
}
