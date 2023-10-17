import { SelectionModel } from '@angular/cdk/collections';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ApiHttpService } from 'src/app/providers/http.service';

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
  length: number;

  grandTotalSalesOrderCount: number = 0;
  grandTotalOrderValue: number = 0;
  grandTotalTotalLineCount: number = 0;

  ngOnInit(): void {
    this.getOrderLifecycleRevSummary();
  }

  getOrderLifecycleRevSummary() {
    this.http.get('order-status-rev-summary').subscribe((data: any) => {
      this.test(data);
      this.setSortAndPaginator();
    });
  }

  test(originalData) {
    const groupedData = [];

    for (const item of originalData) {
      // Find the account in the groupedData array
      let account = groupedData.find((group) => group.account === item.ACCOUNT);

      // If the account doesn't exist, create it
      if (!account) {
        account = {
          account: item.ACCOUNT,
          salesOrderSum: 0,
          totalOrderValueSum: 0,
          totalLineCountSum: 0, // Initialize totalLineCountSum
          deals: [],
        };
        groupedData.push(account);
      }

      // Find the deal in the account's deals array
      let deal = account.deals.find((deal) => deal.dealId === item.DEAL_ID);

      // If the deal doesn't exist, create it
      if (!deal) {
        deal = {
          dealId: item.DEAL_ID,
          salesOrderSum: 0,
          totalOrderValueSum: 0,
          totalLineCountSum: 0, // Initialize totalLineCountSum
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
      };

      // Add the order status to the deal's orderStatuses array
      deal.orderStatuses.push(orderStatus);

      // Update the salesOrderSum, totalOrderValueSum, and totalLineCountSum at each level
      account.salesOrderSum += orderStatus.salesOrderCount;
      account.totalOrderValueSum += orderStatus.totalOrderValue;
      account.totalLineCountSum += orderStatus.totalLineCount;
      deal.salesOrderSum += orderStatus.salesOrderCount;
      deal.totalOrderValueSum += orderStatus.totalOrderValue;
      deal.totalLineCountSum += orderStatus.totalLineCount;
    }

    // Calculate the sum of salesOrderCount, totalOrderValue, and totalLineCount at the order status level
    groupedData.forEach((account) => {
      account.deals.forEach((deal) => {
        deal.orderStatuses.forEach((status) => {
          deal.salesOrderSum += status.salesOrderCount;
          deal.totalOrderValueSum += status.totalOrderValue;
          deal.totalLineCountSum += status.totalLineCount;
        });
      });
    });

    // Calculate the sum of salesOrderCount, totalOrderValue, and totalLineCount at the deal level
    groupedData.forEach((account) => {
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

    // Calculate the sum of salesOrderCount, totalOrderValue, and totalLineCount at the account level
    groupedData.forEach((account) => {
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

    this.newDataSource = new MatTableDataSource(groupedData);

    this.length = groupedData.length;

    // Calculate the grand totals
    groupedData.forEach((account) => {
      account.deals.forEach((deal) => {
        deal.orderStatuses.forEach((status) => {
          this.grandTotalSalesOrderCount += status.salesOrderCount;
          this.grandTotalOrderValue += status.totalOrderValue;
          this.grandTotalTotalLineCount += status.totalLineCount;
        });
      });
    });
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
