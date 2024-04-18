import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { MatTableDataSource } from '@angular/material/table';
import * as XLSX from 'xlsx';
import { RegressionService } from '../regression.service';
import { Chart, registerables } from 'chart.js';
import { Observable, interval, last, startWith, switchMap } from 'rxjs';
import { monthEndDates } from './monthEndDates';
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

  refreshInterval = 300000; //ms = 5 minutes

  private barChart: Chart | null = null;
  private lineChart: Chart | null = null;

  displayedColumns: string[] = [];
  historicalData: HistoricalDataModel[];
  dataSource: any;

  ngOnInit(): void {
    this.getRegressionData();

    this.getHistoricalData();
  }

  private getHistoricalData() {
    this.getEndpointData('wd0-historical-data').subscribe((data: any) => {
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
        LINE_TYPE: '—',
        ...grandTotal,
      };
      const serviceTotalObject = {
        ENTITY: 'Service Lines',
        LINE_TYPE: '—',
        ...serviceTotal,
      };
      const productTotalObject = {
        ENTITY: 'Product Lines',
        LINE_TYPE: '—',
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
    // Check if columnName matches the expected "MMM_YY" pattern
    if (columnName.match(/[A-Z]{3}_[0-9]{2}/)) {
      // Extract the month and year from the columnName
      const [month, year] = columnName.split('_');
      // Convert the month to a fiscal quarter
      const quarter = this.getFiscalQuarter(month, `${year}`);
      // Replace underscores with spaces and return the fiscal quarter format
      return quarter.replace(/_/g, ' ');
    } else {
      // For any columnName that doesn't match the pattern, replace underscores with spaces
      return columnName.replace(/_/g, ' ');
    }
  }

  //for the blue line on the table
  isProductTotalRow(row: any): boolean {
    return row.ENTITY === 'Product Lines';
  }

  getTrend(
    row: any,
    prevColumn: string,
    currentColumn: string
  ): { trend: 'up' | 'down' | 'same'; change: string | number } {
    // Note the change type includes string now
    const prevValue = parseFloat(row[prevColumn]);
    const currentValue = parseFloat(row[currentColumn]);

    if (!isNaN(prevValue) && !isNaN(currentValue)) {
      if (prevValue === 0 && currentValue !== 0) {
        // Special case: Previous quarter is 0, current quarter has a value
        return { trend: 'up', change: '—' }; // Use a dash for the change
      } else if (prevValue === 0 && currentValue === 0) {
        // Both values are 0
        return { trend: 'same', change: '—' }; // Consider it as no change
      }

      const change =
        prevValue !== 0 ? ((currentValue - prevValue) / prevValue) * 100 : '—'; // Calculate change normally if prevValue is not 0
      if (currentValue > prevValue) return { trend: 'up', change: change };
      else if (currentValue < prevValue)
        return { trend: 'down', change: change };
      else return { trend: 'same', change: 0 }; // If the values are equal
    }
    return { trend: 'same', change: '—' }; // Default case when values are not numbers
  }

  //removes the second country name row that repeats the above row
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
      'trend',
    ].map((key) => String(key));
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

  generateBarChart(
    historicalData: HistoricalDataModel[],
    canvasId: string = 'barChartCanvasId'
  ) {
    if (this.barChart) {
      this.barChart.destroy();
    }

    const quarterlyData = this.sumQuarterlyData(historicalData);

    const labels = Object.keys(quarterlyData).map((label) =>
      label.replace(/_/g, ' ')
    ); // Replace underscores

    const datasets = [
      {
        label: 'Product',
        data: labels.map(
          (label) => quarterlyData[label.replace(/ /g, '_')].product || 0
        ), // Replace spaces back to underscores to match keys
        backgroundColor: 'rgb(77,184,255)',
      },
      {
        label: 'Service',
        data: labels.map(
          (label) => quarterlyData[label.replace(/ /g, '_')].service || 0
        ), // Replace spaces back to underscores to match keys
        backgroundColor: 'rgb(0,119,188)',
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

  getEndpointData(endpoint: string): Observable<any> {
    let uniqueId = Date.now();
    let cacheBustingUrl = `${endpoint}?cacheBuster=${uniqueId}`;

    const polling$ = interval(this.refreshInterval).pipe(
      startWith(0), // Emit initial value immediately
      switchMap(() => this.http.get(cacheBustingUrl))
    );
    return polling$;
  }

  upperCI: number;
  lowerCI: number;

  getRegressionData() {
    const numberOfMonths = 4;
    const newMonthData = [[0, 0]];
    let newMonthName = [];

    //check if today is a month end
    let fetchDataForNewMonth = false;
    const today = new Date().toISOString().slice(0, 10); // Get today's date as YYYY-MM-DD
    if (monthEndDates.includes(today)) {
      fetchDataForNewMonth = true; // Flag to fetch new month data
    }

    if (fetchDataForNewMonth) {
      // Check if today is one of the fiscal Saturdays
      this.getEndpointData('wd0-current-month').subscribe((data: any) => {
        // double check product and service lines are going into the correct order of the array
        data.forEach((item: any) => {
          if (item.LINE_TYPE === 'PRODUCT') {
            newMonthData[0][0] = item.LINE_COUNT;
          } else if (item.LINE_TYPE === 'SERVICE') {
            newMonthData[0][1] = item.LINE_COUNT;
          }
        });
        newMonthName = data[0].PERIOD_NAME;
      });
    }

    this.http.get('wd0-regression').subscribe((data: any) => {
      //get recent months names for graph
      const productEntries = data.filter(
        (entry) => entry.LINE_TYPE === 'PRODUCT'
      );
      const recentProductEntries = productEntries.slice(-numberOfMonths); // Get the last 12 entries
      const recentMonthNames = recentProductEntries.map(
        (entry) => entry.PERIOD_NAME
      );
      if (fetchDataForNewMonth) {
        recentMonthNames.push(newMonthName);
      }

      // prep the data and run regression (this sets a model in the service)
      const regressionData = this.processRegressionData(data);

      this.regressionService.performMultipleLinearRegression(
        regressionData.X,
        regressionData.y
      );

      //collect recent months of data for graph
      const recentMonthsData = regressionData.X.slice(-numberOfMonths);
      const degreesOfFreedomBase = regressionData.X.length - 2;
      const combineRecentMonthsWithDFData = recentMonthsData.map(
        (monthData, index) => {
          return {
            X: [monthData], // The predictWithConfidenceIntervals function expects X as a 2D array
            degreesOfFreedom:
              degreesOfFreedomBase - (numberOfMonths - 1 - index), // Adjust the index for the last 12 months
          };
        }
      );
      recentMonthsData.push(newMonthData[0]);

      let fastestTimes = [];
      let slowestTimes = [];

      // get last 6 months confidence intervals
      combineRecentMonthsWithDFData.forEach((data) => {
        const result = this.regressionService.predictWithConfidenceIntervals(
          data.X,
          data.degreesOfFreedom
        );
        fastestTimes.push(+result.lowerCI.toFixed(2));
        slowestTimes.push(+result.upperCI.toFixed(2));
      });

      //for next month prediction (.lengh-1 is for the degress of freedom)
      const upcomingMonthPrediction =
        this.regressionService.predictWithConfidenceIntervals(
          newMonthData,
          regressionData.X.length - 1
        );
      fastestTimes.push(+upcomingMonthPrediction.lowerCI.toFixed(2));
      slowestTimes.push(+upcomingMonthPrediction.upperCI.toFixed(2));

      let actualTimes = regressionData.y
        .slice(-numberOfMonths)
        .map((time) => time[0]);

      this.createLineGraph(
        fastestTimes,
        slowestTimes,
        recentMonthNames,
        recentMonthsData,
        actualTimes
      );
    });
  }

  createLineGraph(fastestTimes, slowestTimes, labels, lines, actualTimes) {
    const canvas = document.getElementById(
      'lineChartCanvas'
    ) as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    // Check if lineChart already exists. If so, destroy it.
    if (this.lineChart) {
      this.lineChart.destroy();
    }

    // Now, recreate the chart with the new data
    this.lineChart = new Chart(ctx, {
      type: 'line', // This specifies the default chart type
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Product (lines)',
            data: lines.map((line) => line[0]),
            yAxisID: 'y',
            type: 'bar', // Change this dataset to a bar chart
            backgroundColor: 'rgb(77,184,255, 0.5)', // Example background color for bars
            // barThickness: 20,
          },
          {
            label: 'Service (lines)',
            data: lines.map((line) => line[1]),
            yAxisID: 'y',
            type: 'bar', // Change this dataset to a bar chart
            backgroundColor: 'rgb(0,119,188, 0.5)', // Example background color for bars
            // barThickness: 20,
          },
          {
            label: 'Actual Run (hrs)',
            data: actualTimes,
            yAxisID: 'y1',
            tension: 0.3,
            type: 'line', // Explicitly setting type to line for clarity
            borderColor: '#ffce56', // Orange color for the actual run line
            backgroundColor: '#ffce5650', // Orange color for the actual run line
            pointBackgroundColor: '#ffce56', // Orange color for the actual run line
          },
          {
            label: 'Lower Bound (hrs)',
            data: fastestTimes,
            yAxisID: 'y1',
            tension: 0.3,
            type: 'line',
            borderColor: '#FF6384', // Red color for the lower bound line
            backgroundColor: '#FF638450', // Red color for the lower bound line
            pointBackgroundColor: '#FF6384', // Red color for the lower bound line
          },
          {
            label: 'Upper Bound (hrs)',
            data: slowestTimes,
            yAxisID: 'y1',
            tension: 0.3,
            type: 'line',
            borderColor: '#48bc84', // Green color for the upper bound line
            backgroundColor: '#48bc8450', // Green color for the upper bound line
            pointBackgroundColor: '#48bc84', // Green color for the upper bound line
          },
        ],
      },
      options: {
        scales: {
          x: {
            grid: {
              offset: false,
            },
          },

          y: {
            type: 'linear',
            position: 'left',
            beginAtZero: false,
            title: {
              display: true,
              text: 'Lines',
            },
          },
          y1: {
            type: 'linear',
            position: 'right',
            beginAtZero: true,
            grid: {
              drawOnChartArea: false, // only want the grid lines for one axis to show up
            },
            title: {
              display: true,
              text: 'Hours',
            },
          },
        },
        plugins: {
          legend: {
            onClick: () => false, // Disable toggling visibility by clicking on legend items
          },
        },
      },
    });
  }

  processRegressionData(data: any[]): { X: number[][]; y: number[][] } {
    // Define the outlier periods that should be excluded from the dataset
    const excludePeriods = ['JUL-23', 'APR-23'];

    // Initialize empty arrays for product and service line counts
    const productLines: number[] = [];
    const serviceLines: number[] = [];
    const executionTimes: number[] = []; // This will store your execution times

    // Filter out the outlier months
    const filteredData = data.filter(
      (entry) => !excludePeriods.includes(entry.PERIOD_NAME)
    );

    // Process the filtered data
    for (let i = 0; i < filteredData.length; i += 2) {
      const productEntry =
        filteredData[i].LINE_TYPE === 'PRODUCT'
          ? filteredData[i]
          : filteredData[i + 1];
      const serviceEntry =
        filteredData[i].LINE_TYPE === 'SERVICE'
          ? filteredData[i]
          : filteredData[i + 1];

      // Since execution time is repeated for each product and service line, select it from the product line
      const executionTime = productEntry.EXECUTION_TIME;

      // Add the line counts and execution time to the respective arrays
      productLines.push(productEntry.LINE_COUNT);
      serviceLines.push(serviceEntry.LINE_COUNT);
      executionTimes.push(executionTime);
    }

    // Combine productLines and serviceLines into a 2D array for X
    const X = productLines.map((productCount, index) => [
      productCount,
      serviceLines[index],
    ]);

    // Convert executionTimes into a 2D array for MLR
    const yFormatted = executionTimes.map((time) => [time]); // Wrap each execution time value in an array

    // Return the formatted 2D arrays
    return { X, y: yFormatted };
  }
}

export interface HistoricalDataModel {
  [key: string]: string | null;
  ENTITY: string | null;
  LINE_TYPE: string | null;
}
