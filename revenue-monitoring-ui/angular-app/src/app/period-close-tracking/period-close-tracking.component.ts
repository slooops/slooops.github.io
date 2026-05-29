import { Component, HostBinding, OnInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { switchMap, startWith } from 'rxjs/operators';
import { Observable, interval } from 'rxjs';
import { DestroyManager } from '../providers/destroy-manager.service';
import { DataService } from '../providers/data.service';
import { AuthenticationService } from '../providers/authentication.service';
import { MatTableDataSource } from '@angular/material/table';
import { MenuService } from '../providers/menu.service';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AtmfCardComponent } from '../components/atmf/atmf-card/atmf-card.component';
import { LoadingSymbolComponent } from '../loading-symbol/loading-symbol.component';
import { AtmfBarLineChartComponent } from '../components/atmf/atmf-bar-line-chart/atmf-bar-line-chart.component';
import { AtmfStackedChartComponent } from '../components/atmf/atmf-stacked-chart/atmf-stacked-chart.component';
import { AtmfTableComponent } from '../components/atmf/atmf-table/atmf-table.component';
import { phosphorSparkleBold } from '@ng-icons/phosphor-icons/bold';
import { provideIcons } from '@ng-icons/core';
import { ThemeService } from '../providers/theme.service';

@Component({
  selector: 'app-period-close-tracking',
  templateUrl: './period-close-tracking.component.html',
  styleUrls: ['./period-close-tracking.component.css'],
  providers: [
    DestroyManager,
    provideIcons({
      phosphorSparkleBold,
    }),
  ],
  imports: [
    CommonModule,
    MatTooltipModule,
    AtmfCardComponent,
    LoadingSymbolComponent,
    AtmfBarLineChartComponent,
    AtmfStackedChartComponent,
    AtmfTableComponent,
  ],
  standalone: true,
})
export class PeriodCloseTrackingComponent implements OnInit {
  @HostBinding('class.dark-theme') get darkThemeClass() {
    return this.themeService.isDarkMode;
  }

  refreshInterval = 300000; //ms
  timeNow: any;
  roles: string[] = [];
  periodStatus: any;

  // Tab state
  precloseActiveTab: 'invoices' | 'cash' = 'invoices';
  midcloseActiveTab: 'invoices' | 'cash' = 'invoices';

  templateObject = Object;

  preCloseStartTime: String;
  preCloseEndTime: String;
  preCloseActualEndTime: String;
  midCloseStartTime: String;
  midCloseEndTime: String;
  midCloseActualEndTime: String;

  preCloseProgramTableData: any[] = [];
  midCloseProgramTableData: any[] = [];

  precloseInterfaceLoadData: any[] = [];
  midcloseInterfaceLoadData: any[] = [];

  qeCashCollectedData: any[] = [];

  pcloseMonthEndStatusData: any[] = [];
  mcloseMonthEndStatusData: any[] = [];
  pcloseMonthEndStatusTableData: any[] = [];
  mcloseMonthEndStatusTableData: any[] = [];

  pcloseEstimatedCompletionTime: string;
  mcloseEstimatedCompletionTime: string;

  // Chart data for Invoices Generated and Cash Posted
  precloseInvChartLabels: string[] = [];
  precloseInvChartDatasets: any[] = [];
  midcloseInvChartLabels: string[] = [];
  midcloseInvChartDatasets: any[] = [];
  precloseCashChartLabels: string[] = [];
  precloseCashChartDatasets: any[] = [];
  midcloseCashChartLabels: string[] = [];
  midcloseCashChartDatasets: any[] = [];

  meStatusColumns: string[] = [
    'Operating Unit',
    'Eligible for Invoicing',
    'Invoicing',
    'Accounting',
    'Intercompany',
    'Deferrals',
    'GL Posting',
  ];
  meStatusDesiredOrder: string[] = [
    'OPERATING_UNIT',
    'ELIGIBLE_FOR_INVOICING',
    'INVOICING',
    'ACCOUNTING',
    'INTERCOMPANY',
    'DEFERRALS',
    'GL_POSTING',
  ];

  // 'AR_INTERFACE', 'INVOICING', 'ACCOUNTING', 'INTERCOMPANY','NGCCRM', 'GL_POSTING'
  pcloseExecutionWindow: string[] = [
    'Estimated time',
    '07:00 - 08:30',
    '08:30 - 09:30',
    '09:30 - 14:30',
    '12:30 - 14:30',
    '12:30 - 14:30',
    '14:30 - 15:00',
  ];

  pcloseActualsTime: string[] = [
    'Actual time',
    ' - ',
    ' - ',
    ' - ',
    ' - ',
    ' - ',
    ' - ',
  ];
  mcloseExecutionWindow: string[] = [
    'Estimated time',
    '00:25 - 01:10',
    '01:10 - 02:10',
    '02:10 - 05:40',
    '03:40 - 05:40',
    '03:40 - 05:40',
    '05:40 - 06:40',
  ];

  pcloseOuStatusMapping: any = {};
  mcloseOuStatusMapping: any = {};

  preclosePeriod: String = '';
  midclosePeriod: String = '';
  isQuarterEnd: boolean = false;
  precloseQuarter: String = '';
  midcloseQuarter: String = '';

  pcloseInterfaceLoadColumns: string[] = [];
  mcloseInterfaceLoadColumns: string[] = [];

  protected http: ApiHttpService;
  protected destroyManager: DestroyManager;

  constructor(
    http: ApiHttpService,
    destroyManager: DestroyManager,
    private authService: AuthenticationService,
    private menuService: MenuService,
    private dataService: DataService,
    public themeService: ThemeService,
  ) {
    this.http = http;
    this.destroyManager = destroyManager;
  }

  ngOnInit(): void {
    this.getPeriodQuarterStartEndTime();
    this.getPeriodCloseInvoice();
    this.getInterfaceLoad();
    this.getQECashCollected();
    this.getPrecloseMeStatus();
    this.getCurrentTime();
    this.getEstimatedCompletionTime();
    this.roles = this.authService.getUserAccessRoles();
    this.dataService.periodStatus$.subscribe((data) => {
      if (data) {
        this.periodStatus = {
          ...data,
          lastUpdated: new Date().toLocaleString(),
        };
      }
    });

    this.menuService.updateMenuItems([
      {
        label: 'Period Close Tracking',
        route: '/period-close-tracking',
        role: ['ADMIN', 'PERIOD_CLOSE'],
      },
      {
        label: 'Invoice to Cash',
        route: '/invoice-to-cash',
        role: ['ADMIN', 'MONITORING_I2C', 'MONITORING_I2C_ADMIN'],
      },
      {
        label: 'Revenue Accounting',
        route: '/revenue-accounting',
        role: [
          'ADMIN',
          'MONITORING_REVENUE_ACCOUNTING',
          'MONITORING_REVENUE_ACCOUNTING_ADMIN',
          'ACCOUNT_RECON',
        ],
      },
      {
        label: 'GL Posting',
        route: '/gl-posting',
        role: ['ADMIN', 'MONITORING_GL_AR', 'MONITORING_GL_AR_ADMIN'],
      },
    ]);
  }

  getIsQuarterEnd(): void {
    // this.preclosePeriod = 'JUN-23';
    let periodMonth = this.preclosePeriod.split('-')[0];
    if (
      periodMonth === 'OCT' ||
      periodMonth === 'JAN' ||
      periodMonth === 'APR' ||
      periodMonth === 'JUL'
    ) {
      this.isQuarterEnd = true;
    } else {
      this.isQuarterEnd = false;
    }
  }

  // Format for Expected dates: "April 26, 2025 at 07:00:00 PST"
  extractDatePrettifyFull(date: string): string {
    if (!date || typeof date !== 'string') {
      return 'N/A';
    }

    // Check if it's a plain TO_CHAR string: "YYYY-MM-DD HH24:MI:SS" (production)
    const plainMatch = date.match(
      /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/,
    );

    if (plainMatch) {
      // Plain string from TO_CHAR - already in PST, display as-is
      const [, year, month, day, hours, minutes, seconds] = plainMatch;
      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      const monthName = monthNames[parseInt(month, 10) - 1];
      return `${monthName} ${parseInt(
        day,
        10,
      )}, ${year} at ${hours}:${minutes}:${seconds} PST`;
    }

    // Otherwise, parse as ISO 8601 timestamp (local dev) and convert UTC to PST
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'N/A';
    }

    const pstDate = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(dateObj);

    return pstDate.replace(',', '').replace(/at /, 'at ') + ' PST';
  }

  // Format for Actual dates: "13:05:00 PST"
  extractDatePrettifyTimeOnly(date: string): string {
    if (!date || typeof date !== 'string') {
      return 'N/A';
    }

    // Case 1: Already time-only (HH:mm:ss)
    const timeOnlyMatch = date.match(/^(\d{2}):(\d{2}):(\d{2})$/);
    if (timeOnlyMatch) {
      return `${timeOnlyMatch[1]}:${timeOnlyMatch[2]}:${timeOnlyMatch[3]} PST`;
    }

    // Case 2: "YYYY-MM-DD HH:mm:ss"
    const dateTimeMatch = date.match(
      /^\d{4}-\d{2}-\d{2}\s+(\d{2}):(\d{2}):(\d{2})$/,
    );
    if (dateTimeMatch) {
      return `${dateTimeMatch[1]}:${dateTimeMatch[2]}:${dateTimeMatch[3]} PST`;
    }

    // Case 3: ISO 8601 timestamp (e.g. 2025-01-24T15:30:00.000+00:00)
    const isoMatch = date.match(/T(\d{2}):(\d{2}):(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[1]}:${isoMatch[2]}:${isoMatch[3]} PST`;
    }

    return 'N/A';
  }

  getCurrentTime() {
    this.getEndpointData('dashboard-timestamp').subscribe((data: any) => {
      this.timeNow = new Date(data['timeNow']).toLocaleString('en-us', {
        hour: 'numeric',
        minute: 'numeric',
      });
    });
  }

  getPeriodQuarterStartEndTime() {
    this.getEndpointData('preclose-start-end-time').subscribe((data: any) => {
      data.forEach((row) => {
        const closeType = row['CLOSE_TYPE'];
        const periodName = row['PERIOD_NAME'];
        const quarter = row['QUARTER'];
        const startTime = this.extractDatePrettifyFull(row['CLOSE_START_TIME']);
        const endTime = this.extractDatePrettifyFull(row['CLOSE_END_TIME']);
        const actualEndTime = this.extractDatePrettifyTimeOnly(
          row['ACTUAL_CLOSE_END_TIME'],
        );

        if (closeType === 'PRECLOSE') {
          this.preclosePeriod = periodName;
          this.precloseQuarter = quarter;
          this.preCloseStartTime = startTime;
          this.preCloseEndTime = endTime;
          this.preCloseActualEndTime = actualEndTime;
        } else if (closeType === 'MIDCLOSE') {
          this.midclosePeriod = periodName;
          this.midcloseQuarter = quarter;
          this.midCloseStartTime = startTime;
          this.midCloseEndTime = endTime;
          this.midCloseActualEndTime = actualEndTime;
        }
      });

      this.getIsQuarterEnd();
    });
  }

  qeCashCollectedTableColumns: any[] = [];
  qeCashCollectedDatasource: any;
  getQECashCollected() {
    this.getEndpointData('pclose-qe-cash-collected').subscribe((data: any) => {
      // Save raw data for chart before formatting
      const rawCashData = data.map((row: any) => ({ ...row }));
      this.buildCashChartData(rawCashData);

      data.map((cashData) => {
        cashData.WD_0 =
          '$' +
          cashData.WD_0.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        cashData.WD_1 =
          '$' +
          cashData.WD_1.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        cashData.WD_2 =
          '$' +
          cashData.WD_2.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        cashData.WD_3 =
          '$' +
          cashData.WD_3.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        cashData.WD_4 =
          '$' +
          cashData.WD_4.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        cashData.WD_5 =
          '$' +
          cashData.WD_5.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        cashData.TOTAL =
          '$' +
          cashData.TOTAL.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        return cashData;
      });
      this.qeCashCollectedData = data;

      let tableColumns: any[] = [];

      for (let column_name of Object.keys(data[0])) {
        if (column_name !== 'STATUS') {
          tableColumns.push(column_name);
        }
      }

      this.qeCashCollectedTableColumns = tableColumns;
      this.qeCashCollectedDatasource = new MatTableDataSource<any>(
        this.qeCashCollectedData,
      );
    });
  }

  getPrecloseMeStatus() {
    this.getEndpointData('preclose-me-status').subscribe((data: any) => {
      this.pcloseMonthEndStatusTableData = [];
      this.pcloseOuStatusMapping = {};

      this.mcloseMonthEndStatusTableData = [];
      this.mcloseOuStatusMapping = {};

      // create ou category status mappings { ou -> { category -> status } }
      this.pcloseMonthEndStatusData = data.filter(
        (obj) => obj['CLOSE_TYPE'] == 'PRECLOSE',
      );
      this.mcloseMonthEndStatusData = data.filter(
        (obj) => obj['CLOSE_TYPE'] == 'MIDCLOSE',
      );

      // setup preclose data (pcloseOuStatusMapping)
      this.pcloseMonthEndStatusData.forEach((row) => {
        let operatingUnit = row['OPERATING_UNIT'];
        let category = row['CATEGORY'];
        let stepsCompleted = row['STEPS_COMPLETED'];
        let closeStatus = row['CLOSE_STATUS'];

        if (!(operatingUnit in this.pcloseOuStatusMapping)) {
          this.pcloseOuStatusMapping[operatingUnit] = {};
          this.pcloseOuStatusMapping[operatingUnit][category] = {};
          this.pcloseOuStatusMapping[operatingUnit][category]['closeStatus'] =
            closeStatus;
          this.pcloseOuStatusMapping[operatingUnit][category][
            'stepsCompleted'
          ] = stepsCompleted;
        } else if (!(category in this.pcloseOuStatusMapping[operatingUnit])) {
          this.pcloseOuStatusMapping[operatingUnit][category] = {};
          this.pcloseOuStatusMapping[operatingUnit][category]['closeStatus'] =
            closeStatus;
          this.pcloseOuStatusMapping[operatingUnit][category][
            'stepsCompleted'
          ] = stepsCompleted;
        }
      });

      // setup midclose data (mcloseOuStatusMapping)
      this.mcloseMonthEndStatusData.forEach((row) => {
        let operatingUnit = row['OPERATING_UNIT'];
        let category = row['CATEGORY'];
        let closeStatus = row['CLOSE_STATUS'];
        let stepsCompleted = row['STEPS_COMPLETED'];

        if (!(operatingUnit in this.mcloseOuStatusMapping)) {
          this.mcloseOuStatusMapping[operatingUnit] = {};
          this.mcloseOuStatusMapping[operatingUnit][category] = {};
          this.mcloseOuStatusMapping[operatingUnit][category]['closeStatus'] =
            closeStatus;
          this.mcloseOuStatusMapping[operatingUnit][category][
            'stepsCompleted'
          ] = stepsCompleted;
        } else if (!(category in this.mcloseOuStatusMapping[operatingUnit])) {
          this.mcloseOuStatusMapping[operatingUnit][category] = {};
          this.mcloseOuStatusMapping[operatingUnit][category]['closeStatus'] =
            closeStatus;
          this.mcloseOuStatusMapping[operatingUnit][category][
            'stepsCompleted'
          ] = stepsCompleted;
        }
      });

      // Get rows of table by building each row as an object and pushing it to array
      // Preclose
      for (let ou of Object.keys(this.pcloseOuStatusMapping)) {
        let tableRowObj = {};
        let ouStatusesObj = this.pcloseOuStatusMapping[ou];
        tableRowObj['OPERATING_UNIT'] = ou;
        for (let category of Object.keys(ouStatusesObj).sort(
          this.customMeStatusCatSort.bind(this),
        )) {
          tableRowObj[category] =
            this.pcloseOuStatusMapping[ou][category]['closeStatus'];
        }
        this.pcloseMonthEndStatusTableData.push(tableRowObj);
      }
      // Midclose
      for (let ou of Object.keys(this.mcloseOuStatusMapping)) {
        let tableRowObj = {};
        let ouStatusesObj = this.mcloseOuStatusMapping[ou];
        tableRowObj['OPERATING_UNIT'] = ou;
        for (let category of Object.keys(ouStatusesObj).sort(
          this.customMeStatusCatSort.bind(this),
        )) {
          tableRowObj[category] =
            this.mcloseOuStatusMapping[ou][category]['closeStatus'];
        }
        this.mcloseMonthEndStatusTableData.push(tableRowObj);
      }
    });
  }

  pcloseInvGenTableColumns: any[] = [];
  mcloseInvGenTableColumns: any[] = [];
  precloseInvGenDatasource: any;
  midcloseInvGenDatasource: any;
  getPeriodCloseInvoice() {
    this.getEndpointData('period-close-invoice-stats').subscribe(
      (data: any) => {
        // Save raw data for charts before formatting
        const rawPreclose = data
          .filter((obj: any) => obj['CLOSE_TYPE'] === 'PRECLOSE')
          .map((row: any) => ({ ...row }));
        const rawMidclose = data
          .filter((obj: any) => obj['CLOSE_TYPE'] === 'MIDCLOSE')
          .map((row: any) => ({ ...row }));

        // Build chart data from raw numbers
        this.buildInvoiceChartData(rawPreclose, 'preclose');
        this.buildInvoiceChartData(rawMidclose, 'midclose');

        // Format for table display (2 decimal places for amounts)
        data.map((invData) => {
          for (let col of Object.keys(invData)) {
            if (col.includes('AMOUNT')) {
              invData[col] =
                '$' +
                invData[col].toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
            }
            if (col.includes('COUNT')) {
              invData[col] = invData[col].toLocaleString('en-US');
            }
          }
          return invData;
        });
        this.preCloseProgramTableData = data.filter(
          (obj) => obj['CLOSE_TYPE'] == 'PRECLOSE',
        );
        this.midCloseProgramTableData = data.filter(
          (obj) => obj['CLOSE_TYPE'] == 'MIDCLOSE',
        );
        let programColumns: any[] = [];

        for (let column of Object.keys(data[0])) {
          if (column !== 'CLOSE_TYPE') {
            if (!this.isQuarterEnd) {
              if (column !== 'QUARTER') {
                programColumns.push(column);
              }
            } else {
              programColumns.push(column);
            }
          }
        }

        this.pcloseInvGenTableColumns = programColumns;
        this.mcloseInvGenTableColumns = programColumns;
        this.precloseInvGenDatasource = new MatTableDataSource<any>(
          this.preCloseProgramTableData,
        );
        this.midcloseInvGenDatasource = new MatTableDataSource<any>(
          this.midCloseProgramTableData,
        );
      },
    );
  }

  getEstimatedCompletionTime() {
    this.getEndpointData('estimated-completion-time').subscribe((data: any) => {
      const precloseData = data.find((obj) => obj['CLOSE_TYPE'] === 'PRECLOSE');
      const midcloseData = data.find((obj) => obj['CLOSE_TYPE'] === 'MIDCLOSE');

      console.log('Estimated Completion Time Data:', data);

      this.pcloseEstimatedCompletionTime = precloseData
        ? this.extractDatePrettifyTimeOnly(
            precloseData['ESTIMATED_COMPLETION_TIME'],
          )
        : 'N/A';
      this.mcloseEstimatedCompletionTime = midcloseData
        ? this.extractDatePrettifyTimeOnly(
            midcloseData['ESTIMATED_COMPLETION_TIME'],
          )
        : 'N/A';
    });
  }

  precloseInterfaceLoadDatasource: any;
  midcloseInterfaceLoadDatasource: any;
  precloseChartData: any;
  midcloseChartData: any;

  getInterfaceLoad() {
    this.getEndpointData('period-close-interface-load').subscribe(
      (data: any) => {
        this.precloseInterfaceLoadData = data['PRECLOSE'];
        this.midcloseInterfaceLoadData = data['MIDCLOSE'];

        // Reorder data: SERVICE first, then PRODUCT
        const reorderData = (dataArray: any[]) => {
          const serviceRow = dataArray.find(
            (row) => row.LINE_TYPE === 'SERVICE',
          );
          const productRow = dataArray.find(
            (row) => row.LINE_TYPE === 'PRODUCT',
          );
          return [serviceRow, productRow].filter(Boolean); // filter out undefined
        };

        this.precloseInterfaceLoadData = reorderData(
          this.precloseInterfaceLoadData,
        );
        this.midcloseInterfaceLoadData = reorderData(
          this.midcloseInterfaceLoadData,
        );

        // Helper function to get period keys (exclude LINE_TYPE and percentage columns)
        const getPeriodKeys = (row: any) => {
          return Object.keys(row).filter(
            (key) =>
              key !== 'LINE_TYPE' &&
              key !== 'QUARTER OVER QUARTER' &&
              key !== 'YEAR OVER YEAR' &&
              key !== 'MONTH OVER MONTH' &&
              key !== 'PRIOR QUARTER MONTH',
          );
        };

        // Helper function to determine if data has QoQ/YoY or MoM/PQM
        const hasQuarterlyData = (row: any) => {
          return 'QUARTER OVER QUARTER' in row || 'YEAR OVER YEAR' in row;
        };

        const hasMonthlyData = (row: any) => {
          return 'MONTH OVER MONTH' in row || 'PRIOR QUARTER MONTH' in row;
        };

        // Transform table data - handle both quarterly and monthly percentages
        const transformTableData = (dataArray: any[]) => {
          if (!dataArray || dataArray.length === 0) return [];

          const isQuarterly = hasQuarterlyData(dataArray[0]);
          const isMonthly = hasMonthlyData(dataArray[0]);

          return dataArray.map((row) => {
            const periods = getPeriodKeys(row);
            const latestPeriod = periods[periods.length - 1];
            const latestPeriodValue = row[latestPeriod];

            const transformedRow: any = {
              LINE_TYPE: row['LINE_TYPE'],
              [latestPeriod]: latestPeriodValue,
            };

            // Add appropriate percentage columns based on data type
            if (isQuarterly) {
              transformedRow['QoQ %'] = row['QUARTER OVER QUARTER'];
              transformedRow['YoY %'] = row['YEAR OVER YEAR'];
            }
            if (isMonthly) {
              transformedRow['MoM %'] = row['MONTH OVER MONTH'];
              transformedRow['PQM %'] = row['PRIOR QUARTER MONTH'];
            }

            return transformedRow;
          });
        };

        const precloseTableData = transformTableData(
          this.precloseInterfaceLoadData,
        );
        const midcloseTableData = transformTableData(
          this.midcloseInterfaceLoadData,
        );

        // Build column arrays dynamically based on what's in the data
        const buildColumns = (dataArray: any[]) => {
          if (!dataArray || dataArray.length === 0) return ['LINE_TYPE'];

          const periods = getPeriodKeys(dataArray[0]);
          const latestPeriod = periods[periods.length - 1];
          const columns = ['LINE_TYPE', latestPeriod];

          const isQuarterly = hasQuarterlyData(dataArray[0]);
          const isMonthly = hasMonthlyData(dataArray[0]);

          if (isQuarterly) {
            columns.push('QoQ %', 'YoY %');
          }
          if (isMonthly) {
            columns.push('MoM %', 'PQM %');
          }

          return columns;
        };

        this.pcloseInterfaceLoadColumns = buildColumns(
          this.precloseInterfaceLoadData,
        );
        this.mcloseInterfaceLoadColumns = buildColumns(
          this.midcloseInterfaceLoadData,
        );

        this.precloseInterfaceLoadDatasource = new MatTableDataSource<any>(
          precloseTableData,
        );
        this.midcloseInterfaceLoadDatasource = new MatTableDataSource<any>(
          midcloseTableData,
        );

        // Transform data for chart component
        this.precloseChartData = this.transformInterfaceDataForChart(
          this.precloseInterfaceLoadData,
        );
        this.midcloseChartData = this.transformInterfaceDataForChart(
          this.midcloseInterfaceLoadData,
        );
      },
    );
  }

  transformInterfaceDataForChart(data: any[]): any {
    if (!data || data.length === 0) return null;

    // Extract periods (exclude LINE_TYPE and all percentage columns)
    const periods = Object.keys(data[0]).filter(
      (key) =>
        key !== 'LINE_TYPE' &&
        key !== 'QUARTER OVER QUARTER' &&
        key !== 'YEAR OVER YEAR' &&
        key !== 'MONTH OVER MONTH' &&
        key !== 'PRIOR QUARTER MONTH',
    );

    // Find PRODUCT and SERVICE rows
    const productRow = data.find((row) => row.LINE_TYPE === 'PRODUCT');
    const serviceRow = data.find((row) => row.LINE_TYPE === 'SERVICE');

    // Build datasets
    const productValues = periods.map((p) => productRow?.[p] || 0);
    const serviceValues = periods.map((p) => serviceRow?.[p] || 0);

    // Calculate period-over-period percent changes for Product
    const productPercentChanges = periods.map((p, index) => {
      if (index === 0) return 0; // No previous period for first data point

      const prevValue = productRow?.[periods[index - 1]] || 0;
      const currentValue = productRow?.[p] || 0;

      if (prevValue === 0) return 0;
      return Math.round(((currentValue - prevValue) / prevValue) * 100);
    });

    // Calculate period-over-period percent changes for Service
    const servicePercentChanges = periods.map((p, index) => {
      if (index === 0) return 0; // No previous period for first data point

      const prevValue = serviceRow?.[periods[index - 1]] || 0;
      const currentValue = serviceRow?.[p] || 0;

      if (prevValue === 0) return 0;
      return Math.round(((currentValue - prevValue) / prevValue) * 100);
    });

    return {
      labels: periods,
      productValues,
      serviceValues,
      productPercentChanges,
      servicePercentChanges,
    };
  }

  customMeStatusCatSort(a: string, b: string): number {
    const indexA = this.meStatusDesiredOrder.indexOf(a);
    const indexB = this.meStatusDesiredOrder.indexOf(b);

    if (indexA === -1) {
      return 1; // Move items not in the desired order to the end
    }
    if (indexB === -1) {
      return -1; // Move items not in the desired order to the end
    }
    return indexA - indexB;
  }

  /**
   * Build chart data for Invoices Generated.
   * Stacked bars: Product Amount, Service Amount, Tax Amount
   * Line on secondary axis: Invoice Count
   */
  buildInvoiceChartData(rawData: any[], type: 'preclose' | 'midclose'): void {
    if (!rawData || rawData.length === 0) return;

    // Determine label key: use QUARTER on quarter-end, PERIOD_NAME otherwise
    const labelKey = this.isQuarterEnd ? 'QUARTER' : 'PERIOD_NAME';
    const labels = rawData.map((row) => row[labelKey] || '');

    // Find amount column names dynamically
    const keys = Object.keys(rawData[0]);
    const productAmtKey = keys.find(
      (k) => k.includes('PRODUCT') && k.includes('AMOUNT'),
    );
    const serviceAmtKey = keys.find(
      (k) => k.includes('SERVICE') && k.includes('AMOUNT'),
    );
    const taxAmtKey = keys.find(
      (k) => k.includes('TAX') && k.includes('AMOUNT'),
    );
    const countKey = keys.find((k) => k.includes('COUNT'));

    const datasets: any[] = [
      {
        type: 'bar',
        label: 'Service Amount',
        data: rawData.map((row) => row[serviceAmtKey] || 0),
        backgroundColor: '#7d8affe4',
        borderColor: '#7D8AFF',
        borderWidth: 1,
        yAxisID: 'y',
        order: 2,
      },
      {
        type: 'bar',
        label: 'Product Amount',
        data: rawData.map((row) => row[productAmtKey] || 0),
        backgroundColor: '#b02863ff',
        borderColor: '#B02863',
        borderWidth: 1,
        yAxisID: 'y',
        order: 1,
      },
      {
        type: 'bar',
        label: 'Tax Amount',
        data: rawData.map((row) => row[taxAmtKey] || 0),
        backgroundColor: '#e6971099',
        borderColor: '#e69710',
        borderWidth: 1,
        yAxisID: 'y',
        order: 3,
      },
    ];

    // Add Invoice Count as a line on secondary axis — same style as Interface Load product % line
    if (countKey) {
      datasets.unshift({
        type: 'line',
        label: 'Invoice Count',
        data: rawData.map((row) => row[countKey] || 0),
        borderColor: '#e69710ff',
        backgroundColor: '#e69710ff',
        borderWidth: 3,
        borderDash: [5, 5],
        fill: false,
        yAxisID: 'y1',
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#e69710ff',
        pointBorderColor: '#e69710ff',
        order: 0,
        tension: 0.3,
      });
    }

    if (type === 'preclose') {
      this.precloseInvChartLabels = labels;
      this.precloseInvChartDatasets = datasets;
    } else {
      this.midcloseInvChartLabels = labels;
      this.midcloseInvChartDatasets = datasets;
    }
  }

  /**
   * Build chart data for Cash Posted.
   * Stacked bars: WD_5 through WD_0
   */
  buildCashChartData(rawData: any[]): void {
    if (!rawData || rawData.length === 0) return;

    // Use PERIOD_NAME for labels
    const labels = rawData.map((row) => row['PERIOD_NAME'] || '');

    const wdColors = [
      { bg: '#7d8affee', border: '#7D8AFF' }, // WD 5
      { bg: '#5b6edbe4', border: '#5b6edb' }, // WD 4
      { bg: '#9a6bffe4', border: '#9a6bff' }, // WD 3
      { bg: '#b02863e4', border: '#B02863' }, // WD 2
      { bg: '#7d3f8fe4', border: '#7d3f8f' }, // WD 1
      { bg: '#4a2080e4', border: '#4a2080' }, // WD 0
    ];

    const wdKeys = ['WD_5', 'WD_4', 'WD_3', 'WD_2', 'WD_1', 'WD_0'];
    const datasets: any[] = wdKeys.map((key, idx) => ({
      type: 'bar',
      label: key.replace('_', ' '),
      data: rawData.map((row) => row[key] || 0),
      backgroundColor: wdColors[idx].bg,
      borderColor: wdColors[idx].border,
      borderWidth: 1,
      yAxisID: 'y',
      order: wdKeys.length - idx,
    }));

    // Same data for both preclose and midclose cash charts
    this.precloseCashChartLabels = labels;
    this.precloseCashChartDatasets = datasets;
    this.midcloseCashChartLabels = labels;
    this.midcloseCashChartDatasets = datasets;
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
}
