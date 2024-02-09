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
  tableData: any[] = [];

  summaryDataSource: MatTableDataSource<any>;

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
      const grandTotal = {};
      const serviceTotal = {};
      const productTotal = {};

      data.forEach((obj) => {
        for (const key in obj) {
          if (obj[key] && !isNaN(parseInt(obj[key]))) {
            // Update grandTotal
            grandTotal[key] = (grandTotal[key] || 0) + parseInt(obj[key]);

            // Update serviceTotal or productTotal based on LINE_TYPE
            if (obj.LINE_TYPE === 'Service') {
              serviceTotal[key] = (serviceTotal[key] || 0) + parseInt(obj[key]);
            } else if (obj.LINE_TYPE === 'Product') {
              productTotal[key] = (productTotal[key] || 0) + parseInt(obj[key]);
            }
          }
        }
      });

      // Example of populating the grandTotalObject correctly
      const grandTotalObject = { ENTITY: 'Grand Total', LINE_TYPE: 'Total' };
      Object.keys(grandTotal).forEach((key) => {
        grandTotalObject[key] = grandTotal[key];
      });

      // Inserting the total rows correctly
      data.unshift(grandTotalObject);

      // Similar approach for serviceTotalObject and productTotalObject
      const serviceTotalObject = {
        ENTITY: 'Service Total',
        LINE_TYPE: 'Service',
      };
      Object.keys(serviceTotal).forEach((key) => {
        serviceTotalObject[key] = serviceTotal[key];
      });

      const productTotalObject = {
        ENTITY: 'Product Total',
        LINE_TYPE: 'Product',
      };
      Object.keys(productTotal).forEach((key) => {
        productTotalObject[key] = productTotal[key];
      });

      data.splice(1, 0, serviceTotalObject, productTotalObject);

      this.historicalData = data;

      const entityMap = new Map<string, boolean>();

      for (const data of this.historicalData) {
        const entity = data.ENTITY;

        if (entityMap.has(entity)) {
          data.ENTITY = null;
        } else {
          entityMap.set(entity, true);
        }
      }

      const allKeys = new Set();
      data.forEach((obj) => {
        Object.keys(obj).forEach((key) => {
          allKeys.add(key);
        });
      });

      this.displayedColumns = [
        'ENTITY',
        'LINE_TYPE',
        ...Array.from(allKeys).filter(
          (key) => key !== 'ENTITY' && key !== 'LINE_TYPE'
        ),
      ].map((key) => String(key));
      // Add these rows for summary table but not in the main table
      data.splice(1, 0, serviceTotalObject, productTotalObject);

      // Create a filtered list for the main table to exclude 'Service Total' and 'Product Total'
      const filteredDataForMainTable = data.filter(
        (row: any) =>
          row.ENTITY !== 'Service Total' && row.ENTITY !== 'Product Total'
      );

      // Setup dataSource for the main table with filtered data
      this.dataSource = new MatTableDataSource<HistoricalDataModel>(
        filteredDataForMainTable
      );

      // Setup dataSource for the summary table with just the total rows
      this.summaryDataSource = new MatTableDataSource([
        serviceTotalObject,
        productTotalObject,
      ]);

      // this.processChartData();
      // this.barChartData = this.chartProcessedData;
    });
  }

  formatColumnHeader(columnName: string): string {
    return columnName.replace(/_/g, ' ');
  }

  getTrend(
    row: any,
    prevColumn: string,
    currentColumn: string
  ): 'up' | 'down' | 'same' {
    const prevValue = parseFloat(row[prevColumn]);
    const currentValue = parseFloat(row[currentColumn]);

    if (!isNaN(prevValue) && !isNaN(currentValue)) {
      if (currentValue > prevValue) return 'up';
      else if (currentValue < prevValue) return 'down';
    }
    return 'same';
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
  APR_20: string | null;
  APR_21: string | null;
  APR_22: string | null;
  APR_23: string | null;
  ENTITY: string | null;
  JAN_20: string | null;
  JAN_21: string | null;
  JAN_22: string | null;
  JAN_23: string | null;
  JUL_19: string | null;
  JUL_20: string | null;
  JUL_21: string | null;
  JUL_22: string | null;
  JUL_23: string | null;
  LINE_TYPE: string | null;
  OCT_20: string | null;
  OCT_21: string | null;
  OCT_22: string | null;
  OCT_23: string | null;
  OCT_24: string | null;
}
