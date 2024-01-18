import { SelectionModel } from '@angular/cdk/collections';
import {
  Component,
  Inject,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ApiHttpService } from 'src/app/providers/http.service';
import * as XLSX from 'xlsx';

import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
// import { fromMatSort, sortRows } from './datasource-utils';
// import { fromMatPaginator, paginateRows } from './datasource-utils';

@Component({
  selector: 'app-order-lifecycle-rev-summary',
  templateUrl: './order-lifecycle-rev-summary.component.html',
  styleUrls: ['./order-lifecycle-rev-summary.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class OrderLifecycleRevSummaryComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<OrderLifecycleRevSummaryComponent>,
    @Inject(MAT_DIALOG_DATA) public injectData: any,
    http: ApiHttpService
  ) {
    this.http = http;
  }
  protected http: ApiHttpService;

  newDataSource: any;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  length: number;
  isNaN: Function = Number.isNaN;

  grandTotalSalesOrderCount: number = 0;
  grandTotalOrderValue: number = 0;
  grandTotalTotalLineCount: number = 0;
  groupedData = [];
  flattenedData = [];

  displayedRows$: Observable<ShipData[]>;

  dataSource = ELEMENT_DATA;
  columnsToDisplay = ['name', 'weight', 'symbol', 'position'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
  expandedElement: PeriodicElement | null;

  trackByFn(index: number, item: any): any {
    return item; // or return a unique identifier if available (e.g., item.id)
  }

  ngOnInit(): void {
    this.getOrderLifecycleRevSummary();

    const rows$ = of(exampleShips);

    // Debugging the Observable to see if data is coming through
    this.displayedRows$ = rows$;
    this.displayedRows$.subscribe((data) => {
      console.log('Rows data:', data);
    });
  }

  getOrderLifecycleRevSummary() {
    this.http.get('order-status-rev-summary').subscribe((data: any) => {
      this.pivotData(data);
      this.setSortAndPaginator();
    });
  }

  pivotData(originalData) {
    for (const item of originalData) {
      let account = this.groupedData.find(
        (group) => group.account === item.ACCOUNT
      );

      if (!account) {
        account = {
          account: item.ACCOUNT,
          salesOrderSum: 0,
          totalOrderValueSum: 0,
          totalLineCountSum: 0,
          deals: [],
        };
        this.groupedData.push(account);
      }

      let deal = account.deals.find((deal) => deal.dealId === item.DEAL_ID);

      if (!deal) {
        deal = {
          dealId: item.DEAL_ID,
          salesOrderSum: 0,
          totalOrderValueSum: 0,
          totalLineCountSum: 0,
          orderStatuses: [],
        };
        account.deals.push(deal);
      }

      // Create an order status object
      const orderStatus = {
        status: item.ORDER_STATUS,
        salesOrderCount: parseFloat(item.SALES_ORDER_COUNT),
        totalOrderValue: parseFloat(item.TOTAL_ORDER_VALUE),
        totalLineCount: parseFloat(item.TOTAL_LINE_COUNT),
        qtrRevEstimate: parseFloat(item.CURRENT_QTR_REV_ESTIMATE),
        qtrAccrualGlRev: parseFloat(item.CURRENT_QTR_ACCR_GL_REV),
        qtrInvGlRev: parseFloat(item.CURRENT_QTR_INV_GL_REV),
        qtrRevRecog: parseFloat(item.CURRENT_QTR_REVENUE_RECOG),
        revNotRecog: parseFloat(item.REVENUE_NOT_RECOG),
      };

      deal.orderStatuses.push(orderStatus);

      account.salesOrderSum += orderStatus.salesOrderCount;
      account.totalOrderValueSum += orderStatus.totalOrderValue;
      account.totalLineCountSum += orderStatus.totalLineCount;
      deal.salesOrderSum += orderStatus.salesOrderCount;
      deal.totalOrderValueSum += orderStatus.totalOrderValue;
      deal.totalLineCountSum += orderStatus.totalLineCount;
    }

    this.groupedData.forEach((account) => {
      account.deals.forEach((deal) => {
        deal.orderStatuses.forEach((status) => {
          deal.salesOrderSum += status.salesOrderCount;
          deal.totalOrderValueSum += status.totalOrderValue;
          deal.totalLineCountSum += status.totalLineCount;
        });
      });
    });

    this.groupedData.forEach((account) => {
      account.deals.forEach((deal) => {
        const orderStatusSalesOrderSum = deal.orderStatuses.reduce(
          (sum, status) => sum + status.salesOrderCount,
          0
        );
        const orderStatusTotalOrderValueSum = deal.orderStatuses.reduce(
          (sum, status) => sum + status.totalOrderValue,
          0
        );
        const orderStatusTotalLineCountSum = deal.orderStatuses.reduce(
          (sum, status) => sum + status.totalLineCount,
          0
        );
        deal.salesOrderSum = orderStatusSalesOrderSum;
        deal.totalOrderValueSum = orderStatusTotalOrderValueSum;
        deal.totalLineCountSum = orderStatusTotalLineCountSum;
      });
    });

    this.groupedData.forEach((account) => {
      const dealSalesOrderSum = account.deals.reduce(
        (sum, deal) => sum + deal.salesOrderSum,
        0
      );
      const dealTotalOrderValueSum = account.deals.reduce(
        (sum, deal) => sum + deal.totalOrderValueSum,
        0
      );
      const dealTotalLineCountSum = account.deals.reduce(
        (sum, deal) => sum + deal.totalLineCountSum,
        0
      );
      account.salesOrderSum = dealSalesOrderSum;
      account.totalOrderValueSum = dealTotalOrderValueSum;
      account.totalLineCountSum = dealTotalLineCountSum;
    });

    const grandTotalSalesOrderCount = this.groupedData.reduce(
      (total, account) => {
        return (
          total +
          account.deals.reduce((dealTotal, deal) => {
            return (
              dealTotal +
              deal.orderStatuses.reduce((statusTotal, status) => {
                return statusTotal + status.salesOrderCount;
              }, 0)
            );
          }, 0)
        );
      },
      0
    );

    const grandTotalOrderValue = this.groupedData.reduce((total, account) => {
      return (
        total +
        account.deals.reduce((dealTotal, deal) => {
          return (
            dealTotal +
            deal.orderStatuses.reduce((statusTotal, status) => {
              return statusTotal + status.totalOrderValue;
            }, 0)
          );
        }, 0)
      );
    }, 0);

    const grandTotalTotalLineCount = this.groupedData.reduce(
      (total, account) => {
        return (
          total +
          account.deals.reduce((dealTotal, deal) => {
            return (
              dealTotal +
              deal.orderStatuses.reduce((statusTotal, status) => {
                return statusTotal + status.totalLineCount;
              }, 0)
            );
          }, 0)
        );
      },
      0
    );

    let grandTotalQtrRevEstimate = 0;
    let grandTotalQtrAccrualGlRev = 0;
    let grandTotalQtrInvGlRev = 0;
    let grandTotalQtrRevRecog = 0;
    let grandTotalRevNotRecog = 0;

    this.groupedData.forEach((account) => {
      account.deals.forEach((deal) => {
        deal.orderStatuses.forEach((status) => {
          grandTotalQtrRevEstimate += parseFloat(status.qtrRevEstimate);
          grandTotalQtrAccrualGlRev += parseFloat(status.qtrAccrualGlRev);
          grandTotalQtrInvGlRev += parseFloat(status.qtrInvGlRev);
          grandTotalQtrRevRecog += parseFloat(status.qtrRevRecog);
          grandTotalRevNotRecog += parseFloat(status.revNotRecog);
        });
      });
    });

    this.groupedData.push({
      account: 'Grand Total',
      deals: [],
      grandTotalSalesOrderCount,
      grandTotalOrderValue,
      grandTotalTotalLineCount,
      grandTotalQtrRevEstimate,
      grandTotalQtrAccrualGlRev,
      grandTotalQtrInvGlRev,
      grandTotalQtrRevRecog,
      grandTotalRevNotRecog,
    });

    this.newDataSource = new MatTableDataSource(this.groupedData);

    this.length = this.groupedData.length;
  }

  applySort() {
    this.groupedData.sort((a, b) => {
      if (a.ACCOUNT < b.ACCOUNT) {
        return -1;
      }
      if (a.ACCOUNT > b.ACCOUNT) {
        return 1;
      }
      return 0;
    });

    this.newDataSource.data = this.groupedData;

    console.log(this.newDataSource.data);
  }

  flattenData(groupedData) {
    const flattenedData = [];

    groupedData.forEach((account) => {
      const accountData = {
        ACCOUNT: account.account,
        'DEAL ID': '',
        'ORDER STATUS': '',
        'COUNT OF SALES ORDER':
          account.account !== 'Grand Total'
            ? account.salesOrderSum
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            : account.grandTotalSalesOrderCount
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
        'SUM OF ORDER VALUE':
          account.account !== 'Grand Total'
            ? '$ ' +
              account.totalOrderValueSum
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            : '$ ' +
              account.grandTotalOrderValue
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
        'SUM OF TOTAL LINE COUNT':
          account.account !== 'Grand Total'
            ? account.totalLineCountSum
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            : account.grandTotalTotalLineCount
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
        'TOTAL QTR REVENUE ESTIMATE':
          account.account === 'Grand Total'
            ? '$ ' +
              account.grandTotalQtrRevEstimate
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            : '',
        'INVOICED GL REVENUE FOR QTR':
          account.account === 'Grand Total'
            ? '$ ' +
              account.grandTotalQtrInvGlRev
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            : '',
        'ACCRUED GL REVENUE FOR QTR':
          account.account === 'Grand Total'
            ? '$ ' +
              account.grandTotalQtrAccrualGlRev
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            : '',
        'TOTAL REV RECOGNIZED FOR QTR':
          account.account === 'Grand Total'
            ? '$ ' +
              account.grandTotalQtrRevRecog
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            : '',
        'REVENUE NOT RECOGNIZED':
          account.account === 'Grand Total'
            ? '$ ' +
              account.grandTotalRevNotRecog
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            : '',
      };

      flattenedData.push(accountData);

      account.deals.forEach((deal) => {
        const dealData = {
          ACCOUNT: '',
          'DEAL ID': deal.dealId,
          'ORDER STATUS': '',
          'COUNT OF SALES ORDER': deal.salesOrderSum
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
          'SUM OF ORDER VALUE':
            '$ ' +
            deal.totalOrderValueSum
              .toString()
              .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
          'SUM OF TOTAL LINE COUNT': deal.totalLineCountSum
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
        };

        flattenedData.push(dealData);

        deal.orderStatuses.forEach((status) => {
          const statusData = {
            ACCOUNT: '',
            'DEAL ID': '',
            'ORDER STATUS': status.status,
            'COUNT OF SALES ORDER': status.salesOrderCount
              .toString()
              .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
            'SUM OF ORDER VALUE':
              '$ ' +
              status.totalOrderValue
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
            'SUM OF TOTAL LINE COUNT': status.totalLineCount
              .toString()
              .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
            'TOTAL QTR REVENUE ESTIMATE':
              '$ ' +
              status.qtrRevEstimate
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
            'INVOICED GL REVENUE FOR QTR':
              '$ ' +
              status.qtrInvGlRev
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
            'ACCRUED GL REVENUE FOR QTR':
              '$ ' +
              status.qtrAccrualGlRev
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
            'TOTAL REV RECOGNIZED FOR QTR':
              '$ ' +
              status.qtrRevRecog
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
            'REVENUE NOT RECOGNIZED':
              '$ ' +
              status.revNotRecog
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
          };

          flattenedData.push(statusData);
        });
      });
    });

    return flattenedData;
  }

  export(sheetName: string, filename: string) {
    this.flattenedData = this.flattenData(this.groupedData);
    this.exportTableToExcel(this.flattenedData, sheetName, filename);
  }

  exportTableToExcel(data: any[], sheetName: string, filename: string) {
    let worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);

    let workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    let excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    this.saveAsExcelFile(excelBuffer, filename);
  }

  saveAsExcelFile(buffer: any, filename: string) {
    let data: Blob = new Blob([buffer], { type: 'application/octet-stream' });
    let url = window.URL.createObjectURL(data); // temp URL that points to the generated excel file data buffer
    let link = document.createElement('a'); // create link
    link.href = url;
    link.download = filename + '.xlsx';
    link.click(); // triggers the download process and save file prompt in browser
    window.URL.revokeObjectURL(url); // revoke temp URL
  }

  closeDialog() {
    this.dialogRef.close();
  }

  formatColumnHeader(columnName: string): string {
    return columnName.replace(/_/g, ' ');
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;

  setSortAndPaginator() {
    this.newDataSource.paginator = this.paginator;
  }
  selection = new SelectionModel<any>(true, []);
  selectedData: any;

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.newDataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.newDataSource.data.forEach((row) => this.selection.select(row));
  }

  onRowClicked(row: any) {
    this.selectedData = row;
  }

  displayedColumns = [
    'select',
    'ACCOUNT',
    'DEAL_ID',
    'ORDER_STATUS',
    'SALES_ORDER_COUNT',
    'TOTAL_ORDER_VALUE',
    'TOTAL_LINE_COUNT',
    'CURRENT_QTR_REV_ESTIMATE',
    'CURRENT_QTR_INV_GL_REV',
    'CURRENT_QTR_ACCR_GL_REV',
    'CURRENT_QTR_REVENUE_RECOG',
    'REVENUE_NOT_RECOG',
  ];

  newdisplayedColumns: string[] = [
    'accountDealStatus',
    'salesOrderSum',
    'totalOrderValueSum',
    'totalLineCountSum',
    'CURRENT_QTR_REV_ESTIMATE',
    'CURRENT_QTR_INV_GL_REV',
    'CURRENT_QTR_ACCR_GL_REV',
    'CURRENT_QTR_REVENUE_RECOG',
    'REVENUE_NOT_RECOG',
  ];
}
export interface ShipData {
  account: string;
  dealid?: string;
  orderstatus?: string;
  countofsalesorder: string;
  sumofordervalue: string;
  sumoftotallinecount: string;
  totalqtrrevenueestimate?: string;
  invoicedglrevenueforqtr?: string;
  accruedglrevenueforqtr?: string;
  totalrevrecognizedforqtr?: string;
  revenuenotrecognized?: string;
}

export const exampleShips: ShipData[] = [
  {
    account: 'CVS',
    dealid: undefined,
    orderstatus: undefined,
    countofsalesorder: '32',
    sumofordervalue: '332891855',
    sumoftotallinecount: '3604',
    totalqtrrevenueestimate: undefined,
    invoicedglrevenueforqtr: undefined,
    accruedglrevenueforqtr: undefined,
    totalrevrecognizedforqtr: undefined,
    revenuenotrecognized: undefined,
  },
  {
    account: undefined,
    dealid: '58582893',
    orderstatus: undefined,
    countofsalesorder: '25',
    sumofordervalue: '135427218',
    sumoftotallinecount: '3501',
    totalqtrrevenueestimate: undefined,
    invoicedglrevenueforqtr: undefined,
    accruedglrevenueforqtr: undefined,
    totalrevrecognizedforqtr: undefined,
    revenuenotrecognized: undefined,
  },
  {
    account: undefined,
    dealid: undefined,
    orderstatus: 'Completed',
    countofsalesorder: '20',
    sumofordervalue: '109339248',
    sumoftotallinecount: '3481',
    totalqtrrevenueestimate: '6735646',
    invoicedglrevenueforqtr: '329964.79',
    accruedglrevenueforqtr: '6405311.31',
    totalrevrecognizedforqtr: '6735276.1',
    revenuenotrecognized: '369.9',
  },
  {
    account: undefined,
    dealid: undefined,
    orderstatus: 'Pending Hold Release',
    countofsalesorder: '5',
    sumofordervalue: '26087970',
    sumoftotallinecount: '20',
    totalqtrrevenueestimate: '0',
    invoicedglrevenueforqtr: '0',
    accruedglrevenueforqtr: '0',
    totalrevrecognizedforqtr: '0',
    revenuenotrecognized: '0',
  },
  {
    account: undefined,
    dealid: '58593910',
    orderstatus: undefined,
    countofsalesorder: '5',
    sumofordervalue: '181940497',
    sumoftotallinecount: '96',
    totalqtrrevenueestimate: undefined,
    invoicedglrevenueforqtr: undefined,
    accruedglrevenueforqtr: undefined,
    totalrevrecognizedforqtr: undefined,
    revenuenotrecognized: undefined,
  },
  {
    account: undefined,
    dealid: undefined,
    orderstatus: 'Completed',
    countofsalesorder: '4',
    sumofordervalue: '178248398',
    sumoftotallinecount: '50',
    totalqtrrevenueestimate: '7982902',
    invoicedglrevenueforqtr: '186816.85',
    accruedglrevenueforqtr: '50245053.79',
    totalrevrecognizedforqtr: '50431870.64',
    revenuenotrecognized: '0.52',
  },
  {
    account: undefined,
    dealid: undefined,
    orderstatus: 'Pending Invoice Eligible',
    countofsalesorder: '1',
    sumofordervalue: '3692099',
    sumoftotallinecount: '46',
    totalqtrrevenueestimate: '161670',
    invoicedglrevenueforqtr: '0',
    accruedglrevenueforqtr: '0',
    totalrevrecognizedforqtr: '0',
    revenuenotrecognized: '161670',
  },
  {
    account: undefined,
    dealid: '58593918',
    orderstatus: undefined,
    countofsalesorder: '2',
    sumofordervalue: '15524140',
    sumoftotallinecount: '7',
    totalqtrrevenueestimate: undefined,
    invoicedglrevenueforqtr: undefined,
    accruedglrevenueforqtr: undefined,
    totalrevrecognizedforqtr: undefined,
    revenuenotrecognized: undefined,
  },
  {
    account: undefined,
    dealid: undefined,
    orderstatus: 'Completed',
    countofsalesorder: '2',
    sumofordervalue: '15524140',
    sumoftotallinecount: '7',
    totalqtrrevenueestimate: '11013926.94',
    invoicedglrevenueforqtr: '45896',
    accruedglrevenueforqtr: '11020810.94',
    totalrevrecognizedforqtr: '11066706.94',
    revenuenotrecognized: '0',
  },
  {
    account: 'Fedex',
    dealid: undefined,
    orderstatus: undefined,
    countofsalesorder: '70',
    sumofordervalue: '51928015',
    sumoftotallinecount: '20365',
    totalqtrrevenueestimate: undefined,
    invoicedglrevenueforqtr: undefined,
    accruedglrevenueforqtr: undefined,
    totalrevrecognizedforqtr: undefined,
    revenuenotrecognized: undefined,
  },
  {
    account: undefined,
    dealid: '57696066',
    orderstatus: undefined,
    countofsalesorder: '70',
    sumofordervalue: '51928015',
    sumoftotallinecount: '20365',
    totalqtrrevenueestimate: undefined,
    invoicedglrevenueforqtr: undefined,
    accruedglrevenueforqtr: undefined,
    totalrevrecognizedforqtr: undefined,
    revenuenotrecognized: undefined,
  },
  {
    account: undefined,
    dealid: undefined,
    orderstatus: 'Completed',
    countofsalesorder: '70',
    sumofordervalue: '51928015',
    sumoftotallinecount: '20365',
    totalqtrrevenueestimate: '12432938',
    invoicedglrevenueforqtr: '11193970.91',
    accruedglrevenueforqtr: '1237929.76',
    totalrevrecognizedforqtr: '12431900.67',
    revenuenotrecognized: '816.39',
  },
  {
    account: 'IRS',
    dealid: undefined,
    orderstatus: undefined,
    countofsalesorder: '12',
    sumofordervalue: '360694668',
    sumoftotallinecount: '892',
    totalqtrrevenueestimate: undefined,
    invoicedglrevenueforqtr: undefined,
    accruedglrevenueforqtr: undefined,
    totalrevrecognizedforqtr: undefined,
    revenuenotrecognized: undefined,
  },
  {
    account: undefined,
    dealid: '58530802',
    orderstatus: undefined,
    countofsalesorder: '9',
    sumofordervalue: '124006653',
    sumoftotallinecount: '847',
    totalqtrrevenueestimate: undefined,
    invoicedglrevenueforqtr: undefined,
    accruedglrevenueforqtr: undefined,
    totalrevrecognizedforqtr: undefined,
    revenuenotrecognized: undefined,
  },
  {
    account: undefined,
    dealid: undefined,
    orderstatus: 'Completed',
    countofsalesorder: '9',
    sumofordervalue: '124006653',
    sumoftotallinecount: '847',
    totalqtrrevenueestimate: '4986180',
    invoicedglrevenueforqtr: '10399.56',
    accruedglrevenueforqtr: '4975793.09',
    totalrevrecognizedforqtr: '4986192.65',
    revenuenotrecognized: '-13.09',
  },
  {
    account: undefined,
    dealid: '58533229',
    orderstatus: undefined,
    countofsalesorder: '1',
    sumofordervalue: '212544967',
    sumoftotallinecount: '37',
    totalqtrrevenueestimate: undefined,
    invoicedglrevenueforqtr: undefined,
    accruedglrevenueforqtr: undefined,
    totalrevrecognizedforqtr: undefined,
    revenuenotrecognized: undefined,
  },
  {
    account: undefined,
    dealid: undefined,
    orderstatus: 'Completed',
    countofsalesorder: '1',
    sumofordervalue: '212544967',
    sumoftotallinecount: '37',
    totalqtrrevenueestimate: '107699766.23',
    invoicedglrevenueforqtr: '107699766.23',
    accruedglrevenueforqtr: '0',
    totalrevrecognizedforqtr: '107699766.23',
    revenuenotrecognized: '0',
  },
  {
    account: undefined,
    dealid: '58533243',
    orderstatus: undefined,
    countofsalesorder: '1',
    sumofordervalue: '23760372',
    sumoftotallinecount: '3',
    totalqtrrevenueestimate: undefined,
    invoicedglrevenueforqtr: undefined,
    accruedglrevenueforqtr: undefined,
    totalrevrecognizedforqtr: undefined,
    revenuenotrecognized: undefined,
  },
  {
    account: undefined,
    dealid: undefined,
    orderstatus: 'Completed',
    countofsalesorder: '1',
    sumofordervalue: '23760372',
    sumoftotallinecount: '3',
    totalqtrrevenueestimate: '754297',
    invoicedglrevenueforqtr: '754297.53',
    accruedglrevenueforqtr: '0',
    totalrevrecognizedforqtr: '754297.53',
    revenuenotrecognized: '-0.53',
  },
  {
    account: undefined,
    dealid: '69698147',
    orderstatus: undefined,
    countofsalesorder: '1',
    sumofordervalue: '382676',
    sumoftotallinecount: '5',
    totalqtrrevenueestimate: undefined,
    invoicedglrevenueforqtr: undefined,
    accruedglrevenueforqtr: undefined,
    totalrevrecognizedforqtr: undefined,
    revenuenotrecognized: undefined,
  },
  {
    account: undefined,
    dealid: undefined,
    orderstatus: 'Pending Hold Release',
    countofsalesorder: '1',
    sumofordervalue: '382676',
    sumoftotallinecount: '5',
    totalqtrrevenueestimate: '382676',
    invoicedglrevenueforqtr: '0',
    accruedglrevenueforqtr: '0',
    totalrevrecognizedforqtr: '0',
    revenuenotrecognized: '382676',
  },
  {
    account: 'TMO',
    dealid: undefined,
    orderstatus: undefined,
    countofsalesorder: '8',
    sumofordervalue: '249995803',
    sumoftotallinecount: '441',
    totalqtrrevenueestimate: undefined,
    invoicedglrevenueforqtr: undefined,
    accruedglrevenueforqtr: undefined,
    totalrevrecognizedforqtr: undefined,
    revenuenotrecognized: undefined,
  },
  {
    account: undefined,
    dealid: '57441922',
    orderstatus: undefined,
    countofsalesorder: '1',
    sumofordervalue: '8840480',
    sumoftotallinecount: '2',
    totalqtrrevenueestimate: undefined,
    invoicedglrevenueforqtr: undefined,
    accruedglrevenueforqtr: undefined,
    totalrevrecognizedforqtr: undefined,
    revenuenotrecognized: undefined,
  },
  {
    account: undefined,
    dealid: undefined,
    orderstatus: 'Completed',
    countofsalesorder: '1',
    sumofordervalue: '8840480',
    sumoftotallinecount: '2',
    totalqtrrevenueestimate: '0',
    invoicedglrevenueforqtr: '0',
    accruedglrevenueforqtr: '0',
    totalrevrecognizedforqtr: '0',
    revenuenotrecognized: '0',
  },
  {
    account: undefined,
    dealid: '58303709',
    orderstatus: undefined,
    countofsalesorder: '4',
    sumofordervalue: '53986489',
    sumoftotallinecount: '400',
    totalqtrrevenueestimate: undefined,
    invoicedglrevenueforqtr: undefined,
    accruedglrevenueforqtr: undefined,
    totalrevrecognizedforqtr: undefined,
    revenuenotrecognized: undefined,
  },
  {
    account: undefined,
    dealid: undefined,
    orderstatus: 'Completed',
    countofsalesorder: '1',
    sumofordervalue: '16870000',
    sumoftotallinecount: '2',
    totalqtrrevenueestimate: '453675',
    invoicedglrevenueforqtr: '0',
    accruedglrevenueforqtr: '453675.3',
    totalrevrecognizedforqtr: '453675.3',
    revenuenotrecognized: '-0.3',
  },
  {
    account: undefined,
    dealid: undefined,
    orderstatus: 'Pending Hold Release',
    countofsalesorder: '1',
    sumofordervalue: '32223302',
    sumoftotallinecount: '1',
    totalqtrrevenueestimate: '0',
    invoicedglrevenueforqtr: '0',
    accruedglrevenueforqtr: '0',
    totalrevrecognizedforqtr: '0',
    revenuenotrecognized: '0',
  },
  {
    account: undefined,
    dealid: undefined,
    orderstatus: 'Pending Invoice Eligible',
    countofsalesorder: '2',
    sumofordervalue: '4893187',
    sumoftotallinecount: '397',
    totalqtrrevenueestimate: '4954',
    invoicedglrevenueforqtr: '0',
    accruedglrevenueforqtr: '0',
    totalrevrecognizedforqtr: '0',
    revenuenotrecognized: '4954',
  },
  {
    account: undefined,
    dealid: '58563419',
    orderstatus: undefined,
    countofsalesorder: '2',
    sumofordervalue: '178935065',
    sumoftotallinecount: '20',
    totalqtrrevenueestimate: undefined,
    invoicedglrevenueforqtr: undefined,
    accruedglrevenueforqtr: undefined,
    totalrevrecognizedforqtr: undefined,
    revenuenotrecognized: undefined,
  },
  {
    account: undefined,
    dealid: undefined,
    orderstatus: 'Completed',
    countofsalesorder: '2',
    sumofordervalue: '178935065',
    sumoftotallinecount: '20',
    totalqtrrevenueestimate: '3247265',
    invoicedglrevenueforqtr: '3145251.99',
    accruedglrevenueforqtr: '2971510.3',
    totalrevrecognizedforqtr: '6116762.29',
    revenuenotrecognized: '0',
  },
  {
    account: undefined,
    dealid: '58578212',
    orderstatus: undefined,
    countofsalesorder: '1',
    sumofordervalue: '8233769',
    sumoftotallinecount: '19',
    totalqtrrevenueestimate: undefined,
    invoicedglrevenueforqtr: undefined,
    accruedglrevenueforqtr: undefined,
    totalrevrecognizedforqtr: undefined,
    revenuenotrecognized: undefined,
  },
  {
    account: undefined,
    dealid: undefined,
    orderstatus: 'Completed',
    countofsalesorder: '1',
    sumofordervalue: '8233769',
    sumoftotallinecount: '19',
    totalqtrrevenueestimate: '213225',
    invoicedglrevenueforqtr: '211539.53',
    accruedglrevenueforqtr: '0',
    totalrevrecognizedforqtr: '211539.53',
    revenuenotrecognized: '1685.47',
  },
  {
    account: 'Grand Total',
    dealid: undefined,
    orderstatus: undefined,
    countofsalesorder: '122',
    sumofordervalue: '995510341',
    sumoftotallinecount: '25302',
    totalqtrrevenueestimate: '156069121.17000002',
    invoicedglrevenueforqtr: '123577903.39',
    accruedglrevenueforqtr: '77310084.49000001',
    totalrevrecognizedforqtr: '200887987.88000003',
    revenuenotrecognized: '552158.36',
  },
];

export interface OrderLifecycleRevSummaryModel {
  ACCOUNT: string;
  CURRENT_QTR_ACCR_GL_REV: string;
  CURRENT_QTR_INV_GL_REV: string;
  CURRENT_QTR_REVENUE_RECOG: string;
  CURRENT_QTR_REV_ESTIMATE: string;
  DEAL_ID: string;
  ORDER_STATUS: string;
  REVENUE_NOT_RECOG: string;
  SALES_ORDER_COUNT: string;
  TOTAL_LINE_COUNT: string;
  TOTAL_ORDER_VALUE: string;
}

export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
  description: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {
    position: 1,
    name: 'Hydrogen',
    weight: 1.0079,
    symbol: 'H',
    description: `Hydrogen is a chemical element with symbol H and atomic number 1. With a standard
        atomic weight of 1.008, hydrogen is the lightest element on the periodic table.`,
  },
  {
    position: 2,
    name: 'Helium',
    weight: 4.0026,
    symbol: 'He',
    description: `Helium is a chemical element with symbol He and atomic number 2. It is a
        colorless, odorless, tasteless, non-toxic, inert, monatomic gas, the first in the noble gas
        group in the periodic table. Its boiling point is the lowest among all the elements.`,
  },
  {
    position: 3,
    name: 'Lithium',
    weight: 6.941,
    symbol: 'Li',
    description: `Lithium is a chemical element with symbol Li and atomic number 3. It is a soft,
        silvery-white alkali metal. Under standard conditions, it is the lightest metal and the
        lightest solid element.`,
  },
  {
    position: 4,
    name: 'Beryllium',
    weight: 9.0122,
    symbol: 'Be',
    description: `Beryllium is a chemical element with symbol Be and atomic number 4. It is a
        relatively rare element in the universe, usually occurring as a product of the spallation of
        larger atomic nuclei that have collided with cosmic rays.`,
  },
  {
    position: 5,
    name: 'Boron',
    weight: 10.811,
    symbol: 'B',
    description: `Boron is a chemical element with symbol B and atomic number 5. Produced entirely
        by cosmic ray spallation and supernovae and not by stellar nucleosynthesis, it is a
        low-abundance element in the Solar system and in the Earth's crust.`,
  },
  {
    position: 6,
    name: 'Carbon',
    weight: 12.0107,
    symbol: 'C',
    description: `Carbon is a chemical element with symbol C and atomic number 6. It is nonmetallic
        and tetravalent—making four electrons available to form covalent chemical bonds. It belongs
        to group 14 of the periodic table.`,
  },
  {
    position: 7,
    name: 'Nitrogen',
    weight: 14.0067,
    symbol: 'N',
    description: `Nitrogen is a chemical element with symbol N and atomic number 7. It was first
        discovered and isolated by Scottish physician Daniel Rutherford in 1772.`,
  },
  {
    position: 8,
    name: 'Oxygen',
    weight: 15.9994,
    symbol: 'O',
    description: `Oxygen is a chemical element with symbol O and atomic number 8. It is a member of
         the chalcogen group on the periodic table, a highly reactive nonmetal, and an oxidizing
         agent that readily forms oxides with most elements as well as with other compounds.`,
  },
  {
    position: 9,
    name: 'Fluorine',
    weight: 18.9984,
    symbol: 'F',
    description: `Fluorine is a chemical element with symbol F and atomic number 9. It is the
        lightest halogen and exists as a highly toxic pale yellow diatomic gas at standard
        conditions.`,
  },
  {
    position: 10,
    name: 'Neon',
    weight: 20.1797,
    symbol: 'Ne',
    description: `Neon is a chemical element with symbol Ne and atomic number 10. It is a noble gas.
        Neon is a colorless, odorless, inert monatomic gas under standard conditions, with about
        two-thirds the density of air.`,
  },
];
