import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { MatTableDataSource } from '@angular/material/table';
import * as XLSX from 'xlsx';
import { Chart, ChartOptions, registerables } from 'chart.js';
import { DestroyManager } from '../providers/destroy-manager.service';
// import { resolve } from 'path';
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

  displayedColumnsForAgingBacklog: string[] = [];
  dataSourceAgingBacklog = new MatTableDataSource<any>([]);

  displayedColumnsForCurrentQuarter: string[] = [];

  dataSourceCurrentQuarter = new MatTableDataSource<any>([]);

  espWeeklyComparisonSummary: any[] = [];
  backlogInflowChart: Chart | null = null;
  cancelledPdfChart: Chart | null = null;
  routedMisroutedChart: Chart | null = null;

  backlogInflowChartPrior: Chart | null = null;
  cancelledPdfChartPrior: Chart | null = null;

  ngOnInit(): void {
    this.getEspAgingCaseSummary();
    this.getEspCaseServiceMetricSummary();
    this.getEspWeeklyComparisonSummary();
  }

  getEspCaseServiceMetricSummary() {
    this.http
      .get('esp-case-service-metric-summary', this.destroyManager)
      .subscribe((data: any) => {
        if (data && data.length > 0) {
          // Filter out rows where RELATIVE_QTR is "PREVIOUS QUARTER"
          const filteredData = data.filter(
            (item: any) =>
              item.RELATIVE_QTR !== 'PREVIOUS QUARTER' &&
              item.RELATIVE_QTR !== 'OTHER'
          );

          // Columns to remove
          const columnsToRemove = [
            'CREATED_BY',
            'CREATED_TIME',
            'LAST_UPDATED_BY',
            'LAST_UPDATED_TIME',
            'IS_ACTIVE',
            'FISC_QTR',
            'RELATIVE_QTR',
          ];

          // Remove the specified columns from the filtered data
          const cleanedData = filteredData.map((item: any) => {
            columnsToRemove.forEach((column) => {
              delete item[column];
            });
            return item;
          });

          // Update the table with the cleaned data
          this.displayedColumnsForCurrentQuarter = Object.keys(
            cleanedData[0] || {}
          ); // Handle empty data after filtering
          this.dataSourceCurrentQuarter = new MatTableDataSource(cleanedData);
        }
      });
  }

  getEspAgingCaseSummary() {
    this.http
      .get('esp-aging-case-summary', this.destroyManager)
      .subscribe((data: any) => {
        if (data && data.length > 0) {
          // Columns to remove
          const columnsToRemove = ['FISC_QTR', 'CREATED_AT', 'LAST_UPDATED_AT'];

          // Columns to check for non-zero values
          const columnsToCheck = [
            'LESS_THAN_5',
            'BETWEEN_5_10',
            'BETWEEN_10_15',
            'GREATER_THAN_15',
          ];

          // Remove the specified columns and filter out rows with all zero values in the specified columns
          const cleanedData = data
            .map((item: any) => {
              columnsToRemove.forEach((column) => {
                delete item[column];
              });
              return item;
            })
            .filter((item: any) => {
              return columnsToCheck.some((column) => item[column] !== 0);
            });

          this.displayedColumnsForAgingBacklog = Object.keys(cleanedData[0]);
          this.dataSourceAgingBacklog = new MatTableDataSource(cleanedData);
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
          //   label: 'Routed Out (Current Quarter)',
          //   data: transformData('CURRENT QUARTER', 'ROUTED OUT'),
          //   ...COLORS.routedOutCurrent,
          //   type: 'line',
          // },
          // {
          //   label: 'Routed Out (Previous Quarter)',
          //   data: transformData('PREVIOUS QUARTER', 'ROUTED OUT'),
          //   ...COLORS.routedOutPrevious,
          //   type: 'line',
          // },
          // {
          //   label: 'Misrouted (Current Quarter)',
          //   data: transformData('CURRENT QUARTER', 'MISROUTED'),
          //   ...COLORS.misroutedCurrent,
          //   type: 'line',
          // },
          // {
          //   label: 'Misrouted (Previous Quarter)',
          //   data: transformData('PREVIOUS QUARTER', 'MISROUTED'),
          //   ...COLORS.misroutedPrevious,
          //   type: 'line',
          // },
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
