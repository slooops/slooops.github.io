import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { ApiHttpService } from 'src/app/providers/http.service';
import * as XLSX from 'xlsx';
import { SelectionModel } from '@angular/cdk/collections';
import { AssignDialogComponent } from './assign-dialog/assign-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Chart, ChartConfiguration, ChartData, ChartOptions } from 'chart.js';
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
  displayedColumns: string[] = [];

  subApplicationMapping = {
    XXCFIR_REV_INTERFACE_ALL: '1. Interface',
    XXCFIR_REVENUE_EXTRACT_ALL: '2. Extraction',
    XXCFIR_REVENUE_DIST_ALL: '3. Distribution',
    XXCFIR_ROL_XLA_SUMMARY: '4. Summarization',
    XLA_AE_HEADERS: '5. SLA',
  };

  totalRecords: number = 0;
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
    private dialog: MatDialog
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

    // setTimeout(() => {
    //   if (this.paginator) {
    //     this.dataSource.paginator = this.paginator;
    //     this.cdr.detectChanges(); // Ensure change detection
    //   }
    // });
  }

  getRolErrorSummaryData() {
    this.summaryLoadTime = `Last Updated: ...`;
    this.http.get('rol-errors-summary').subscribe((data: any) => {
      console.log('Rol error summary data:', data);
      this.processFlowTotals = this.calculateTotalsByProcessFlow(data);

      this.rolErrorColumns = [
        'PERIOD_NAME',
        'APPLICATION_NAME',
        'PROCESS_FLOW',
        'ORG_NAME',
        'AMOUNT',
        'CREATION_DATE',
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
        row.AGING = this.getAging(row.CREATION_DATE) + ' days';
        row.CREATION_DATE = this.dateTransform(row.CREATION_DATE);
        row.ASSIGNED_DATE = this.dateTransform(row.ASSIGNED_DATE);
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
    const date = new Date(dateString);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  getRolTransactionData(pageIndex: number, pageSize: number) {
    this.isLoading = true;
    const pageRequest = {
      page: pageIndex.toString(),
      size: pageSize.toString(),
    };

    this.http.get('rol-transaction-data', { params: pageRequest }).subscribe({
      next: (data: any) => {
        this.rolTransactionData = data.rolTransactionData;
        this.totalRecords = data.totalRecords;

        if (this.rolTransactionData.length > 0) {
          // Transaction Data Table Columns Order
          this.displayedColumns = [
            'period_NAME',
            'application_NAME',
            'process_FLOW',
            'org_NAME',
            'amount',
            'process_STATUS',
            'source',
            'error_MESSAGE',

            // 'currency_CODE',
            // 'custtrxlineid',
            // 'error_APPLICATION',
            // 'intid_TRXNID_CUSTTRXLINE_GROUPID',
            // 'orderlineid',
            // 'ordernumber_CUSTTRXID',
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

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.rolErrorSummaryData.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.rolErrorSummaryData.data.forEach((row) =>
          this.selection.select(row)
        );
  }

  onRowClicked(row: any) {
    this.selectedData = row;
  }

  selectedSummaryData: RolErrorSummaryData[] = [];

  viewDetails() {
    this.selectedSummaryData = this.selection.selected;
    console.log('Selected data:', this.selectedSummaryData);
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

  closeModal(): void {
    this.isModalOpen = false;
    this.openChartModal = false;
  }

  openRowDialog(): void {
    const dialogRef = this.dialog.open(AssignDialogComponent, {
      width: '400px',
      data: this.selectedSummaryData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Dialog result:', result);
      }
    });
  }

  getChartTotals() {
    this.chartLoading = true;

    this.http.get('rol-chart-totals').subscribe((data: any) => {
      console.log('Rol chart totals:', data);

      // Extract labels and counts from the API response
      const labels = data.map((entry) => entry.PERIOD_NAME);
      const counts = data.map((entry) => entry.COUNT_RECORDS);

      // Fetch the details data to pass to the chart
      this.http.get('rol-chart-details').subscribe((detailsData: any) => {
        console.log('rolChartDetails:', detailsData);

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
            tension: 0.2, // Smooth the line
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
            callbacks: {
              // Customize the tooltip
              label: (tooltipItem: any) => {
                const periodName = tooltipItem.label; // Get the month (PERIOD_NAME)
                const details = groupedData[periodName]; // Get the grouped details for this month

                // Format the tooltip content
                if (details) {
                  const tooltipLines = details.map(
                    (item: any) =>
                      `${item.APPLICATION_NAME}: ${item.COUNT_RECORDS}`
                  );
                  return tooltipLines; // Return the tooltip content as an array of strings
                }
                return 'No details available';
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
  CREATION_DATE: string;
  ASSIGNED_DATE: string;
}
