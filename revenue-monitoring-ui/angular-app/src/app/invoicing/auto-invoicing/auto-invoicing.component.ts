import { SelectionModel } from '@angular/cdk/collections';
import { DatePipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { DataService } from 'src/app/providers/data.service';
import { ApiHttpService } from 'src/app/providers/http.service';
import * as XLSX from 'xlsx';
import { Chart } from 'chart.js';

@Component({
  selector: 'app-auto-invoicing',
  templateUrl: './auto-invoicing.component.html',
  styleUrl: './auto-invoicing.component.css',
})
export class AutoInvoicingComponent implements OnInit, AfterViewInit {
  autoInvoicingSummary: AutoInvoicingErrorSummary[];
  @ViewChild('detailsPaginator') detailsPaginator: MatPaginator;
  @ViewChild('summaryPaginator') summaryPaginator: MatPaginator;

  summaryDatasource: any;
  constructor(
    private http: ApiHttpService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
    private dataService: DataService
  ) {}
  ngOnInit(): void {
    this.getRolErrorSummaryPeriodStatus();
    this.getAutoInvoiceErrorSummary();
    this.getAutoInvoiceErrorDetails();
    this.totalImpactData$ = this.dataService.totalImpactData$;
  }

  ngAfterViewInit(): void {
    // this.paginator.page.subscribe((event: PageEvent) => {
    //   if (this.isFiltered) {
    //     this.getTransactionDataFiltered(
    //       this.selectedRows,
    //       event.pageIndex,
    //       event.pageSize
    //     );
    //   } else {
    //     this.getRolTransactionData(event.pageIndex, event.pageSize);
    //   }
    // });
    if (this.openChartModal) {
      this.getChartTotals();
    }
  }

  summaryColumns: string[] = [
    'PERIOD_NAME',
    'APPLICATION_NAME',
    'PROCESS_FLOW',
    'ORG_NAME',
    'AMOUNT',
    'TRANSACTION_DATE',
    'AGING',
    'ASSIGNED_TO',
    'ASSIGNED_DATE',
    'COMMENTS',
  ];
  totalImpactData$: Observable<any>;
  summaryDisplayedColumns: string[] = [];
  selection = new SelectionModel<any>(true, []);
  selectedData: any;
  totalSummaryRecords: number = 0;
  summaryLoadTime: string;
  periodName: string = '';
  periodEnd: string = '';
  summaryLoading: boolean = true;
  processFlowTotals: { [key: string]: string | number };
  originalData: any[] = [];
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' | '' = '';
  selectedRows: any[] = [];
  dataSource: any;
  autoInvocingErrorDetails: AutoInvoicingErrorDetails[];
  autoInvocingErrorDetailsFiltered: AutoInvoicingErrorDetails[];
  isFiltered: boolean = false;
  filtereddataSource: any;
  totalRecords: number = 0;
  isLoading: boolean = false;
  selectedSummaryData: AutoInvoicingErrorSummary[] = [];
  isModalOpen: boolean = false;
  totalRecordsFiltered: number = 0;
  openChartModal: boolean = false;
  chart: any;
  chartLoading: boolean = true;
  getRolErrorSummaryPeriodStatus() {
    this.http.get('monitoring-period-status').subscribe((data: any) => {
      this.periodName = data[0].PERIOD_NAME;
      this.periodEnd = this.dateTransform(data[0].END_DATE);
    });
  }

  getAutoInvoiceErrorSummary() {
    this.summaryLoadTime = `Last Updated: ...`;
    this.http.get('auto-invoice-error-summary').subscribe((data: any) => {
      this.processFlowTotals = this.calculateTotalsByProcessFlow(data);
      this.dataService.setTab2Data(this.processFlowTotals);
      console.log(data);
      this.summaryDisplayedColumns = ['select', ...this.summaryColumns];
      this.autoInvoicingSummary = this.formatData(data);
      this.autoInvoicingSummary.forEach((row) => {
        row.TRANSACTION_DATE = this.dateTransform(row.TRANSACTION_DATE);
        row.ASSIGNED_DATE = this.dateTransform(row.ASSIGNED_DATE);
      });
      this.originalData = this.autoInvoicingSummary;

      this.summaryDatasource =
        new MatTableDataSource<AutoInvoicingErrorSummary>(
          this.autoInvoicingSummary
        );

      if (this.summaryPaginator) {
        if (this.summaryDatasource.paginator !== this.summaryPaginator) {
          this.summaryDatasource.paginator = this.summaryPaginator;
        }

        this.totalSummaryRecords = this.autoInvoicingSummary.length;

        // setTimeout(() => {
        //   this.paginator.length = this.totalRecords;
        //   this.paginator.pageIndex = pageIndex;
        //   this.paginator.pageSize = pageSize;
        //   this.cdr.detectChanges();
        // });
        this.summaryLoading = false;
        this.summaryLoadTime = `Last Updated: ${new Date().toLocaleString()}`;
      }
    });
  }

  sortData(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection =
        this.sortDirection === 'desc'
          ? 'asc'
          : this.sortDirection === 'asc'
          ? ''
          : 'desc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'desc';
    }

    if (this.sortDirection === '') {
      this.summaryDatasource.data = [...this.originalData];
    } else {
      this.summaryDatasource.data = [...this.summaryDatasource.data].sort(
        (a, b) => this.compare(a[column], b[column], column)
      );
    }
  }

  compare(a: any, b: any, column: string): number {
    let valueA = a;
    let valueB = b;

    if (column === 'AMOUNT') {
      valueA = parseFloat(a.replace(/[$,]/g, '')) || 0;
      valueB = parseFloat(b.replace(/[$,]/g, '')) || 0;
    } else if (column === 'AGING') {
      valueA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      valueB = parseInt(b.replace(/\D/g, ''), 10) || 0;
    }

    const comparison = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
    return this.sortDirection === 'asc' ? comparison : -comparison;
  }

  getSortIcon(): string {
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  isSortedColumn(column: string): boolean {
    return this.sortColumn === column && this.sortDirection !== '';
  }

  isEscalated(element: any): boolean {
    return element.AGING > 6;
  }

  getCircleNumber(element: any): any {
    const aging = element.AGING;
    if (aging >= 7 && aging <= 10) {
      return 1;
    } else if (aging >= 11 && aging <= 16) {
      return 2;
    } else if (aging > 16) {
      return 3;
    }
    return 0;
  }

  dateTransform(dateString: string): string {
    return this.datePipe.transform(dateString, 'MM/dd/yyyy');
  }

  formatData(data: any[]): any[] {
    return data.map((row) => {
      const formattedRow = { ...row };
      const amountKey =
        'AMOUNT' in row ? 'AMOUNT' : 'amount' in row ? 'amount' : null;

      if (amountKey) {
        formattedRow[amountKey] = `$${Number(row[amountKey]).toLocaleString(
          undefined,
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )}`;
      }

      return formattedRow;
    });
  }

  onRowSelectionChange(event: MatCheckboxChange, row: any) {
    this.selection.toggle(row);

    if (event.checked) {
      this.selectedRows.push(row);
    } else {
      this.selectedRows = this.selectedRows.filter(
        (selectedRow) => selectedRow !== row
      );
    }

    if (this.selectedRows.length > 0) {
      this.getAutoInvoiceErrorDetailsFiltered(this.selectedRows);
    } else {
      this.isFiltered = false;
      this.dataSource = new MatTableDataSource<AutoInvoicingErrorDetails>(
        this.autoInvocingErrorDetails
      );
      this.dataSource.paginator = this.detailsPaginator;
      this.filtereddataSource = null;
      this.detailsPaginator.length = this.totalRecords;
      this.cdr.detectChanges();
    }
  }

  detailsDisplayedColumns: string[] = [
    'PERIOD_NAME',
    'APPLICATION_NAME',
    'PROCESS_FLOW',
    'ORG_NAME',
    'AMOUNT',
    'TRANSACTION_DATE',
    'SALES_ORDER',
    'INTERFACE_LINE_ID',
    'ERROR_MESSAGE',
  ];

  getAutoInvoiceErrorDetails() {
    this.isLoading = true;
    this.isFiltered = false;

    this.http.get('auto-invoice-error-details').subscribe({
      next: (data: any) => {
        this.autoInvocingErrorDetails = data;
        this.autoInvocingErrorDetails = this.formatData(
          this.autoInvocingErrorDetails
        );
        this.autoInvocingErrorDetails.forEach((row) => {
          row.TRANSACTION_DATE = this.dateTransform(row.TRANSACTION_DATE);
        });
        this.dataSource = new MatTableDataSource<AutoInvoicingErrorDetails>(
          this.autoInvocingErrorDetails
        );

        if (this.detailsPaginator) {
          if (this.dataSource.paginator !== this.detailsPaginator) {
            this.dataSource.paginator = this.detailsPaginator;
          }

          this.totalRecords = this.autoInvocingErrorDetails.length;

          // setTimeout(() => {
          //   this.paginator.length = this.totalRecords;
          //   this.paginator.pageIndex = pageIndex;
          //   this.paginator.pageSize = pageSize;
          //   this.cdr.detectChanges();
          // });
        }
      },
      error: (err) => {
        console.error('Error fetching data', err);
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  getAutoInvoiceErrorDetailsFiltered(data: any) {
    this.isLoading = true;
    this.isFiltered = true;
    const periodNames = data.map((row) => row.PERIOD_NAME);
    const ouNames = data.map((row) => row.ORG_NAME);
    const appNames = data.map((row) => row.APPLICATION_NAME);
    const uniqueIds = data.map((row) => row.TRANSACTION_DATE);

    const pageRequest = {
      periodNames: periodNames.join(','),
      ouNames: ouNames.join(','),
      appNames: appNames.join(','),
      uniqueIds: uniqueIds.join(','),
    };

    this.http
      .get('auto-invoice-error-details-filtered', { params: pageRequest })
      .subscribe({
        next: (data: any) => {
          this.autoInvocingErrorDetailsFiltered =
            data.autoInvoiceErrorDetailsFiltered;

          this.autoInvocingErrorDetailsFiltered = this.formatData(
            this.autoInvocingErrorDetailsFiltered
          );

          this.autoInvocingErrorDetailsFiltered.forEach((row) => {
            row.TRANSACTION_DATE = this.dateTransform(row.TRANSACTION_DATE);
          });

          console.log(this.autoInvocingErrorDetailsFiltered);

          this.filtereddataSource =
            new MatTableDataSource<AutoInvoicingErrorDetails>(
              this.autoInvocingErrorDetailsFiltered
            );

          if (this.detailsPaginator) {
            this.filtereddataSource.paginator = this.detailsPaginator;
            setTimeout(() => {
              this.detailsPaginator.length =
                this.autoInvocingErrorDetailsFiltered.length;
              this.cdr.detectChanges();
            });
          }
        },
        error: (err) => {
          console.error('Error fetching filtered data', err);
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        },
      });
  }

  replaceUnderscore(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const specialWords = [
      'name',
      'amount',
      'interface',
      'error',
      'number',
      'total',
      'hold',
      'pending',
      'status',
      'num',
      'year',
      'status',
      'sub',
      'staging',
      'id',
      'line',
    ];

    return value
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => {
        if (word !== 'IOL') {
          const lowerWord = word.toLowerCase();
          if (specialWords.includes(lowerWord)) {
            return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
          }
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        } else {
          return word;
        }
      })
      .join(' ');
  }

  viewDetails() {
    this.selectedSummaryData = this.selection.selected;
    if (!this.selectedSummaryData || this.selectedSummaryData.length === 0) {
      console.error('No data selected.');
      return;
    }

    this.openRowModal();
  }

  openRowModal(): void {
    if (!this.selectedSummaryData || this.selectedSummaryData.length === 0) {
      console.error('No selectedSummaryData found:', this.selectedSummaryData);
      return;
    }

    this.isModalOpen = true;
  }

  closeAssignModal(event: any): void {
    this.isModalOpen = false;
    if (event === 'successful') {
      this.selection.clear();
      this.summaryDatasource = null;
      this.selectedRows = [];
      this.isFiltered = false;
      this.filtereddataSource = null;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.getAutoInvoiceErrorSummary();
      }, 1000);
    }
  }

  calculateTotalsByProcessFlow(data: any[]): {
    [key: string]: string | number;
  } {
    const totals: { [key: string]: number } = {
      '3 - Auto Invoice': 0,
    };

    data.forEach((item) => {
      if (item.PROCESS_FLOW !== null) {
        const processFlowKey = item.PROCESS_FLOW;

        if (totals.hasOwnProperty(processFlowKey)) {
          totals[processFlowKey] += Number(item.AMOUNT);
        }
      }
    });

    const formattedTotals: { [key: string]: string | number } = {};
    Object.keys(totals).forEach((key) => {
      formattedTotals[key] =
        totals[key] === 0
          ? '0'
          : totals[key] === undefined || totals[key] === null
          ? 'N/A'
          : totals[key] >= 1_000_000
          ? `$${(totals[key] / 1_000_000).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}M`
          : `$${totals[key].toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
    });

    return formattedTotals;
  }

  export() {
    if (this.isFiltered) {
      this.exportTableToExcel(
        this.autoInvocingErrorDetailsFiltered,
        'AutoInv Details Filtered',
        'AutoInv_Details_Filtered'
      );
    } else {
      this.exportTableToExcel(
        this.autoInvocingErrorDetails,
        'AutoInv Error Details',
        'AutoInv_Error_Details'
      );
    }
  }

  exportTableToExcel(data: any[], sheetName: string, filename: string) {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  getChartTotals() {
    this.chartLoading = true;

    this.http.get('rol-chart-totals').subscribe((data: any) => {
      // Extract labels and counts from the API response
      const labels = data.map((entry) => entry.PERIOD_NAME);
      const counts = data.map((entry) => entry.COUNT_RECORDS);

      // Fetch the details data to pass to the chart
      this.http.get('rol-chart-details').subscribe((detailsData: any) => {
        // Group details data by PERIOD_NAME
        const groupedData = detailsData.reduce((acc, curr) => {
          const period = curr.PERIOD_NAME;

          // Initialize an array for the period if it doesn't exist
          if (!acc[period]) {
            acc[period] = [];
          }

          // Push the current record into the array for its period
          acc[period].push(curr);

          return acc;
        }, {});

        // Create chart with fetched data and grouped details
        this.createHistoricalErrorTrendChart(labels, counts, groupedData);
        this.chartLoading = false;
      });
    });
  }

  // Create the chart with dynamic data
  createHistoricalErrorTrendChart(
    labels: string[],
    data: number[],
    groupedData: any
  ) {
    const ctx = document.getElementById(
      'historicalErrorTrend'
    ) as HTMLCanvasElement;

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels, // Use dynamic labels from chart totals
        datasets: [
          {
            label: 'Number of Errors',
            data: data, // Use dynamic data from chart totals
            borderColor: '#007dab',
            backgroundColor: 'rgba(0, 125, 171, 0.2)',
            fill: true,
            pointRadius: 5,
            tension: 0.2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Time (Months)',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Number of Errors',
            },
            beginAtZero: true,
          },
        },
        plugins: {
          tooltip: {
            displayColors: false, // Remove color box
            callbacks: {
              // Customize the tooltip content
              label: (tooltipItem: any) => {
                const periodName = tooltipItem.label; // Get the month (PERIOD_NAME)
                const totalErrors = tooltipItem.raw; // Get the total errors from the chart data
                const details = groupedData[periodName]; // Get the grouped details for this month

                // Initialize an array to store the tooltip lines
                const tooltipLines = [
                  `Total Errors: ${totalErrors}`, // Display the total number of errors
                ];

                // Format the grouped details
                if (details) {
                  tooltipLines.push(
                    ...details.map(
                      (item: any) =>
                        `${item.APPLICATION_NAME}: ${item.COUNT_RECORDS}`
                    )
                  );
                } else {
                  tooltipLines.push('No details available');
                }

                return tooltipLines; // Return the tooltip content as an array of strings
              },
            },
          },
        },
      },
    });
  }

  openChart() {
    this.openChartModal = true;

    setTimeout(() => {
      // Initialize the chart after the modal is visible
      this.getChartTotals();
    }, 0);
  }
}

interface AutoInvoicingErrorSummary {
  PERIOD_NAME: string;
  APPLICATION_NAME: string;
  PROCESS_FLOW: string;
  ORG_NAME: string;
  AMOUNT: string;
  AGING: string;
  ASSIGNED_TO: string;
  COMMENTS: string;
  TRANSACTION_DATE: string;
  ASSIGNED_DATE: string;
}

export interface AutoInvoicingErrorDetails {
  AMOUNT: string;
  APPLICATION_NAME: string;
  ERROR_MESSAGE: string;
  INTERFACE_LINE_ID: string;
  ORG_NAME: string;
  PERIOD_NAME: string;
  PROCESS_FLOW: string;
  SALES_ORDER: string;
  TRANSACTION_DATE: string;
}
