import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { MatTableDataSource } from '@angular/material/table';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-wd0-historical-data',
  templateUrl: './wd0-historical-data.component.html',
  styleUrls: ['./wd0-historical-data.component.css'],
})
export class Wd0HistoricalDataComponent implements OnInit {
  protected http: ApiHttpService;

  constructor(http: ApiHttpService) {
    this.http = http;
  }

  displayedColumns: string[] = [];
  historicalData: HistoricalDataModel[];
  dataSource: any;
  chartProcessedData: any[] = [];

  ngOnInit(): void {
    this.getHistoricalData();
    this.processLineChartData();
  }

  public barChartOptions = {
    responsive: true,
    scales: {
      xAxes: [
        {
          stacked: true,
        },
      ],
      yAxes: [
        {
          stacked: true,
        },
      ],
    },
  };
  public barChartLabels = [
    'APR 21',
    'JUL 21',
    'OCT 22',
    'JAN 22',
    'APR 22',
    'JUL 22',
    'OCT 23',
    'JAN 23',
    'APR 23',
    'JUL 23',
  ];
  public barChartType = 'bar';
  public barChartLegend = true;
  public barChartData: any[] = [];

  public lineChartOptions = {
    responsive: true,
    scales: {
      xAxes: [
        {
          display: true,
        },
      ],
      yAxes: [
        {
          display: true,
        },
      ],
    },
  };
  public lineChartLabels = this.barChartLabels;
  public lineChartType = 'line';
  public lineChartLegend = true;
  public lineChartData: any[] = [];

  getHistoricalData() {
    this.http.get('wd0-historical-data').subscribe((data: any) => {
      this.historicalData = data;
      this.displayedColumns = Object.keys(this.historicalData[0]);
      this.dataSource = new MatTableDataSource<HistoricalDataModel>(
        this.historicalData
      );

      this.processChartData();
      this.barChartData = this.chartProcessedData;
    });
  }

  formatColumnHeader(columnName: string): string {
    return columnName.replace(/_/g, ' ');
  }

  processChartData() {
    const entities = ['United Kingdom', 'US', 'Canada', 'India'];
    const productData = {};
    const serviceData = {};

    const chartColors = {
      'United Kingdom-Product': 'rgb(0,119,188)', // Darker shade of 009EDC
      'United Kingdom-Service': 'rgb(77,184,255)', // Lighter tint of 009EDC
      'US-Product': 'rgb(30,68,113)', // Given dark blue 1e4471
      'US-Service': 'rgb(62,106,178)', // Slightly lighter version of 1e4471
      'Canada-Product': 'rgb(64,170,128)', // Soft green complementary to 009EDC
      'Canada-Service': 'rgb(128,213,170)', // Lighter version of the chosen green
      'India-Product': 'rgb(255,165,0)', // Soft orange
      'India-Service': 'rgb(255,213,128)', // Lighter version of chosen orange
    };

    for (let entry of this.historicalData) {
      if (entities.includes(entry.ENTITY)) {
        if (entry.LINE_TYPE === 'Product') {
          if (!productData[entry.ENTITY]) {
            productData[entry.ENTITY] = [];
          }
          productData[entry.ENTITY].push(
            entry.APR_21,
            entry.JUL_21,
            entry.OCT_22,
            entry.JAN_22,
            entry.APR_22,
            entry.JUL_22,
            entry.OCT_23,
            entry.JAN_23,
            entry.APR_23,
            entry.JUL_23
          );
        }
        if (entry.LINE_TYPE === 'Service') {
          if (!serviceData[entry.ENTITY]) {
            serviceData[entry.ENTITY] = [];
          }
          serviceData[entry.ENTITY].push(
            entry.APR_21,
            entry.JUL_21,
            entry.OCT_22,
            entry.JAN_22,
            entry.APR_22,
            entry.JUL_22,
            entry.OCT_23,
            entry.JAN_23,
            entry.APR_23,
            entry.JUL_23
          );
        }
      }
    }

    this.chartProcessedData = [];

    entities.forEach((entity) => {
      if (productData[entity]) {
        this.chartProcessedData.push({
          data: productData[entity],
          label: `${entity} - Product`,
          stack: entity,
          backgroundColor: chartColors[`${entity}-Product`], // <-- fixed this line
        });
      }
      if (serviceData[entity]) {
        this.chartProcessedData.push({
          data: serviceData[entity],
          label: `${entity} - Service`,
          stack: entity,
          backgroundColor: chartColors[`${entity}-Service`], // <-- fixed this line
        });
      }
    });
  }

  processLineChartData() {
    const totalProductData = [];
    const totalServiceData = [];

    this.chartProcessedData.forEach((chartData) => {
      if (chartData.label.includes('Product')) {
        totalProductData.push(...chartData.data);
      }
      if (chartData.label.includes('Service')) {
        totalServiceData.push(...chartData.data);
      }
    });

    const reducedProductData = this.reduceData(totalProductData);
    const reducedServiceData = this.reduceData(totalServiceData);

    this.lineChartData = [
      {
        data: reducedProductData,
        label: 'Total Product',
        borderColor: '#FF5733', // Choose the color of your choice
        fill: false,
      },
      {
        data: reducedServiceData,
        label: 'Total Service',
        borderColor: '#33C2FF', // Choose the color of your choice
        fill: false,
      },
    ];
  }

  reduceData(data: number[]): number[] {
    let reducedData = [];

    for (let i = 0; i < data.length; i += 10) {
      let chunk = data.slice(i, i + 10);
      let sum = chunk.reduce((a, b) => a + b, 0);
      reducedData.push(sum);
    }

    return reducedData;
  }

  exportTableToExcel(data: any[], sheetName: string, filename: string) {
    let worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    let workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    let excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    this.saveAsExcelFile(excelBuffer, filename);
  }

  saveAsExcelFile(buffer: any, filename: string) {
    let data: Blob = new Blob([buffer], { type: 'application/octet-stream' });
    let url = window.URL.createObjectURL(data); // temp URL that points to the generated excel file data buffer
    let link = document.createElement('a'); // create link
    link.href = url;
    link.download = filename + '.xlsx';
    link.click(); // triggers the download process and save file prompt in browser
    window.URL.revokeObjectURL(url); // revoke temp URL
  }
}

export interface HistoricalDataModel {
  APR_20: string;
  APR_21: string;
  APR_22: string;
  APR_23: string;
  AUG_20: string;
  DEC_20: string;
  ENTITY: string;
  FEB_20: string;
  JAN_20: string;
  JAN_21: string;
  JAN_22: string;
  JAN_23: string;
  JUL_19: string;
  JUL_20: string;
  JUL_21: string;
  JUL_22: string;
  JUL_23: string;
  JUN_19: string;
  LINE_TYPE: string;
  NOV_20: string;
  OCT_20: string;
  OCT_21: string;
  OCT_22: string;
  OCT_23: string;
  OCT_24: string | null;
  SEP_20: string;
  SEQUENCE_NUMBER: string;
}
