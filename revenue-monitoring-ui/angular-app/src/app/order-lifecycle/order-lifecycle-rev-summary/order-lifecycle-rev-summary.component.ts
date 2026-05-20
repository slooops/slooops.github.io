import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { ExportToExcelService } from 'src/app/providers/export-to-excel.service';
import { ApiHttpService } from 'src/app/providers/http.service';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { LoadingSymbolComponent } from '../../loading-symbol/loading-symbol.component';
import { PaginationComponent } from '../../ui/atoms/pagination/pagination.component';
import { PageChangeEvent } from '../../ui/types/common.types';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorArrowLineDownBold } from '@ng-icons/phosphor-icons/bold';

@Component({
  selector: 'app-order-lifecycle-rev-summary',
  templateUrl: './order-lifecycle-rev-summary.component.html',
  styleUrls: ['./order-lifecycle-rev-summary.component.scss'],
  providers: [DestroyManager, provideIcons({ phosphorArrowLineDownBold })],
  imports: [
    CommonModule,
    MatDialogModule,
    LoadingSymbolComponent,
    PaginationComponent,
    NgIcon,
  ],
  standalone: true,
})
export class OrderLifecycleRevSummaryComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<OrderLifecycleRevSummaryComponent>,
    http: ApiHttpService,
    private destroyManager: DestroyManager,
    private exportToExcelService: ExportToExcelService,
  ) {
    this.http = http;
  }
  protected http: ApiHttpService;

  groupedData = [];
  flattenedData = [];
  grandTotalData = [];
  accountCompleted = false;

  ngOnInit(): void {
    this.getOrderLifecycleRevSummary();
  }

  getOrderLifecycleRevSummary() {
    this.http
      .get('order-status-rev-summary', this.destroyManager)
      .subscribe((data: any) => {
        this.pivotData(data);
      });
  }

  pivotData(originalData) {
    for (const item of originalData) {
      let account = this.groupedData.find(
        (group) => group.account === item.ACCOUNT,
      );

      if (!account) {
        account = {
          account: item.ACCOUNT,
          salesOrderSum: 0,
          totalOrderValueSum: 0,
          deals: [],
          qtrRevEstimateSum: 0,
          qtrAccrualGlRevSum: 0,
          qtrInvGlRevSum: 0,
          qtrRevRecogSum: 0,
          revNotRecogSum: 0,
          expanded: false,
        };
        this.groupedData.push(account);
      }

      let deal = account.deals.find((deal) => deal.dealId === item.DEAL_ID);

      if (!deal) {
        deal = {
          dealId: item.DEAL_ID,
          salesOrderSum: 0,
          totalOrderValueSum: 0,
          orderStatuses: [],
          qtrRevEstimateSum: 0,
          qtrAccrualGlRevSum: 0,
          qtrInvGlRevSum: 0,
          qtrRevRecogSum: 0,
          revNotRecogSum: 0,
          expanded: false,
        };
        account.deals.push(deal);
      }

      const orderStatus = {
        status: item.ORDER_STATUS,
        salesOrderCount: +item.SALES_ORDER_COUNT,
        totalOrderValue: +item.TOTAL_ORDER_VALUE,
        qtrRevEstimate: +item.CURRENT_QTR_REV_ESTIMATE,
        qtrAccrualGlRev: +item.CURRENT_QTR_ACCR_GL_REV,
        qtrInvGlRev: +item.CURRENT_QTR_INV_GL_REV,
        qtrRevRecog: +item.CURRENT_QTR_REVENUE_RECOG,
        revNotRecog: +item.REVENUE_NOT_RECOG,
      };

      deal.orderStatuses.push(orderStatus);

      account.salesOrderSum += orderStatus.salesOrderCount;
      account.totalOrderValueSum += orderStatus.totalOrderValue;
      account.qtrRevEstimateSum += orderStatus.qtrRevEstimate;
      account.qtrAccrualGlRevSum += orderStatus.qtrAccrualGlRev;
      account.qtrInvGlRevSum += orderStatus.qtrInvGlRev;
      account.qtrRevRecogSum += orderStatus.qtrRevRecog;
      account.revNotRecogSum += orderStatus.revNotRecog;

      deal.salesOrderSum += orderStatus.salesOrderCount;
      deal.totalOrderValueSum += orderStatus.totalOrderValue;
      deal.qtrRevEstimateSum += orderStatus.qtrRevEstimate;
      deal.qtrAccrualGlRevSum += orderStatus.qtrAccrualGlRev;
      deal.qtrInvGlRevSum += orderStatus.qtrInvGlRev;
      deal.qtrRevRecogSum += orderStatus.qtrRevRecog;
      deal.revNotRecogSum += orderStatus.revNotRecog;
    }

    let grandTotalSalesOrderCount = 0;
    let grandTotalOrderValue = 0;
    let grandTotalQtrRevEstimate = 0;
    let grandTotalQtrAccrualGlRev = 0;
    let grandTotalQtrInvGlRev = 0;
    let grandTotalQtrRevRecog = 0;
    let grandTotalRevNotRecog = 0;

    this.groupedData.forEach((account) => {
      account.deals.forEach((deal) => {
        deal.orderStatuses.forEach((status) => {
          grandTotalSalesOrderCount += parseFloat(status.salesOrderCount);
          grandTotalOrderValue += parseFloat(status.totalOrderValue);
          grandTotalQtrRevEstimate += parseFloat(status.qtrRevEstimate);
          grandTotalQtrAccrualGlRev += parseFloat(status.qtrAccrualGlRev);
          grandTotalQtrInvGlRev += parseFloat(status.qtrInvGlRev);
          grandTotalQtrRevRecog += parseFloat(status.qtrRevRecog);
          grandTotalRevNotRecog += parseFloat(status.revNotRecog);
        });
      });
    });

    this.groupedData.sort((a, b) => b.qtrRevEstimateSum - a.qtrRevEstimateSum);

    this.grandTotalData.push({
      account: 'Grand Total',
      grandTotalSalesOrderCount,
      grandTotalOrderValue,
      grandTotalQtrRevEstimate,
      grandTotalQtrAccrualGlRev,
      grandTotalQtrInvGlRev,
      grandTotalQtrRevRecog,
      grandTotalRevNotRecog,
    });

    this.calculateTotalPages();
    this.setPage(1);
  }

  pageSize = 5;
  currentPage = 1;
  totalPages = 0;
  paginatedData: any[] = [];
  pages: number[] = [];

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.groupedData.length / this.pageSize);
    this.pages = Array.from(
      { length: this.totalPages },
      (_, index) => index + 1,
    );
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      const startIndex = (page - 1) * this.pageSize;
      this.paginatedData = this.groupedData.slice(
        startIndex,
        startIndex + this.pageSize,
      );
    }
  }

  prevPage(): void {
    this.setPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.setPage(this.currentPage + 1);
  }

  onPageChange(event: PageChangeEvent): void {
    this.pageSize = event.pageSize;
    this.calculateTotalPages();
    this.setPage(event.pageIndex + 1);
  }

  sortingColumn: string = '';

  sortEnable(column: string) {
    const selectedColumn = this.displayedColumns.find(
      (col) => col.name === column,
    );

    if (selectedColumn) {
      if (selectedColumn.sortingOrder === 'desc') {
        selectedColumn.sorted = false;
      } else {
        selectedColumn.sorted = true;
      }
      selectedColumn.sortingOrder =
        selectedColumn.sortingOrder === ''
          ? 'asc'
          : selectedColumn.sortingOrder === 'asc'
            ? 'desc'
            : '';
    }

    if (column === 'ACCOUNT/ DEAL IDs') {
      this.sortData('account', selectedColumn.sortingOrder);
    } else if (column === 'COUNT OF SALES ORDER') {
      this.sortData('salesOrderSum', selectedColumn.sortingOrder);
    } else if (column === 'SUM OF ORDER VALUE ($M)') {
      this.sortData('totalOrderValueSum', selectedColumn.sortingOrder);
    } else if (column === 'TOTAL QTR REVENUE ESTIMATE ($M) (A)') {
      this.sortData('qtrRevEstimateSum', selectedColumn.sortingOrder);
    } else if (column === 'INVOICED GL REVENUE FOR QTR ($M) (B)') {
      this.sortData('qtrInvGlRevSum', selectedColumn.sortingOrder);
    } else if (column === 'ACCRUED GL REVENUE FOR QTR ($M) (C)') {
      this.sortData('qtrAccrualGlRevSum', selectedColumn.sortingOrder);
    } else if (column === 'TOTAL REV RECOGNIZED FOR QTR ($M) (D = B+C)') {
      this.sortData('qtrRevRecogSum', selectedColumn.sortingOrder);
    } else if (column === 'REVENUE NOT RECOGNIZED ($M) (E = A-D)') {
      this.sortData('revNotRecogSum', selectedColumn.sortingOrder);
    }
  }

  sortData(column: string, sortingOrder: string) {
    this.paginatedData.sort((a, b) => {
      const valueA = a[column] || '';
      const valueB = b[column] || '';

      if (typeof valueA === 'string') {
        return sortingOrder === 'asc'
          ? valueA.localeCompare(valueB)
          : sortingOrder === 'desc'
            ? valueB.localeCompare(valueA)
            : valueA.localeCompare(valueB);
      } else {
        return sortingOrder === 'asc'
          ? valueA - valueB
          : sortingOrder === 'desc'
            ? valueB - valueA
            : valueA - valueB;
      }
    });
  }

  isDealCompleted(deal): boolean {
    return deal.orderStatuses.every((status) => status.status === 'Completed');
  }

  isAccountCompleted(account): boolean {
    this.accountCompleted = account.deals.every((deal) =>
      this.isDealCompleted(deal),
    );
    return this.accountCompleted;
  }

  flattenData(groupedData) {
    const flattenedData = [];

    groupedData.forEach((account) => {
      const accountData = {
        ACCOUNT: account.account,
        'DEAL ID': '',
        'ORDER STATUS': '',
        'COUNT OF SALES ORDER':
          account.account !== 'GRAND TOTAL'
            ? account.salesOrderSum
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            : account.grandTotalSalesOrderCount
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
        'SUM OF ORDER VALUE':
          account.account !== 'GRAND TOTAL'
            ? '$ ' +
              account.totalOrderValueSum
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            : '$ ' +
              account.grandTotalOrderValue
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
        'TOTAL QTR REVENUE ESTIMATE':
          account.account === 'GRAND TOTAL'
            ? '$ ' +
              account.grandTotalQtrRevEstimate
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            : '$ ' +
              account.qtrRevEstimateSum
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
        'INVOICED GL REVENUE FOR QTR':
          account.account === 'GRAND TOTAL'
            ? '$ ' +
              account.grandTotalQtrInvGlRev
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            : '$ ' +
              account.qtrInvGlRevSum
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
        'ACCRUED GL REVENUE FOR QTR':
          account.account === 'GRAND TOTAL'
            ? '$ ' +
              account.grandTotalQtrAccrualGlRev
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            : '$ ' +
              account.qtrAccrualGlRevSum
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
        'TOTAL REV RECOGNIZED FOR QTR':
          account.account === 'GRAND TOTAL'
            ? '$ ' +
              account.grandTotalQtrRevRecog
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            : '$ ' +
              account.qtrRevRecogSum
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
        'REVENUE NOT RECOGNIZED':
          account.account === 'GRAND TOTAL'
            ? '$ ' +
              account.grandTotalRevNotRecog
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            : '$ ' +
              account.revNotRecogSum
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
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
          'TOTAL QTR REVENUE ESTIMATE':
            '$ ' +
            deal.qtrRevEstimateSum
              .toString()
              .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
          'INVOICED GL REVENUE FOR QTR':
            '$ ' +
            deal.qtrInvGlRevSum
              .toString()
              .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
          'ACCRUED GL REVENUE FOR QTR':
            '$ ' +
            deal.qtrAccrualGlRevSum
              .toString()
              .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
          'TOTAL REV RECOGNIZED FOR QTR':
            '$ ' +
            deal.qtrRevRecogSum
              .toString()
              .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
          'REVENUE NOT RECOGNIZED':
            '$ ' +
            deal.revNotRecogSum
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
    this.exportToExcelService.exportTableToExcel(data, sheetName, filename);
  }

  closeDialog() {
    this.dialogRef.close();
  }

  onOverlayClicked(): void {
    this.dialogRef.close(); // Close the modal when clicking the overlay
  }

  displayedColumns: {
    name: string;
    sorted: boolean;
    sortingOrder: 'asc' | 'desc' | '';
  }[] = [
    { name: 'Account/ Deal Ids', sorted: false, sortingOrder: '' },
    { name: 'Sales order count', sorted: false, sortingOrder: '' },
    { name: 'Order Value sum($M)', sorted: false, sortingOrder: '' },
    {
      name: 'Total Qtr Rev Estimate($M)(A)',
      sorted: false,
      sortingOrder: '',
    },
    {
      name: 'Invoiced GL rev for qtr($M)(B)',
      sorted: false,
      sortingOrder: '',
    },
    {
      name: 'Accrued GL rev for qtr($M)(C)',
      sorted: false,
      sortingOrder: '',
    },
    {
      name: 'Total rev recognized for qtr($M)(D = B+C)',
      sorted: false,
      sortingOrder: '',
    },
    {
      name: 'Rev not recognized($M)(E = A-D)',
      sorted: false,
      sortingOrder: '',
    },
  ];
}
