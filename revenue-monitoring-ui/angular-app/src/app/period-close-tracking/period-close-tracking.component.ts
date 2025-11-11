import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { switchMap, startWith } from 'rxjs/operators';
import { Observable, interval } from 'rxjs';
import { DestroyManager } from '../providers/destroy-manager.service';
import { AuthenticationService } from '../providers/authentication.service';
import { MatTableDataSource } from '@angular/material/table';
import { MenuService } from '../providers/menu.service';

@Component({
  selector: 'app-period-close-tracking',
  templateUrl: './period-close-tracking.component.html',
  styleUrls: ['./period-close-tracking.component.css'],
  providers: [DestroyManager],
})
export class PeriodCloseTrackingComponent implements OnInit {
  refreshInterval = 300000; //ms
  timeNow: any;
  roles: string[] = [];

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
    'Scheduled time PST',
    '07:00 - 08:30',
    '08:30 - 09:30',
    '09:30 - 14:30',
    '12:30 - 14:30',
    '12:30 - 14:30',
    '14:30 - 15:00',
  ];

  pcloseActualsTime: string[] = [
    'Actual time PST',
    ' - ',
    ' - ',
    ' - ',
    ' - ',
    ' - ',
    'Data needed',
  ];
  mcloseExecutionWindow: string[] = [
    'Scheduled time PST',
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
    private menuService: MenuService
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
    this.roles = this.authService.getRoles();

    this.menuService.updateMenuItems([
      {
        label: 'Period Close Tracking',
        route: '/period-close-tracking',
        role: ['ADMIN', 'PERIOD_CLOSE'],
      },
      {
        label: 'Invoice to Cash',
        route: '/invoice-to-cash',
        role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
      },
      {
        label: 'Revenue Accounting',
        route: '/revenue-accounting',
        role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
      },
      {
        label: 'GL Posting',
        route: '/gl-posting',
        role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
      },
      {
        label: 'Operations Controls',
        route: '',
        role: [''],
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

    // Parse the ISO date string and convert to PST
    const utcDate = new Date(date);

    // Convert to PST (UTC-8) or PDT (UTC-7) - JavaScript handles DST automatically
    const pstDate = new Date(
      utcDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
    );

    // Format the date
    const month = pstDate.toLocaleString('en-US', { month: 'long' });
    const day = pstDate.getDate();
    const year = pstDate.getFullYear();
    const hours = String(pstDate.getHours()).padStart(2, '0');
    const minutes = String(pstDate.getMinutes()).padStart(2, '0');
    const seconds = String(pstDate.getSeconds()).padStart(2, '0');

    return `${month} ${day}, ${year} at ${hours}:${minutes}:${seconds} PST`;
  }

  // Format for Actual dates: "13:05:00 PST"
  extractDatePrettifyTimeOnly(date: string): string {
    if (!date || typeof date !== 'string') {
      return 'N/A';
    }

    // Parse the ISO date string and convert to PST
    const utcDate = new Date(date);

    // Convert to PST (UTC-8) or PDT (UTC-7) - JavaScript handles DST automatically
    const pstDate = new Date(
      utcDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
    );

    // Format time only
    const hours = String(pstDate.getHours()).padStart(2, '0');
    const minutes = String(pstDate.getMinutes()).padStart(2, '0');
    const seconds = String(pstDate.getSeconds()).padStart(2, '0');

    return `${hours}:${minutes}:${seconds} PST`;
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
      console.log('Period Close Start/End Times:', data);

      data.forEach((row) => {
        const closeType = row['CLOSE_TYPE'];
        const periodName = row['PERIOD_NAME'];
        const quarter = row['QUARTER'];
        const startTime = this.extractDatePrettifyFull(row['CLOSE_START_TIME']);
        const endTime = this.extractDatePrettifyFull(row['CLOSE_END_TIME']);
        const actualEndTime = this.extractDatePrettifyTimeOnly(
          row['ACTUAL_CLOSE_END_TIME']
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
      console.log(data);
      data.map((cashData) => {
        cashData.WD_0 = '$' + cashData.WD_0.toLocaleString('en-US');
        cashData.WD_1 = '$' + cashData.WD_1.toLocaleString('en-US');
        cashData.WD_2 = '$' + cashData.WD_2.toLocaleString('en-US');
        cashData.WD_3 = '$' + cashData.WD_3.toLocaleString('en-US');
        cashData.WD_4 = '$' + cashData.WD_4.toLocaleString('en-US');
        cashData.WD_5 = '$' + cashData.WD_5.toLocaleString('en-US');
        cashData.TOTAL = '$' + cashData.TOTAL.toLocaleString('en-US');
        return cashData;
      });
      this.qeCashCollectedData = data;

      let tableColumns: any[] = [];

      for (let column_name of Object.keys(data[0])) {
        tableColumns.push(column_name);
      }

      this.qeCashCollectedTableColumns = tableColumns;
      this.qeCashCollectedDatasource = new MatTableDataSource<any>(
        this.qeCashCollectedData
      );
    });
  }

  getPrecloseMeStatus() {
    this.getEndpointData('preclose-me-status').subscribe((data: any) => {
      console.log(data);
      this.pcloseMonthEndStatusTableData = [];
      this.pcloseOuStatusMapping = {};

      this.mcloseMonthEndStatusTableData = [];
      this.mcloseOuStatusMapping = {};

      // create ou category status mappings { ou -> { category -> status } }
      this.pcloseMonthEndStatusData = data.filter(
        (obj) => obj['CLOSE_TYPE'] == 'PRECLOSE'
      );
      this.mcloseMonthEndStatusData = data.filter(
        (obj) => obj['CLOSE_TYPE'] == 'MIDCLOSE'
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
          this.customMeStatusCatSort.bind(this)
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
          this.customMeStatusCatSort.bind(this)
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
        data.map((invData) => {
          for (let col of Object.keys(invData)) {
            if (col.includes('AMOUNT')) {
              invData[col] = '$' + invData[col].toLocaleString('en-US');
            }
            if (col.includes('COUNT')) {
              invData[col] = invData[col].toLocaleString('en-US');
            }
          }
          return invData;
        });
        this.preCloseProgramTableData = data.filter(
          (obj) => obj['CLOSE_TYPE'] == 'PRECLOSE'
        );
        this.midCloseProgramTableData = data.filter(
          (obj) => obj['CLOSE_TYPE'] == 'MIDCLOSE'
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
          this.preCloseProgramTableData
        );
        this.midcloseInvGenDatasource = new MatTableDataSource<any>(
          this.midCloseProgramTableData
        );
      }
    );
  }

  getEstimatedCompletionTime() {
    this.getEndpointData('estimated-completion-time').subscribe((data: any) => {
      const precloseData = data.find((obj) => obj['CLOSE_TYPE'] === 'PRECLOSE');
      const midcloseData = data.find((obj) => obj['CLOSE_TYPE'] === 'MIDCLOSE');

      this.pcloseEstimatedCompletionTime = precloseData
        ? this.extractDatePrettifyTimeOnly(
            precloseData['ESTIMATED_COMPLETION_TIME']
          )
        : 'N/A';
      this.mcloseEstimatedCompletionTime = midcloseData
        ? this.extractDatePrettifyTimeOnly(
            midcloseData['ESTIMATED_COMPLETION_TIME']
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
        console.log(data);

        this.precloseInterfaceLoadData = data['PRECLOSE'];
        this.midcloseInterfaceLoadData = data['MIDCLOSE'];

        // Reorder data: SERVICE first, then PRODUCT
        const reorderData = (dataArray: any[]) => {
          const serviceRow = dataArray.find(
            (row) => row.LINE_TYPE === 'SERVICE'
          );
          const productRow = dataArray.find(
            (row) => row.LINE_TYPE === 'PRODUCT'
          );
          return [serviceRow, productRow].filter(Boolean); // filter out undefined
        };

        this.precloseInterfaceLoadData = reorderData(
          this.precloseInterfaceLoadData
        );
        this.midcloseInterfaceLoadData = reorderData(
          this.midcloseInterfaceLoadData
        );

        // Transform table data to include latest quarter and rename headers
        const precloseTableData = this.precloseInterfaceLoadData.map((row) => {
          // Get all quarter keys (exclude LINE_TYPE, QUARTER OVER QUARTER, YEAR OVER YEAR)
          const quarters = Object.keys(row).filter(
            (key) =>
              key !== 'LINE_TYPE' &&
              key !== 'QUARTER OVER QUARTER' &&
              key !== 'YEAR OVER YEAR'
          );

          // Get the latest quarter (last in array)
          const latestQuarter = quarters[quarters.length - 1];
          const latestQuarterValue = row[latestQuarter];

          return {
            LINE_TYPE: row['LINE_TYPE'],
            [latestQuarter]: latestQuarterValue,
            'QoQ %': row['QUARTER OVER QUARTER'],
            'YoY %': row['YEAR OVER YEAR'],
          };
        });

        const midcloseTableData = this.midcloseInterfaceLoadData.map((row) => {
          // Get all quarter keys
          const quarters = Object.keys(row).filter(
            (key) =>
              key !== 'LINE_TYPE' &&
              key !== 'QUARTER OVER QUARTER' &&
              key !== 'YEAR OVER YEAR'
          );

          // Get the latest quarter (last in array)
          const latestQuarter = quarters[quarters.length - 1];
          const latestQuarterValue = row[latestQuarter];

          return {
            LINE_TYPE: row['LINE_TYPE'],
            [latestQuarter]: latestQuarterValue,
            'QoQ %': row['QUARTER OVER QUARTER'],
            'YoY %': row['YEAR OVER YEAR'],
          };
        });

        // Get the latest quarter name dynamically for column headers
        const precloseQuarters = Object.keys(
          this.precloseInterfaceLoadData[0]
        ).filter(
          (key) =>
            key !== 'LINE_TYPE' &&
            key !== 'QUARTER OVER QUARTER' &&
            key !== 'YEAR OVER YEAR'
        );
        const latestPcloseQuarter =
          precloseQuarters[precloseQuarters.length - 1];

        const midcloseQuarters = Object.keys(
          this.midcloseInterfaceLoadData[0]
        ).filter(
          (key) =>
            key !== 'LINE_TYPE' &&
            key !== 'QUARTER OVER QUARTER' &&
            key !== 'YEAR OVER YEAR'
        );
        const latestMcloseQuarter =
          midcloseQuarters[midcloseQuarters.length - 1];

        this.pcloseInterfaceLoadColumns = [
          'LINE_TYPE',
          latestPcloseQuarter,
          'QoQ %',
          'YoY %',
        ];
        this.mcloseInterfaceLoadColumns = [
          'LINE_TYPE',
          latestMcloseQuarter,
          'QoQ %',
          'YoY %',
        ];

        this.precloseInterfaceLoadDatasource = new MatTableDataSource<any>(
          precloseTableData
        );
        this.midcloseInterfaceLoadDatasource = new MatTableDataSource<any>(
          midcloseTableData
        );

        // Transform data for chart component
        this.precloseChartData = this.transformInterfaceDataForChart(
          this.precloseInterfaceLoadData
        );
        this.midcloseChartData = this.transformInterfaceDataForChart(
          this.midcloseInterfaceLoadData
        );
      }
    );
  }

  transformInterfaceDataForChart(data: any[]): any {
    if (!data || data.length === 0) return null;

    // Extract quarters (exclude LINE_TYPE, QUARTER OVER QUARTER, YEAR OVER YEAR)
    const quarters = Object.keys(data[0]).filter(
      (key) =>
        key !== 'LINE_TYPE' &&
        key !== 'QUARTER OVER QUARTER' &&
        key !== 'YEAR OVER YEAR'
    );

    // Find PRODUCT and SERVICE rows
    const productRow = data.find((row) => row.LINE_TYPE === 'PRODUCT');
    const serviceRow = data.find((row) => row.LINE_TYPE === 'SERVICE');

    // Build datasets
    const productValues = quarters.map((q) => productRow?.[q] || 0);
    const serviceValues = quarters.map((q) => serviceRow?.[q] || 0);

    // Calculate quarter-over-quarter percent changes for Product
    const productPercentChanges = quarters.map((q, index) => {
      if (index === 0) return 0; // No previous quarter for first data point

      const prevValue = productRow?.[quarters[index - 1]] || 0;
      const currentValue = productRow?.[q] || 0;

      if (prevValue === 0) return 0;
      return Math.round(((currentValue - prevValue) / prevValue) * 100);
    });

    // Calculate quarter-over-quarter percent changes for Service
    const servicePercentChanges = quarters.map((q, index) => {
      if (index === 0) return 0; // No previous quarter for first data point

      const prevValue = serviceRow?.[quarters[index - 1]] || 0;
      const currentValue = serviceRow?.[q] || 0;

      if (prevValue === 0) return 0;
      return Math.round(((currentValue - prevValue) / prevValue) * 100);
    });

    return {
      labels: quarters,
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

  getEndpointData(endpoint: string): Observable<any> {
    let uniqueId = Date.now();
    let cacheBustingUrl = `${endpoint}?cacheBuster=${uniqueId}`;

    const polling$ = interval(this.refreshInterval).pipe(
      startWith(0), // Emit initial value immediately
      switchMap(() => this.http.get(cacheBustingUrl, this.destroyManager))
    );
    return polling$;
  }
}
