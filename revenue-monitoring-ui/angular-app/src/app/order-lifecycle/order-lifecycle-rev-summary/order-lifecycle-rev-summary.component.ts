import { SelectionModel } from '@angular/cdk/collections';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ApiHttpService } from 'src/app/providers/http.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-order-lifecycle-rev-summary',
  templateUrl: './order-lifecycle-rev-summary.component.html',
  styleUrls: ['./order-lifecycle-rev-summary.component.css'],
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

  ngOnInit(): void {
    this.getOrderLifecycleRevSummary();
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
