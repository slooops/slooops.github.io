import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { ApiHttpService } from 'src/app/providers/http.service';
import * as XLSX from 'xlsx';
import { SelectionModel } from '@angular/cdk/collections';
import { AssignDialogComponent } from './assign-dialog/assign-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Chart, ChartConfiguration, ChartData, ChartOptions } from 'chart.js';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { DataService } from '../providers/data.service';
import { DatePipe } from '@angular/common';
@Component({
  selector: 'app-rol',
  templateUrl: './rol.component.html',
  styleUrls: ['./rol.component.css'],
})
export class RolComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  rolSummaryModel: RolErrorSummaryData[];

  rolErrorSummaryData: any;
  rolErrorDisplayedColumns: string[] = [];
  rolErrorColumns: string[] = [];

  isModalOpen: boolean = false;
  openChartModal: boolean = false;

  chart: any;

  dataSource: any;
  rolTransactionData: RolTransactionData[];
  rolTransactionDataFiltered: RolTransactionData[];
  displayedColumns: string[] = [];

  subApplicationMapping = {
    XXCFIR_REV_INTERFACE_ALL: '1. Interface',
    XXCFIR_REVENUE_EXTRACT_ALL: '2. Extraction',
    XXCFIR_REVENUE_DIST_ALL: '3. Distribution',
    XXCFIR_ROL_XLA_SUMMARY: '4. Summarization',
    XLA_AE_HEADERS: '5. SLA',
  };

  totalRecords: number = 0;
  totalRecordsFiltered: number = 0;
  pageSize: number = 20;
  isLoading: boolean = false;
  chartLoading: boolean = true;
  summaryLoading: boolean = true;
  summaryLoadTime: string;
  periodName: string = '';
  periodEnd: string = '';
  processFlowTotals: { [key: string]: string | number };

  constructor(
    private http: ApiHttpService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private dataService: DataService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.getRolTransactionData(0, this.pageSize);
    this.getRolErrorSummaryData();
    this.getRolErrorSummaryPeriodStatus();
  }

  ngAfterViewInit(): void {
    this.paginator.page.subscribe((event: PageEvent) => {
      this.getRolTransactionData(event.pageIndex, event.pageSize);
    });
    if (this.openChartModal) {
      this.getChartTotals();
    }
  }

  getRolErrorSummaryData() {
    this.summaryLoadTime = `Last Updated: ...`;
    this.http.get('rol-errors-summary').subscribe((data: any) => {
      this.processFlowTotals = this.calculateTotalsByProcessFlow(data);
      this.rolErrorColumns = [
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
        // 'CURRENCY_CODE',
        // 'ERROR_APPLICATION',
      ];
      this.rolErrorDisplayedColumns = ['select', ...this.rolErrorColumns];

      this.rolSummaryModel = this.formatData(data);
      this.rolSummaryModel.forEach((row) => {
        row.AGING = this.getAging(row.TRANSACTION_DATE) + ' days';
        row.TRANSACTION_DATE = this.dateTransform(row.TRANSACTION_DATE);
        row.ASSIGNED_DATE = row.ASSIGNED_DATE
          ? this.dateTransform(row.ASSIGNED_DATE)
          : '';
      });

      this.rolErrorSummaryData = new MatTableDataSource<RolErrorSummaryData>(
        this.rolSummaryModel
      );
      this.summaryLoading = false;
      this.summaryLoadTime = `Last Updated: ${new Date().toLocaleString()}`;
    });
  }

  getRolErrorSummaryPeriodStatus() {
    this.http.get('rol-errors-summary-period-status').subscribe((data: any) => {
      this.periodName = data[0].PERIOD_NAME;
      this.periodEnd = this.dateTransform(data[0].END_DATE);
    });
  }

  dateTransform(dateString: string): string {
    return this.datePipe.transform(dateString, 'MM/dd/yyyy');
  }

  isFiltered: boolean = false;
  getRolTransactionData(pageIndex: number, pageSize: number) {
    this.isLoading = true;
    this.isFiltered = false;
    const pageRequest = {
      page: pageIndex.toString(),
      size: pageSize.toString(),
    };

    this.http.get('rol-transaction-data', { params: pageRequest }).subscribe({
      next: (data: any) => {
        this.rolTransactionData = data.rolTransactionData;
        this.totalRecords = data.totalRecords;

        if (this.rolTransactionData.length > 0) {
          this.displayedColumns = [
            'period_NAME',
            'application_NAME',
            'process_FLOW',
            'org_NAME',
            'amount',
            'process_STATUS',
            'source',
            'transaction_ID',
            'order_LINE_ID',
            'error_MESSAGE',
          ];
        }
        this.rolTransactionData = this.formatData(this.rolTransactionData);
        this.dataSource = new MatTableDataSource<RolTransactionData>(
          this.rolTransactionData
        );

        if (this.paginator) {
          if (this.dataSource.paginator !== this.paginator) {
            this.dataSource.paginator = this.paginator;
          }

          setTimeout(() => {
            this.paginator.length = this.totalRecords;
            this.paginator.pageIndex = pageIndex;
            this.paginator.pageSize = pageSize;
            this.cdr.detectChanges();
          });
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

  viewTransactionDetails() {
    this.selectedSummaryData = this.selection.selected;
    if (!this.selectedSummaryData || this.selectedSummaryData.length === 0) {
      console.error('No data selected.');
      return;
    }
    this.getTransactionDataFiltered(this.selectedSummaryData);
  }

  filtereddataSource: any;

  getTransactionDataFiltered(data: any) {
    this.isLoading = true;
    this.isFiltered = true;
    const periodNames = data.map((row) => row.PERIOD_NAME);
    const ouNames = data.map((row) => row.ORG_NAME);
    const appNames = data.map((row) => row.APPLICATION_NAME);
    // const amounts = data.map((row) => row.AMOUNT);

    // Prepare the request payload (adjust according to your API needs)
    const pageRequest = {
      page: '0',
      size: '20',
      periodNames: periodNames.join(','), // Send as comma-separated values
      ouNames: ouNames.join(','), // Send as comma-separated values
      appNames: appNames.join(','), // Send as comma-separated values
      // amounts: amounts.join(',')
    };

    this.http
      .get('rol-transaction-data-filter', { params: pageRequest })
      .subscribe({
        next: (data: any) => {
          console.log(data);
          this.rolTransactionDataFiltered = data.rolTransactionDataFiltered;
          this.totalRecordsFiltered = data.totalRecords;
          if (this.rolTransactionDataFiltered.length > 0) {
            this.displayedColumns = [
              'period_NAME',
              'application_NAME',
              'process_FLOW',
              'org_NAME',
              'amount',
              'process_STATUS',
              'source',
              'transaction_ID',
              'order_LINE_ID',
              'error_MESSAGE',
            ];
          }
          this.rolTransactionDataFiltered = this.formatData(
            this.rolTransactionDataFiltered
          );

          this.filtereddataSource = new MatTableDataSource<RolTransactionData>(
            this.rolTransactionDataFiltered
          );

          if (this.paginator) {
            this.paginator.length = this.totalRecordsFiltered; // Update length
            this.paginator.pageIndex = 0; // Reset to the first page
            this.paginator.pageSize = 20; // Set page size, adjust if needed
            this.filtereddataSource.paginator = this.paginator; // Assign paginator
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

  selectedRows: any[] = []; // Store all selected rows

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
      this.getTransactionDataFiltered(this.selectedRows);
    } else {
      this.isFiltered = false;
      this.dataSource = new MatTableDataSource<RolTransactionData>(
        this.rolTransactionData
      );
      this.filtereddataSource = null;
      this.paginator.length = this.totalRecords;
      this.paginator.pageIndex = 0;
      this.paginator.pageSize = 20;
      this.cdr.detectChanges();
    }
  }

  getAging(dateString: string): string {
    const today = new Date();
    const creationDate = new Date(dateString);
    const timeDifference = today.getTime() - creationDate.getTime();

    const agingInDays = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    return agingInDays.toString();
  }

  subAppMapping(key: string): string | undefined {
    return this.subApplicationMapping[key];
  }

  calculateTotalsByProcessFlow(data: any[]): {
    [key: string]: string | number;
  } {
    // Initialize an object to store totals
    const totals: { [key: string]: number } = {
      XXCFIR_REV_INTERFACE_ALL: 0,
      XXCFIR_REVENUE_EXTRACT_ALL: 0,
      XXCFIR_REVENUE_DIST_ALL: 0,
      XXCFIR_ROL_XLA_SUMMARY: 0,
      XLA_AE_HEADERS: 0,
    };

    // Calculate total impact for each process flow
    data.forEach((item) => {
      const processFlowKey = item.PROCESS_FLOW;

      // Check if the process flow is in the mapping
      if (totals.hasOwnProperty(processFlowKey)) {
        totals[processFlowKey] += item.AMOUNT;
      }
    });

    // Convert totals to displayable format
    const formattedTotals: { [key: string]: string | number } = {};
    Object.keys(totals).forEach((key) => {
      formattedTotals[key] =
        totals[key] === 0
          ? '0' // If total is zero, display "0"
          : totals[key] === undefined || totals[key] === null
          ? 'N/A' // If no line items, display "N/A"
          : `$${totals[key].toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`; // Format total as a dollar amount
    });

    return formattedTotals;
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

  // Replace underscores in column headers
  replaceUnderscore(value: string | null | undefined): string {
    if (!value) {
      return ''; // Return an empty string if value is null or undefined
    }

    const specialWords = [
      'name',
      'num',
      'year',
      'code',
      'org',
      'sub',
      'unit',
      'process',
    ];

    return value
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => {
        const lowerWord = word.toLowerCase();
        if (specialWords.includes(lowerWord)) {
          return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  exportTableToExcel(data: any[], sheetName: string, filename: string) {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  selection = new SelectionModel<any>(true, []);
  selectedData: any;

  selectedSummaryData: RolErrorSummaryData[] = [];

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
      this.rolErrorSummaryData = null;
      this.selectedRows = [];
      this.isFiltered = false;
      this.filtereddataSource = null;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.getRolErrorSummaryData();
      }, 1000);
    }
  }

  closeModal() {
    this.openChartModal = false;
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

interface RolTransactionData {
  PERIOD_NAME: string;
  PERIOD_NUM: string;
  ORG_NAME: string;
  APPLICATION_NAME: string;
  ERROR_APPLICATION: string;
  PROCESS_FLOW: string;
  SOURCE: string;
  AMOUNT: string;
  CURRENCY_CODE: string;
  INTID_TRXNID_CUSTTRXLINE_GROUPID: string;
  ORDERNUMBER_CUSTTRXID: string;
  CUSTTRXLINEID: string;
  ORDERLINEID: string;
  ERROR_MESSAGE: string;
  PROCESS_STATUS: string;
}

interface RolErrorSummaryData {
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
