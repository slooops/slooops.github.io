import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { MatTableDataSource } from '@angular/material/table';
import * as XLSX from 'xlsx';
import { Chart, ChartOptions, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-esp-case-analyzer',
  templateUrl: './esp-case-analyzer.component.html',
  styleUrl: './esp-case-analyzer.component.css',
})
export class EspCaseAnalyzerComponent implements OnInit {
  constructor(http: ApiHttpService) {
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

  ngOnInit(): void {
    this.getEspAgingCaseSummary();
    this.getEspCaseServiceMetricSummary();
    this.getEspWeeklyComparisonSummary();
    this.getTspAccountSummaryView();
    this.getTspAccountDetailView();
  }

  getTspAccountSummaryView() {
    this.http.get('tsp-account-summary-view').subscribe((data: any) => {
      console.log('tspAccountSummaryView:', data);
    });
  }

  getTspAccountDetailView() {
    this.http.get('tsp-account-detail-view').subscribe((data: any) => {
      console.log('tspAccountDetailView:', data);
    });
  }

  getEspCaseServiceMetricSummary() {
    this.http.get('esp-case-service-metric-summary').subscribe((data: any) => {
      // console.log('espCaseServiceMetricSummary:', data);
      if (data && data.length > 0) {
        this.displayedColumnsForCurrentQuarter = Object.keys(data[0]);
        this.dataSourceCurrentQuarter = new MatTableDataSource(data);
      }
    });
  }

  getEspAgingCaseSummary() {
    this.http.get('esp-aging-case-summary').subscribe((data: any) => {
      // console.log('espAgingCaseSummary:', data);
      if (data && data.length > 0) {
        this.displayedColumnsForAgingBacklog = Object.keys(data[0]);
        this.dataSourceAgingBacklog = new MatTableDataSource(data);
      }
    });
  }

  getEspWeeklyComparisonSummary(): void {
    this.http
      .get('esp-weekly-comparison-summary', { responseType: 'json' })
      .subscribe((data: any) => {
        this.espWeeklyComparisonSummary = data;
        console.log('raw graph data', data);
        this.initializeCharts();
      });
  }

  removeColumns(columnsToRemove: string[]) {
    this.displayedColumnsForAgingBacklog =
      this.displayedColumnsForAgingBacklog.filter(
        (column) => !columnsToRemove.includes(column)
      );
  }

  removeUnderscores(key: string): string {
    return key.replace(/_/g, ' ');
  }

  exportTableToExcel(data: any[], sheetName: string, fileName: string): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = {
      Sheets: { [sheetName]: worksheet },
      SheetNames: [sheetName],
    };
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
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

    console.log('labels:', labels);

    const transformData = (relativeQuarter: string, category: string) =>
      labels.map((label) => {
        const weekNum = parseInt(label.split(' ')[1], 10);
        const entry = this.espWeeklyComparisonSummary.find(
          (item) =>
            item.WEEK_NUM === weekNum &&
            item.RELATIVE_QTR === relativeQuarter &&
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
            label: 'Backlog (Current Quarter)',
            data: transformData('CURRENT QUARTER', 'BACKLOG'),
            ...COLORS.backlogCurrent,
          },
          {
            label: 'Backlog (Previous Quarter)',
            data: transformData('PREVIOUS QUARTER', 'BACKLOG'),
            ...COLORS.backlogPrevious,
          },
          {
            label: 'Inflow (Current Quarter)',
            data: transformData('CURRENT QUARTER', 'INFLOW'),
            ...COLORS.inflowCurrent,
            type: 'line',
          },
          {
            label: 'Inflow (Previous Quarter)',
            data: transformData('PREVIOUS QUARTER', 'INFLOW'),
            ...COLORS.inflowPrevious,
            type: 'line',
          },
          {
            label: 'Routed Out (Current Quarter)',
            data: transformData('CURRENT QUARTER', 'ROUTED OUT'),
            ...COLORS.routedOutCurrent,
            type: 'line',
          },
          {
            label: 'Routed Out (Previous Quarter)',
            data: transformData('PREVIOUS QUARTER', 'ROUTED OUT'),
            ...COLORS.routedOutPrevious,
            type: 'line',
          },
          {
            label: 'Misrouted (Current Quarter)',
            data: transformData('CURRENT QUARTER', 'MISROUTED'),
            ...COLORS.misroutedCurrent,
            type: 'line',
          },
          {
            label: 'Misrouted (Previous Quarter)',
            data: transformData('PREVIOUS QUARTER', 'MISROUTED'),
            ...COLORS.misroutedPrevious,
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
            label: 'PDF (Current Quarter)',
            data: transformData('CURRENT QUARTER', 'PDF'),
            ...COLORS.pdfCurrent,
          },
          {
            label: 'PDF (Previous Quarter)',
            data: transformData('PREVIOUS QUARTER', 'PDF'),
            ...COLORS.pdfPrevious,
          },
          {
            label: 'Cancelled (Current Quarter)',
            data: transformData('CURRENT QUARTER', 'CANCELLED'),
            ...COLORS.cancelledCurrent,
            type: 'line',
          },
          {
            label: 'Cancelled (Previous Quarter)',
            data: transformData('PREVIOUS QUARTER', 'CANCELLED'),
            ...COLORS.cancelledPrevious,
            type: 'line',
          },
        ],
      },
      options: this.sharedChartOptions,
    });
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
    if (this.routedMisroutedChart) {
      this.routedMisroutedChart.destroy();
      this.routedMisroutedChart = null;
    }
  }
}
