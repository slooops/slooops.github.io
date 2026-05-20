import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { SidebarService } from '../../sidebar.service';
import ExcelJS from 'exceljs';
import { Router } from '@angular/router';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { ApiHttpService } from '../../providers/http.service';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { O2cSidebarNavComponent } from '../../shared/o2c-sidebar-nav/o2c-sidebar-nav.component';
import { O2cProcessFlowComponent } from '../../components/o2c-process-flow/o2c-process-flow.component';
import { LoadingSymbolComponent } from '../../loading-symbol/loading-symbol.component';

@Component({
  selector: 'app-o2c-bill-details',
  templateUrl: './o2c-bill-details.component.html',
  styleUrls: ['./o2c-bill-details.component.css'],
  imports: [
    CommonModule,
    MatTableModule,
    O2cSidebarNavComponent,
    O2cProcessFlowComponent,
    LoadingSymbolComponent,
  ],
  standalone: true,
})
export class O2cBillDetailsComponent {
  orderId: string = ''; // Placeholder for order ID
  subRefId: string = ''; // Placeholder for subscription reference ID
  billId: string = ''; // Placeholder for bill ID

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

  billScheduleSummaryLoaded = true; // Set to false when implementing real data loading
  billScheduleSummaryDisplayedColumns: string[] = [];
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
      billNum?: string;
      circleStatus?: { [key: string]: number };
      billData?: any;
      summaryTableData?: any[];
    };

    if (navState) {
      this.orderId = navState.orderId;
      this.subRefId = navState.subRefId;
      this.billId = navState.billNum || this.billId;
      this.circleStatus = navState.circleStatus;
      if (navState.summaryTableData.length > 0) {
        this.billScheduleSummaryDisplayedColumns = Object.keys(
          navState.summaryTableData[0],
        );
        const index =
          this.billScheduleSummaryDisplayedColumns.indexOf('OFFSET_ID');
        if (index > -1) {
          this.billScheduleSummaryDisplayedColumns.splice(index, 1);
        }
      }
      this.billScheduleSummaryDataSource = new MatTableDataSource(
        navState.summaryTableData,
      );

      if (navState.billData.length > 0) {
        this.billScheduleDisplayedColumns = Object.keys(navState.billData[0]);
        const index = this.billScheduleDisplayedColumns.indexOf('OFFSET_ID');
        if (index > -1) {
          this.billScheduleDisplayedColumns.splice(index, 1);
        }
      }
      this.billScheduleDataSource = new MatTableDataSource(navState.billData);
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

  async handleDownload(
    data: any[],
    fileName: string = 'ExportedData',
    sheetName: string = 'Data',
  ): Promise<void> {
    if (!data?.length) {
      console.warn('No data to export');
      return;
    }

    console.log('Exporting data:', data);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName.substring(0, 31));

    const headers = Object.keys(data[0]);
    worksheet.addRow(headers);
    data.forEach((row) => worksheet.addRow(headers.map((h) => row[h])));

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
}
