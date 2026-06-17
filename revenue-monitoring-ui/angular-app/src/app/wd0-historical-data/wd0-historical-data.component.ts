import {
  Component,
  HostBinding,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { MatTableDataSource } from '@angular/material/table';
import { RegressionService } from '../regression.service';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import { ThemeService } from '../providers/theme.service';

const createLineGradient = (startColor: string, endColor: string) =>
  new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: startColor },
    { offset: 1, color: endColor },
  ]);

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);

import { Observable, interval, last, startWith, switchMap } from 'rxjs';
import { tap } from 'rxjs/operators';

import { monthEndDates } from './monthEndDates';
import { DestroyManager } from '../providers/destroy-manager.service';
import { MenuService } from '../providers/menu.service';
import { TableModalComponent } from '../components/table-modal/table-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { ExportToExcelService } from '../providers/export-to-excel.service';

@Component({
  selector: 'app-wd0-historical-data',
  templateUrl: './wd0-historical-data.component.html',
  styleUrls: ['./wd0-historical-data.component.scss'],
  providers: [DestroyManager],
  standalone: false,
})
export class Wd0HistoricalDataComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @HostBinding('class.dark-theme') get darkThemeClass() {
    return this.themeService.isDarkMode;
  }
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
  productMidCloseActuals: any[] = [];
  serviceMidCloseActuals: any[] = [];
  productActualsLoading: boolean = true;
  serviceActualsLoading: boolean = true;

  chartOptionsMap: Record<string, EChartsOption> = {};

  upperCI: number;
  lowerCI: number;

  constructor(
    http: ApiHttpService,
    private regressionService: RegressionService,
    private destroyManager: DestroyManager,
    private menuService: MenuService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private ngZone: NgZone,
    private exportToExcelService: ExportToExcelService,
    public themeService: ThemeService,
  ) {
    this.http = http;
  }

  refreshInterval = 300000; //ms = 5 minutes

  ngOnDestroy(): void {}

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

    this.refreshExportData();
    this.getHistoricalData();
  }

  ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      this.ngZone.runOutsideAngular(() => {
        // Ensure the current date and time are interpreted in Pacific Time
        const nowPacificTime = new Date(
          new Date().toLocaleString('en-US', {
            timeZone: 'America/Los_Angeles',
          }),
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
              switchMap(() => this.getEndpointData('wd0-regression')),
            )
            .subscribe((data: any) => {
              let serviceActuals = [null, null, null];
              let productActuals = [null, null, null];

              // Check if the new month's data is present
              const newMonthDataExists = data.some(
                (entry: any) => entry.PERIOD_NAME === this.newMonthName,
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
              switchMap(() => this.getEndpointData('wd0-regression')),
            )
            .subscribe((data: any) => {
              let productActuals = [null, null, null];
              let serviceActuals = [null, null, null];
              this.getWd0Volumes(productActuals, serviceActuals);

              this.prepareDataForRegression(data);
              this.dataTimestamp = `Last Updated: ${new Date().toLocaleString()}`;
            });
        } else if (this.isWd2 || this.isWd3) {
          let productActuals = [null, null, null];
          let serviceActuals = [null, null, null];
          this.getWd0Volumes(productActuals, serviceActuals); // Projected data only

          this.getEndpointData('wd0-regression').subscribe((data: any) => {
            this.prepareDataForRegression(data);
            this.loading = false;
            this.dataTimestamp = `Last Updated: ${new Date().toLocaleString()}`;
          });
        } else {
          this.getEndpointData('wd0-regression').subscribe((data: any) => {
            productActuals = this.extractProductActuals(data);
            serviceActuals = this.extractServiceActuals(data);
            this.getWd0Volumes(productActuals, serviceActuals);

            this.prepareDataForRegression(data);

            this.loading = false;
            this.dataTimestamp = `Last Updated: ${new Date().toLocaleString()}`;
          });
        }
      });
    });
  }

  getWd0MidcloseActualsProduct() {
    this.productActualsLoading = true;
    // console.log('func called');
    this.http
      .get('wd0-midclose-actuals-product', this.destroyManager)
      .subscribe((data: any) => {
        this.productMidCloseActuals = data.map(
          ({ PERIOD_NAME, PRODUCT_CATEGORY, ...rest }) => rest,
        );
        // console.log('productMidCloseActuals', this.productMidCloseActuals);
        this.productActualsLoading = false;
      });
  }

  openWd0ProductModal(): void {
    this.showProductModal = true;

    setTimeout(() => {
      this.renderPieChart(this.productMidCloseActuals, 'productPieChart');
    }, 0);
  }

  getWd0MidcloseActualsService() {
    this.serviceActualsLoading = true;
    this.http
      .get('wd0-midclose-actuals-service', this.destroyManager)
      .subscribe((data: any) => {
        this.serviceMidCloseActuals = data.map(
          ({ PERIOD_NAME, PRODUCT_CATEGORY, ...rest }) => rest,
        );
        // console.log('serviceMidCloseActuals', this.serviceMidCloseActuals);
        this.serviceActualsLoading = false;
      });
  }

  openWd0ServiceModal(): void {
    this.showServiceModal = true;
    setTimeout(() => {
      this.renderPieChart(this.serviceMidCloseActuals, 'servicePieChart');
    }, 0);
  }

  customLegend: { label: string; color: string }[] = [];
  renderPieChart(
    data: { BATCH_SOURCE: string; TOTAL_COUNT: number }[],
    canvasId: string,
  ): void {
    const pieColors = [
      'rgba(54, 162, 235, 0.6)',
      'rgba(100, 255, 218, 0.6)',
      'rgba(255, 99, 132, 0.6)',
      'rgba(255, 159, 64, 0.6)',
      'rgba(153, 102, 255, 0.6)',
      'rgba(75, 192, 192, 0.6)',
      'rgba(235, 154, 229, 0.6)',
      'rgba(201, 203, 207, 0.6)',
      'rgba(0, 255, 157, 0.6)',
      'rgba(255, 205, 86, 0.6)',
    ];

    const labels = data.map(
      (entry) =>
        `${entry.TOTAL_COUNT.toLocaleString()} - ${entry.BATCH_SOURCE}`,
    );
    const counts = data.map((entry) => entry.TOTAL_COUNT);
    const colors = data.map((_, index) => pieColors[index % pieColors.length]);

    this.chartOptionsMap[canvasId] = {
      tooltip: { show: false },
      series: [
        {
          type: 'pie',
          radius: ['50%', '80%'],
          data: counts.map((value, i) => ({
            value,
            name: labels[i],
            itemStyle: { color: colors[i] },
          })),
          label: { show: false },
          emphasis: { disabled: true },
          animation: false,
        },
      ],
    };

    this.customLegend = labels.map((label, i) => ({
      label,
      color: colors[i],
    }));
  }

  getWd0Volumes(productActuals: number[], serviceActuals: number[]) {
    this.http.get('wd0-volumes', this.destroyManager).subscribe((data: any) => {
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
          entry.WD === 'WD-1' && entry.FISCAL_PERIOD === mostRecentFiscalPeriod,
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
          },
        );
      }

      // Step 3: Check if WD-2 data exists
      const wd2Exists = data.some(
        (entry: any) =>
          entry.WD === 'WD-2' && entry.FISCAL_PERIOD === mostRecentFiscalPeriod,
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
          },
        );
      }

      // Step 3: Filter the data for the most recent period
      const recentData = data.filter(
        (entry: any) => entry.FISCAL_PERIOD === mostRecentFiscalPeriod,
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
    // Step 1: Identify the most recent RUN_DATE
    const mostRecentEntry = data.reduce(
      (latest, entry) => {
        const entryDate = new Date(entry.RUN_DATE).getTime();
        return entryDate > latest.date
          ? { period: entry.FISCAL_PERIOD, date: entryDate }
          : latest;
      },
      { period: null, date: 0 },
    );

    this.latestPeriodName = mostRecentEntry.period;

    // Return the fiscal period of the most recent RUN_DATE entry
    return mostRecentEntry.period || 'Unknown Period'; // Fallback if no data is found
  }

  // Step 3: Function to filter and sort data by PRODUCT_TYPE and WD
  filterAndSortData(data: any[], productType: string): any[] {
    // Filter the data by product type
    const filteredData = data.filter(
      (entry: any) => entry.PRODUCT_TYPE === productType,
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
        productTotalObject,
      );

      // Now remove duplicate entries
      this.removeDuplicateEntityEntries(sanitizedData);

      this.historicalData = sanitizedData;

      this.dataSource = new MatTableDataSource<HistoricalDataModel>(
        this.historicalData,
      );

      // this.generateBarChart(this.historicalData);
    });
  }

  // Update the Q3 Service Line Predictive Model Chart
  updateServiceLineChart(serviceData: any[], serviceActuals: number[]) {
    const labels = serviceData.map((entry: any) => entry.WD).reverse();
    const lowData: (number | null)[] = serviceData
      .map((entry: any) => Number(entry.RECORD_COUNT_LOW))
      .reverse();
    const highData: (number | null)[] = serviceData
      .map((entry: any) => Number(entry.RECORD_COUNT_HIGH))
      .reverse();

    // Overwrite with nulls if isWd2 is true
    if (this.isWd2) {
      lowData[lowData.length - 1] = null;
      highData[highData.length - 1] = null;
    }

    const actualsPresent = serviceActuals.some((value) => value !== null);

    const chartData: any = {
      labels: labels,
      datasets: [
        {
          label: 'Low',
          data: lowData,
          fill: '+1',
          borderColor: '#9933ff',
        },
        {
          label: 'High',
          data: highData,
          borderColor: '#6ebe4a',
        },
      ],
    };

    if (actualsPresent) {
      chartData.datasets.push({
        label: 'Actuals',
        data: serviceActuals,
        borderColor: '#2EA8FF',
      });
    }

    this.chartOptionsMap['q3ServiceLinePredictiveModel'] =
      this.buildLineChartOptions(
        chartData.labels as string[],
        chartData.datasets,
      );
    this.serviceLoading = false;
    this.cdr.detectChanges();
  }

  updateProductLineChart(productData: any[], productActuals: number[]) {
    const labels = productData.map((entry: any) => entry.WD).reverse();
    const lowData: (number | null)[] = productData
      .map((entry: any) => Number(entry.RECORD_COUNT_LOW))
      .reverse();
    const highData: (number | null)[] = productData
      .map((entry: any) => Number(entry.RECORD_COUNT_HIGH))
      .reverse();

    // Overwrite with nulls if isWd2 is true
    if (this.isWd2) {
      lowData[lowData.length - 1] = null;
      highData[highData.length - 1] = null;
    }

    const actualsPresent = productActuals.some((value) => value !== null);

    const chartData: any = {
      labels: labels,
      datasets: [
        {
          label: 'Low',
          data: lowData,
          fill: '+1',
          borderColor: '#9933ff',
        },
        {
          label: 'High',
          data: highData,
          borderColor: '#6ebe4a',
        },
      ],
    };

    if (actualsPresent) {
      chartData.datasets.push({
        label: 'Actuals',
        data: productActuals,
        borderColor: '#2EA8FF',
      });
    }

    this.chartOptionsMap['productLinePredictiveModel'] =
      this.buildLineChartOptions(
        chartData.labels as string[],
        chartData.datasets,
      );
    this.productLoading = false;
    this.cdr.detectChanges();
  }

  private buildLineChartOptions(
    labels: string[],
    datasets: any[],
  ): EChartsOption {
    const series = datasets.map((ds: any) => {
      const gradientMap: Record<string, any> = {
        '#9933ff': createLineGradient(
          'rgba(153, 51, 255, 0.5)',
          'rgba(153, 51, 255, 0)',
        ),
        '#6ebe4a': createLineGradient(
          'rgba(110, 190, 74, 0.5)',
          'rgba(110, 190, 74, 0)',
        ),
        '#2EA8FF': createLineGradient(
          'rgba(46, 168, 255, 0.3)',
          'rgba(46, 168, 255, 0)',
        ),
      };

      const base: any = {
        name: ds.label,
        type: 'line',
        data: ds.data,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: ds.borderColor, width: 2 },
        itemStyle: { color: ds.borderColor },
        label: {
          show: true,
          position: 'top',
          distance: 5,
          fontSize: 10,
          color: '#4f4f4f',
          backgroundColor: 'rgba(255,255,255,0.83)',
          borderRadius: 3,
          padding: [2, 4],
          formatter: (params: any) =>
            params.value != null ? params.value.toLocaleString() : '',
        },
        labelLayout: (params: any) => {
          if (params.dataIndex === 0) {
            return { dx: 14 };
          }
          if (params.dataIndex === labels.length - 1) {
            return { dx: -10 };
          }
          return {};
        },
        areaStyle: {
          color:
            gradientMap[ds.borderColor] ??
            createLineGradient('rgba(65, 65, 65, 0.12)', 'rgba(65, 65, 65, 0)'),
        },
      };
      return base;
    });

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#222',
        textStyle: { color: '#fff' },
      },
      legend: {
        top: 0,
        textStyle: { fontSize: 10 },
        icon: 'circle',
        itemWidth: 10,
        itemHeight: 10,
      },
      grid: { top: 35, left: 8, right: 8, bottom: 10, containLabel: true },
      xAxis: {
        type: 'category',
        data: labels,
        boundaryGap: false,
        axisLabel: { fontSize: 10, margin: 8 },
        axisTick: { show: false },
        axisLine: { show: false },
        splitLine: { show: true, lineStyle: { color: '#f0f0f0' } },
      },
      yAxis: {
        type: 'value',
        name: 'Line Count',
        nameLocation: 'end',
        nameTextStyle: {
          fontSize: 10,
        },
        axisLabel: { show: false },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
      },
      series,
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
    return row.LINE_TYPE === 'Product Lines';
  }

  getTrend(
    row: any,
    prevColumn: string,
    currentColumn: string,
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
      (key) => key !== 'ENTITY' && key !== 'LINE_TYPE',
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
    this.exportToExcelService.exportTableToExcel(data, sheetName, filename);
  }

  getEndpointData(endpoint: string): Observable<any> {
    let uniqueId = Date.now();
    let cacheBustingUrl = `${endpoint}?cacheBuster=${uniqueId}`;

    const polling$ = interval(this.refreshInterval).pipe(
      startWith(0), // Emit initial value immediately
      switchMap(() => this.http.get(cacheBustingUrl, this.destroyManager)),
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
      (entry: any) => entry.LINE_TYPE === 'PRODUCT',
    );
    const recentProductEntries = productEntries.slice(-this.numberOfMonths); // Get the last few months
    const recentMonthNames = recentProductEntries.map(
      (entry: any) => entry.PERIOD_NAME,
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
      (entry) => !excludePeriods.includes(entry.PERIOD_NAME),
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
    recentMonthNames: string[],
  ) => {
    try {
      if (regressionData.X.length === 0 || regressionData.y.length === 0) {
        this.errorMessage = true;
        this.loading = false;
        return;
      }

      this.regressionService.performMultipleLinearRegression(
        regressionData.X,
        regressionData.y,
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
        },
      );

      let fastestTimes = [];
      let slowestTimes = [];

      // Get last 6 months confidence intervals
      combineRecentMonthsWithDFData.forEach((data) => {
        const result = this.regressionService.predictWithConfidenceIntervals(
          data.X,
          data.degreesOfFreedom,
        );
        fastestTimes.push(+result.lowerCI.toFixed(2));
        slowestTimes.push(+result.upperCI.toFixed(2));
      });

      // For next month prediction (.length - 1 is for the degrees of freedom)
      const upcomingMonthPrediction =
        this.regressionService.predictWithConfidenceIntervals(
          this.newMonthData,
          regressionData.X.length - 1,
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
        actualTimes,
      );
    } catch (error) {
      console.error('Error fetching data', error);
      this.errorMessage = true;
      this.loading = false;
    }
  };

  createLineGraph(fastestTimes, slowestTimes, labels, lines, actualTimes) {
    this.chartOptionsMap['lineChartCanvas'] = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#222',
        textStyle: { color: '#fff' },
      },
      legend: {
        top: 0,
        left: 'center',
        width: '80%',
        textStyle: { fontSize: 10 },
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 12,
        icon: 'circle',
      },
      grid: { top: 55, left: 8, right: 10, bottom: 10, containLabel: true },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { fontSize: 10, margin: 8 },
        axisTick: { show: false },
        axisLine: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          name: 'Lines',
          position: 'left',
          nameTextStyle: { fontSize: 10 },
          axisLabel: { fontSize: 10 },
          splitLine: { lineStyle: { color: '#f0f0f0' } },
        },
        {
          type: 'value',
          name: 'Hours',
          position: 'right',
          nameTextStyle: { fontSize: 10 },
          axisLabel: { fontSize: 10 },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'Actual Run (hrs)',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: true,
          data: actualTimes,
          lineStyle: { color: '#2EA8FF' },
          itemStyle: { color: '#2EA8FF' },
          areaStyle: {
            color: createLineGradient(
              'rgba(46, 168, 255, 0.28)',
              'rgba(46, 168, 255, 0)',
            ),
          },
        },
        {
          name: 'Lower Bound (hrs)',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: true,
          data: fastestTimes,
          lineStyle: { color: '#9933ff' },
          itemStyle: { color: '#9933ff' },
          areaStyle: {
            color: createLineGradient(
              'rgba(153, 51, 255, 0.5)',
              'rgba(153, 51, 255, 0)',
            ),
          },
        },
        {
          name: 'Upper Bound (hrs)',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: true,
          data: slowestTimes,
          lineStyle: { color: '#6ebe4a' },
          itemStyle: { color: '#6ebe4a' },
          areaStyle: {
            color: createLineGradient(
              'rgba(110, 190, 74, 0.5)',
              'rgba(110, 190, 74, 0)',
            ),
          },
        },
        {
          name: 'Product (lines)',
          type: 'bar',
          yAxisIndex: 0,
          data: lines.map((line) => line[0]),
          itemStyle: { color: '#909ca8' },
        },
        {
          name: 'Service (lines)',
          type: 'bar',
          yAxisIndex: 0,
          data: lines.map((line) => line[1]),
          itemStyle: { color: '#f39c12' },
        },
      ],
    };
    this.loading = false;
    this.cdr.detectChanges();
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
