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

  sharedChartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
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
        // grid: {
        //   drawBorder: false,
        // },
      },
    },
  };

  ngOnInit(): void {
    this.initializeCharts();
    this.getEspAgingCaseSummary();
    this.getEspCaseServiceMetricSummary();
    this.getEspWeeklyComparisonSummary();
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
        console.log(data);
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

  initializeCharts(): void {
    // Destroy existing charts to prevent the canvas reuse error
    this.destroyCharts();

    const labels = Array.from(
      new Set(
        this.espWeeklyComparisonSummary.map((item) => `WEEK ${item.WEEK_NUM}`)
      )
    ).sort();

    console.log('labels:', labels);

    const transformData = (quarter: string, category: string) =>
      labels.map((label) => {
        const weekNum = parseInt(label.split(' ')[1], 10);
        const entry = this.espWeeklyComparisonSummary.find(
          (item) =>
            item.WEEK_NUM === weekNum &&
            item.FISC_QTR === quarter &&
            item.CATEGORY === category
        );
        console.log('entry:', entry);
        return entry ? entry.COUNT : 0;
      });

    // console.log('backlog:', transformData('Q2FY25', 'BACKLOG CASES'));

    this.backlogInflowChart = new Chart('backlogInflowChart', {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Backlog Q2FY25',
            data: transformData('Q2FY25', 'BACKLOG CASES'),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
          },
          {
            label: 'Inflow Q2FY25',
            data: transformData('Q2FY25', 'INFLOW'),
            borderColor: 'rgba(255, 159, 64, 1)',
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            type: 'line',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });

    this.cancelledPdfChart = new Chart('cancelledPdfChart', {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Cancelled Cases Q2FY25',
            data: transformData('Q2FY25', 'CANCELLED CASES'),
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            type: 'line',
          },
          {
            label: 'PDF Cases Q2FY25',
            data: transformData('Q2FY25', 'PDF'),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });

    this.routedMisroutedChart = new Chart('routedMisroutedChart', {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Misrouted Q2FY25',
            data: transformData('Q2FY25', 'MISROUTED'),
            backgroundColor: 'rgba(255, 159, 64, 0.6)',
          },
          {
            label: 'Routed Out Q2FY25',
            data: transformData('Q2FY25', 'ROUTED OUT'),
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            type: 'line',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
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
