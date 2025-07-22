import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { SidebarService } from '../sidebar.service';
import * as XLSX from 'xlsx';
import { Router } from '@angular/router';

@Component({
  selector: 'app-o2c-bill-details',
  templateUrl: './o2c-bill-details.component.html',
  styleUrls: ['./o2c-bill-details.component.css'],
})
export class O2cBillDetailsComponent {
  orderId = '28221819418344'; // Placeholder for order ID
  subRefId = 'Sub2822413'; // Placeholder for subscription reference ID
  invoiceId = '32219418347'; // Placeholder for invoice ID

  billData: any = null;

  expanded = {
    subscription: false,
    invoice: false,
  };

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

  billScheduleSummaryLoaded = true; // Set to false when implementing real data loading
  billScheduleSummaryDisplayedColumns: string[] = [
    'WEB_ORDER_ID',
    'SUB_REF_ID',
    'BILLING_SCHEDULE',
    'BILLING_FREQUENCY',
    'BILLING_DATE',
    'BILLING_PERIOD',
    'STATUS',
  ];
  billScheduleSummaryDataSource = new MatTableDataSource<any>([
    {
      WEB_ORDER_ID: '28221819418344',
      SUB_REF_ID: 'Sub2822413',
      BILLING_SCHEDULE: '2/4',
      BILLING_FREQUENCY: 'Quarterly',
      BILLING_DATE: '2025-10-15',
      BILLING_PERIOD: '2-Jan-25 to 1-Apr-25',
      STATUS: 'Unbilled',
    },
  ]);

  billScheduleDataLoaded = true; // Set to false when implementing real data loading
  billScheduleDisplayedColumns: string[] = [
    'ORDERED_ITEM',
    'CCW_ORDER_LINE_ID',
    'LINE_STATUS',
    'CHARGE_CYCLE',
    'ITEM_TOTAL_(USD)',
    'IS_REFUND_LINE',
    'PREV_ORDER_LINE_ID',
    'ACTION',
  ];
  billScheduleDataSource = new MatTableDataSource<any>([
    {
      ORDERED_ITEM: 'LIC-MR-E',
      CCW_ORDER_LINE_ID: '353910887',
      LINE_STATUS: 'Active',
      CHARGE_CYCLE: '2-Jan-25 to 1-Apr-25',
      'ITEM_TOTAL_(USD)': '3193.49',
      IS_REFUND_LINE: 'N',
      PREV_ORDER_LINE_ID: '343333005',
      ACTION: 'Download',
    },
    {
      ORDERED_ITEM: 'LIC-MR-E',
      CCW_ORDER_LINE_ID: '353910888',
      LINE_STATUS: 'Active',
      CHARGE_CYCLE: '2-Jan-25 to 1-Apr-25',
      'ITEM_TOTAL_(USD)': '3193.49',
      IS_REFUND_LINE: 'N',
      PREV_ORDER_LINE_ID: '343333006',
      ACTION: 'Download',
    },
    {
      ORDERED_ITEM: 'LIC-MR-E',
      CCW_ORDER_LINE_ID: '353910889',
      LINE_STATUS: 'Active',
      CHARGE_CYCLE: '2-Jan-25 to 1-Apr-25',
      'ITEM_TOTAL_(USD)': '3193.49',
      IS_REFUND_LINE: 'N',
      PREV_ORDER_LINE_ID: '343333007',
      ACTION: 'Download',
    },
    {
      ORDERED_ITEM: 'LIC-MR-E',
      CCW_ORDER_LINE_ID: '353910890',
      LINE_STATUS: 'Active',
      CHARGE_CYCLE: '2-Jan-25 to 1-Apr-25',
      'ITEM_TOTAL_(USD)': '3193.49',
      IS_REFUND_LINE: 'N',
      PREV_ORDER_LINE_ID: '343333008',
      ACTION: 'Download',
    },
    {
      ORDERED_ITEM: 'LIC-MR-E',
      CCW_ORDER_LINE_ID: '353910891',
      LINE_STATUS: 'Active',
      CHARGE_CYCLE: '2-Jan-25 to 1-Apr-25',
      'ITEM_TOTAL_(USD)': '3193.49',
      IS_REFUND_LINE: 'N',
      PREV_ORDER_LINE_ID: '343333009',
      ACTION: 'Download',
    },
  ]);

  constructor(private sidebarService: SidebarService, private router: Router) {}

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

    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      const state = navigation.extras.state as {
        billData: any;
        orderId: string;
        subRefId: string;
      };

      this.billData = state.billData;

      // Update component properties if they were passed
      if (state.orderId) this.orderId = state.orderId;
      if (state.subRefId) this.subRefId = state.subRefId;

      console.log('Received bill data in details component:', this.billData);

      // You might want to use this data to load more specific details
      if (this.billData && this.billData.BILL_DATE) {
        console.log('Bill date received:', this.billData.BILL_DATE);
        // You could call a service method here to load detailed data for this bill
        // this.loadBillDetails(this.billData.BILL_DATE, this.billData.BILL_NUMBER);
      }
    }
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
      'ccw',
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
}
