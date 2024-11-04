import { SelectionModel } from '@angular/cdk/collections';
import { DatePipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ApiHttpService } from 'src/app/providers/http.service';
import * as XLSX from 'xlsx';
import { Chart } from 'chart.js';
import { Observable } from 'rxjs';
import { DataService } from 'src/app/providers/data.service';

@Component({
  selector: 'app-pre-invoicing',
  templateUrl: './pre-invoicing.component.html',
  styleUrl: './pre-invoicing.component.css',
})
export class PreInvoicingComponent<T>
  implements OnInit, AfterViewInit, OnChanges
{
  preInvoicingSummary: any[];
  @ViewChild('detailsPaginator') detailsPaginator: MatPaginator;
  @ViewChild('summaryPaginator') summaryPaginator: MatPaginator;
  @Input() summaryUrl: string;
  @Input() detailsUrl: string;
  @Input() filteredDetailsUrl: string;
  @Input() fieldKey: string;
  @Input() processFlowKeys: { [key: string]: number };
  @Input() periodStatus: any;
  @Input() detailsDisplayedColumns: string[];

  summaryDatasource: any;
  constructor(
    private http: ApiHttpService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
    private dataService: DataService
  ) {}
  ngOnInit(): void {
    this.getPreInvoiceErrorSummary();
    this.getPreInvoiceErrorDetails();
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
  chartLoading: boolean = true;
  chart: any;
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

  selection = new SelectionModel<any>(true, []);
  selectedData: any;
  totalSummaryRecords: number = 0;
  selectedSummaryData: any[] = [];
  isModalOpen: boolean = false;
  originalData: any[] = [];
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' | '' = '';
  selectedRows: any[] = [];
  dataSource: any;
  preInvocingErrorDetails: any[];
  preInvocingErrorDetailsFiltered: any[];
  isFiltered: boolean = false;
  filtereddataSource: any;
  totalRecords: number = 0;
  isLoading: boolean = false;
  totalRecordsFiltered: number = 0;
  summaryLoadTime: string;
  periodName: string = '';
  periodEnd: string = '';
  summaryLoading: boolean = true;
  totalImpactData$: Observable<any>;
  processFlowTotals: { [key: string]: string | number };
  openChartModal: boolean = false;

  ngOnChanges(changes: SimpleChanges) {
    if (this.periodStatus) {
      this.periodName = this.periodStatus[0].PERIOD_NAME;
      this.periodEnd = this.dateTransform(this.periodStatus[0].END_DATE);
    }
  }

  getPreInvoiceErrorSummary() {
    this.summaryLoadTime = `Last Updated: ...`;
    this.http.get(this.summaryUrl).subscribe((data: any) => {
      console.log(data);
      this.processFlowTotals = this.calculateTotalsByProcessFlow(data);
      this.dataService.setTab1Data(this.processFlowTotals);
      this.summaryDisplayedColumns = ['select', ...this.summaryColumns];
      this.preInvoicingSummary = this.formatData(data);
      this.preInvoicingSummary.forEach((row) => {
        row.TRANSACTION_DATE = this.dateTransform(row.TRANSACTION_DATE);
      });
      this.originalData = this.preInvoicingSummary;

      this.summaryDatasource = new MatTableDataSource<T>(
        this.preInvoicingSummary
      );
      if (this.summaryPaginator) {
        if (this.summaryDatasource.paginator !== this.summaryPaginator) {
          this.summaryDatasource.paginator = this.summaryPaginator;
        }

        this.totalSummaryRecords = this.preInvoicingSummary.length;

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

  calculateTotalsByProcessFlow(data: any[]): {
    [key: string]: string | number;
  } {
    data.forEach((item) => {
      if (item.PROCESS_FLOW !== null) {
        const processFlowKey = item.PROCESS_FLOW;

        if (this.processFlowKeys.hasOwnProperty(processFlowKey)) {
          this.processFlowKeys[processFlowKey] += Number(item.AMOUNT);
        }
      }
    });

    const formattedTotals: { [key: string]: string | number } = {};
    Object.keys(this.processFlowKeys).forEach((key) => {
      formattedTotals[key] =
        this.processFlowKeys[key] === 0
          ? '0' // If total is zero, display "0"
          : this.processFlowKeys[key] === undefined ||
            this.processFlowKeys[key] === null
          ? 'N/A' // If no line items, display "N/A"
          : this.processFlowKeys[key] >= 1_000_000
          ? `$${(this.processFlowKeys[key] / 1_000_000).toLocaleString(
              undefined,
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}M` // Format in millions with "M" suffix
          : `$${this.processFlowKeys[key].toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`; // Format as a dollar amount if less than a million
    });

    return formattedTotals;
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
            minimumFractionDigits: 2, // Always show at least two decimal places
            maximumFractionDigits: 2, // Restrict to two decimal places
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
      this.getPreInvoiceErrorDetailsFiltered(this.selectedRows);
    } else {
      this.isFiltered = false;
      this.dataSource = new MatTableDataSource<T>(this.preInvocingErrorDetails);
      this.dataSource.paginator = this.detailsPaginator;
      this.filtereddataSource = null;
      this.detailsPaginator.length = this.totalRecords;
      this.cdr.detectChanges();
    }
  }

  getPreInvoiceErrorDetails() {
    this.isLoading = true;
    this.isFiltered = false;

    this.http.get(this.detailsUrl).subscribe({
      next: (data: any) => {
        console.log(data);
        this.preInvocingErrorDetails = data;
        this.preInvocingErrorDetails = this.formatData(
          this.preInvocingErrorDetails
        );
        this.preInvocingErrorDetails.forEach((row) => {
          row.TRANSACTION_DATE = this.dateTransform(row.TRANSACTION_DATE);
          this.detailsDisplayedColumns.forEach((column) => {
            if (row[column] === '-') {
              row[column] = '--';
            }
          });
        });
        this.dataSource = new MatTableDataSource<T>(
          this.preInvocingErrorDetails
        );

        if (this.detailsPaginator) {
          if (this.dataSource.paginator !== this.detailsPaginator) {
            this.dataSource.paginator = this.detailsPaginator;
          }

          this.totalRecords = this.preInvocingErrorDetails.length;
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

  getPreInvoiceErrorDetailsFiltered(data: any) {
    this.isLoading = true;
    this.isFiltered = true;
    const periodNames = data.map((row) => row.PERIOD_NAME);
    const ouNames = data.map((row) => row.ORG_NAME);
    const appNames = data.map((row) => row.APPLICATION_NAME);
    const uniqueIds = data.map((row) => row[this.fieldKey]);

    const pageRequest = {
      periodNames: periodNames.join(','),
      ouNames: ouNames.join(','),
      appNames: appNames.join(','),
      uniqueIds: uniqueIds.join(','),
    };

    console.log(pageRequest);

    this.http.get(this.filteredDetailsUrl, { params: pageRequest }).subscribe({
      next: (data: any) => {
        this.preInvocingErrorDetailsFiltered =
          data.preInvoiceErrorDetailsFiltered;

        this.preInvocingErrorDetailsFiltered = this.formatData(
          this.preInvocingErrorDetailsFiltered
        );

        this.preInvocingErrorDetailsFiltered.forEach((row) => {
          row.TRANSACTION_DATE = this.dateTransform(row.TRANSACTION_DATE);
        });

        console.log(this.preInvocingErrorDetailsFiltered);

        this.filtereddataSource = new MatTableDataSource<T>(
          this.preInvocingErrorDetailsFiltered
        );

        if (this.detailsPaginator) {
          this.filtereddataSource.paginator = this.detailsPaginator;
          setTimeout(() => {
            this.detailsPaginator.length =
              this.preInvocingErrorDetailsFiltered.length;
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
    // if (event === 'successful') {
    //   this.selection.clear();
    //   this.rolErrorSummaryData = null;
    //   this.selectedRows = [];
    //   this.isFiltered = false;
    //   this.filtereddataSource = null;
    //   this.cdr.detectChanges();
    //   setTimeout(() => {
    //     this.getRolErrorSummaryData();
    //   }, 1000);
    // }
  }

  export() {
    if (this.isFiltered) {
      this.exportTableToExcel(
        this.preInvocingErrorDetailsFiltered,
        'PreInv Error Details Filtered',
        'PreInv_Error_Details_Filtered'
      );
    } else {
      this.exportTableToExcel(
        this.preInvocingErrorDetails,
        'PreInv Error Details',
        'PreInv_Error_Details'
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
      const labels = data.map((entry) => entry.PERIOD_NAME);
      const counts = data.map((entry) => entry.COUNT_RECORDS);
      this.http.get('rol-chart-details').subscribe((detailsData: any) => {
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
