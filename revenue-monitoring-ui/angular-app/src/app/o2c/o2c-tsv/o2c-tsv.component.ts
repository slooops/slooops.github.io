import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { SidebarService } from '../../sidebar.service';
import * as XLSX from 'xlsx';
import { Router } from '@angular/router';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { ApiHttpService } from 'src/app/providers/http.service';

@Component({
  selector: 'app-o2c-tsv',
  templateUrl: './o2c-tsv.component.html',
  styleUrl: './o2c-tsv.component.css',
  providers: [DestroyManager],
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
  financialSummaryDisplayedColumns: string[] = [];
  financialSummaryDataSource = new MatTableDataSource<any>([]);

  table1Loaded = false; // Set to false when implementing real data loading
  table1DisplayedColumns: string[] = [];
  table1DataSource = new MatTableDataSource<any>();

  table2Loaded = false; // Set to false when implementing real data loading
  table2DisplayedColumns: string[] = [];
  table2DataSource = new MatTableDataSource<any>();

  table3Loaded = false; // Set to false when implementing real data loading
  table3DisplayedColumns: string[] = [];
  table3DataSource = new MatTableDataSource<any>();

  rowData: any = null;
  sourceComponent: string | null = null;
  isTsvCreated: boolean = false;

  constructor(
    private location: Location,
    private router: Router,
    private destroyManager: DestroyManager,
    private http: ApiHttpService
  ) {}

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

    this.getTsvTopSku(navState.rowData);
    this.getTsvSubSku(navState.rowData);
    this.getTsvAccounts(navState.rowData);

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
      this.financialSummaryDisplayedColumns = Object.keys(
        navState.financialData[0] || {}
      );
      console.log('Financial Summary Data:', navState.financialData);
      this.financialSummaryDataSource.data = navState.financialData;
    }
  }

  getTsvTopSku(rowData: any) {
    const payload = {
      subscriptionIds: rowData.SUBSCRIPTION_REF_ID,
      webOrderLineIds: rowData.WEBORDER_LINEID,
    };

    this.http
      .get('tsv-top-sku', this.destroyManager, {
        params: payload,
      })
      .subscribe((data: any) => {
        console.log('TSV Top SKU Data:', data);

        const currencyColumns = ['TOTAL_SALES_VALUE'];
        const formattedData = data.map((row: any) => ({
          ...row,
          ...currencyColumns.reduce((acc, col) => {
            if (row[col] != null) {
              const num =
                typeof row[col] === 'string' ? parseFloat(row[col]) : row[col];
              acc[col] = isNaN(num)
                ? row[col]
                : num.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });
            }
            return acc;
          }, {} as any),
        }));
        this.table1DisplayedColumns = Object.keys(formattedData[0] || {});
        this.table1DataSource.data = formattedData;
        this.table1Loaded = true;
      });
  }

  getTsvSubSku(rowData: any) {
    const payload = {
      subscriptionIds: rowData.SUBSCRIPTION_REF_ID,
      webOrderLineIds: rowData.WEBORDER_LINEID,
    };

    this.http
      .get('tsv-sub-sku', this.destroyManager, {
        params: payload,
      })
      .subscribe((data: any) => {
        console.log('TSV Sub SKU Data:', data);
        const currencyColumns = ['AMOUNT'];
        const formattedData = data.map((row: any) => ({
          ...row,
          ...currencyColumns.reduce((acc, col) => {
            if (row[col] != null) {
              const num =
                typeof row[col] === 'string' ? parseFloat(row[col]) : row[col];
              acc[col] = isNaN(num)
                ? row[col]
                : num.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });
            }
            return acc;
          }, {} as any),
        }));
        this.table2DisplayedColumns = Object.keys(formattedData[0] || {});
        this.table2DataSource.data = formattedData;
        this.table2Loaded = true;
      });
  }

  getTsvAccounts(rowData: any) {
    const payload = {
      subscriptionIds: rowData.SUBSCRIPTION_REF_ID,
      webOrderLineIds: rowData.WEBORDER_LINEID,
    };

    this.http
      .get('tsv-accounts', this.destroyManager, {
        params: payload,
      })
      .subscribe((data: any) => {
        console.log('TSV accounts Data:', data);
        const currencyColumns = ['AMOUNT'];
        const formattedData = data.map((row: any) => ({
          ...row,
          ...currencyColumns.reduce((acc, col) => {
            if (row[col] != null) {
              const num =
                typeof row[col] === 'string' ? parseFloat(row[col]) : row[col];
              acc[col] = isNaN(num)
                ? row[col]
                : num.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });
            }
            return acc;
          }, {} as any),
        }));
        this.table3DisplayedColumns = Object.keys(formattedData[0] || {});
        this.table3DataSource.data = formattedData;
        this.table3Loaded = true;
      });
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
