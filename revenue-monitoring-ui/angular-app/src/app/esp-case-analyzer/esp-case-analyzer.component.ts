import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { MatTableDataSource } from '@angular/material/table';
import * as XLSX from 'xlsx';
import { Chart, ChartOptions, registerables } from 'chart.js';
import { DestroyManager } from '../providers/destroy-manager.service';
import { MenuService } from '../providers/menu.service';
// import { resolve } from 'path';
Chart.register(...registerables);

@Component({
  selector: 'app-esp-case-analyzer',
  templateUrl: './esp-case-analyzer.component.html',
  styleUrl: './esp-case-analyzer.component.css',
  providers: [DestroyManager],
})
export class EspCaseAnalyzerComponent implements OnInit {
  constructor(
    http: ApiHttpService,
    private destroyManager: DestroyManager,
    private menuService: MenuService
  ) {
    this.http = http;
    Chart.register(...registerables);
  }
  protected http: ApiHttpService;

  isChartLoading = true;
  isPriorChartLoading = true;

  displayedColumnsForAgingBacklogCurrent: string[] = [];
  dataSourceAgingBacklogCurrent = new MatTableDataSource<any>([]);

  displayedColumnsForAgingBacklogPrevious: string[] = [];
  dataSourceAgingBacklogPrevious = new MatTableDataSource<any>([]);

  displayedColumnsForCurrentQuarter: string[] = [];
  dataSourceCurrentQuarter = new MatTableDataSource<any>([]);

  displayedColumnsForPreviousQuarter: string[] = [];
  dataSourcePreviousQuarter = new MatTableDataSource<any>([]);

  espWeeklyComparisonSummary: any[] = [];
  backlogInflowChart: Chart | null = null;
  cancelledPdfChart: Chart | null = null;
  routedMisroutedChart: Chart | null = null;

  backlogInflowChartPrior: Chart | null = null;
  cancelledPdfChartPrior: Chart | null = null;

  q0: string | null = null;
  q1: string | null = null;
  q2: string | null = null;
  q3: string | null = null;
  q4: string | null = null;

  ngOnInit(): void {
    this.getEspAgingCaseSummary();
    this.getEspCaseServiceMetricSummary();
    this.getEspWeeklyComparisonSummary();
    this.menuService.updateMenuItems([
      {
        label: 'ESP Case Analyzer',
        route: '/case-analyzer',
        role: ['ADMIN'],
      },
    ]);
  }

  getEspCaseServiceMetricSummary() {
    this.http
      .get('esp-case-service-metric-summary', this.destroyManager)
      .subscribe((data: any) => {
        if (data && data.length > 0) {
          // Extract quarter names from the first occurrence of each QTR_RELATIVE_POSITION
          const quarters: { [key: number]: string } = {};
          data.forEach((item: any) => {
            const position = item.QTR_RELATIVE_POSITION;
            if (position >= 0 && position <= 4 && !quarters[position]) {
              quarters[position] = item.FISC_QTR;
            }
          });

          // Assign quarter names, defaulting to null if missing
          this.q0 = quarters[0] || null;
          this.q1 = quarters[1] || null;
          this.q2 = quarters[2] || null;
          this.q3 = quarters[3] || null;
          this.q4 = quarters[4] || null;

          // Separate current and previous quarter data
          const currentQuarterData = data.filter(
            (item: any) => item.QTR_RELATIVE_POSITION === 0
          );
          const previousQuarterData = data.filter(
            (item: any) => item.QTR_RELATIVE_POSITION === 1
          );

          // Columns to remove
          const columnsToRemove = [
            'CREATED_BY',
            'CREATED_TIME',
            'LAST_UPDATED_BY',
            'LAST_UPDATED_TIME',
            'IS_ACTIVE',
            'FISC_QTR', // Removed from table but stored in q0–q4
            'QTR_RELATIVE_POSITION',
          ];

          // Remove unwanted columns from both datasets
          const cleanedCurrentQuarterData = currentQuarterData.map(
            (item: any) => {
              columnsToRemove.forEach((column) => delete item[column]);
              return item;
            }
          );

          const cleanedPreviousQuarterData = previousQuarterData.map(
            (item: any) => {
              columnsToRemove.forEach((column) => delete item[column]);
              return item;
            }
          );

          // Update the tables with cleaned data
          this.displayedColumnsForCurrentQuarter = Object.keys(
            cleanedCurrentQuarterData[0] || {}
          );
          this.dataSourceCurrentQuarter = new MatTableDataSource(
            cleanedCurrentQuarterData
          );

          this.displayedColumnsForPreviousQuarter = Object.keys(
            cleanedPreviousQuarterData[0] || {}
          );
          this.dataSourcePreviousQuarter = new MatTableDataSource(
            cleanedPreviousQuarterData
          );
        }
      });
  }

  getEspAgingCaseSummary() {
    this.http
      .get('esp-aging-case-summary', this.destroyManager)
      .subscribe((data: any) => {
        if (data && data.length > 0) {
          // Separate current quarter (0) and last quarter (1)
          const currentQuarterData = data.filter(
            (item: any) => item.QTR_RELATIVE_POSITION === 0
          );
          const previousQuarterData = data.filter(
            (item: any) => item.QTR_RELATIVE_POSITION === 1
          );

          // Columns to remove
          const columnsToRemove = [
            'FISC_QTR',
            'CREATED_AT',
            'LAST_UPDATED_AT',
            'QTR_RELATIVE_POSITION',
          ];

          // Columns to check for non-zero values
          const columnsToCheck = [
            'LESS_THAN_5',
            'BETWEEN_5_10',
            'BETWEEN_10_15',
            'GREATER_THAN_15',
          ];

          // Remove unwanted columns and filter out rows with all zero values
          const cleanedCurrentQuarterData = currentQuarterData
            .map((item: any) => {
              columnsToRemove.forEach((column) => delete item[column]);
              return item;
            })
            .filter((item: any) =>
              columnsToCheck.some((column) => item[column] !== 0)
            );

          const cleanedPreviousQuarterData = previousQuarterData
            .map((item: any) => {
              columnsToRemove.forEach((column) => delete item[column]);
              return item;
            })
            .filter((item: any) =>
              columnsToCheck.some((column) => item[column] !== 0)
            );

          // Update tables with cleaned data
          this.displayedColumnsForAgingBacklogCurrent = Object.keys(
            cleanedCurrentQuarterData[0] || {}
          );
          this.dataSourceAgingBacklogCurrent = new MatTableDataSource(
            cleanedCurrentQuarterData
          );

          this.displayedColumnsForAgingBacklogPrevious = Object.keys(
            cleanedPreviousQuarterData[0] || {}
          );
          this.dataSourceAgingBacklogPrevious = new MatTableDataSource(
            cleanedPreviousQuarterData
          );
        }
      });
  }

  getEspWeeklyComparisonSummary(): void {
    this.http
      .get('esp-weekly-comparison-summary', this.destroyManager, {
        responseType: 'json',
      })
      .subscribe((data: any) => {
        this.espWeeklyComparisonSummary = data;
        this.destroyCharts();
        this.initializeCharts();
      });
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

  initializeCharts(): void {
    const COLORS = {
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

    const labels = Array.from(
      new Set(
        this.espWeeklyComparisonSummary.map((item) => `WEEK ${item.WEEK_NUM}`)
      )
    ).sort((a, b) => {
      const numA = parseInt(a.split(' ')[1], 10);
      const numB = parseInt(b.split(' ')[1], 10);
      return numA - numB;
    });

    // console.log('labels:', labels);

    const transformData = (relativePosition: string, category: string) =>
      labels.map((label) => {
        const weekNum = parseInt(label.split(' ')[1], 10);
        const entry = this.espWeeklyComparisonSummary.find(
          (item) =>
            item.WEEK_NUM === weekNum &&
            item.QTR_RELATIVE_POSITION.toString() === relativePosition &&
            item.CATEGORY === category
        );
        return entry ? entry.COUNT : 0;
      });

    this.backlogInflowChartPrior = new Chart('backlogInflowChartPrior', {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Backlog (Prior Quarter)',
            data: transformData('2', 'BACKLOG'),
            ...COLORS.backlogPrevious,
          },
          {
            label: 'Backlog (Last Quarter)',
            data: transformData('1', 'BACKLOG'),
            ...COLORS.backlogCurrent,
          },
          {
            label: 'Inflow (Prior Quarter)',
            data: transformData('2', 'INFLOW'),
            ...COLORS.inflowPrevious,
            type: 'line',
          },
          {
            label: 'Inflow (Last Quarter)',
            data: transformData('1', 'INFLOW'),
            ...COLORS.inflowCurrent,
            type: 'line',
          },
          {
            label: 'Resolved (Prior Quarter)',
            data: transformData('2', 'RESOLVED'),
            ...COLORS.resolvedPrevious,
            type: 'line',
          },
          {
            label: 'Resolved (Last Quarter)',
            data: transformData('1', 'RESOLVED'),
            ...COLORS.resolvedCurrent,
            type: 'line',
          },
        ],
      },
      options: this.sharedChartOptions,
    });

    this.cancelledPdfChartPrior = new Chart('cancelledPdfChartPrior', {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'PDF (Prior Quarter)',
            data: transformData('2', 'PDF'),
            ...COLORS.pdfPrevious,
          },
          {
            label: 'PDF (Last Quarter)',
            data: transformData('1', 'PDF'),
            ...COLORS.pdfCurrent,
          },
          {
            label: 'Routed Out (Prior Quarter)',
            data: transformData('2', 'ROUTED OUT'),
            ...COLORS.routedOutPrevious,
            type: 'line',
          },
          {
            label: 'Routed Out (Last Quarter)',
            data: transformData('1', 'ROUTED OUT'),
            ...COLORS.routedOutCurrent,
            type: 'line',
          },
          {
            label: 'Misrouted (Prior Quarter)',
            data: transformData('2', 'MISROUTED'),
            ...COLORS.misroutedPrevious,
            type: 'line',
          },
          {
            label: 'Misrouted (Last Quarter)',
            data: transformData('1', 'MISROUTED'),
            ...COLORS.misroutedCurrent,
            type: 'line',
          },
          {
            label: 'Cancelled (Prior Quarter)',
            data: transformData('2', 'CANCELLED'),
            ...COLORS.cancelledPrevious,
            type: 'line',
          },
          {
            label: 'Cancelled (Last Quarter)',
            data: transformData('1', 'CANCELLED'),
            ...COLORS.cancelledCurrent,
            type: 'line',
          },
        ],
      },
      options: this.sharedChartOptions,
    });

    this.backlogInflowChart = new Chart('backlogInflowChart', {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Backlog (Previous Quarter)',
            data: transformData('1', 'BACKLOG'),
            ...COLORS.backlogPrevious,
          },
          {
            label: 'Backlog (Current Quarter)',
            data: transformData('0', 'BACKLOG'),
            ...COLORS.backlogCurrent,
          },
          {
            label: 'Inflow (Previous Quarter)',
            data: transformData('1', 'INFLOW'),
            ...COLORS.inflowPrevious,
            type: 'line',
          },
          {
            label: 'Inflow (Current Quarter)',
            data: transformData('0', 'INFLOW'),
            ...COLORS.inflowCurrent,
            type: 'line',
          },
          {
            label: 'Resolved (Previous Quarter)',
            data: transformData('1', 'RESOLVED'),
            ...COLORS.resolvedPrevious,
            type: 'line',
          },
          {
            label: 'Resolved (Current Quarter)',
            data: transformData('0', 'RESOLVED'),
            ...COLORS.resolvedCurrent,
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

    this.cancelledPdfChart = new Chart('cancelledPdfChart', {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'PDF (Last Quarter)',
            data: transformData('1', 'PDF'),
            ...COLORS.pdfPrevious,
          },
          {
            label: 'PDF (This Quarter)',
            data: transformData('0', 'PDF'),
            ...COLORS.pdfCurrent,
          },
          {
            label: 'Routed Out (Last Quarter)',
            data: transformData('1', 'ROUTED OUT'),
            ...COLORS.routedOutPrevious,
            type: 'line',
          },
          {
            label: 'Routed Out (This Quarter)',
            data: transformData('0', 'ROUTED OUT'),
            ...COLORS.routedOutCurrent,
            type: 'line',
          },
          {
            label: 'Misrouted (Last Quarter)',
            data: transformData('1', 'MISROUTED'),
            ...COLORS.misroutedPrevious,
            type: 'line',
          },
          {
            label: 'Misrouted (This Quarter)',
            data: transformData('0', 'MISROUTED'),
            ...COLORS.misroutedCurrent,
            type: 'line',
          },
          {
            label: 'Cancelled (Last Quarter)',
            data: transformData('1', 'CANCELLED'),
            ...COLORS.cancelledPrevious,
            type: 'line',
          },
          {
            label: 'Cancelled (This Quarter)',
            data: transformData('0', 'CANCELLED'),
            ...COLORS.cancelledCurrent,
            type: 'line',
          },
        ],
      },
      options: this.sharedChartOptions,
    });
  }

  destroyCharts(): void {
    console.log('Destroying charts');
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
  }

  onTabClick(event: any): void {
    if (event.index === 1) {
      // Destroy and reinitialize charts when switching to "Last Quarter vs. Prior Quarter"
      setTimeout(() => {
        this.destroyCharts();
        this.initializeCharts();
      }, 200);
    }
  }
}
