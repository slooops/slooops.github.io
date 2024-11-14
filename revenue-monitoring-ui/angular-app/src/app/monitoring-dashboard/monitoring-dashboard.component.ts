import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ApiHttpService } from 'src/app/providers/http.service';
import * as XLSX from 'xlsx';
import { SelectionModel } from '@angular/cdk/collections';
import { Chart } from 'chart.js';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { DataService } from '../providers/data.service';

@Component({
  selector: 'app-monitoring-dashboard',
  templateUrl: './monitoring-dashboard.component.html',
  styleUrl: './monitoring-dashboard.component.css',
})
export class MonitoringDashboardComponent<T>
  implements OnInit, OnChanges, AfterViewInit
{
  @ViewChild('detailsPaginator') detailsPaginator: MatPaginator;
  @ViewChild('summaryPaginator') summaryPaginator: MatPaginator;
  @Input() urls: { [key: string]: string };
  @Input() fieldKey: string;
  @Input() processFlowKeys: { [key: string]: number };
  @Input() periodStatus: any;
  @Input() detailsDisplayedColumns: string[];
  @Input() componentName: string;
  @Input() processFlowTabsToDisplay: string[];
  @Input() specialWords: string[];
  @Input() skippedWords: string[];
  @Input() subAppMapping: { [key: string]: string };
  @Input() dynamicTemplate: TemplateRef<any> | null = null;
  @Input() dynamicCss: string = '';
  @Input() isSubAppMapping: boolean = false;
  @Input() warningMessage: string = '';
  periodName: string = '';
  periodEnd: string = '';
  totalImpactData$: Observable<any>;
  updateUrl: string;
  webexUrl: string;
  processFlowhtml: string = '';
  processFlowcss: string = '';
  constructor(
    private http: ApiHttpService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
    private dataService: DataService
  ) {}
  ngOnInit(): void {
    this.getErrorSummary();
    this.getErrorDetails();
    this.updateUrl = this.urls['summaryUpdateUrl'];
    this.webexUrl = this.urls['webexMessageUrl'];
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
      // this.getChartTotals();
    }
  }
  ngOnChanges(changes: SimpleChanges) {
    if (this.periodStatus) {
      this.periodName = this.periodStatus[0].PERIOD_NAME;
      this.periodEnd = this.dateTransform(this.periodStatus[0].END_DATE);
    }
    this.processFlowTotals$ = this.dataService.getTabData(this.componentName);
  }

  summaryLoadTime: string;
  summaryData: any[];
  summaryDatasource: any;
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
  summaryDisplayedColumns: string[] = [];
  totalSummaryRecords: number = 0;
  summaryLoading: boolean = true;
  originalData: any[] = [];
  processFlowTotals$: Observable<{ [key: string]: string }>;
  getErrorSummary() {
    this.summaryLoadTime = `Last Updated: ...`;
    this.http.get(this.urls['summaryUrl']).subscribe((data: any) => {
      const totals = this.calculateTotalsByProcessFlow(data);
      this.dataService.setTabData(this.componentName, totals);
      this.summaryDisplayedColumns = ['select', ...this.summaryColumns];
      this.summaryData = this.formatData(data);
      this.summaryData.forEach((row) => {
        row.TRANSACTION_DATE = this.dateTransform(row.TRANSACTION_DATE);
        row.ASSIGNED_DATE = this.dateTransform(row.ASSIGNED_DATE);
        if (row.AGING == null) {
          row.AGING = this.getAging(row.TRANSACTION_DATE) + ' Days';
        } else {
          row.AGING = row.AGING + ' Days';
        }
      });
      this.originalData = this.summaryData;

      this.summaryDatasource = new MatTableDataSource<T>(this.summaryData);
      if (this.summaryPaginator) {
        if (this.summaryDatasource.paginator !== this.summaryPaginator) {
          this.summaryDatasource.paginator = this.summaryPaginator;
        }

        this.totalSummaryRecords = this.summaryData.length;

        // setTimeout(() => {
        //   this.paginator.length = this.totalRecords;
        //   this.paginator.pageIndex = pageIndex;
        //   this.paginator.pageSize = pageSize;
        //   this.cdr.detectChanges();
        // });
      }
      this.summaryLoading = false;
      this.summaryLoadTime = `Last Updated: ${new Date().toLocaleString()}`;
    });
  }

  calculateTotalsByProcessFlow(data: any[]): {
    [key: string]: string;
  } {
    data.forEach((item) => {
      if (item.PROCESS_FLOW !== null) {
        const processFlowKey = item.PROCESS_FLOW;

        if (this.processFlowKeys.hasOwnProperty(processFlowKey)) {
          this.processFlowKeys[processFlowKey] += Number(item.AMOUNT);
        }
      }
    });

    const formattedTotals: { [key: string]: string } = {};
    Object.keys(this.processFlowKeys).forEach((key) => {
      formattedTotals[key] =
        this.processFlowKeys[key] === 0
          ? '0'
          : this.processFlowKeys[key] === undefined ||
            this.processFlowKeys[key] === null
          ? 'N/A'
          : this.processFlowKeys[key] >= 1_000_000
          ? `$${(this.processFlowKeys[key] / 1_000_000).toLocaleString(
              undefined,
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}M`
          : `$${this.processFlowKeys[key].toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
    });

    return formattedTotals;
  }

  subAppMapper(key: string): string | undefined {
    return this.subAppMapping[key];
  }

  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' | '' = '';
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

  getAging(dateString: string): string {
    const today = new Date();
    const creationDate = new Date(dateString);
    const timeDifference = today.getTime() - creationDate.getTime();

    const agingInDays = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    return agingInDays.toString();
  }

  isSortedColumn(column: string): boolean {
    return this.sortColumn === column && this.sortDirection !== '';
  }

  isEscalated(element: any): boolean {
    const aging = element.AGING.split(' ')[0];
    return Number(aging) > 6;
  }

  escalationLevel: any = 0;
  getCircleNumber(element: any): any {
    const aging = Number(element.AGING.split(' ')[0]);
    if (aging >= 7 && aging <= 11) {
      this.escalationLevel = 1;
    } else if (aging > 11) {
      this.escalationLevel = 2;
    }
    return this.escalationLevel;
  }

  dateTransform(dateString: string): string {
    return this.datePipe.transform(dateString, 'MM/dd/yyyy');
  }

  formatData(data: any[]): any[] {
    return data.map((row) => {
      const formattedRow = { ...row };
      const amountKeys = [
        'AMOUNT',
        'BILL_TOTAL',
        'IOL_HOLD',
        'IOL_PENDING',
        'IOL_ERROR',
        'AR_INTERFACE',
        'AR_INTERFACE_ERROR',
        'INVOICED',
      ];
      let key;
      amountKeys.forEach((amountKey) => {
        key = amountKey in row ? amountKey : amountKey.toLowerCase();
        if (key in row) {
          if (formattedRow[key] == '-') {
            return;
          }
          formattedRow[key] = `$${Number(row[key]).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`;
        }
      });

      return formattedRow;
    });
  }

  selection = new SelectionModel<any>(true, []);
  selectedSummaryData: any[] = [];
  isModalOpen: boolean = false;
  selectedRows: any[] = [];
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
      this.getErrorDetailsFiltered(this.selectedRows);
    } else {
      this.isFiltered = false;
      this.dataSource = new MatTableDataSource<T>(this.errorDetails);
      this.dataSource.paginator = this.detailsPaginator;
      this.filtereddataSource = null;
      this.detailsPaginator.length = this.totalRecords;
      this.cdr.detectChanges();
    }
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
        this.getErrorSummary();
      }, 1000);
    }
  }

  dataSource: any;
  errorDetails: any[];
  errorDetailsFiltered: any[];
  isFiltered: boolean = false;
  filtereddataSource: any;
  totalRecords: number = 0;
  isLoading: boolean = false;
  totalRecordsFiltered: number = 0;
  getErrorDetails() {
    this.isLoading = true;
    this.isFiltered = false;

    this.http.get(this.urls['detailsUrl']).subscribe({
      next: (data: any) => {
        this.errorDetails = data;
        this.errorDetails = this.formatData(this.errorDetails);
        this.errorDetails.forEach((row) => {
          row.TRANSACTION_DATE = this.dateTransform(row.TRANSACTION_DATE);
          this.detailsDisplayedColumns.forEach((column) => {
            if (row[column] === '-') {
              row[column] = '--';
            }
          });
        });
        this.dataSource = new MatTableDataSource<T>(this.errorDetails);
        if (this.detailsPaginator) {
          if (this.dataSource.paginator !== this.detailsPaginator) {
            this.dataSource.paginator = this.detailsPaginator;
          }
          this.totalRecords = this.errorDetails.length;
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

  getErrorDetailsFiltered(data: any) {
    this.isLoading = true;
    this.isFiltered = true;
    const periodNames = data.map((row) => row.PERIOD_NAME);
    const ouNames = data.map((row) => row.ORG_NAME);
    const appNames = data.map((row) => row.APPLICATION_NAME);
    const processFlows = data.map((row) => row.PROCESS_FLOW);
    const uniqueIds = data.map((row) => row[this.fieldKey]);

    const pageRequest = {
      periodNames: periodNames.join(','),
      ouNames: ouNames.join(','),
      appNames: appNames.join(','),
      processFlows: processFlows.join(','),
      uniqueIds: uniqueIds.join(','),
    };

    this.http
      .get(this.urls['filteredDetailsUrl'], { params: pageRequest })
      .subscribe({
        next: (data: any) => {
          this.errorDetailsFiltered = data.errorDetailsFiltered;
          this.errorDetailsFiltered = this.formatData(
            this.errorDetailsFiltered
          );
          this.errorDetailsFiltered.forEach((row) => {
            row.TRANSACTION_DATE = this.dateTransform(row.TRANSACTION_DATE);
          });
          this.filtereddataSource = new MatTableDataSource<T>(
            this.errorDetailsFiltered
          );
          if (this.detailsPaginator) {
            this.filtereddataSource.paginator = this.detailsPaginator;
            setTimeout(() => {
              this.detailsPaginator.length = this.errorDetailsFiltered.length;
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
      return ''; // Return an empty string if value is null or undefined
    }

    return value
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => {
        if (!this.skippedWords.includes(word)) {
          const lowerWord = word.toLowerCase();
          if (this.specialWords.includes(lowerWord)) {
            return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
          }
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        } else {
          return word;
        }
      })
      .join(' ');
  }

  export() {
    if (this.isFiltered) {
      this.exportTableToExcel(
        this.errorDetailsFiltered,
        this.generateSheetName(this.componentName + ' Error Details Filtered'),
        this.componentName + '_Error_Details_Filtered'
      );
    } else {
      this.exportTableToExcel(
        this.errorDetails,
        this.generateSheetName(this.componentName + ' Error Details'),
        this.componentName + '_Error_Details'
      );
    }
  }

  generateSheetName(originalName: string): string {
    const maxNameLength = 31;
    let truncatedName = originalName.substring(0, maxNameLength);
    return truncatedName;
  }

  exportTableToExcel(data: any[], sheetName: string, filename: string) {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  chartLoading: boolean = true;
  chart: any;
  openChartModal: boolean = false;

  getChartTotals() {
    this.chartLoading = true;
    this.http.get(this.urls['chartTotalsUrl']).subscribe((data: any) => {
      const labels = data.map((entry) => entry.PERIOD_NAME);
      const counts = data.map((entry) => entry.COUNT_RECORDS);
      this.http
        .get(this.urls['chartDetailsUrl'])
        .subscribe((detailsData: any) => {
          const groupedData = detailsData.reduce((acc, curr) => {
            const period = curr.PERIOD_NAME;
            if (!acc[period]) {
              acc[period] = [];
            }
            acc[period].push(curr);
            return acc;
          }, {});

          this.createHistoricalErrorTrendChart(labels, counts, groupedData);
          this.chartLoading = false;
        });
    });
  }

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
        labels: labels,
        datasets: [
          {
            label: 'Number of Errors',
            data: data,
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
            displayColors: false,
            callbacks: {
              label: (tooltipItem: any) => {
                const periodName = tooltipItem.label;
                const totalErrors = tooltipItem.raw;
                const details = groupedData[periodName];
                const tooltipLines = [`Total Errors: ${totalErrors}`];
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

                return tooltipLines;
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
      this.getChartTotals();
    }, 0);
  }
}
