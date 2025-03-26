import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { MatTableDataSource } from '@angular/material/table';
import { Chart, ChartOptions, registerables } from 'chart.js';
import { DestroyManager } from '../providers/destroy-manager.service';
import { el } from 'date-fns/locale';
Chart.register(...registerables);

@Component({
  selector: 'app-esp-case-analyzer',
  templateUrl: './esp-case-analyzer.component.html',
  styleUrl: './esp-case-analyzer.component.css',
  providers: [DestroyManager],
})
export class EspCaseAnalyzerComponent implements OnInit {
  constructor(http: ApiHttpService, private destroyManager: DestroyManager) {
    this.http = http;
    Chart.register(...registerables);
  }
  protected http: ApiHttpService;

  selectedTabIndex = 0;

  isChartLoading = true;
  isPriorChartLoading = true;

  quarterComparisons: [string, string][] = [];

  displayedColumnsForAgingBacklog: { [key: number]: string[] } = {};
  dataSourceAgingBacklog: { [key: number]: MatTableDataSource<any> } = {};

  displayedColumnsForCaseSummaryQuarter: { [key: number]: string[] } = {};
  dataSourceCaseSummaryQuarter: MatTableDataSource<any>[] = [];

  espWeeklyComparisonSummary: any[] = [];
  backlogInflowChart: Chart | null = null;
  cancelledPdfChart: Chart | null = null;
  routedMisroutedChart: Chart | null = null;

  backlogInflowChartPrior: Chart | null = null;
  cancelledPdfChartPrior: Chart | null = null;

  q1: string | null = null;
  q2: string | null = null;
  q3: string | null = null;
  q4: string | null = null;
  q5: string | null = null;

  ngOnInit(): void {
    this.http
      .get('esp-weekly-comparison-summary', this.destroyManager, {
        responseType: 'json',
      })
      .subscribe((data: any) => {
        const recentQuarters = this.extractRecentQuarters(data);

        // Assign quarters, defaulting to null if missing
        this.q1 =
          recentQuarters.find((q) => q.quarterIndex === 1)?.fiscalQuarter ||
          null;
        this.q2 =
          recentQuarters.find((q) => q.quarterIndex === 2)?.fiscalQuarter ||
          null;
        this.q3 =
          recentQuarters.find((q) => q.quarterIndex === 3)?.fiscalQuarter ||
          null;
        this.q4 =
          recentQuarters.find((q) => q.quarterIndex === 4)?.fiscalQuarter ||
          null;
        this.q5 =
          recentQuarters.find((q) => q.quarterIndex === 5)?.fiscalQuarter ||
          null;

        this.selectedTabIndex = Math.max(0, recentQuarters.length - 2); // last valid pair is at length - 2

        // this.espWeeklyComparisonSummary = data;
        this.getEspWeeklyComparisonSummary(data);

        this.getEspAgingCaseSummary();
        this.getEspCaseServiceMetricSummary();
      });
  }

  getEspCaseServiceMetricSummary() {
    this.http
      .get('esp-case-service-metric-summary', this.destroyManager)
      .subscribe((data: any) => {
        if (data && data.length > 0) {
          // Columns to remove
          const columnsToRemove = [
            'CREATED_BY',
            'CREATED_TIME',
            'LAST_UPDATED_BY',
            'LAST_UPDATED_TIME',
            'IS_ACTIVE',
            'FISC_QTR',
            'QTR_RELATIVE_POSITION',
          ];

          // Process available quarter data dynamically
          for (let i = 1; i <= 5; i++) {
            const quarterName = this[`q${i}` as keyof this];
            if (quarterName) {
              const quarterData = data.filter(
                (item: any) => item.FISC_QTR === quarterName
              );
              const cleanedData = this.removeColumns(
                quarterData,
                columnsToRemove
              );

              if (cleanedData.length > 0) {
                this.displayedColumnsForCaseSummaryQuarter[i] = Object.keys(
                  cleanedData[0]
                );
                this.dataSourceCaseSummaryQuarter[i] = new MatTableDataSource(
                  cleanedData
                );
              }
            }
          }
        }
      });
  }

  getEspAgingCaseSummary() {
    this.http
      .get('esp-aging-case-summary', this.destroyManager)
      .subscribe((data: any) => {
        if (data && data.length > 0) {
          // Columns to remove
          const columnsToRemove = [
            'FISC_QTR',
            'CREATED_AT',
            'LAST_UPDATED_AT',
            'QTR_RELATIVE_POSITION',
          ];

          // Columns to check for non-zero values
          const columnsToCheck = [
            'LESS_THAN_5_DAYS',
            'BETWEEN_5_TO_10_DAYS',
            'BETWEEN_10_TO_15_DAYS',
            'GREATER_THAN_15_DAYS',
          ];

          // Process available quarter data dynamically
          for (let i = 1; i <= 5; i++) {
            const quarterName = this[`q${i}` as keyof this];
            if (quarterName) {
              const quarterData = data.filter(
                (item: any) => item.FISC_QTR === quarterName
              );

              const cleanedData = this.removeColumns(
                quarterData,
                columnsToRemove
              );
              const renamedData = this.renameColumns(cleanedData);
              const finalData = this.filterNonZeroRows(
                renamedData,
                columnsToCheck
              );

              if (finalData.length > 0) {
                this.displayedColumnsForAgingBacklog[i] = Object.keys(
                  finalData[0]
                );
                this.dataSourceAgingBacklog[i] = new MatTableDataSource(
                  finalData
                );
              }
            }
          }
        }
      });
  }

  getEspWeeklyComparisonSummary(data: any) {
    this.espWeeklyComparisonSummary = data;

    this.destroyCharts();
    this.initializeCurrentQuarterCharts();
    this.initializePreviousQuarterCharts();
  }

  sharedChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        // mode: 'index',
        // intersect: false,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  initializeCurrentQuarterCharts(): void {
    this.isChartLoading = false;
    const labels = this.getSortedLabels();

    const ctx1 = document.getElementById(
      'backlogInflowChart'
    ) as HTMLCanvasElement;
    if (ctx1 && ctx1.getContext('2d')) {
      this.backlogInflowChart = new Chart('backlogInflowChart', {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Backlog (Previous Quarter)',
              data: this.transformData('1', 'BACKLOG'),
              ...this.COLORS.backlogPrevious,
            },
            {
              label: 'Backlog (Current Quarter)',
              data: this.transformData('0', 'BACKLOG'),
              ...this.COLORS.backlogCurrent,
            },
            {
              label: 'Inflow (Previous Quarter)',
              data: this.transformData('1', 'INFLOW'),
              ...this.COLORS.inflowPrevious,
              type: 'line',
            },
            {
              label: 'Inflow (Current Quarter)',
              data: this.transformData('0', 'INFLOW'),
              ...this.COLORS.inflowCurrent,
              type: 'line',
            },
            {
              label: 'Resolved (Previous Quarter)',
              data: this.transformData('1', 'RESOLVED'),
              ...this.COLORS.resolvedPrevious,
              type: 'line',
            },
            {
              label: 'Resolved (Current Quarter)',
              data: this.transformData('0', 'RESOLVED'),
              ...this.COLORS.resolvedCurrent,
              type: 'line',
            },

            // {
            //   label: 'Total (Current Quarter)',
            //   data: transformData('CURRENT QUARTER', 'TOTAL'),
            //   ...COLORS.totalCurrent,
            //   type: 'line',
            // },
            // {
            //   label: 'Total (Previous Quarter)',
            //   data: transformData('PREVIOUS QUARTER', 'TOTAL'),
            //   ...COLORS.totalPrevious,
            //   type: 'line',
            // },
          ],
        },
        options: this.sharedChartOptions,
      });
    }

    const ctx2 = document.getElementById(
      'cancelledPdfChart'
    ) as HTMLCanvasElement;
    if (ctx2 && ctx2.getContext('2d')) {
      this.cancelledPdfChart = new Chart('cancelledPdfChart', {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'PDF (Last Quarter)',
              data: this.transformData('1', 'PDF'),
              ...this.COLORS.pdfPrevious,
            },
            {
              label: 'PDF (This Quarter)',
              data: this.transformData('0', 'PDF'),
              ...this.COLORS.pdfCurrent,
            },
            {
              label: 'Routed Out (Last Quarter)',
              data: this.transformData('1', 'ROUTED OUT'),
              ...this.COLORS.routedOutPrevious,
              type: 'line',
            },
            {
              label: 'Routed Out (This Quarter)',
              data: this.transformData('0', 'ROUTED OUT'),
              ...this.COLORS.routedOutCurrent,
              type: 'line',
            },
            {
              label: 'Misrouted (Last Quarter)',
              data: this.transformData('1', 'MISROUTED'),
              ...this.COLORS.misroutedPrevious,
              type: 'line',
            },
            {
              label: 'Misrouted (This Quarter)',
              data: this.transformData('0', 'MISROUTED'),
              ...this.COLORS.misroutedCurrent,
              type: 'line',
            },
            {
              label: 'Cancelled (Last Quarter)',
              data: this.transformData('1', 'CANCELLED'),
              ...this.COLORS.cancelledPrevious,
              type: 'line',
            },
            {
              label: 'Cancelled (This Quarter)',
              data: this.transformData('0', 'CANCELLED'),
              ...this.COLORS.cancelledCurrent,
              type: 'line',
            },
          ],
        },
        options: this.sharedChartOptions,
      });
    }
  }

  initializePreviousQuarterCharts(): void {
    this.isPriorChartLoading = false;
    const labels = this.getSortedLabels();

    const ctx3 = document.getElementById(
      'backlogInflowChartPrior'
    ) as HTMLCanvasElement;
    if (ctx3 && ctx3.getContext('2d')) {
      this.backlogInflowChartPrior = new Chart('backlogInflowChartPrior', {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Backlog (Prior Quarter)',
              data: this.transformData('2', 'BACKLOG'),
              ...this.COLORS.backlogPrevious,
            },
            {
              label: 'Backlog (Last Quarter)',
              data: this.transformData('1', 'BACKLOG'),
              ...this.COLORS.backlogCurrent,
            },
            {
              label: 'Inflow (Prior Quarter)',
              data: this.transformData('2', 'INFLOW'),
              ...this.COLORS.inflowPrevious,
              type: 'line',
            },
            {
              label: 'Inflow (Last Quarter)',
              data: this.transformData('1', 'INFLOW'),
              ...this.COLORS.inflowCurrent,
              type: 'line',
            },
            {
              label: 'Resolved (Prior Quarter)',
              data: this.transformData('2', 'RESOLVED'),
              ...this.COLORS.resolvedPrevious,
              type: 'line',
            },
            {
              label: 'Resolved (Last Quarter)',
              data: this.transformData('1', 'RESOLVED'),
              ...this.COLORS.resolvedCurrent,
              type: 'line',
            },
          ],
        },
        options: this.sharedChartOptions,
      });
    }

    const ctx4 = document.getElementById(
      'cancelledPdfChartPrior'
    ) as HTMLCanvasElement;
    if (ctx4 && ctx4.getContext('2d')) {
      this.cancelledPdfChartPrior = new Chart('cancelledPdfChartPrior', {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'PDF (Prior Quarter)',
              data: this.transformData('2', 'PDF'),
              ...this.COLORS.pdfPrevious,
            },
            {
              label: 'PDF (Last Quarter)',
              data: this.transformData('1', 'PDF'),
              ...this.COLORS.pdfCurrent,
            },
            {
              label: 'Routed Out (Prior Quarter)',
              data: this.transformData('2', 'ROUTED OUT'),
              ...this.COLORS.routedOutPrevious,
              type: 'line',
            },
            {
              label: 'Routed Out (Last Quarter)',
              data: this.transformData('1', 'ROUTED OUT'),
              ...this.COLORS.routedOutCurrent,
              type: 'line',
            },
            {
              label: 'Misrouted (Prior Quarter)',
              data: this.transformData('2', 'MISROUTED'),
              ...this.COLORS.misroutedPrevious,
              type: 'line',
            },
            {
              label: 'Misrouted (Last Quarter)',
              data: this.transformData('1', 'MISROUTED'),
              ...this.COLORS.misroutedCurrent,
              type: 'line',
            },
            {
              label: 'Cancelled (Prior Quarter)',
              data: this.transformData('2', 'CANCELLED'),
              ...this.COLORS.cancelledPrevious,
              type: 'line',
            },
            {
              label: 'Cancelled (Last Quarter)',
              data: this.transformData('1', 'CANCELLED'),
              ...this.COLORS.cancelledCurrent,
              type: 'line',
            },
          ],
        },
        options: this.sharedChartOptions,
      });
    }
  }

  transformData(fiscalQuarter: string, category: string): number[] {
    const labels = this.getSortedLabels();
    return labels.map((label) => {
      const weekNum = parseInt(label.split(' ')[1], 10);
      const entry = this.espWeeklyComparisonSummary.find(
        (item) =>
          item.WEEK_NUM === weekNum &&
          item.QTR_RELATIVE_POSITION.toString() === fiscalQuarter &&
          // item.FISC_QTR === fiscalQuarter &&
          item.CATEGORY === category
      );

      return entry ? entry.COUNT : 0;
    });
  }

  getSortedLabels(): string[] {
    return Array.from(
      new Set(
        this.espWeeklyComparisonSummary.map((item) => `WEEK ${item.WEEK_NUM}`)
      )
    ).sort((a, b) => {
      const numA = parseInt(a.split(' ')[1], 10);
      const numB = parseInt(b.split(' ')[1], 10);
      return numA - numB;
    });
  }

  onTabClick(event: any): void {
    this.isChartLoading = true;
    this.isPriorChartLoading = true;
    this.destroyCharts();
    this.initializeCurrentQuarterCharts();
    this.initializePreviousQuarterCharts();
  }

  destroyCharts(): void {
    // Destroy charts if they exist
    if (this.backlogInflowChart) {
      this.backlogInflowChart.destroy();
      this.backlogInflowChart = null;
    }
    if (this.cancelledPdfChart) {
      this.cancelledPdfChart.destroy();
      this.cancelledPdfChart = null;
    }

    if (this.backlogInflowChartPrior) {
      this.backlogInflowChartPrior.destroy();
      this.backlogInflowChartPrior = null;
    }
    if (this.cancelledPdfChartPrior) {
      this.cancelledPdfChartPrior.destroy();
      this.cancelledPdfChartPrior = null;
    }

    console.log('Destroying charts');
    [this.backlogInflowChart, this.cancelledPdfChart].forEach((chart) => {
      if (chart) {
        chart.destroy();
      }
    });

    this.backlogInflowChart = null;
    this.cancelledPdfChart = null;
  }

  COLORS = {
    backlogCurrent: {
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      borderColor: 'rgba(75, 192, 192, 1)',
      pointBackgroundColor: 'rgba(75, 192, 192, 1)',
      pointBorderColor: 'rgba(75, 192, 192, 1)',
    },
    backlogPrevious: {
      backgroundColor: 'rgba(75, 192, 192, 0.3)',
      borderColor: 'rgba(75, 192, 192, 0.5)',
      pointBackgroundColor: 'rgba(75, 192, 192, 0.5)',
      pointBorderColor: 'rgba(75, 192, 192, 0.5)',
    },
    inflowCurrent: {
      backgroundColor: 'rgba(255, 159, 64, 0.6)',
      borderColor: 'rgba(255, 159, 64, 1)',
      pointBackgroundColor: 'rgba(255, 159, 64, 1)',
      pointBorderColor: 'rgba(255, 159, 64, 1)',
    },
    inflowPrevious: {
      backgroundColor: 'rgba(255, 159, 64, 0.3)',
      borderColor: 'rgba(255, 159, 64, 0.5)',
      pointBackgroundColor: 'rgba(255, 159, 64, 0.5)',
      pointBorderColor: 'rgba(255, 159, 64, 0.5)',
    },
    resolvedCurrent: {
      backgroundColor: 'rgba(235, 154, 229, 0.6)', // Muted pink-purple with 60% opacity
      borderColor: 'rgba(212, 114, 205, 1)', // Muted pink-purple with 100% opacity
      pointBackgroundColor: 'rgba(235, 154, 229, 1)', // Muted pink-purple with 100% opacity
      pointBorderColor: 'rgba(230, 109, 221, 1)', // Muted pink-purple with 100% opacity
    },
    resolvedPrevious: {
      backgroundColor: 'rgba(235, 154, 229, 0.3)', // Muted pink-purple with 30% opacity
      borderColor: 'rgba(213, 103, 206, 0.5)', // Muted pink-purple with 50% opacity
      pointBackgroundColor: 'rgba(235, 154, 229, 0.5)', // Muted pink-purple with 50% opacity
      pointBorderColor: 'rgba(232, 87, 223, 0.5)', // Muted pink-purple with 50% opacity
    },
    routedOutCurrent: {
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      pointBackgroundColor: 'rgba(54, 162, 235, 1)',
      pointBorderColor: 'rgba(54, 162, 235, 1)',
    },
    routedOutPrevious: {
      backgroundColor: 'rgba(54, 162, 235, 0.1)',
      borderColor: 'rgba(54, 162, 235, 0.5)',
      pointBackgroundColor: 'rgba(54, 162, 235, 0.5)',
      pointBorderColor: 'rgba(54, 162, 235, 0.5)',
    },
    misroutedCurrent: {
      backgroundColor: 'rgba(255, 99, 132, 0.6)',
      borderColor: 'rgba(255, 99, 132, 1)',
      pointBackgroundColor: 'rgba(255, 99, 132, 1)',
      pointBorderColor: 'rgba(255, 99, 132, 1)',
    },
    misroutedPrevious: {
      backgroundColor: 'rgba(255, 99, 132, 0.3)',
      borderColor: 'rgba(255, 99, 132, 0.5)',
      pointBackgroundColor: 'rgba(255, 99, 132, 0.5)',
      pointBorderColor: 'rgba(255, 99, 132, 0.5)',
    },
    pdfCurrent: {
      backgroundColor: 'rgba(153, 102, 255, 0.6)',
      borderColor: 'rgba(153, 102, 255, 1)',
      pointBackgroundColor: 'rgba(153, 102, 255, 1)',
      pointBorderColor: 'rgba(153, 102, 255, 1)',
    },
    pdfPrevious: {
      backgroundColor: 'rgba(153, 102, 255, 0.3)',
      borderColor: 'rgba(153, 102, 255, 0.5)',
      pointBackgroundColor: 'rgba(153, 102, 255, 0.5)',
      pointBorderColor: 'rgba(153, 102, 255, 0.5)',
    },
    cancelledCurrent: {
      backgroundColor: 'rgba(201, 203, 207, 0.6)',
      borderColor: 'rgba(201, 203, 207, 1)',
      pointBackgroundColor: 'rgba(201, 203, 207, 1)',
      pointBorderColor: 'rgba(201, 203, 207, 1)',
    },
    cancelledPrevious: {
      backgroundColor: 'rgba(201, 203, 207, 0.3)',
      borderColor: 'rgba(201, 203, 207, 0.5)',
      pointBackgroundColor: 'rgba(201, 203, 207, 0.5)',
      pointBorderColor: 'rgba(201, 203, 207, 0.5)',
    },
    totalCurrent: {
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      borderColor: 'rgba(75, 192, 192, 1)',
      pointBackgroundColor: 'rgba(75, 192, 192, 1)',
      pointBorderColor: 'rgba(75, 192, 192, 1)',
    },
    totalPrevious: {
      backgroundColor: 'rgba(75, 192, 192, 0.3)',
      borderColor: 'rgba(75, 192, 192, 0.5)',
      pointBackgroundColor: 'rgba(75, 192, 192, 0.5)',
      pointBorderColor: 'rgba(75, 192, 192, 0.5)',
    },
  };

  private removeColumns(data: any[], columnsToRemove: string[]): any[] {
    return data.map((item: any) => {
      columnsToRemove.forEach((column) => delete item[column]);
      return item;
    });
  }

  private filterByQuarter(data: any[], quarter: number): any[] {
    return data.filter((item) => item.QTR_RELATIVE_POSITION === quarter);
  }

  private filterNonZeroRows(data: any[], columnsToCheck: string[]): any[] {
    return data.filter((item) =>
      columnsToCheck.some((column) => item[column] !== 0)
    );
  }

  private renameColumns(data: any[]): any[] {
    return data.map((item) => {
      const newItem: any = {};
      Object.keys(item).forEach((key) => {
        const newKey = key.includes('_TO_') ? key.replace(/_TO_/g, '-') : key;
        newItem[newKey] = item[key];
      });
      return newItem;
    });
  }

  private extractRecentQuarters(
    data: any[]
  ): { quarterIndex: number; fiscalQuarter: string }[] {
    // Create an array of unique quarters with fiscal years
    const quarterMap = new Map<
      string,
      { fiscalYear: number; quarterNumber: number }
    >();

    data.forEach((item) => {
      const match = item.FISC_QTR.match(/Q(\d)FY(\d+)/);
      if (match) {
        const quarterNumber = parseInt(match[1], 10);
        const fiscalYear = parseInt(match[2], 10);
        quarterMap.set(item.FISC_QTR, { fiscalYear, quarterNumber });
      }
    });

    // Convert to array and sort by fiscal year (descending), then by quarter number (ascending)
    const sortedQuarters = Array.from(quarterMap.entries())
      .map(([fiscalQuarter, { fiscalYear, quarterNumber }]) => ({
        fiscalQuarter,
        fiscalYear,
        quarterNumber,
      }))
      .sort(
        (a, b) =>
          b.fiscalYear - a.fiscalYear || a.quarterNumber - b.quarterNumber
      );

    // Identify the most recent `Q1`
    const latestQ1 = sortedQuarters.find((q) => q.quarterNumber === 1);
    if (!latestQ1) return []; // If no Q1 exists, return empty array

    // Get all quarters for the same fiscal year as `latestQ1`
    const selectedYear = latestQ1.fiscalYear;
    const recentFiscalYearQuarters = sortedQuarters.filter(
      (q) => q.fiscalYear === selectedYear
    );

    // Find `Q4` from the preceding fiscal year for `q5`
    const q5 = sortedQuarters.find(
      (q) => q.quarterNumber === 4 && q.fiscalYear === selectedYear - 1
    );

    // Assign indices based on fiscal year quarters
    return [
      ...recentFiscalYearQuarters.map((q) => ({
        quarterIndex: q.quarterNumber, // Q1 -> 1, Q2 -> 2, etc.
        fiscalQuarter: q.fiscalQuarter,
      })),
      ...(q5 ? [{ quarterIndex: 5, fiscalQuarter: q5.fiscalQuarter }] : []),
    ];
  }
}
