import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { SidebarService } from '../../sidebar.service';
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
  billId = 'BILL123456'; // Placeholder for bill ID

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
      WEB_ORDER_ID: '95075262',
      SUB_REF_ID: 'SR100112',
      BILLING_SCHEDULE: '1/2',
      BILLING_FREQUENCY: 'Recurring Term',
      BILLING_DATE: '06/08/2022',
      BILLING_PERIOD: '06/08/2022 - 06/07/2027',
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
    },
    {
      ORDERED_ITEM: 'LIC-MR-E',
      CCW_ORDER_LINE_ID: '353910888',
      LINE_STATUS: 'Active',
      CHARGE_CYCLE: '2-Jan-25 to 1-Apr-25',
      'ITEM_TOTAL_(USD)': '3193.49',
      IS_REFUND_LINE: 'N',
      PREV_ORDER_LINE_ID: '343333006',
    },
    {
      ORDERED_ITEM: 'LIC-MR-E',
      CCW_ORDER_LINE_ID: '353910889',
      LINE_STATUS: 'Active',
      CHARGE_CYCLE: '2-Jan-25 to 1-Apr-25',
      'ITEM_TOTAL_(USD)': '3193.49',
      IS_REFUND_LINE: 'N',
      PREV_ORDER_LINE_ID: '343333007',
    },
    {
      ORDERED_ITEM: 'LIC-MR-E',
      CCW_ORDER_LINE_ID: '353910890',
      LINE_STATUS: 'Active',
      CHARGE_CYCLE: '2-Jan-25 to 1-Apr-25',
      'ITEM_TOTAL_(USD)': '3193.49',
      IS_REFUND_LINE: 'N',
      PREV_ORDER_LINE_ID: '343333008',
    },
    {
      ORDERED_ITEM: 'LIC-MR-E',
      CCW_ORDER_LINE_ID: '353910891',
      LINE_STATUS: 'Active',
      CHARGE_CYCLE: '2-Jan-25 to 1-Apr-25',
      'ITEM_TOTAL_(USD)': '3193.49',
      IS_REFUND_LINE: 'N',
      PREV_ORDER_LINE_ID: '343333009',
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
      orderId?: string;
      subRefId?: string;
      circleStatus?: { [key: string]: number };
      billData?: any;
      summaryTableData?: any[];
    };

    console.log('Navigation state:', navState);

    if (navState) {
      this.orderId = navState.orderId;
      this.subRefId = navState.subRefId;
      this.billId = navState.billData?.BILL_NUMBER || this.billId;
      this.circleStatus = navState.circleStatus;
      this.billScheduleSummaryDataSource.data =
        this.billScheduleSummaryDataSource.data.map((item) => ({
          ...item,
          WEB_ORDER_ID: this.orderId,
          SUB_REF_ID: this.subRefId,
          BILLING_SCHEDULE:
            navState.summaryTableData?.[0]?.BILLING_SCHEDULE ||
            item.BILLING_SCHEDULE,
          BILLING_FREQUENCY:
            navState.summaryTableData?.[0]?.BILLING_FREQUENCY ||
            item.BILLING_FREQUENCY,
          BILLING_DATE: navState.billData?.BILL_DATE || item.BILLING_DATE,
          BILLING_PERIOD:
            navState.billData?.BILLING_PERIOD || item.BILLING_PERIOD,
          STATUS: navState.billData?.STATUS || item.STATUS,
        }));
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

  handlePrint(): void {
    window.print();
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

  isBilledLate(element: any): boolean {
    if (!element['BILLED_ON_DATE'] || !element['BILL_DATE']) {
      return false;
    }

    const billedDate = new Date(element['BILLED_ON_DATE']);
    const scheduledDate = new Date(element['BILL_DATE']);

    return billedDate > scheduledDate;
  }
}
