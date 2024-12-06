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
    // Destroy existing charts to prevent the canvas reuse error
    this.destroyCharts();

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

    const backlogCurrentQuarter = transformData('CURRENT QUARTER', 'BACKLOG');
    const backlogPreviousQuarter = transformData('PREVIOUS QUARTER', 'BACKLOG');
    console.log(
      'Backlog Current & Previous:',
      backlogCurrentQuarter,
      backlogPreviousQuarter
    );

    const inflowCurrentQuarter = transformData('CURRENT QUARTER', 'INFLOW');
    const inflowPreviousQuarter = transformData('PREVIOUS QUARTER', 'INFLOW');
    console.log(
      'Inflow Current & Previous:',
      inflowCurrentQuarter,
      inflowPreviousQuarter
    );

    const cancelledCurrentQuarter = transformData(
      'CURRENT QUARTER',
      'CANCELLED'
    );
    const cancelledPreviousQuarter = transformData(
      'PREVIOUS QUARTER',
      'CANCELLED'
    );
    console.log(
      'Cancelled Current & Previous:',
      cancelledCurrentQuarter,
      cancelledPreviousQuarter
    );

    const pdfCurrentQuarter = transformData('CURRENT QUARTER', 'PDF');
    const pdfPreviousQuarter = transformData('PREVIOUS QUARTER', 'PDF');
    console.log(
      'PDF Current & Previous:',
      pdfCurrentQuarter,
      pdfPreviousQuarter
    );

    const misroutedCurrentQuarter = transformData(
      'CURRENT QUARTER',
      'MISROUTED'
    );
    const misroutedPreviousQuarter = transformData(
      'PREVIOUS QUARTER',
      'MISROUTED'
    );
    console.log(
      'Misrouted Current & Previous:',
      misroutedCurrentQuarter,
      misroutedPreviousQuarter
    );

    const routedOutCurrentQuarter = transformData(
      'CURRENT QUARTER',
      'ROUTED OUT'
    );
    const routedOutPreviousQuarter = transformData(
      'PREVIOUS QUARTER',
      'ROUTED OUT'
    );
    console.log(
      'Routed Out Current & Previous:',
      routedOutCurrentQuarter,
      routedOutPreviousQuarter
    );

    this.backlogInflowChart = new Chart('backlogInflowChart', {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Backlog (Current Quarter)',
            data: transformData('CURRENT QUARTER', 'BACKLOG'),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
          },
          {
            label: 'Backlog (Previous Quarter)',
            data: transformData('PREVIOUS QUARTER', 'BACKLOG'),
            backgroundColor: 'rgba(75, 192, 192, 0.3)',
          },
          {
            label: 'Inflow (Current Quarter)',
            data: transformData('CURRENT QUARTER', 'INFLOW'),
            backgroundColor: 'rgba(255, 159, 64, 0.6)',
            type: 'line',
          },
          {
            label: 'Inflow (Previous Quarter)',
            data: transformData('PREVIOUS QUARTER', 'INFLOW'),
            backgroundColor: 'rgba(255, 159, 64, 0.3)',
            type: 'line',
          },
          {
            label: 'Routed Out (Current Quarter)',
            data: transformData('CURRENT QUARTER', 'ROUTED OUT'),
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            type: 'line',
          },
          {
            label: 'Routed Out (Previous Quarter)',
            data: transformData('PREVIOUS QUARTER', 'ROUTED OUT'),
            borderColor: 'rgba(54, 162, 235, 0.5)',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            type: 'line',
          },
          {
            label: 'Misrouted (Current Quarter)',
            data: transformData('CURRENT QUARTER', 'MISROUTED'),
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            type: 'line',
          },
          {
            label: 'Misrouted (Previous Quarter)',
            data: transformData('PREVIOUS QUARTER', 'MISROUTED'),
            backgroundColor: 'rgba(255, 99, 132, 0.3)',
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
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
          },
          {
            label: 'PDF (Previous Quarter)',
            data: transformData('PREVIOUS QUARTER', 'PDF'),
            backgroundColor: 'rgba(153, 102, 255, 0.3)',
          },
          {
            label: 'Cancelled (Current Quarter)',
            data: transformData('CURRENT QUARTER', 'CANCELLED'),
            backgroundColor: 'rgba(201, 203, 207, 0.6)',
            type: 'line',
          },
          {
            label: 'Cancelled (Previous Quarter)',
            data: transformData('PREVIOUS QUARTER', 'CANCELLED'),
            backgroundColor: 'rgba(201, 203, 207, 0.3)',
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
