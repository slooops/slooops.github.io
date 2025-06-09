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
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { DestroyManager } from '../providers/destroy-manager.service';

@Component({
  selector: 'app-monitoring-dashboard',
  templateUrl: './monitoring-dashboard.component.html',
  styleUrl: './monitoring-dashboard.component.css',
  providers: [DestroyManager],
})
export class MonitoringDashboardComponent<T>
  implements OnInit, OnChanges, AfterViewInit
{
  @ViewChild('detailsPaginator') detailsPaginator: MatPaginator;
  @ViewChild('summaryPaginator') summaryPaginator: MatPaginator;
  @Input() urls: { [key: string]: string };
  @Input() keysToMap: string[];
  @Input() processFlowKeys: { [key: string]: number };
  @Input() periodStatus: any;
  @Input() componentName: string;
  @Input() processFlowTabsToDisplay: string[];
  @Input() specialWords: string[];
  @Input() skippedWords: string[];
  @Input() subAppMapping: { [key: string]: string };
  @Input() dynamicTemplate: TemplateRef<any> | null = null;
  @Input() dynamicCss: string = '';
  @Input() isSubAppMapping: boolean = false;
  @Input() warningMessage: string = '';
  @Input() columnsToFilter: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[];
  @Input() summaryColumnsToHide: string[] = [];
  @Input() detailsColumnsToHide: string[] = [];
  @Input() assignmentDialogFieldConfig: any[] = [];
  @Input() submitKeysToMap: string[] = [];
  @Input() webexKeysToMap: string[] = [];
  @Input() assignmentUsersFilter: string = '';

  periodName: string = '';
  periodEnd: string = '';
  totalImpactData$: Observable<any>;
  updateUrl: string;
  webexUrl: string;
  searchForm: FormGroup = new FormGroup({});
  textFilters: any[] = [];
  selectFilters: any[] = [];

  constructor(
    private http: ApiHttpService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
    private dataService: DataService,
    private fb: FormBuilder,
    private destroyManager: DestroyManager
  ) {}
  ngOnInit(): void {
    this.getErrorSummary();
    this.getErrorDetails();
    this.updateUrl = this.urls['summaryUpdateUrl'];
    this.webexUrl = this.urls['webexMessageUrl'];
    this.initializeForm();
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
  }
  ngOnChanges(changes: SimpleChanges) {
    if (this.periodStatus) {
      this.periodName = this.periodStatus[0].PERIOD_NAME;
      this.periodEnd = this.dateTransform(this.periodStatus[0].END_DATE);
    }

    if (changes['columnsToFilter'] && this.columnsToFilter) {
      this.initializeForm();
    }
  }

  summaryLoadTime: string;
  summaryData: any[];
  summaryDatasource: any;
  summaryColumns: string[] = [];
  summaryDisplayedColumns: string[] = [];
  totalSummaryRecords: number = 0;
  summaryLoading: boolean = false;
  originalData: any[] = [];
  originalDetailsData: any[] = [];
  originalFilteredData: any[] = [];
  getErrorSummary() {
    this.summaryLoading = true;
    this.summaryLoadTime = `Last Updated: ...`;
    this.http.get(this.urls['summaryUrl'], this.destroyManager).subscribe({
      next: (data: any) => {
        this.summaryData = this.formatData(data);
        if (this.summaryData.length > 0) {
          this.summaryColumns = Object.keys(this.summaryData[0]);
        }
        this.summaryColumns = this.summaryColumns.filter(
          (data) => !this.summaryColumnsToHide.includes(data)
        );
        this.summaryDisplayedColumns = ['select', ...this.summaryColumns];
        if (this.summaryColumns.includes('PROCESS_FLOW')) {
          this.resetPreInvoicingTotals();
          const totals = this.calculateTotalsByProcessFlow(data);
          this.dataService.setTabData(this.componentName, totals);
        }
        this.originalData = this.summaryData;
        this.summaryDatasource = new MatTableDataSource<T>(this.summaryData);
        if (this.summaryPaginator) {
          if (this.summaryDatasource.paginator !== this.summaryPaginator) {
            this.summaryDatasource.paginator = this.summaryPaginator;
          }
          this.totalSummaryRecords = this.summaryData.length;
        }
        this.summaryLoadTime = `Last Updated: ${new Date().toLocaleString()}`;
      },
      error: (err) => {
        console.error('Error fetching data', err);
        this.summaryLoading = false;
      },
      complete: () => {
        this.summaryLoading = false;
      },
    });
  }

  private resetPreInvoicingTotals(): void {
    Object.keys(this.processFlowKeys).forEach((key) => {
      this.processFlowKeys[key] = 0;
    });
  }

  calculateTotalsByProcessFlow(data: any[]): {
    [key: string]: string;
  } {
    data.forEach((item) => {
      if (item.PROCESS_FLOW !== null) {
        const processFlowKey = item.PROCESS_FLOW;
        if (this.processFlowKeys.hasOwnProperty(processFlowKey)) {
          if (!this.summaryColumns.includes('AMOUNT')) {
            this.processFlowKeys[processFlowKey] += Number(item.ORDER_COUNT);
          } else {
            this.processFlowKeys[processFlowKey] += Number(item.AMOUNT);
          }
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
  sortData(column: string, sortOn: string) {
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
      if (sortOn === 'summary') {
        this.summaryDatasource.data = [...this.originalData];
      } else if (sortOn === 'filteredDetails') {
        this.filtereddataSource.data = [...this.originalFilteredData];
      } else {
        this.dataSource.data = [...this.originalDetailsData];
      }
    } else {
      if (sortOn === 'summary') {
        this.summaryDatasource.data = [...this.summaryDatasource.data].sort(
          (a, b) => this.compare(a[column], b[column], column)
        );
      } else if (sortOn === 'filteredDetails') {
        this.filtereddataSource.data = [...this.filtereddataSource.data].sort(
          (a, b) => this.compare(a[column], b[column], column)
        );
      } else {
        this.dataSource.data = [...this.dataSource.data].sort((a, b) =>
          this.compare(a[column], b[column], column)
        );
      }
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
    } else if (column === 'PROCESS_FLOW') {
      const processFlowNumberA = parseInt(a.split(' - ')[0], 10) || 0;
      const processFlowNumberB = parseInt(b.split(' - ')[0], 10) || 0;
      valueA = processFlowNumberA;
      valueB = processFlowNumberB;
    } else if (column === 'ORG_NAME') {
      valueA = a.toUpperCase();
      valueB = b.toUpperCase();
    } else if (column === 'ERROR_MESSAGE') {
      valueA = a.toUpperCase();
      valueB = b.toUpperCase();
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
        'BALANCE',
        'ACCOUNTED_CR',
        'ACCOUNTED_DR',
        'ENTERED_CR',
        'ENTERED_DR',
        'USD_AMOUNT',
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
      this.filterData();
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
      this.resetSelection();
      this.summaryDatasource = null;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.getErrorSummary();
      }, 0);
    }
  }

  resetSelection() {
    this.selection.clear();
    this.selectedRows = [];
    this.isFiltered = false;
    this.filtereddataSource = null;
    this.filterData();
    this.cdr.detectChanges();
  }

  dataSource: any;
  errorDetails: any[];
  errorDetailsFiltered: any[];
  isFiltered: boolean = false;
  filtereddataSource: any;
  totalRecords: number = 0;
  isLoading: boolean = false;
  totalRecordsFiltered: number = 0;
  detailsDisplayedColumns: string[] = [];
  getErrorDetails() {
    this.isLoading = true;
    this.isFiltered = false;

    this.http.get(this.urls['detailsUrl'], this.destroyManager).subscribe({
      next: (data: any) => {
        this.errorDetails = data;
        this.errorDetails = this.formatData(this.errorDetails);
        if (this.errorDetails.length > 0) {
          this.detailsDisplayedColumns = Object.keys(this.errorDetails[0]);
        }
        this.detailsDisplayedColumns = this.detailsDisplayedColumns.filter(
          (data) => !this.detailsColumnsToHide.includes(data)
        );
        this.errorDetails.forEach((row) => {
          this.detailsDisplayedColumns.forEach((column) => {
            if (row[column] === '-') {
              row[column] = '--';
            }
          });
        });
        this.originalDetailsData = this.errorDetails;
        this.dataSource = new MatTableDataSource<T>(this.errorDetails);
        if (this.detailsPaginator) {
          if (this.dataSource.paginator !== this.detailsPaginator) {
            this.dataSource.paginator = this.detailsPaginator;
          }
          this.totalRecords = this.errorDetails.length;
        }
        this.filterData();
        this.dataSource.filterPredicate = this.filterPredicate;
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

  camelCase(str) {
    const camelKey = str
      .toLowerCase()
      .replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    return `${camelKey}s`;
  }

  getErrorDetailsFiltered(data: any) {
    this.isLoading = true;
    this.isFiltered = true;
    const pageRequest = this.keysToMap.reduce((acc, key) => {
      const keyName = this.camelCase(key);
      acc[keyName] = data.map((row) => row[key]).join(',');
      return acc;
    }, {});
    this.http
      .get(this.urls['filteredDetailsUrl'], this.destroyManager, {
        params: pageRequest,
      })
      .subscribe({
        next: (data: any) => {
          this.errorDetailsFiltered = data.errorDetailsFiltered;
          this.errorDetailsFiltered = this.formatData(
            this.errorDetailsFiltered
          );
          this.errorDetailsFiltered.forEach((row) => {});
          this.originalFilteredData = this.errorDetailsFiltered;
          this.filtereddataSource = new MatTableDataSource<T>(
            this.errorDetailsFiltered
          );
          if (this.detailsPaginator) {
            this.filtereddataSource.paginator = this.detailsPaginator;
            setTimeout(() => {
              this.detailsPaginator.length = this.errorDetailsFiltered.length;
              this.cdr.detectChanges();
            });
            this.filterData();
            this.filtereddataSource.filterPredicate = this.filterPredicate;
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

  // processFlowOptions: string[] = [];
  // orgNameOptions: string[] = [];
  // filterData() {
  //   this.processFlowOptions = [];
  //   this.orgNameOptions = [];
  //   let processFlowTemp: string[] = [];
  //   let orgNameTemp: string[] = [];
  //   if (this.isFiltered) {
  //     this.errorDetailsFiltered.forEach((data) => {
  //       processFlowTemp.push(data.PROCESS_FLOW);
  //       if (this.componentName === 'General Ledger') {
  //         orgNameTemp.push(data.LEDGER_NAME);
  //       } else {
  //         orgNameTemp.push(data.ORG_NAME);
  //       }
  //     });
  //   } else {
  //     this.errorDetails.forEach((data) => {
  //       processFlowTemp.push(data.PROCESS_FLOW);
  //       if (this.componentName === 'General Ledger') {
  //         orgNameTemp.push(data.LEDGER_NAME);
  //       } else {
  //         orgNameTemp.push(data.ORG_NAME);
  //       }
  //     });
  //   }
  //   this.processFlowOptions = [...new Set(processFlowTemp)];
  //   this.orgNameOptions = [...new Set(orgNameTemp)];
  // }

  filterOptions: { [key: string]: string[] } = {}; // Store dynamic filter options

  filterData() {
    // Reset the filter options object
    this.filterOptions = {};

    // Temporary storage for unique values
    let tempOptions: { [key: string]: string[] } = {};

    // Initialize temporary storage for each select filter
    this.selectFilters.forEach((column) => {
      tempOptions[column.formControlName] = [];
    });

    // Determine the data source based on filter status
    const dataSource = this.isFiltered
      ? this.errorDetailsFiltered
      : this.errorDetails;

    // Populate filter options dynamically
    dataSource.forEach((data) => {
      this.selectFilters.forEach((column) => {
        let value;

        value = data[column.columnName];

        if (value) {
          tempOptions[column.formControlName].push(value);
        }
      });
    });

    // Remove duplicates and store in `filterOptions`
    Object.keys(tempOptions).forEach((key) => {
      this.filterOptions[key] = [...new Set(tempOptions[key])];
    });
  }

  private initializeForm() {
    this.textFilters = this.columnsToFilter.filter(
      (col) => col.type === 'text'
    );
    this.selectFilters = this.columnsToFilter.filter(
      (col) => col.type === 'select'
    );

    // Add text-based filters
    this.textFilters.forEach((column) => {
      if (!this.searchForm.contains(column.formControlName)) {
        this.searchForm.addControl(column.formControlName, new FormControl(''));
      }
    });

    // Add select filters
    this.selectFilters.forEach((column) => {
      if (!this.searchForm.contains(column.formControlName)) {
        this.searchForm.addControl(column.formControlName, new FormControl([])); // Multiple select needs an array
      }
    });

    // this.columnsToFilter.forEach((column) => {
    //   if (!this.searchForm.contains(column.formControlName)) {
    //     this.searchForm.addControl(column.formControlName, new FormControl(''));
    //   }
    // });
  }

  filter() {
    this.searchForm.valueChanges.subscribe(() => this.applyFilter());
  }

  applyFilter() {
    const filters = {};

    this.textFilters.forEach((column) => {
      filters[column.formControlName + 'Filter'] = this.searchForm.get(
        column.formControlName
      ).value;
    });

    this.selectFilters.forEach((column) => {
      filters[column.formControlName + 'Filter'] =
        this.searchForm.get(column.formControlName).value || '';
    });

    // filters['processFlowFilter'] =
    //   this.searchForm.get('processFlow').value || '';
    // filters['orgNameFilter'] = this.searchForm.get('orgName').value || '';

    const filterString = JSON.stringify(filters);

    if (this.dataSource) {
      this.dataSource.filter = filterString;
    }
    if (this.filtereddataSource) {
      this.filtereddataSource.filter = filterString;
    }
  }

  filterPredicate = (data: any, filter: string): boolean => {
    const filters = JSON.parse(filter);
    // const matchesProcessFlow =
    //   !filters['processFlowFilter'] || filters['processFlowFilter'].length === 0
    //     ? true
    //     : filters['processFlowFilter'].includes(data['PROCESS_FLOW']);

    // const matchesOrgName =
    //   !filters['orgNameFilter'] || filters['orgNameFilter'].length === 0
    //     ? true
    //     : this.componentName === 'General Ledger'
    //     ? filters['orgNameFilter'].includes(data['LEDGER_NAME'])
    //     : filters['orgNameFilter'].includes(data['ORG_NAME']);

    const matchesSelectFilters = this.selectFilters.every((column) => {
      const filterValue =
        !filters[column.formControlName + 'Filter'] ||
        filters[column.formControlName + 'Filter'].length === 0
          ? true
          : filters[column.formControlName + 'Filter'].includes(
              data[column.columnName]
            );
      return filterValue;
    });
    const matchesTextFilters = this.textFilters.every((column) => {
      const filterValue = filters[column.formControlName + 'Filter'] || '';
      return (
        data[column.columnName]
          ?.toString()
          .toLowerCase()
          .indexOf(filterValue.toLowerCase()) !== -1
      );
    });
    return matchesSelectFilters && matchesTextFilters;
  };

  clearFilters() {
    if (this.isFiltered) {
      this.filtereddataSource.filter = '';
    } else {
      this.dataSource.filter = '';
    }
    this.searchForm.reset();
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
    this.http
      .get(this.urls['chartTotalsUrl'], this.destroyManager)
      .subscribe((data: any) => {
        const labels = data.map((entry) => entry.PERIOD_NAME);
        const counts = data.map((entry) => entry.COUNT_RECORDS);
        this.http
          .get(this.urls['chartDetailsUrl'], this.destroyManager)
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
