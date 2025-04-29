import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
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
import { DestroyManager } from '../providers/destroy-manager.service';
import { MenuService } from '../providers/menu.service';
import { TableModalComponent } from '../components/table-modal/table-modal.component';
import { MatDialog } from '@angular/material/dialog';

Chart.register(...registerables);

@Component({
  selector: 'app-wd0-historical-data',
  templateUrl: './wd0-historical-data.component.html',
  styleUrls: ['./wd0-historical-data.component.scss'],
  providers: [DestroyManager],
})
export class Wd0HistoricalDataComponent implements OnInit, OnDestroy {
  protected http: ApiHttpService;
  loading: boolean = true;
  serviceLoading: boolean = true;
  productLoading: boolean = true;
  isOutdated: boolean = false;
  errorMessage: boolean = false;
  barChartLoading: boolean = true;
  dataTimestamp: string;
  numberOfQuartersOfHistoricalData: number = 8;
  showProductModal = false;
  showServiceModal = false;
  productActuals: any[] = [];
  serviceActuals: any[] = [];

  upperCI: number;
  lowerCI: number;

  constructor(
    http: ApiHttpService,
    private regressionService: RegressionService,
    private destroyManager: DestroyManager,
    private menuService: MenuService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {
    Chart.register(...registerables, ChartDataLabels);
    this.http = http;
  }

  refreshInterval = 300000; //ms = 5 minutes

  private lineChart: Chart | null = null;
  private serviceLineChart: Chart | null = null;
  private productLineChart: Chart | null = null;

  ngOnDestroy(): void {
    // Destroy the chart instance if it exists
    if (this.lineChart) {
      this.lineChart.destroy();
      this.lineChart = null; // Set to null to avoid memory leaks
    }

    // Destroy other charts if applicable
    if (this.serviceLineChart) {
      this.serviceLineChart.destroy();
      this.serviceLineChart = null;
    }

    if (this.productLineChart) {
      this.productLineChart.destroy();
      this.productLineChart = null;
    }
  }

  displayedColumns: string[] = [];
  historicalData: HistoricalDataModel[];
  exportData: ExportDataModel[];

  dataSource: any;

  unprocessedRegressionData: any[] = [];
  numberOfMonths: number = 4;
  newMonthName: string = '';
  latestPeriodName: string = '';
  newMonthData = [[0, 0]];
  fetchDataForNewMonth: boolean = false;
  isWd1: boolean = false;
  isWd2: boolean = false;
  isWd3: boolean = false;

  today = new Date();

  ngOnInit(): void {
    this.dataTimestamp = `Last Updated: ...`;

    this.getWd0MidcloseActualsProduct();
    this.getWd0MidcloseActualsService();

    // Ensure the current date and time are interpreted in Pacific Time
    const nowPacificTime = new Date(
      new Date().toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
      })
    );

    let effectiveWd = null;

    monthEndDates.forEach((monthEndDate, index) => {
      const monthEnd = new Date(`${monthEndDate}T00:00:00-08:00`); // Explicit Pacific Time for month end
      monthEnd.setHours(10); // WD-0 starts at 10 AM

      // Calculate WD-3, WD-2, and WD-1 with rollovers
      const wd3 = new Date(monthEnd);
      const wd2 = new Date(monthEnd);
      const wd1 = new Date(monthEnd);

      wd3.setDate(monthEnd.getDate() - 3);
      wd3.setHours(15); // 4 PM DST, 3 PM summer time rollover for WD-3

      wd2.setDate(monthEnd.getDate() - 2);
      wd2.setHours(5); // early rollover for WD-2, so wd3 data can be seen

      wd1.setDate(monthEnd.getDate() - 1);
      wd1.setHours(15); // 4 PM rollover for WD-1

      // Determine the effective WD based on the current time
      if (
        nowPacificTime.toLocaleDateString('en-CA') ===
          monthEnd.toLocaleDateString('en-CA') &&
        nowPacificTime > wd1
      ) {
        effectiveWd = { wd: 'WD-0', index }; // WD-0
      } else if (nowPacificTime >= wd1 && nowPacificTime < monthEnd) {
        effectiveWd = { wd: 'WD-1', index }; // WD-1
      } else if (nowPacificTime >= wd2 && nowPacificTime < wd1) {
        effectiveWd = { wd: 'WD-2', index }; // WD-2
      } else if (nowPacificTime >= wd3 && nowPacificTime < wd2) {
        effectiveWd = { wd: 'WD-3', index }; // WD-3
      } else {
      }
    });

    this.fetchDataForNewMonth = false;
    this.isWd1 = false;
    this.isWd2 = false;
    this.isWd3 = false;

    // Set the flags for the effective WD
    if (effectiveWd) {
      switch (effectiveWd.wd) {
        case 'WD-0':
          this.fetchDataForNewMonth = true;
          break;
        case 'WD-1':
          this.isWd1 = true;
          break;
        case 'WD-2':
          this.isWd2 = true;
          break;
        case 'WD-3':
        case 'WD-3 (fallback)':
          this.isWd3 = true;
          break;
        default:
          console.error('Unknown WD:', effectiveWd.wd);
      }
      // this.menuService.updateMenuItems([
      //   {
      //     label: 'Large Deal Tracker',
      //     route: '/large-deal-tracker',
      //     role: ['ADMIN', 'LARGE_DEAL'],
      //   },
      //   {
      //     label: 'WD0',
      //     route: '/wd0',
      //     role: ['ADMIN', 'WD0'],
      //   },
      //   {
      //     label: 'Mid Close Volumes',
      //     route: '/midclose-volumes',
      //     role: ['ADMIN', 'MIDCLOSE_VOLUMES'],
      //   },
      // ]);
    }

    let serviceActuals = [null, null, null];
    let productActuals = [null, null, null];

    // Fetch data for regression
    if (this.fetchDataForNewMonth) {
      this.getEndpointData('wd0-current-month')
        .pipe(
          tap((data: any) => {
            this.newMonthName = data[0].PERIOD_NAME;
            this.latestPeriodName = this.newMonthName; // Set latestPeriodName for wd-0
          }),
          switchMap(() => this.getEndpointData('wd0-regression'))
        )
        .subscribe((data: any) => {
          let serviceActuals = [null, null, null];
          let productActuals = [null, null, null];

          // Check if the new month's data is present
          const newMonthDataExists = data.some(
            (entry: any) => entry.PERIOD_NAME === this.newMonthName
          );

          // If the new month's data exists, extract actuals. Otherwise, keep them as null.
          if (newMonthDataExists) {
            productActuals = this.extractProductActuals(data);
            serviceActuals = this.extractServiceActuals(data);
          }

          // Pass the actuals (whether null or extracted) to getWd0Volumes
          this.getWd0Volumes(productActuals, serviceActuals);

          this.prepareDataForRegression(data);
          this.dataTimestamp = `Last Updated: ${new Date().toLocaleString()}`;
        });
    } else if (this.isWd1) {
      this.getEndpointData('wd0-current-month')
        .pipe(
          tap((data: any) => {
            // Process the current month data
            data.forEach((item: any) => {
              if (item.LINE_TYPE === 'PRODUCT') {
                // this.newMonthData[0][0] = item.LINE_COUNT;
                this.newMonthData[0][0] = 0;
              } else if (item.LINE_TYPE === 'SERVICE') {
                // this.newMonthData[0][1] = item.LINE_COUNT;
                this.newMonthData[0][1] = 0;
              }
            });
            this.newMonthName = data[0].PERIOD_NAME;
            this.latestPeriodName = this.newMonthName; // Set latestPeriodName for wd-1
          }),
          switchMap(() => this.getEndpointData('wd0-regression'))
        )
        .subscribe((data: any) => {
          let productActuals = [null, null, null];
          let serviceActuals = [null, null, null];
          this.getWd0Volumes(productActuals, serviceActuals);

          this.prepareDataForRegression(data);
          this.dataTimestamp = `Last Updated: ${new Date().toLocaleString()}`;
        });
    } else if (this.isWd2) {
      let productActuals = [null, null, null];
      let serviceActuals = [null, null, null];
      this.getWd0Volumes(productActuals, serviceActuals); // Projected data only

      this.getEndpointData('wd0-regression').subscribe((data: any) => {
        this.prepareDataForRegression(data);

        this.latestPeriodName = this.getLatestPeriodName(data); // Set latestPeriodName for regular case

        this.loading = false;
        this.dataTimestamp = `Last Updated: ${new Date().toLocaleString()}`;
      });
    } else if (this.isWd3) {
      this.getEndpointData('wd0-regression').subscribe((data: any) => {
        productActuals = this.extractProductActuals(data);
        serviceActuals = this.extractServiceActuals(data);
        this.getWd0Volumes(productActuals, serviceActuals);

        const latestPeriodName = this.getLatestPeriodName(data);

        this.latestPeriodName = this.getLatestPeriodName(data); // Set latestPeriodName for regular case

        this.prepareDataForRegression(data);

        this.loading = false;
        this.dataTimestamp = `Last Updated: ${new Date().toLocaleString()}`;
      });
    } else {
      this.getEndpointData('wd0-regression').subscribe((data: any) => {
        productActuals = this.extractProductActuals(data);
        serviceActuals = this.extractServiceActuals(data);
        this.getWd0Volumes(productActuals, serviceActuals);

        this.latestPeriodName = this.getLatestPeriodName(data); // Set latestPeriodName for regular case

        this.prepareDataForRegression(data);

        this.loading = false;
        this.dataTimestamp = `Last Updated: ${new Date().toLocaleString()}`;
      });
    }

    this.refreshExportData();
    this.getHistoricalData();
  }

  getWd0MidcloseActualsProduct() {
    console.log('func called');
    this.http
      .get('wd0-midclose-actuals-product', this.destroyManager)
      .subscribe((data: any) => {
        console.log('wd0MidcloseActualsProduct:', data);
        this.productActuals = data;
      });
  }

  openWd0ProductModal(): void {
    this.showProductModal = true;
  }

  getWd0MidcloseActualsService() {
    this.http
      .get('wd0-midclose-actuals-service', this.destroyManager)
      .subscribe((data: any) => {
        console.log('wd0MidcloseActualsService:', data);
        this.serviceActuals = data;
      });
  }

  openWd0ServiceModal(): void {
    this.showServiceModal = true;
  }

  //this method is necessary for predicting the next month in the absence of
  //actual data for the current month from Surya
  getLatestPeriodName(data: any[]): string {
    const monthMap = {
      JAN: 'FEB',
      FEB: 'MAR',
      MAR: 'APR',
      APR: 'MAY',
      MAY: 'JUN',
      JUN: 'JUL',
      JUL: 'AUG',
      AUG: 'SEP',
      SEP: 'OCT',
      OCT: 'NOV',
      NOV: 'DEC',
      DEC: 'JAN', // Wrap back to JAN
    };

    const filteredData = data.filter((entry) => entry.PERIOD_NAME);

    if (filteredData.length === 0) {
      return 'Unknown Period';
    }

    const latestEntry = filteredData[filteredData.length - 1];
    const currentPeriodName = latestEntry.PERIOD_NAME;
    const [currentPeriodMonth] = currentPeriodName.split('-');

    // Get current local machine month in 3-letter uppercase format (e.g., 'NOV')
    const monthNames = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ];
    const currentMachineMonth = monthNames[new Date().getMonth()];

    // If it's WD-2 and latest period is NOT the current month, advance it
    if (
      (this.isWd2 || this.isWd3) &&
      currentPeriodMonth !== currentMachineMonth
    ) {
      const nextMonth = monthMap[currentPeriodMonth];
      return nextMonth
        ? `${nextMonth}-${currentPeriodName.split('-')[1]}`
        : 'Unknown Period';
    }

    return currentPeriodName;
  }

  getWd0Volumes(productActuals: number[], serviceActuals: number[]) {
    this.http.get('wd0-volumes', this.destroyManager).subscribe((data: any) => {
      // console.log('wd0-volumes', data);

      // Step 1: Identify the most recent fiscal period
      const mostRecentFiscalPeriod = this.getMostRecentFiscalPeriod(data);

      // Get the current date in Pacific Time
      const nowPacificTime = new Date().toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
      });
      const todayPacificTime = new Date(nowPacificTime);

      // Extract the month as a short string (e.g., 'Nov')
      const currentMonth = todayPacificTime
        .toLocaleString('en-US', {
          timeZone: 'America/Los_Angeles',
          month: 'short', // Short month format (e.g., 'Nov')
        })
        .toUpperCase(); // Convert to uppercase to match fiscal period format

      // Extract the month from the fiscal period
      const fiscalPeriodMonth = mostRecentFiscalPeriod.split('-')[0]; // Get the 'OCT' part of 'OCT-25'

      // console.log('Most recent fiscal period (month only):', fiscalPeriodMonth);
      // console.log('Current month:', currentMonth);

      // Set the flag if the most recent fiscal period's month doesn't match the current month
      this.isOutdated = fiscalPeriodMonth !== currentMonth;

      // Step 2: Check if WD-1 data exists
      const wd1Exists = data.some(
        (entry: any) =>
          entry.WD === 'WD-1' && entry.FISCAL_PERIOD === mostRecentFiscalPeriod
      );

      if (!wd1Exists) {
        // Create placeholder entries for WD-1
        data.push(
          {
            FISCAL_PERIOD: mostRecentFiscalPeriod,
            PRODUCT_TYPE: 'PRODUCT',
            RECORD_COUNT_HIGH: null,
            RECORD_COUNT_LOW: null,
            RUN_DATE: null,
            WD: 'WD-1',
          },
          {
            FISCAL_PERIOD: mostRecentFiscalPeriod,
            PRODUCT_TYPE: 'SERVICE',
            RECORD_COUNT_HIGH: null,
            RECORD_COUNT_LOW: null,
            RUN_DATE: null,
            WD: 'WD-1',
          }
        );
      }

      // Step 3: Check if WD-2 data exists
      const wd2Exists = data.some(
        (entry: any) =>
          entry.WD === 'WD-2' && entry.FISCAL_PERIOD === mostRecentFiscalPeriod
      );

      if (!wd2Exists) {
        // Create placeholder entries for WD-2
        data.push(
          {
            FISCAL_PERIOD: mostRecentFiscalPeriod,
            PRODUCT_TYPE: 'PRODUCT',
            RECORD_COUNT_HIGH: null,
            RECORD_COUNT_LOW: null,
            RUN_DATE: null,
            WD: 'WD-2',
          },
          {
            FISCAL_PERIOD: mostRecentFiscalPeriod,
            PRODUCT_TYPE: 'SERVICE',
            RECORD_COUNT_HIGH: null,
            RECORD_COUNT_LOW: null,
            RUN_DATE: null,
            WD: 'WD-2',
          }
        );
      }

      // Step 3: Filter the data for the most recent period
      const recentData = data.filter(
        (entry: any) => entry.FISCAL_PERIOD === mostRecentFiscalPeriod
      );

      // Step 4: Organize by PRODUCT_TYPE and sort by WD
      const productData = this.filterAndSortData(recentData, 'PRODUCT');
      const serviceData = this.filterAndSortData(recentData, 'SERVICE');

      // Now use `productData` and `serviceData` in your charts along with actuals
      this.updateServiceLineChart(serviceData, serviceActuals); // for service data
      this.updateProductLineChart(productData, productActuals); // for product data
    });
  }

  // Step 1: Identify the most recent fiscal period
  getMostRecentFiscalPeriod(data: any[]): string {
    if (this.isWd3) {
      // If isWd3 is true, return the period from the item at the 2nd index (prev month)
      return data[2] ? data[2].FISCAL_PERIOD : 'Unknown Period';
    }
    // Step 1: Identify the most recent RUN_DATE
    const mostRecentEntry = data.reduce(
      (latest, entry) => {
        const entryDate = new Date(entry.RUN_DATE).getTime();
        return entryDate > latest.date
          ? { period: entry.FISCAL_PERIOD, date: entryDate }
          : latest;
      },
      { period: null, date: 0 }
    );

    // Return the fiscal period of the most recent RUN_DATE entry
    return mostRecentEntry.period || 'Unknown Period'; // Fallback if no data is found
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
        ENTITY: ' —',
        LINE_TYPE: 'Grand Total',
        ...grandTotal,
      };
      const serviceTotalObject = {
        ENTITY: '   —',
        LINE_TYPE: 'Service Lines',
        ...serviceTotal,
      };
      const productTotalObject = {
        ENTITY: '  —',
        LINE_TYPE: 'Product Lines',
        ...productTotal,
      };

      const sanitizedData = data.map((item) => {
        const newItem = { ...item }; // Create a shallow copy to avoid mutating the original object
        Object.keys(newItem).forEach((key) => {
          if (newItem[key] === null) {
            newItem[key] = 0;
          }
        });
        return newItem;
      });

      // Insert total rows at the beginning of the data array
      sanitizedData.unshift(
        grandTotalObject,
        serviceTotalObject,
        productTotalObject
      );

      // Now remove duplicate entries
      this.removeDuplicateEntityEntries(sanitizedData);

      this.historicalData = sanitizedData;

      this.dataSource = new MatTableDataSource<HistoricalDataModel>(
        this.historicalData
      );

      // this.generateBarChart(this.historicalData);
    });
  }

  private retryCountServiceLine = 0;
  private maxRetriesServiceLine = 5;
  // Update the Q3 Service Line Predictive Model Chart
  updateServiceLineChart(serviceData: any[], serviceActuals: number[]) {
    const labels = serviceData.map((entry: any) => entry.WD).reverse();
    const lowData = serviceData
      .map((entry: any) => Number(entry.RECORD_COUNT_LOW))
      .reverse();
    const highData = serviceData
      .map((entry: any) => Number(entry.RECORD_COUNT_HIGH))
      .reverse();

    // Overwrite with nulls if isWd2 is true
    if (this.isWd2) {
      lowData[lowData.length - 1] = null;
      highData[highData.length - 1] = null;
    }

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
          borderColor: '#8549ba', // Purple for Low line
          pointBackgroundColor: '#8549ba', // Purple for dots
          pointBorderColor: '#8549ba', // Purple for dot borders
        },
        {
          label: 'High',
          data: highData,
          tension: 0.3,
          type: 'line',
          fill: false,
          borderColor: '#00a950', // Green for High line
          pointBackgroundColor: '#00a950', // Green for dots
          pointBorderColor: '#00a950', // Green for dot borders
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
        borderColor: '#ffde5a', // Yellow for Actuals line
        pointBackgroundColor: '#ffde5a', // Yellow for dots
        pointBorderColor: '#ffde5a', // Yellow for dot borders
      });
    }

    const canvas = document.getElementById(
      'q3ServiceLinePredictiveModel'
    ) as HTMLCanvasElement;

    // Check if canvas is available
    if (canvas) {
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Destroy existing chart if it exists
        if (this.serviceLineChart) {
          this.serviceLineChart.destroy();
          this.serviceLineChart = null;
        }

        // Create the new chart
        this.serviceLineChart = new Chart(ctx, {
          // new Chart('q3ServiceLinePredictiveModel', {
          type: 'line',
          data: chartData,
          options: this.getChartOptions(),
        });

        this.serviceLoading = false; // Stop loading when chart is created
        this.cdr.detectChanges(); // Trigger change detection
      } else {
        console.error('Failed to get 2D context for service line chart');
      }
    } else {
      // console.error('Canvas element for Service Line chart not created');
      // Retry logic for canvas creation
      if (this.retryCountServiceLine < this.maxRetriesServiceLine) {
        setTimeout(() => {
          this.retryCountServiceLine++;
          this.updateServiceLineChart(serviceData, serviceActuals);
        }, 1000);
      } else {
        console.error('Max retries reached for Service Line chart');
      }
    }
  }

  private retryCountProductLine = 0;
  private maxRetriesProdcutLine = 5;

  updateProductLineChart(productData: any[], productActuals: number[]) {
    const labels = productData.map((entry: any) => entry.WD).reverse();
    const lowData = productData
      .map((entry: any) => Number(entry.RECORD_COUNT_LOW))
      .reverse();
    const highData = productData
      .map((entry: any) => Number(entry.RECORD_COUNT_HIGH))
      .reverse();

    // Overwrite with nulls if isWd2 is true
    if (this.isWd2) {
      lowData[lowData.length - 1] = null;
      highData[highData.length - 1] = null;
    }

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
          borderColor: '#8549ba', // Purple for Low line
          pointBackgroundColor: '#8549ba', // Purple for dots
          pointBorderColor: '#8549ba', // Purple for dot borders
        },
        {
          label: 'High',
          data: highData,
          tension: 0.3,
          type: 'line',
          fill: false,
          borderColor: '#00a950', // Green for High line
          pointBackgroundColor: '#00a950', // Green for dots
          pointBorderColor: '#00a950', // Green for dot borders
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
        borderColor: '#ffe57e', // Yellow for Actuals line
        pointBackgroundColor: '#ffe57e', // Yellow for dots
        pointBorderColor: '#ffe57e', // Yellow for dot borders
      });
    }

    const canvas = document.getElementById(
      'productLinePredictiveModel'
    ) as HTMLCanvasElement;

    // Check if canvas is available
    if (canvas) {
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Destroy existing chart if it exists
        if (this.productLineChart) {
          this.productLineChart.destroy();
          this.productLineChart = null;
        }

        // Create the new chart
        this.productLineChart = new Chart(ctx, {
          type: 'line',
          data: chartData,
          options: this.getChartOptions(),
        });

        this.productLoading = false; // Stop loading when chart is created
        this.cdr.detectChanges(); // Trigger change detection
      } else {
        // this.handleChartCreationError();
      }
    } else {
      // console.error('Canvas element for Product Line chart not created');
      // Retry logic for canvas creation
      if (this.retryCountProductLine < this.maxRetriesProdcutLine) {
        setTimeout(() => {
          this.retryCountProductLine++;
          this.updateProductLineChart(productData, productActuals);
        }, 1000);
      } else {
        console.error('Max retries reached for Product Line chart');
      }
    }
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
          color: '#4f4f4f',
          font: {
            size: 10,
            weight: 'bolder',
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
          anchor: (context) => {
            const datasets = context.chart.data.datasets;
            const dataIndex = context.dataIndex;

            // Get values for High, Low, and Actuals
            const highValue = datasets.find((d) => d.label === 'High')?.data[
              dataIndex
            ];
            const lowValue = datasets.find((d) => d.label === 'Low')?.data[
              dataIndex
            ];
            const actualValue = datasets.find((d) => d.label === 'Actuals')
              ?.data[dataIndex];

            // Validate that all required values are present
            if (
              highValue === undefined ||
              lowValue === undefined ||
              actualValue === undefined
            ) {
              // console.warn('Missing data for anchor positioning', {
              //   highValue,
              //   lowValue,
              //   actualValue,
              // });
              return 'center'; // Fallback
            }

            // Create an array of the values and sort them to determine rank
            const sortedValues = [
              { label: 'High', value: Number(highValue) },
              { label: 'Low', value: Number(lowValue) },
              { label: 'Actuals', value: Number(actualValue) },
            ].sort((a, b) => b.value - a.value); // Descending order

            // Assign positions based on rank
            const currentLabel = context.dataset.label;
            if (currentLabel === sortedValues[0].label) {
              return 'end'; // Highest value gets positioned above
            } else if (currentLabel === sortedValues[2].label) {
              return 'start'; // Lowest value gets positioned below
            }
            return 'center'; // Middle value stays centered
          },
          align: (context) => {
            const datasets = context.chart.data.datasets;
            const dataIndex = context.dataIndex;

            // Get values for High, Low, and Actuals
            const highValue = datasets.find((d) => d.label === 'High')?.data[
              dataIndex
            ];
            const lowValue = datasets.find((d) => d.label === 'Low')?.data[
              dataIndex
            ];
            const actualValue = datasets.find((d) => d.label === 'Actuals')
              ?.data[dataIndex];

            // Validate that all required values are present
            if (
              highValue === undefined ||
              lowValue === undefined ||
              actualValue === undefined
            ) {
              // console.warn('Missing data for alignment', {
              //   highValue,
              //   lowValue,
              //   actualValue,
              // });
              return 'center'; // Fallback
            }

            // Create an array of the values and sort them to determine rank
            const sortedValues = [
              { label: 'High', value: Number(highValue) },
              { label: 'Low', value: Number(lowValue) },
              { label: 'Actuals', value: Number(actualValue) },
            ].sort((a, b) => b.value - a.value); // Descending order

            // Assign alignment based on rank
            const currentLabel = context.dataset.label;
            if (currentLabel === sortedValues[0].label) {
              return 'top'; // Highest value aligns at the top
            } else if (currentLabel === sortedValues[2].label) {
              return 'bottom'; // Lowest value aligns at the bottom
            }
            return 'center'; // Middle value aligns at the center
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

    // Convert the Set to an array and filter out ENTITY and LINE_TYPE
    const columnArray = Array.from(allKeys).filter(
      (key) => key !== 'ENTITY' && key !== 'LINE_TYPE'
    );

    // Keep only the last 8 columns along with ENTITY and LINE_TYPE
    this.displayedColumns = [
      'ENTITY',
      'LINE_TYPE',
      ...columnArray.slice(-this.numberOfQuartersOfHistoricalData), // Selects the last 8 columns
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
        ENTITY: '—',
        LINE_TYPE: 'Grand Total',
        ...grandTotal,
      };
      const serviceTotalObject = {
        ENTITY: '—',
        LINE_TYPE: 'Service Lines',
        ...serviceTotal,
      };
      const productTotalObject = {
        ENTITY: '—',
        LINE_TYPE: 'Product Lines',
        ...productTotal,
      };

      // Insert total rows at the beginning of the data array
      data.unshift(grandTotalObject, serviceTotalObject, productTotalObject);

      this.exportData = data;
    });
  }

  exportTableToExcel(data: any[], sheetName: string, filename: string) {
    const columnsToExclude = ['ENTITY', 'LINE_TYPE'];
    const startRow = 4;
    const endRow = 37;

    for (let rowIndex = startRow - 1; rowIndex < endRow; rowIndex++) {
      const row = data[rowIndex];
      if (row) {
        Object.keys(row).forEach((col) => {
          if (!columnsToExclude.includes(col)) {
            if (
              row[col] !== undefined &&
              row[col] !== 'NA' &&
              row[col] !== null
            ) {
              row[col] = parseInt(row[col], 10);
              if (isNaN(row[col])) {
                row[col] = 0;
              }
            } else if (row[col] === 'NA' || row[col] === null) {
              row[col] = 0;
            }
          }
        });
      }
    }

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
      switchMap(() => this.http.get(cacheBustingUrl, this.destroyManager))
    );
    return polling$;
  }

  // Method 1: Filters and prepares the data, then passes to processRegressionData
  prepareDataForRegression = (data: any) => {
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

    // Only push newMonthName if it's not already in recentMonthNames
    if (
      (this.fetchDataForNewMonth || this.isWd1) &&
      !recentMonthNames.includes(this.newMonthName)
    ) {
      recentMonthNames.push(this.newMonthName);
    }

    // Ensure there are no null execution times
    filteredData.forEach((entry: any) => {
      if (entry.EXECUTION_TIME === null && entry.LINE_COUNT !== null) {
        entry.EXECUTION_TIME = 0.0; // Default value
      }
    });

    this.processRegressionData(filteredData, recentMonthNames);
  };

  // Method 2: Processes the regression data
  processRegressionData(data: any[], recentMonthNames: string[]): void {
    const excludePeriods = ['JUL-23', 'APR-23'];
    const productLines: number[] = [];
    const serviceLines: number[] = [];
    const executionTimes: number[] = [];

    // Step 1: Filter out excluded periods
    const filteredData = data.filter(
      (entry) => !excludePeriods.includes(entry.PERIOD_NAME)
    );

    // Step 2: Group data by PERIOD_NAME
    const periodGroups = filteredData.reduce((groups, entry) => {
      const periodName = entry.PERIOD_NAME;
      if (!groups[periodName]) {
        groups[periodName] = { PRODUCT: null, SERVICE: null };
      }
      groups[periodName][entry.LINE_TYPE] = entry; // Set either PRODUCT or SERVICE
      return groups;
    }, {});

    // Step 3: Iterate through the grouped data and collect product, service, and execution times
    for (const period in periodGroups) {
      const productEntry = periodGroups[period].PRODUCT;
      const serviceEntry = periodGroups[period].SERVICE;

      // Ensure we have both product and service data before pushing
      if (
        productEntry &&
        serviceEntry &&
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

    // Now pass processed regression data and recentMonthNames to executeRegression
    this.executeRegression({ X, y: yFormatted }, recentMonthNames);
  }

  executeRegression = async (
    regressionData: { X: number[][]; y: number[][] },
    recentMonthNames: string[]
  ) => {
    try {
      if (regressionData.X.length === 0 || regressionData.y.length === 0) {
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
      const upcomingMonthPrediction =
        this.regressionService.predictWithConfidenceIntervals(
          this.newMonthData,
          regressionData.X.length - 1
        );
      fastestTimes.push(+upcomingMonthPrediction.lowerCI.toFixed(2));
      slowestTimes.push(+upcomingMonthPrediction.upperCI.toFixed(2));
      // fastestTimes.push(null);
      // slowestTimes.push(null);

      let actualTimes = regressionData.y
        .slice(-this.numberOfMonths)
        .map((time) => time[0]);

      if (this.fetchDataForNewMonth) {
        recentMonthsData.push(this.newMonthData[0]);
        // actualTimes.push(4.0);
      }

      this.createLineGraph(
        fastestTimes,
        slowestTimes,
        recentMonthNames,
        recentMonthsData,
        actualTimes
      );
    } catch (error) {
      console.error('Error fetching data', error);
      this.errorMessage = true;
      this.loading = false;
    }
  };

  private retryCountLineGraph = 0;
  private maxRetriesLineGraph = 5;

  createLineGraph(fastestTimes, slowestTimes, labels, lines, actualTimes) {
    const canvas = document.getElementById(
      'lineChartCanvas'
    ) as HTMLCanvasElement;

    if (canvas) {
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Check if lineChart already exists. If so, destroy it.
        if (this.lineChart) {
          this.lineChart.destroy();
          this.lineChart = null;
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
        this.loading = false; // Set loading to false after data is processed
        this.cdr.detectChanges(); // Trigger change detection
      } else {
        console.error('Failed to get 2D context for line chart');
      }
    } else {
      if (this.retryCountLineGraph < this.maxRetriesLineGraph) {
        this.retryCountLineGraph++;
        setTimeout(() => {
          this.createLineGraph(
            fastestTimes,
            slowestTimes,
            labels,
            lines,
            actualTimes
          );
        }, 1000);
      } else {
        console.error('Max retries reached for chart creation');
      }
    }
  }
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
