import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { MatTab } from '@angular/material/tabs';
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

  displayedColumnsForAgingBacklog: string[] = [
    'SERVICE_OFFERING',
    '<5days',
    '5-10days',
    '10-15days',
    '>15days',
  ];
  dataSourceAgingBacklog = new MatTableDataSource<any>([
    {
      SERVICE_OFFERING:
        'Billing Invoice and Revenue - Non Standard Revenue (NextGen CCRM)',
      '<5days': '80',
      '5-10days': '50',
      '10-15days': '30',
      '>15days': '10',
    },
    {
      SERVICE_OFFERING: 'Billing Invoice and Revenue Revenue Attribution',
      '<5days': '70',
      '5-10days': '40',
      '10-15days': '20',
      '>15days': '5',
    },
    {
      SERVICE_OFFERING:
        'Billing, Invoice and Revenue - Billing/Invoice Processing (Bridge)',
      '<5days': '60',
      '5-10days': '35',
      '10-15days': '15',
      '>15days': '8',
    },
    {
      SERVICE_OFFERING: 'Billing, Invoice and Revenue - Collections (ICMS)',
      '<5days': '90',
      '5-10days': '45',
      '10-15days': '25',
      '>15days': '12',
    },
    {
      SERVICE_OFFERING: 'Billing, Invoice and Revenue - Invoicing (AR)',
      '<5days': '85',
      '5-10days': '55',
      '10-15days': '35',
      '>15days': '20',
    },
    {
      SERVICE_OFFERING: 'Billing, Invoice and Revenue - Receipt Processing',
      '<5days': '75',
      '5-10days': '50',
      '10-15days': '25',
      '>15days': '15',
    },
    {
      SERVICE_OFFERING: 'Billing, Invoice and Revenue - Revenue Accounting',
      '<5days': '95',
      '5-10days': '60',
      '10-15days': '40',
      '>15days': '25',
    },
    {
      SERVICE_OFFERING: 'Billing, Invoice and Revenue – CMS (Highradius)',
      '<5days': '65',
      '5-10days': '30',
      '10-15days': '20',
      '>15days': '10',
    },
    {
      SERVICE_OFFERING: 'Customs Administration',
      '<5days': '50',
      '5-10days': '25',
      '10-15days': '10',
      '>15days': '5',
    },
    {
      SERVICE_OFFERING: 'Direct Tax Management',
      '<5days': '55',
      '5-10days': '35',
      '10-15days': '15',
      '>15days': '8',
    },
    {
      SERVICE_OFFERING: 'Indirect Tax Global',
      '<5days': '80',
      '5-10days': '45',
      '10-15days': '20',
      '>15days': '10',
    },
    {
      SERVICE_OFFERING: 'Intercompany Accounting',
      '<5days': '70',
      '5-10days': '40',
      '10-15days': '25',
      '>15days': '15',
    },
    {
      SERVICE_OFFERING:
        'Billing, Invoice and Revenue - Credit Processing (eCredit)',
      '<5days': '85',
      '5-10days': '55',
      '10-15days': '30',
      '>15days': '18',
    },
    {
      SERVICE_OFFERING:
        'Billing, Invoice and Revenue - Revenue Reporting (RRR)',
      '<5days': '95',
      '5-10days': '60',
      '10-15days': '35',
      '>15days': '20',
    },
  ]);

  displayedColumnsForCurrentQuarter: string[] = [];

  dataSourceCurrentQuarter = new MatTableDataSource<any>([]);
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
      console.log('espCaseServiceMetricSummary:', data);
      if (data && data.length > 0) {
        this.displayedColumnsForCurrentQuarter = Object.keys(data[0]);
        this.dataSourceCurrentQuarter = new MatTableDataSource(data);
      }
    });
  }

  getEspAgingCaseSummary() {
    this.http.get('esp-aging-case-summary').subscribe((data: any) => {
      console.log('espAgingCaseSummary:', data);
      if (data && data.length > 0) {
        this.displayedColumnsForAgingBacklog = Object.keys(data[0]);
        this.dataSourceAgingBacklog = new MatTableDataSource(data);
      }
    });
  }

  getEspWeeklyComparisonSummary() {
    this.http.get('esp-weekly-comparison-summary').subscribe((data: any) => {
      console.log('espWeeklyComparisonSummary:', data);
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
    const backlogInflowChart = new Chart('backlogInflowChart', {
      type: 'bar',
      data: {
        labels: [
          'WEEK 01',
          'WEEK 02',
          'WEEK 03',
          'WEEK 04',
          'WEEK 05',
          'WEEK 06',
          'WEEK 07',
          'WEEK 08',
          'WEEK 09',
          'WEEK 10',
          'WEEK 11',
          'WEEK 12',
          'WEEK 13',
        ],
        datasets: [
          {
            label: 'Backlog Q1FY25',
            data: [2, 0, 0, 0, 3, 0, 1, 1, 1, 5, 22, 8, 0],
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            type: 'bar',
          },
          {
            label: 'Backlog Q4FY24',
            data: [0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 7, 10],
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
            type: 'bar',
          },
          {
            label: 'Inflow Q1FY25',
            data: [86, 52, 52, 67, 64, 48, 54, 56, 55, 64, 56, 10, 0],
            borderColor: 'rgba(255, 159, 64, 1)',
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            type: 'line',
          },
          {
            label: 'Inflow Q4FY24',
            data: [53, 69, 60, 55, 63, 62, 62, 61, 79, 65, 76, 68, 78],
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            type: 'line',
          },
        ],
      },
      options: this.sharedChartOptions,
    });

    const cancelledPdfChart = new Chart('cancelledPdfChart', {
      type: 'bar',
      data: {
        labels: [
          'WEEK 01',
          'WEEK 02',
          'WEEK 03',
          'WEEK 04',
          'WEEK 05',
          'WEEK 06',
          'WEEK 07',
          'WEEK 08',
          'WEEK 09',
          'WEEK 10',
          'WEEK 11',
          'WEEK 12',
          'WEEK 13',
        ],
        datasets: [
          {
            label: 'Cancelled Cases Q1FY25',
            data: [14, 21, 12, 25, 14, 15, 17, 21, 16, 17, 2, 0, 0],
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            type: 'line',
          },
          {
            label: 'Cancelled Cases Q4FY24',
            data: [9, 5, 17, 5, 11, 9, 18, 17, 12, 14, 10, 22, 23],
            borderColor: 'rgba(255, 206, 86, 1)',
            backgroundColor: 'rgba(255, 206, 86, 0.2)',
            type: 'line',
          },
          {
            label: 'PDF Cases Q1FY25',
            data: [3, 2, 5, 2, 1, 1, 2, 2, 0, 2, 3, 0, 0],
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            type: 'bar',
          },
          {
            label: 'PDF Cases Q4FY24',
            data: [1, 0, 3, 0, 1, 2, 8, 6, 4, 6, 4, 6, 2],
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
            type: 'bar',
          },
        ],
      },
      options: this.sharedChartOptions,
    });

    const routedMisroutedChart = new Chart('routedMisroutedChart', {
      type: 'bar',
      data: {
        labels: [
          'WEEK 01',
          'WEEK 02',
          'WEEK 03',
          'WEEK 04',
          'WEEK 05',
          'WEEK 06',
          'WEEK 07',
          'WEEK 08',
          'WEEK 09',
          'WEEK 10',
          'WEEK 11',
          'WEEK 12',
          'WEEK 13',
        ],
        datasets: [
          {
            label: 'Misrouted Q1FY25',
            data: [1, 2, 1, 1, 3, 3, 2, 1, 0, 1, 2, 0, 0],
            backgroundColor: 'rgba(255, 159, 64, 0.6)',
            type: 'bar',
          },
          {
            label: 'Misrouted Q4FY24',
            data: [1, 8, 6, 2, 3, 4, 3, 4, 5, 5, 7, 0, 1],
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            type: 'bar',
          },
          {
            label: 'Routed Out Q1FY25',
            data: [30, 26, 31, 31, 26, 21, 27, 41, 32, 34, 22, 6, 0],
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            type: 'line',
          },
          {
            label: 'Routed Out Q4FY24',
            data: [22, 31, 21, 19, 29, 29, 32, 28, 26, 22, 45, 33, 43],
            borderColor: 'rgba(153, 102, 255, 1)',
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            type: 'line',
          },
        ],
      },
      options: this.sharedChartOptions,
    });
  }
}
