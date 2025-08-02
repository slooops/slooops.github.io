import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { SidebarService } from '../../sidebar.service';
import * as XLSX from 'xlsx';
import { Router } from '@angular/router';
import { DatePipe, Location } from '@angular/common';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { ApiHttpService } from '../../providers/http.service';
import { offset } from '@popperjs/core';
import { ro } from 'date-fns/locale';

@Component({
  selector: 'app-o2c-bill-schedule',
  templateUrl: './o2c-bill-schedule.component.html',
  styleUrls: ['./o2c-bill-schedule.component.css'],
})
export class O2cBillScheduleComponent {
  orderId: string = '28221819418344'; // Placeholder for order ID
  subRefId: string = 'Sub2252774'; // Placeholder for subscription reference ID
  invoiceId: string = '32219418347'; // Placeholder for invoice ID
  offsetId: string = '35699'; // Placeholder for offset ID

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
  billScheduleSummaryDataSource = new MatTableDataSource<any>();

  billScheduleDataLoaded = true; // Set to false when implementing real data loading
  billScheduleDisplayedColumns: string[] = [];
  billScheduleDataSource = new MatTableDataSource<any>();

  constructor(
    private sidebarService: SidebarService,
    private router: Router,
    private location: Location,
    private destroyManager: DestroyManager,
    private http: ApiHttpService,
    private datePipe: DatePipe
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
      // this.subRefId = navState.rowData?.SUBSCRIPTION_ID;
      // this.offsetId = navState.rowData?.OFFSET_ID || this.offsetId;
    }

    console.log('Navigation state:', navState);

    this.getBillScheduleHeader(this.subRefId);
    this.getBillSchedule(this.offsetId);
  }

  private getBillScheduleHeader(subRefId: string): void {
    console.log('Fetching bill schedule header for subRefId:', subRefId);
    this.http
      .get('sbp-bill-schedule-header', this.destroyManager, {
        params: { subRefId: [subRefId] },
      })
      .subscribe((data: any) => {
        console.log('Bill Schedule Header:', data);
        if (data.length > 0) {
          this.billScheduleSummaryDisplayedColumns = Object.keys(data[0]);
          const index =
            this.billScheduleSummaryDisplayedColumns.indexOf('OFFSET_ID');
          if (index > -1) {
            this.billScheduleSummaryDisplayedColumns.splice(index, 1);
          }
        }
        this.billScheduleSummaryDataSource = new MatTableDataSource(data);
      });
  }

  private getBillSchedule(offsetId: string): void {
    this.http
      .get('sbp-bill-schedule', this.destroyManager, {
        params: { offsetId: [offsetId] },
      })
      .subscribe((data: any) => {
        console.log('Bill Schedules:', data);
        if (data.length > 0) {
          this.billScheduleDisplayedColumns = Object.keys(data[0]);
          const index = this.billScheduleDisplayedColumns.indexOf('OFFSET_ID');
          if (index > -1) {
            this.billScheduleDisplayedColumns.splice(index, 1);
          }
        }
        this.billScheduleDataSource = new MatTableDataSource(data);
      });
  }

  getBillScheduleLines(element: any): void {
    console.log('Fetching bill schedule lines for element:', element);
    const offsetId = element['OFFSET_ID'];
    const billDate = this.datePipe.transform(
      element['BILL_DATE'],
      'MM/dd/yyyy'
    );
    this.http
      .get('sbp-bill-schedule-lines', this.destroyManager, {
        params: { offsetId: [offsetId], billDate: [billDate] },
      })
      .subscribe((data: any) => {
        console.log('Bill Schedule Lines:', data);
        this.navigateToBillDetails(data);
      });
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
        if (acronyms.includes(word)) {
          return word.toUpperCase();
        }
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
    this.router.navigate(['/o2c-bill-details'], {
      state: {
        billData: rowData,
        orderId: rowData['WEB_ORDER_ID'],
        subRefId: rowData['SUBSCRIPTION_REF_ID'],
        circleStatus: this.circleStatus,
        summaryTableData: this.billScheduleSummaryDataSource.data,
      },
    });
  }
}
