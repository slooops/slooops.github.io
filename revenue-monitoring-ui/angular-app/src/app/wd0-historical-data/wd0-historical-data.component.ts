import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { MatTableDataSource } from '@angular/material/table';
import * as XLSX from 'xlsx';
import { RegressionService } from '../regression.service';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { ChartData, ChartDataset } from 'chart.js/auto';
import { ChartOptions } from 'chart.js'; // Import ChartOptions for proper typing

import { Observable, interval, last, startWith, switchMap } from 'rxjs';
import { tap } from 'rxjs/operators';

import { monthEndDates } from './monthEndDates';
Chart.register(...registerables);

@Component({
  selector: 'app-wd0-historical-data',
  templateUrl: './wd0-historical-data.component.html',
  styleUrls: ['./wd0-historical-data.component.scss'],
})
export class Wd0HistoricalDataComponent implements OnInit, AfterViewInit {
  protected http: ApiHttpService;
  loading: boolean = true;
  errorMessage: boolean = false;
  barChartLoading: boolean = true;
  dataTimestamp: string;

  upperCI: number;
  lowerCI: number;

  constructor(
    http: ApiHttpService,
    private regressionService: RegressionService
  ) {
    Chart.register(...registerables, ChartDataLabels);
    this.http = http;
  }

  refreshInterval = 300000; //ms = 5 minutes

  private lineChart: Chart | null = null;

  displayedColumns: string[] = [];
  historicalData: HistoricalDataModel[];
  exportData: ExportDataModel[];

  dataSource: any;

  unprocessedRegressionData: any[] = [];
  numberOfMonths: number = 4;
  newMonthName: string = '';
  newMonthData = [[0, 0]];
  fetchDataForNewMonth = false;
  today = new Date();

  ngOnInit(): void {
    this.dataTimestamp = `Last Updated: ...`;
    const localDateString = this.today.toLocaleDateString('en-CA'); // en-CA provides the format YYYY-MM-DD
    if (monthEndDates.includes(localDateString)) {
      this.fetchDataForNewMonth = true; // Flag to fetch new month data
    }

    let serviceActuals = [null, null, null];
    let productActuals = [null, null, null];
    console.log(this.today, 'hi', this.fetchDataForNewMonth);

    // Fetch data for regression
    if (this.fetchDataForNewMonth) {
      this.getEndpointData('wd0-current-month')
        .pipe(
          tap((data: any) => {
            // Process the current month data
            data.forEach((item: any) => {
              if (item.LINE_TYPE === 'PRODUCT') {
                this.newMonthData[0][0] = item.LINE_COUNT;
              } else if (item.LINE_TYPE === 'SERVICE') {
                this.newMonthData[0][1] = item.LINE_COUNT;
              }
            });
            this.newMonthName = data[0].PERIOD_NAME;
          }),
          switchMap(() => this.http.get('wd0-regression'))
        )
        .subscribe((data: any) => {
          this.unprocessedRegressionData = data;

          productActuals = [null, null, null];
          serviceActuals = [null, null, null];

          this.getWd0Volumes(productActuals, serviceActuals);

          // Process regression data and execute regression
          setTimeout(() => {
            const regressionData = this.processRecentMonths(
              this.unprocessedRegressionData
            );
            this.runRegressionIfDataReady(regressionData);
            this.loading = false;
          }, 1000);
        });
    } else {
      this.http.get('wd0-regression').subscribe((data: any) => {
        // this.unprocessedRegressionData = data;

        productActuals = this.extractProductActuals(data);
        serviceActuals = this.extractServiceActuals(data);

        data = this.processRecentMonths(data);

        this.getWd0Volumes(productActuals, serviceActuals);

        // this.regressionService.performMultipleLinearRegression(data.X, data.y);

        this.loading = false;
        this.dataTimestamp = `Last Updated: ${new Date().toLocaleString()}`;
      });
    }

    this.refreshExportData();
    this.getHistoricalData();
  }

  ngAfterViewInit() {
    // this.getRegressionData();
  }

  getWd0Volumes(productActuals: number[], serviceActuals: number[]) {
    console.log('productActuals', productActuals);
    console.log('serviceActuals', serviceActuals);
    this.http.get('wd0-volumes').subscribe((data: any) => {
      // Step 1: Filter the most recent fiscal period
      const mostRecentFiscalPeriod = this.getMostRecentFiscalPeriod(data);

      // Step 2: Filter the data for the most recent period
      const recentData = data.filter(
        (entry: any) => entry.FISCAL_PERIOD === mostRecentFiscalPeriod
      );

      // Step 3: Organize by PRODUCT_TYPE and sort by WD
      const productData = this.filterAndSortData(recentData, 'PRODUCT');
      const serviceData = this.filterAndSortData(recentData, 'SERVICE');

      // Now use `productData` and `serviceData` in your charts along with actuals
      this.updateServiceLineChart(serviceData, serviceActuals); // for service data
      this.updateProductLineChart(productData, productActuals); // for product data
    });
  }

  // Step 1: Function to get the most recent fiscal period
  getMostRecentFiscalPeriod(data: any[]): string {
    // Extract all fiscal periods and sort them (assumes fiscal periods are sortable strings)
    const fiscalPeriods = [
      ...new Set(data.map((entry: any) => entry.FISCAL_PERIOD)),
    ];
    fiscalPeriods.sort(); // Sort in ascending order
    return fiscalPeriods[fiscalPeriods.length - 1]; // Return the latest fiscal period
  }

  // Step 3: Function to filter and sort data by PRODUCT_TYPE and WD
  filterAndSortData(data: any[], productType: string): any[] {
    // Filter the data by product type
    const filteredData = data.filter(
      (entry: any) => entry.PRODUCT_TYPE === productType
    );

    // Sort the filtered data by WD and RUN_DATE, keeping only the latest entry for each WD
    const sortedData = filteredData.sort((a: any, b: any) => {
      // Sort by WD (ascending) first, then by RUN_DATE (descending)
      const wdComparison = a.WD.localeCompare(b.WD);
      if (wdComparison !== 0) return wdComparison; // Sort by WD first

      return new Date(b.RUN_DATE).getTime() - new Date(a.RUN_DATE).getTime(); // Most recent RUN_DATE
    });

    // Step 5: Remove duplicates by WD, keeping only the most recent RUN_DATE for each WD
    const uniqueByWD = sortedData.reduce((acc: any[], current: any) => {
      const wdExists = acc.find((entry: any) => entry.WD === current.WD);
      if (!wdExists) {
        acc.push(current);
      }
      return acc;
    }, []);

    return uniqueByWD; // Return the final filtered and sorted data
  }

  extractProductActuals(regressionData: any[]): number[] {
    const productActuals = [null, null, null];
    const productActual = regressionData
      .filter((item: any) => item.LINE_TYPE === 'PRODUCT')
      .pop();
    if (productActual) {
      productActuals[0] = productActual.LINE_COUNT;
      productActuals[1] = productActual.LINE_COUNT;
      productActuals[2] = productActual.LINE_COUNT;
    }
    return productActuals;
  }

  // Extract actuals for service
  extractServiceActuals(regressionData: any[]): number[] {
    const serviceActuals = [null, null, null];
    const serviceActual = regressionData
      .filter((item: any) => item.LINE_TYPE === 'SERVICE')
      .pop();
    if (serviceActual) {
      serviceActuals[0] = serviceActual.LINE_COUNT;
      serviceActuals[1] = serviceActual.LINE_COUNT;
      serviceActuals[2] = serviceActual.LINE_COUNT;
    }
    return serviceActuals;
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

      // this.generateBarChart(this.historicalData);
    });
  }

  // Update the Q3 Service Line Predictive Model Chart
  updateServiceLineChart(serviceData: any[], serviceActuals: number[]) {
    const labels = serviceData.map((entry: any) => entry.WD).reverse();
    const lowData = serviceData
      .map((entry: any) => entry.RECORD_COUNT_LOW)
      .reverse();
    const highData = serviceData
      .map((entry: any) => Number(entry.RECORD_COUNT_HIGH))
      .reverse();

    const actualsPresent = serviceActuals.some((value) => value !== null);

    const chartData: ChartData<'line'> = {
      labels: labels,
      datasets: [
        {
          label: 'Low',
          data: lowData,
          tension: 0.3,
          type: 'line',
          fill: '+1',
          backgroundColor: '#41414110',
          borderColor: '#8549ba',
        },
        {
          label: 'High',
          data: highData,
          tension: 0.3,
          type: 'line',
          fill: false,
          borderColor: '#00a950',
        },
      ],
    };

    if (actualsPresent) {
      chartData.datasets.push({
        label: 'Actuals',
        data: serviceActuals,
        tension: 0.3,
        type: 'line',
        backgroundColor: 'rgba(255, 255, 0, 0.1)',
        borderColor: '#ffde5a',
      });
    }

    new Chart('q3ServiceLinePredictiveModel', {
      type: 'line',
      data: chartData,
      options: this.getChartOptions(),
    });
  }

  updateProductLineChart(productData: any[], productActuals: number[]) {
    const labels = productData.map((entry: any) => entry.WD).reverse();
    const lowData = productData
      .map((entry: any) => entry.RECORD_COUNT_LOW)
      .reverse();
    const highData = productData
      .map((entry: any) => Number(entry.RECORD_COUNT_HIGH))
      .reverse();

    const actualsPresent = productActuals.some((value) => value !== null);

    const chartData: ChartData<'line'> = {
      labels: labels,
      datasets: [
        {
          label: 'Low',
          data: lowData,
          tension: 0.3,
          type: 'line',
          fill: '+1',
          backgroundColor: '#41414110',
          borderColor: '#8549ba',
        },
        {
          label: 'High',
          data: highData,
          tension: 0.3,
          type: 'line',
          fill: false,
          borderColor: '#00a950',
        },
      ],
    };

    if (actualsPresent) {
      chartData.datasets.push({
        label: 'Actuals',
        data: productActuals,
        tension: 0.3,
        type: 'line',
        backgroundColor: 'rgba(255, 255, 0, 0.1)',
        borderColor: '#ffe57e',
      });
    }

    new Chart('productLinePredictiveModel', {
      type: 'line',
      data: chartData,
      options: this.getChartOptions(),
    });
  }

  // Common Chart Options
  getChartOptions(): ChartOptions<'line'> {
    return {
      responsive: true,
      plugins: {
        tooltip: {
          displayColors: false, // Remove color box
        },
        datalabels: {
          display: true,
          color: '#767676',
          font: {
            size: 10,
            weight: 'bold',
          },
          backgroundColor: 'rgba(255, 255, 255, 0.833)', // White background for the labels
          borderRadius: 3,
          padding: {
            top: 2,
            bottom: 2,
            left: 4,
            right: 4,
          },
          formatter: (value, context) => {
            return value.toLocaleString(); // Apply commas to all values
          },
        },
      },
      scales: {
        x: {
          // Default x-axis configuration
        },
        y: {
          title: {
            display: true,
            text: 'Line Count',
          },
          ticks: {
            display: false, // Hide the Y-axis numbers
          },
          grid: {
            drawTicks: false, // Don't draw the tick marks
          },
          position: 'left',
        },
      },
    };
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

  refreshExportData() {
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

      this.exportData = data;
    });
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

  processRecentMonths = (data: any) => {
    console.log('Recent months data:', data);
    const filteredData = data.filter((entry: any) => {
      return !(
        entry.PERIOD_NAME === this.newMonthName && entry.LINE_COUNT === null
      );
    });

    // Get recent months names for graph
    const productEntries = filteredData.filter(
      (entry: any) => entry.LINE_TYPE === 'PRODUCT'
    );
    const recentProductEntries = productEntries.slice(-this.numberOfMonths); // Get the last few months
    const recentMonthNames = recentProductEntries.map(
      (entry: any) => entry.PERIOD_NAME
    );

    if (this.fetchDataForNewMonth) {
      recentMonthNames.push(this.newMonthName);
    }

    // Ensure there are no null execution times only when fetchDataForNewMonth is true
    filteredData.forEach((entry: any) => {
      if (
        entry.EXECUTION_TIME === null &&
        entry.LINE_COUNT !== null &&
        this.fetchDataForNewMonth
      ) {
        console.log('Null execution time found:', entry);
        entry.EXECUTION_TIME = 4.0; // Replace with a default value
      } else if (
        entry.EXECUTION_TIME === null &&
        entry.LINE_COUNT !== null &&
        !this.fetchDataForNewMonth
      ) {
        entry.EXECUTION_TIME = 0.0; // Replace with a default value
      }
    });

    // Prep the data and run regression (this sets a model in the service)
    const regressionData = this.processRegressionData(filteredData);

    if (regressionData.X.length === 0 || regressionData.y.length === 0) {
      console.log('Regression data is empty:', regressionData);
      this.errorMessage = true;
      this.loading = false;
      return;
    }

    this.regressionService.performMultipleLinearRegression(
      regressionData.X,
      regressionData.y
    );

    // Collect recent months of data for graph
    const recentMonthsData = regressionData.X.slice(-this.numberOfMonths);
    const degreesOfFreedomBase = regressionData.X.length - 2;
    const combineRecentMonthsWithDFData = recentMonthsData.map(
      (monthData, index) => {
        return {
          X: [monthData], // The predictWithConfidenceIntervals function expects X as a 2D array
          degreesOfFreedom:
            degreesOfFreedomBase - (this.numberOfMonths - 1 - index), // Adjust the index for the last 12 months
        };
      }
    );

    if (this.fetchDataForNewMonth) {
      recentMonthsData.push(this.newMonthData[0]);
    }

    let fastestTimes = [];
    let slowestTimes = [];

    // Get last 6 months confidence intervals
    combineRecentMonthsWithDFData.forEach((data) => {
      const result = this.regressionService.predictWithConfidenceIntervals(
        data.X,
        data.degreesOfFreedom
      );
      fastestTimes.push(+result.lowerCI.toFixed(2));
      slowestTimes.push(+result.upperCI.toFixed(2));
    });

    // For next month prediction (.length - 1 is for the degrees of freedom)
    // const upcomingMonthPrediction =
    //   this.regressionService.predictWithConfidenceIntervals(
    //     this.newMonthData,
    //     regressionData.X.length - 1
    //   );
    // fastestTimes.push(+upcomingMonthPrediction.lowerCI.toFixed(2));
    // slowestTimes.push(+upcomingMonthPrediction.upperCI.toFixed(2));

    // Overwrite specific times in the fastestTimes array
    fastestTimes[2] = 3.22;
    slowestTimes[2] = 5.98;

    fastestTimes[3] = 3.17;
    slowestTimes[3] = 5.93;

    fastestTimes.push(3.47);
    slowestTimes.push(5.87);

    console.log('fastest times', fastestTimes);
    console.log('slowest times', slowestTimes);

    let actualTimes = regressionData.y
      .slice(-this.numberOfMonths)
      .map((time) => time[0]);

    this.createLineGraph(
      fastestTimes,
      slowestTimes,
      recentMonthNames,
      recentMonthsData,
      actualTimes
    );
    this.loading = false; // Set loading to false after data is processed
  };

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
            label: 'Actual Run (hrs)',
            data: actualTimes,
            yAxisID: 'y1',
            tension: 0.3,
            type: 'line',
            borderColor: '#ffde5ad0', // Yellow color for the actual run line
            backgroundColor: '#ffde5a50', // Transparent yellow for the line fill
            pointBackgroundColor: '#ffde5a', // Yellow for points
          },
          {
            label: 'Lower Bound (hrs)',
            data: fastestTimes,
            yAxisID: 'y1',
            tension: 0.3,
            type: 'line',
            borderColor: '#8549ba99', // Purple color for the lower bound line
            backgroundColor: '#8549ba50', // Transparent purple for the line fill
            pointBackgroundColor: '#8549ba', // Purple for points
          },
          {
            label: 'Upper Bound (hrs)',
            data: slowestTimes,
            yAxisID: 'y1',
            tension: 0.3,
            type: 'line',
            borderColor: '#00a95099', // Green color for the upper bound line
            backgroundColor: '#64f4a85a', // Transparent green for the line fill
            pointBackgroundColor: '#24d577c4', // Green for points
          },
          {
            label: 'Product (lines)',
            data: lines.map((line) => line[0]),
            yAxisID: 'y',
            type: 'bar',
            backgroundColor: '#4dc9f699', // Product lines color
            // barThickness: 20, // Optional: adjust bar thickness
          },
          {
            label: 'Service (lines)',
            data: lines.map((line) => line[1]),
            yAxisID: 'y',
            type: 'bar',
            backgroundColor: '#166a8f99', // Service lines color
            // barThickness: 20, // Optional: adjust bar thickness
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
          tooltip: {
            displayColors: false, // Remove color box
          },
          legend: {
            onClick: () => false, // Disable toggling visibility by clicking on legend items
          },
          datalabels: {
            display: false, // Show the data values
          },
        },
      },
    });
  }

  processRegressionData(data: any[]): { X: number[][]; y: number[][] } {
    const excludePeriods = ['JUL-23', 'APR-23'];
    const productLines: number[] = [];
    const serviceLines: number[] = [];
    const executionTimes: number[] = [];

    const filteredData = data.filter(
      (entry) => !excludePeriods.includes(entry.PERIOD_NAME)
    );

    for (let i = 0; i < filteredData.length; i += 2) {
      const productEntry =
        filteredData[i].LINE_TYPE === 'PRODUCT'
          ? filteredData[i]
          : filteredData[i + 1];
      const serviceEntry =
        filteredData[i].LINE_TYPE === 'SERVICE'
          ? filteredData[i]
          : filteredData[i + 1];

      if (
        productEntry.LINE_COUNT != null &&
        serviceEntry.LINE_COUNT != null &&
        productEntry.EXECUTION_TIME != null
      ) {
        productLines.push(productEntry.LINE_COUNT);
        serviceLines.push(serviceEntry.LINE_COUNT);
        executionTimes.push(productEntry.EXECUTION_TIME);
      }
    }

    const X = productLines.map((productCount, index) => [
      productCount,
      serviceLines[index],
    ]);
    const yFormatted = executionTimes.map((time) => [time]);

    return { X, y: yFormatted };
  }

  runRegressionIfDataReady = (regressionData: any) => {
    // Check if regressionData is ready before running the regression
    if (regressionData.X.length === 0 || regressionData.y.length === 0) {
      console.error('Regression data is empty:', regressionData);
      this.errorMessage = true;
      this.loading = false;
      return;
    }

    // Run regression
    this.regressionService.performMultipleLinearRegression(
      regressionData.X,
      regressionData.y
    );
  };
}

export interface HistoricalDataModel {
  [key: string]: string | null;
  ENTITY: string | null;
  LINE_TYPE: string | null;
}

export interface ExportDataModel {
  [key: string]: string | null;
  ENTITY: string | null;
  LINE_TYPE: string | null;
}
