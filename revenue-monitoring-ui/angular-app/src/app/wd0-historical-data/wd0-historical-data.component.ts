import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { MatTableDataSource } from '@angular/material/table';
import * as XLSX from 'xlsx';
import { RegressionService } from '../regression.service';
import { Chart, registerables } from 'chart.js';
import { runtimes } from './runtimes';
Chart.register(...registerables);

@Component({
  selector: 'app-wd0-historical-data',
  templateUrl: './wd0-historical-data.component.html',
  styleUrls: ['./wd0-historical-data.component.css'],
})
export class Wd0HistoricalDataComponent implements OnInit {
  protected http: ApiHttpService;

  constructor(
    http: ApiHttpService,
    private regressionService: RegressionService
  ) {
    this.http = http;
    Chart.register(...registerables);
  }

  private barChart: Chart | null = null;

  displayedColumns: string[] = [];
  historicalData: HistoricalDataModel[];
  dataSource: any;

  ngOnInit(): void {
    this.getHistoricalData();
    this.getRegressionData();
    this.createLineGraph();
  }

  private getHistoricalData() {
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

      const grandTotalObject = {
        ENTITY: 'Grand Total',
        LINE_TYPE: 'Total',
        ...grandTotal,
      };
      const serviceTotalObject = {
        ENTITY: 'Service Total',
        LINE_TYPE: 'Service',
        ...serviceTotal,
      };
      const productTotalObject = {
        ENTITY: 'Product Total',
        LINE_TYPE: 'Product',
        ...productTotal,
      };

      // Insert total rows at the beginning of the data array
      data.unshift(grandTotalObject, serviceTotalObject, productTotalObject);

      this.historicalData = data;

      this.removeDuplicateEntityEntries(data);

      this.dataSource = new MatTableDataSource<HistoricalDataModel>(
        this.historicalData
      );

      this.generateBarChart(this.historicalData);
    });
  }

  formatColumnHeader(columnName: string): string {
    return columnName.replace(/_/g, ' ');
  }

  isProductTotalRow(row: any): boolean {
    return row.ENTITY === 'Product Total';
  }

  getTrend(
    row: any,
    prevColumn: string,
    currentColumn: string
  ): { trend: 'up' | 'down' | 'same'; change: number } {
    const prevValue = parseFloat(row[prevColumn]);
    const currentValue = parseFloat(row[currentColumn]);

    if (!isNaN(prevValue) && !isNaN(currentValue)) {
      const change = ((currentValue - prevValue) / prevValue) * 100;
      if (currentValue > prevValue) return { trend: 'up', change: change };
      else if (currentValue < prevValue)
        return { trend: 'down', change: change };
      else return { trend: 'same', change: 0 };
    }
    return { trend: 'same', change: 0 };
  }

  private removeDuplicateEntityEntries(data: any[]) {
    const entityMap = new Map<string, boolean>();
    data.forEach((row) => {
      if (row.ENTITY && entityMap.has(row.ENTITY)) {
        // Optionally, adjust based on your specific requirements
        row.ENTITY = null; // This line effectively marks duplicates
      } else {
        entityMap.set(row.ENTITY, true);
      }
    });

    // Update displayedColumns based on the processed data
    this.updateDisplayedColumns(data);
  }

  private updateDisplayedColumns(data: any[]) {
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
  }

  generateBarChart(
    historicalData: HistoricalDataModel[],
    canvasId: string = 'barChartCanvasId'
  ) {
    const filteredData = this.filterDataByDate(
      historicalData,
      new Date(2022, 9)
    ); // October 2022

    const quarterlyData = this.sumQuarterlyData(filteredData);

    const labels = Object.keys(quarterlyData).map((label) =>
      label.replace(/_/g, ' ')
    ); // Replace underscores

    const datasets = [
      {
        label: 'Service',
        data: labels.map(
          (label) => quarterlyData[label.replace(/ /g, '_')].service || 0
        ), // Replace spaces back to underscores to match keys
        backgroundColor: 'rgb(0,119,188)',
      },
      {
        label: 'Product',
        data: labels.map(
          (label) => quarterlyData[label.replace(/ /g, '_')].product || 0
        ), // Replace spaces back to underscores to match keys
        backgroundColor: 'rgb(77,184,255)',
      },
    ];

    this.barChart = new Chart(canvasId, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: datasets,
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }

  filterDataByDate(
    historicalData: HistoricalDataModel[],
    startDate: Date
  ): HistoricalDataModel[] {
    return historicalData.filter((data) => {
      const keys = Object.keys(data).filter((key) => key.includes('_')); // Only consider keys with an underscore

      return keys.some((key) => {
        const [month, year] = key.split('_');

        // Check if year is defined and adjust if it's only two digits
        const fullYear = year && year.length === 2 ? `20${year}` : year;
        if (fullYear && !isNaN(+fullYear)) {
          const monthNumber = this.monthStringToNumber(month);
          if (!isNaN(monthNumber)) {
            const date = new Date(+fullYear, monthNumber - 1);
            return date >= startDate;
          }
        }
        return false;
      });
    });
  }

  private monthStringToNumber(month: string): number {
    const months = {
      JAN: 1,
      APR: 4,
      JUL: 7,
      OCT: 10,
    };
    const monthNumber = months[month] || 0;
    return monthNumber;
  }

  sumQuarterlyData(historicalData: HistoricalDataModel[]): any {
    const quarterlySums = {};
    historicalData.forEach((data) => {
      Object.keys(data).forEach((key) => {
        if (
          key.includes('_') &&
          !['ENTITY', 'LINE_TYPE', 'SEQUENCE_NUMBER'].includes(key)
        ) {
          const [month, year] = key.split('_');
          const quarter = this.getFiscalQuarter(month, year);
          const lineType = data.LINE_TYPE ? data.LINE_TYPE.toLowerCase() : null;
          const valueString = data[key];
          const value = valueString ? parseInt(valueString, 10) : 0;

          if (lineType && !isNaN(value)) {
            if (!quarterlySums[quarter]) {
              quarterlySums[quarter] = { service: 0, product: 0 };
            }
            quarterlySums[quarter][lineType] += value;
          }
        }
      });
    });
    return quarterlySums;
  }

  private getFiscalQuarter(month: string, year: string): string {
    const fiscalMonths = {
      OCT: 'Q1',
      JAN: 'Q2',
      APR: 'Q3',
      JUL: 'Q4',
    };
    const fiscalQuarter = fiscalMonths[month];
    return fiscalQuarter ? `${fiscalQuarter}_${year}` : '';
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

  upperCI: number;
  lowerCI: number;

  getRegressionData() {
    this.http.get('wd0-regression').subscribe((data: any) => {
      const regressionData = this.processRegressionData(data);

      console.log('Regression Data:', regressionData);

      const regressionResults =
        this.regressionService.performMultipleLinearRegression(
          regressionData.X,
          regressionData.y
        );

      console.log('Coefficients:', regressionResults.coefficients);
      console.log('Intercept:', regressionResults.intercept);

      console.log('Lower CI:', regressionResults.lowerCI);
      console.log('Upper CI:', regressionResults.upperCI);

      this.upperCI = regressionResults.upperCI;
      this.lowerCI = regressionResults.lowerCI;

      const newInput = [[27718, 10417]]; // [PRODUCT, SERVICE]
      const predictedRuntimes = this.regressionService.predict(newInput);
      console.log(`Predicted runtime: ${predictedRuntimes[0]}`);

      //chart data collection
      console.log(
        `OCT-24: ${this.regressionService.predict([[23050, 15246]])}`
      );
      console.log(`NOV-24: ${this.regressionService.predict([[19926, 2859]])}`);
      console.log(`DEC-24: ${this.regressionService.predict([[20341, 8383]])}`);
      console.log(`JAN-24: ${this.regressionService.predict([[20341, 8383]])}`);
      console.log(`FEB-24: ${this.regressionService.predict([[16105, 1946]])}`);

      const months = [
        { period: 'OCT-24', product: 23050, service: 15246, df: 23 },
        { period: 'NOV-24', product: 19926, service: 2859, df: 24 },
        { period: 'DEC-24', product: 20341, service: 8383, df: 25 },
        { period: 'JAN-24', product: 20341, service: 8383, df: 26 },
        { period: 'FEB-24', product: 16105, service: 1946, df: 27 },
      ];

      months.forEach((month) => {
        const input = [[month.product, month.service]];
        const { predictedRuntime, lowerCI, upperCI } =
          this.regressionService.predictWithConfidenceIntervals(
            input,
            month.df
          );
        console.log(
          `${month.period}: Predicted runtime = ${predictedRuntime}, Lower CI = ${lowerCI}, Upper CI = ${upperCI}`
        );
      });
    });
  }

  createLineGraph() {
    this.http.get('wd0-current-month').subscribe((data: any) => {
      console.log('Current Month Data:', data);
    });
    const ctx = (
      document.getElementById('lineChartCanvas') as HTMLCanvasElement
    ).getContext('2d');
    if (ctx) {
      const lineChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['OCT-24', 'NOV-24', 'DEC-24', 'JAN-24', 'FEB-24'],
          datasets: [
            {
              label: 'Predicted Runtime',
              data: [4.457, 4.49, 4.484, 4.484, 4.525],
              yAxisID: 'y',
              tension: 0.3,
            },
            {
              label: 'Lower Confidence Interval',
              data: [3.178, 3.214, 3.21, 3.213, 3.256],
              yAxisID: 'y',
              tension: 0.3,
            },
            {
              label: 'Upper Confidence Interval',
              data: [5.737, 5.767, 5.758, 5.756, 5.794],
              yAxisID: 'y',
              tension: 0.3,
            },
            {
              label: 'Product',
              data: [23050, 19926, 20341, 20341, 16105],
              yAxisID: 'y1',
              tension: 0.3,
            },
            {
              label: 'Service',
              data: [15246, 2859, 8383, 8383, 1946],
              yAxisID: 'y1',
              tension: 0.3,
            },
          ],
        },
        options: {
          scales: {
            y: {
              type: 'linear',
              position: 'left',
              beginAtZero: false,
            },
            y1: {
              type: 'linear',
              position: 'right',
              beginAtZero: true,
              grid: {
                drawOnChartArea: false, // only want the grid lines for one axis to show up
              },
            },
          },
        },
      });
    }
  }

  // This method will transform the backend data into two arrays: productLines and serviceLines.
  processRegressionData(data: any[]): { X: number[][]; y: number[][] } {
    // Initialize empty arrays for product and service line counts
    const productLines: number[] = [];
    const serviceLines: number[] = [];
    const y: number[] = []; // This will store your actual runtimes

    // Filter out months that are missing from the actual runtimes data
    const filteredData = data.filter((entry) =>
      runtimes.some((runtime) => runtime.PERIOD_NAME === entry.PERIOD_NAME)
    );

    // Assuming the filteredData is sorted by period and each period has two entries: one for PRODUCT and one for SERVICE
    for (let i = 0; i < filteredData.length; i += 2) {
      const productEntry =
        filteredData[i].LINE_TYPE === 'PRODUCT'
          ? filteredData[i]
          : filteredData[i + 1];
      const serviceEntry =
        filteredData[i].LINE_TYPE === 'SERVICE'
          ? filteredData[i]
          : filteredData[i + 1];

      // Check if the period for this entry exists in the runtimes array
      const runtimeEntry = runtimes.find(
        (rt) => rt.PERIOD_NAME === productEntry.PERIOD_NAME
      );
      if (runtimeEntry) {
        // Add the line counts and runtime to the respective arrays
        productLines.push(productEntry.LINE_COUNT);
        serviceLines.push(serviceEntry.LINE_COUNT);
        y.push(runtimeEntry.Actual_Run_Time);
      }
    }

    // Combine productLines and serviceLines into a 2D array for X
    const X = productLines.map((productCount, index) => [
      productCount,
      serviceLines[index],
    ]);

    // Convert y into a 2D array for MLR
    const yFormatted = y.map((runtime) => [runtime]); // Wrap each runtime value in an array

    // Return the formatted 2D array yFormatted as part of the object
    return { X, y: yFormatted };
  }
}

export interface HistoricalDataModel {
  [key: string]: string | null;
  ENTITY: string | null;
  LINE_TYPE: string | null;
}
