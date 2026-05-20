import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { SidebarService } from '../../sidebar.service';
import ExcelJS from 'exceljs';
import { Router } from '@angular/router';
import { DatePipe, Location } from '@angular/common';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { ApiHttpService } from '../../providers/http.service';
import { offset } from '@popperjs/core';
import { ro, th } from 'date-fns/locale';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { O2cSidebarNavComponent } from '../../shared/o2c-sidebar-nav/o2c-sidebar-nav.component';
import { O2cProcessFlowComponent } from '../../components/o2c-process-flow/o2c-process-flow.component';
import { LoadingSymbolComponent } from '../../loading-symbol/loading-symbol.component';

@Component({
  selector: 'app-o2c-bill-schedule',
  templateUrl: './o2c-bill-schedule.component.html',
  styleUrls: ['./o2c-bill-schedule.component.css'],
  imports: [
    CommonModule,
    MatTableModule,
    O2cSidebarNavComponent,
    O2cProcessFlowComponent,
    LoadingSymbolComponent,
  ],
  standalone: true,
})
export class O2cBillScheduleComponent {
  orderId: string = ''; // Placeholder for order ID
  subRefId: string = ''; // Placeholder for subscription reference ID
  billNum: string = '';
  offsetId: string = ''; // Placeholder for offset ID

  expanded = {
    subscription: false,
    invoice: false,
  };

  circleStatus: { [key: string]: number } = {
    Order: 0,
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

  billScheduleLoaded = false;
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

  billScheduleDataLoaded = false;
  billScheduleDisplayedColumns: string[] = [];
  billScheduleDataSource = new MatTableDataSource<any>();

  constructor(
    private sidebarService: SidebarService,
    private router: Router,
    private location: Location,
    private destroyManager: DestroyManager,
    private http: ApiHttpService,
    private datePipe: DatePipe,
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
      circleStatus?: { [key: string]: number };
    };

    if (navState.rowData && navState.orderId) {
      this.orderId = navState.orderId;
      this.subRefId = navState.rowData?.SUBSCRIPTION_ID;
      this.billNum = navState.rowData?.BILL_NUMBER || '';
      this.circleStatus = navState.circleStatus || this.circleStatus;
    }

    console.log('Navigation state:', navState);

    this.getBillScheduleHeader(this.subRefId);
  }

  private getBillScheduleHeader(subRefId: string): void {
    this.http
      .get('sbp-bill-schedule-header', this.destroyManager, {
        params: { subRefId: [subRefId] },
      })
      .subscribe((data: any) => {
        const safeData = data || [];
        if (safeData.length > 0) {
          this.offsetId = safeData[0]?.OFFSET_ID;
          this.billScheduleSummaryDisplayedColumns = Object.keys(safeData[0]);
          const index =
            this.billScheduleSummaryDisplayedColumns.indexOf('OFFSET_ID');
          if (index > -1) {
            this.billScheduleSummaryDisplayedColumns.splice(index, 1);
          }
          this.billScheduleSummaryDataSource = new MatTableDataSource(safeData);

          // Only call getBillSchedule if we have an offsetId
          if (this.offsetId) {
            this.getBillSchedule(this.offsetId);
          } else {
            // No offsetId means no bill schedule data
            this.billScheduleDataSource = new MatTableDataSource([]);
            this.billScheduleDataLoaded = true;
          }
        } else {
          // No header data available
          this.billScheduleSummaryDataSource = new MatTableDataSource([]);
          this.billScheduleDataSource = new MatTableDataSource([]);
          this.billScheduleDataLoaded = true;
        }

        this.billScheduleLoaded = true;
      });
  }

  private getBillSchedule(offsetId: string): void {
    this.http
      .get('sbp-bill-schedule', this.destroyManager, {
        params: { offsetId: [offsetId] },
      })
      .subscribe((data: any) => {
        console.log('Bill schedule data:', data);
        const safeData = data || [];
        if (safeData.length > 0) {
          this.billScheduleDisplayedColumns = Object.keys(safeData[0]);
          const index = this.billScheduleDisplayedColumns.indexOf('OFFSET_ID');
          if (index > -1) {
            this.billScheduleDisplayedColumns.splice(index, 1);
          }
        }
        this.billScheduleDataSource = new MatTableDataSource(safeData);
        this.billScheduleDataLoaded = true;
      });
  }

  getBillScheduleLines(element: any): void {
    const offsetId = element['OFFSET_ID'];
    const billDate = this.datePipe.transform(
      element['BILL_DATE'],
      'MM/dd/yyyy',
    );

    this.http
      .get('sbp-bill-schedule-lines', this.destroyManager, {
        params: { offsetId: [offsetId], billDate: [billDate] },
      })
      .subscribe((data: any) => {
        const safeData = data || [];
        if (safeData.length > 0) {
          this.navigateToBillDetails(safeData);
        } else {
          console.warn('No bill schedule lines available for this element');
          alert('No detailed billing information available for this date.');
        }
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

  async handleDownload(
    data: any[],
    fileName: string = 'ExportedData',
    sheetName: string = 'Data',
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName.substring(0, 31));

    if (data?.length > 0) {
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);
      data.forEach((row) => worksheet.addRow(headers.map((h) => row[h])));
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  handlePrint(): void {
    window.print();
  }

  handleShare(): void {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'O2C View All Dashboard',
        text: 'Check out this data dashboard',
        url,
      });
    } else {
      navigator.clipboard
        .writeText(url)
        .then(() => alert('Link copied to clipboard'))
        .catch(() => alert('Unable to copy link'));
    }
  }

  isBilledLate(element: any): boolean {
    if (!element['INVOICED_DATE'] || !element['BILL_DATE']) {
      return false;
    }

    const billedDate = new Date(element['INVOICED_DATE']);
    const scheduledDate = new Date(element['BILL_DATE']);

    return billedDate > scheduledDate;
  }

  navigateToBillDetails(rowData: any): void {
    console.log('Navigating to bill details with data:', rowData);
    this.router.navigate(['/o2c-bill-details'], {
      state: {
        billNumber: this.billNum,
        billData: rowData,
        orderId: this.billScheduleSummaryDataSource.data[0]?.WEB_ORDER_ID,
        subRefId:
          this.billScheduleSummaryDataSource.data[0]?.SUBSCRIPTION_REF_ID,
        circleStatus: this.circleStatus,
        summaryTableData: this.billScheduleSummaryDataSource.data,
      },
    });
  }
}
