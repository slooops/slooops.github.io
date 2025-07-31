import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { SidebarService } from '../../sidebar.service';
import * as XLSX from 'xlsx';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-o2c-bill-schedule',
  templateUrl: './o2c-bill-schedule.component.html',
  styleUrls: ['./o2c-bill-schedule.component.css'],
})
export class O2cBillScheduleComponent {
  orderId = '28221819418344'; // Placeholder for order ID
  subRefId = 'Sub2822413'; // Placeholder for subscription reference ID
  invoiceId = '32219418347'; // Placeholder for invoice ID

  expanded = {
    subscription: false,
    invoice: false,
  };

  circleStatus: { [key: string]: number } = {
    Order: 2,
    Subscription: 2,
    Invoicing: 2,
    Accounting: 2,
    Cash: 0,
  };

  navTotals = [
    { label: 'Orders', icon: 'cart-icon', count: null },
    { label: 'Subscriptions', icon: 'bookmark-icon', count: null },
    { label: 'Invoices', icon: 'receipt-icon', count: null },
  ];

  billScheduleLoaded = true; // Set to false when implementing real data loading
  billScheduleSummaryDisplayedColumns: string[] = [
    'WEB_ORDER_ID',
    'SUB_REF_ID',
    'LAST_MODIFIED_DATE',
    'BILLING_PREFERENCE',
    'SUBSCRIPTION_SOURCE',
    'CURRENCY',
    'BILLING_SCHEDULE',
    'BILLING_FREQUENCY',
  ];
  billScheduleSummaryDataSource = new MatTableDataSource<any>([
    {
      WEB_ORDER_ID: '95075262',
      SUB_REF_ID: 'SR100112',
      LAST_MODIFIED_DATE: '07/25/2025',
      BILLING_PREFERENCE: 'SSD 5',
      SUBSCRIPTION_SOURCE: 'BRM',
      CURRENCY: 'USD',
      BILLING_SCHEDULE: '1/12',
      BILLING_FREQUENCY: 'Recurring',
    },
  ]);

  billScheduleDataLoaded = true; // Set to false when implementing real data loading
  billScheduleDisplayedColumns: string[] = [
    'BILL_DATE',
    'BILLING_PERIOD',
    'BILL_AMOUNT',
    'STATUS',
    'BILLED_ON_DATE',
    'BILL_NUMBER',
  ];
  billScheduleDataSource = new MatTableDataSource<any>([
    // On-time bills
    {
      BILL_DATE: '2023-06-28',
      BILLING_PERIOD: '28-Jun-23 to 27-Sep-23',
      BILL_AMOUNT: 2500.0,
      STATUS: 'Billed',
      BILLED_ON_DATE: '2023-06-28',
      BILL_NUMBER: '12345678901',
    },
    {
      BILL_DATE: '2023-09-28',
      BILLING_PERIOD: '28-Sep-23 to 27-Dec-23',
      BILL_AMOUNT: 2500.0,
      STATUS: 'Billed',
      BILLED_ON_DATE: '2023-09-28',
      BILL_NUMBER: '12345678902',
    },

    // Late bills
    {
      BILL_DATE: '2024-01-15',
      BILLING_PERIOD: '15-Jan-24 to 14-Apr-24',
      BILL_AMOUNT: 2500.0,
      STATUS: 'Billed',
      BILLED_ON_DATE: '2024-01-20', // Late by 5 days
      BILL_NUMBER: '12345678903',
    },
    {
      BILL_DATE: '2024-04-15',
      BILLING_PERIOD: '15-Apr-24 to 14-Jul-24',
      BILL_AMOUNT: 2500.0,
      STATUS: 'Billed',
      BILLED_ON_DATE: '2024-04-18', // Late by 3 days
      BILL_NUMBER: '12345678904',
    },

    // Future bills with no billed-on date or bill number
    {
      BILL_DATE: '2027-03-15',
      BILLING_PERIOD: '15-Mar-27 to 14-Jun-27',
      BILL_AMOUNT: 2500.0,
      STATUS: 'Pending',
      BILLED_ON_DATE: null,
      BILL_NUMBER: null,
    },
    {
      BILL_DATE: '2027-06-07',
      BILLING_PERIOD: '7-Jun-27 to 6-Sep-27',
      BILL_AMOUNT: 2500.0,
      STATUS: 'Future',
      BILLED_ON_DATE: null,
      BILL_NUMBER: null,
    },
  ]);

  constructor(
    private sidebarService: SidebarService,
    private router: Router,
    private location: Location
  ) {}

  sidebarExpanded = true;

  ngOnInit(): void {
    this.sidebarService.isExpanded$.subscribe((isExpanded) => {
      this.sidebarExpanded = isExpanded;

      if (!isExpanded) {
        this.expanded.subscription = true;
        this.expanded.invoice = true;
      } else if (isExpanded) {
        this.expanded.subscription = false;
        this.expanded.invoice = false;
      }
    });

    this.sidebarService.activeItem$.subscribe((item) => {
      if (item === 'Subscriptions') {
        this.expanded.subscription = true;
        this.expanded.invoice = false;
      } else if (item === 'Invoices') {
        this.expanded.invoice = true;
        this.expanded.subscription = false;
      } else if (item === 'Orders') {
        this.expanded.subscription = false;
        this.expanded.invoice = false;
      }
    });

    const navState = this.location.getState() as {
      rowData?: any;
      orderId?: string;
    };

    if (navState.rowData && navState.orderId) {
      this.orderId = navState.orderId;
      this.subRefId = navState.rowData?.SUBSCRIPTION_CODE;

      this.billScheduleSummaryDataSource.data =
        this.billScheduleSummaryDataSource.data.map((item) => ({
          ...item,
          WEB_ORDER_ID: this.orderId,

          SUB_REF_ID: navState.rowData.SUBSCRIPTION_ID,
          LAST_MODIFIED_DATE: new Date(
            navState.rowData.LAST_UPDATE_DATE
          ).toLocaleDateString(),
          BILLING_PREFERENCE: navState.rowData.BILLING_PREFERENCE,
          BILLING_SCHEDULE: navState.rowData.BILLING_SCHEDULE,
          BILLING_FREQUENCY: navState.rowData.BILLING_FREQ_TYPE,
        }));
    }

    console.log('Navigation state:', navState);
  }

  get invoiceContainerWidth(): string {
    if (!this.expanded.invoice && !this.expanded.subscription) return '100%';
    return this.sidebarExpanded ? 'calc(100% - 255px)' : 'calc(100% - 71px)';
  }

  formatColumnName(column: string): string {
    const acronyms = [
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

  isBilledLate(element: any): boolean {
    if (!element['BILLED_ON_DATE'] || !element['BILL_DATE']) {
      return false;
    }

    const billedDate = new Date(element['BILLED_ON_DATE']);
    const scheduledDate = new Date(element['BILL_DATE']);

    return billedDate > scheduledDate;
  }

  navigateToBillDetails(rowData: any): void {
    console.log('Navigating to bill details with data:', rowData);

    // Navigate to the bill details page with the data
    this.router.navigate(['/o2c-bill-details'], {
      state: {
        billData: rowData,
        orderId: this.orderId,
        subRefId: this.subRefId,
        circleStatus: this.circleStatus,
        summaryTableData: this.billScheduleSummaryDataSource.data,
      },
    });
  }
}
