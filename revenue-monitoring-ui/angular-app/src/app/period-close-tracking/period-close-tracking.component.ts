import { ChangeDetectorRef, Component, OnChanges, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ApiHttpService } from '../providers/http.service';

import { DatePipe } from '@angular/common';
import { switchMap, startWith } from 'rxjs/operators';
import { Observable, interval } from 'rxjs';
import * as XLSX from 'xlsx';
import { DestroyManager } from '../providers/destroy-manager.service';
import { AuthenticationService } from '../providers/authentication.service';
import { MatTableDataSource } from '@angular/material/table';
import { MenuService } from '../providers/menu.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-period-close-tracking',
  templateUrl: './period-close-tracking.component.html',
  styleUrls: ['./period-close-tracking.component.css'],
  providers: [DestroyManager],
})
export class PeriodCloseTrackingComponent implements OnInit {
  refreshInterval = 30000; //ms
  timeNow: any;
  now: any;
  roles: string[] = [];

  monthMap = {
    '01': 'January',
    '02': 'February',
    '03': 'March',
    '04': 'April',
    '05': 'May',
    '06': 'June',
    '07': 'July',
    '08': 'August',
    '09': 'September',
    '10': 'October',
    '11': 'November',
    '12': 'December',
  };

  templateObject = Object;
  datePipe: DatePipe = new DatePipe('en-US');

  preCloseStartTime: String;
  preCloseEndTime: String;
  preCloseActualEndTime: String;
  midCloseStartTime: String;
  midCloseEndTime: String;
  midCloseActualEndTime: String;
  productVolume: Number;
  serviceVolume: Number;

  // pcloseInvGenTableOptions!: CuiTableOptions;
  // mcloseInvGenTableOptions!: CuiTableOptions;

  preCloseProgramTableData: any[] = [];
  midCloseProgramTableData: any[] = [];

  interfaceLoadHeaders: any[] = [];
  precloseInterfaceLoadData: any[] = [];
  midcloseInterfaceLoadData: any[] = [];
  precloseInterfaceLoadTableData: any[] = [];
  midcloseInterfaceLoadTableData: any[] = [];

  qeCashCollectedData: any[] = [];

  pcloseMonthEndStatusData: any[] = [];
  mcloseMonthEndStatusData: any[] = [];
  pcloseMonthEndStatusTableData: any[] = [];
  mcloseMonthEndStatusTableData: any[] = [];

  pcloseEstimatedCompletionTime: string;
  mcloseEstimatedCompletionTime: string;

  meStatusColumns: string[] = [
    'OPERATING UNIT',
    'ELIGIBLE FOR INVOICING',
    'INVOICING',
    'ACCOUNTING',
    'INTERCOMPANY',
    'DEFERRALS',
    'GL POSTING',
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
  meStatusCategories: string[] = [
    'ELIGIBLE_FOR_INVOICING',
    'INVOICING',
    'ACCOUNTING',
    'INTERCOMPANY',
    'DEFERRALS',
    'GL_POSTING',
  ];

  // 'AR_INTERFACE', 'INVOICING', 'ACCOUNTING', 'INTERCOMPANY','NGCCRM', 'GL_POSTING'
  pcloseExecutionWindow: string[] = [
    'Scheduled time',
    '07:00 - 08:30 PST',
    '08:30 - 09:30 PST',
    '09:30 - 14:30 PST',
    '12:30 - 14:30 PST',
    '12:30 - 14:30 PST',
    '14:30 - 15:00 PST',
  ];
  mcloseExecutionWindow: string[] = [
    'Scheduled time',
    '00:25 - 01:10 PST',
    '01:10 - 02:10 PST',
    '02:10 - 05:40 PST',
    '03:40 - 05:40 PST',
    '03:40 - 05:40 PST',
    '05:40 - 06:40 PST',
  ];

  pCloseProgBarStatusMapping: any = {};
  mCloseProgBarStatusMapping: any = {};
  pcloseOuStatusMapping: any = {};
  mcloseOuStatusMapping: any = {};

  preclosePeriod: String = '';
  midclosePeriod: String = '';
  isQuarterEnd: boolean = false;
  // pclose_last_period = 'JUL-23'; // hardcoded for now
  // mclose_last_period = 'JUL-23'; // hardcoded for now
  precloseQuarter: String = '';
  midcloseQuarter: String = '';

  dynamicInterfaceLoadColumns: string[] = [];
  pcloseInterfaceLoadColumns: string[] = [];
  mcloseInterfaceLoadColumns: string[] = [];

  protected http: ApiHttpService;
  protected destroyManager: DestroyManager;

  constructor(
    http: ApiHttpService,
    destroyManager: DestroyManager,
    private authService: AuthenticationService,
    private menuService: MenuService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private router: Router
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
    this.getDefaultTabIndex();

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

      // {
      //   category: 'Invoice to Cash',
      //   items: [
      //     {
      //       label: 'Pre Invoicing',
      //       route: '/pre-invoicing',
      //       role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
      //     },
      //     {
      //       label: 'Invoicing',
      //       route: '/invoicing',
      //       role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
      //     },
      //     {
      //       label: 'Post Invoicing',
      //       route: '/post-invoicing',
      //       role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
      //     },
      //     {
      //       label: 'eInvoicing',
      //       route: '/einvoicing',
      //       role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
      //     },
      //     {
      //       label: 'Fusion',
      //       route: '/fusion',
      //       role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
      //     },
      //   ],
      // },
      // {
      //   category: 'Revenue Accounting',
      //   items: [
      //     {
      //       label: 'Standard Revenue',
      //       route: '/standard-revenue',
      //       role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
      //     },
      //     {
      //       label: 'Rol',
      //       route: '/rol',
      //       role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
      //     },
      //     {
      //       label: 'Accruals',
      //       route: '/accruals',
      //       role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
      //     },
      //     {
      //       label: 'Accounts',
      //       route: '/accounts',
      //       role: ['ADMIN', 'ACCOUNT_RECON'],
      //     },
      //   ],
      // },
      // {
      //   category: 'GL Posting',
      //   items: [
      //     {
      //       label: 'General Ledger',
      //       route: '/general-ledger',
      //       role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
      //     },
      //   ],
      // },
      // {
      //   category: 'Operations Controls',
      //   items: [
      //     {
      //       label: 'Invoice to Cash',
      //       route: '',
      //       role: ['ADMIN'],
      //     },
      //     {
      //       label: 'Revenue',
      //       route: '',
      //       role: ['ADMIN'],
      //     },
      //   ],
      // },
    ]);
    // this.router.events.subscribe((event) => {
    //   if (event instanceof NavigationEnd) {
    //     console.log('🔹 Navigated to:', event.url);

    //     if (event.url.includes('/period-close-tracking')) {
    //       console.log('✅ First load detected for Period Close Tracking');
    //       this.updateHeaderToPreclose();
    //     }
    //   }
    // });
  }

  onTabChange(index: number) {
    this.selectedIndex = index;
    const newHeader = `Continuous Monitoring > ${this.filteredTabs[index]?.label}`;
    console.log('🔹 Tab changed, updating header:', newHeader);
    this.menuService.updateHeader(newHeader);
  }

  updateHeaderToPreclose() {
    const newHeader = 'Continuous Monitoring > Preclose';
    console.log('🔹 Setting initial header:', newHeader);
    this.menuService.updateHeader(newHeader);
  }

  menuOpen = false;

  toggleMenu() {
    console.log('Burger menu clicked!');
    // Implement menu toggle logic here
  }
  visibleTabs: { label: string; component: string; role: string[] }[] = [
    {
      label: 'Pre-close (Internal)',
      component: 'app-preclose',
      role: ['ADMIN', 'PERIOD_CLOSE'],
    },
    {
      label: 'Mid-close (Internal)',
      component: 'app-midclose',
      role: ['ADMIN', 'PERIOD_CLOSE'],
    },
  ];

  selectedIndex: number = 0;
  filteredTabs: { label: string; component: string }[] = [];

  getDefaultTabIndex() {
    this.filteredTabs = this.visibleTabs.filter((tab) =>
      tab.role.some((role) => this.roles.includes(role))
    );
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

  extractDatePrettify(date: string) {
    if (!date || typeof date !== 'string') {
      return 'N/A';
    }
    let dateParts = date.split('T')[0].split('-');
    let year = dateParts[0];
    let month;
    for (const ele in this.monthMap) {
      if (ele === dateParts[1]) {
        month = this.monthMap[ele];
      }
    }
    let day = dateParts[2];

    let timeParts = date.split('T')[1].split('.');
    let time = timeParts[0];

    let prettyDate = `${month} ${day}, ${year} at ${time} PST`;
    return prettyDate;
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
        if (row['CLOSE_TYPE'] == 'PRECLOSE') {
          this.preclosePeriod = row['PERIOD_NAME'];
          this.precloseQuarter = row['QUARTER'];
          this.preCloseStartTime =
            row['CLOSE_START_TIME'] != null
              ? this.extractDatePrettify(row['CLOSE_START_TIME'])
              : 'N/A';
          this.preCloseEndTime =
            row['CLOSE_END_TIME'] != null
              ? this.extractDatePrettify(row['CLOSE_END_TIME'])
              : 'N/A';
          this.preCloseActualEndTime =
            row['ACTUAL_CLOSE_END_TIME'] != null
              ? this.extractDatePrettify(row['ACTUAL_CLOSE_END_TIME'])
              : 'N/A';
        } else if (row['CLOSE_TYPE'] == 'MIDCLOSE') {
          this.midclosePeriod = row['PERIOD_NAME'];
          this.midcloseQuarter = row['QUARTER'];
          this.midCloseStartTime =
            row['CLOSE_START_TIME'] != null
              ? this.extractDatePrettify(row['CLOSE_START_TIME'])
              : 'N/A';
          this.midCloseEndTime =
            row['CLOSE_END_TIME'] != null
              ? this.extractDatePrettify(row['CLOSE_END_TIME'])
              : 'N/A';
          this.midCloseActualEndTime =
            row['ACTUAL_CLOSE_END_TIME'] != null
              ? this.extractDatePrettify(row['ACTUAL_CLOSE_END_TIME'])
              : 'N/A';
        }
        this.getIsQuarterEnd();
      });
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

  replaceUnderscoreWithDash(column: string): string {
    return column.replace(/_/g, '-').split(' ').join(' ');
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

      // For any operating unit, iterate through all the categories
      // These categories will be columns for the new table and keys for pCloseProgBarStatusMapping
      let tempOperatingUnit = data[0]['OPERATING_UNIT'];
      for (let category of Object.keys(
        this.pcloseOuStatusMapping[tempOperatingUnit]
      ).sort(this.customMeStatusCatSort.bind(this))) {
        // create new object for progress bar category mappings
        this.pCloseProgBarStatusMapping[category] = {};
        this.mCloseProgBarStatusMapping[category] = {};
      }

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

  replaceUnderscoreWithEmpty(column: string): string {
    return column.replace(/_/g, ' ');
  }

  getEstimatedCompletionTime() {
    this.getEndpointData('estimated-completion-time').subscribe((data: any) => {
      const pcloseesttime = data.find((obj) => obj['CLOSE_TYPE'] == 'PRECLOSE');
      const mcloseesttime = data.find((obj) => obj['CLOSE_TYPE'] == 'MIDCLOSE');

      this.pcloseEstimatedCompletionTime = this.extractDatePrettify(
        pcloseesttime['ESTIMATED_COMPLETION_TIME']
      );
      this.mcloseEstimatedCompletionTime = this.extractDatePrettify(
        mcloseesttime['ESTIMATED_COMPLETION_TIME']
      );
    });
  }

  precloseInterfaceLoadDatasource: any;
  midcloseInterfaceLoadDatasource: any;
  percentageColumn: boolean = false;
  getInterfaceLoad() {
    this.getEndpointData('period-close-interface-load').subscribe(
      (data: any) => {
        this.precloseInterfaceLoadData = data['PRECLOSE'];
        this.midcloseInterfaceLoadData = data['MIDCLOSE'];
        this.pcloseInterfaceLoadColumns = [];
        this.mcloseInterfaceLoadColumns = [];

        if (this.precloseInterfaceLoadData.length > 0) {
          this.pcloseInterfaceLoadColumns = Object.keys(
            this.precloseInterfaceLoadData[0]
          );
        }

        if (this.midcloseInterfaceLoadData.length > 0) {
          this.mcloseInterfaceLoadColumns = Object.keys(
            this.midcloseInterfaceLoadData[0]
          );
        }

        this.precloseInterfaceLoadDatasource = new MatTableDataSource<any>(
          this.precloseInterfaceLoadData
        );
        this.midcloseInterfaceLoadDatasource = new MatTableDataSource<any>(
          this.midcloseInterfaceLoadData
        );
      }
    );
  }

  isPercentageColumn(column: string): boolean {
    return (
      column === 'QUARTER OVER QUARTER' ||
      column === 'MONTH OVER MONTH' ||
      column === 'YEAR OVER YEAR' ||
      column === 'PRIOR QUARTER MONTH'
    );
  }

  getCircleColor(category: string, data: any[]): string {
    const hasStoppedItem = data.some(
      (row) => row[category] && row[category].toLowerCase() === 'stopped'
    );
    if (hasStoppedItem) {
      return '#FF0000'; // Red for stopped
    }

    const hasDelayedItem = data.some(
      (row) => row[category] && row[category].toLowerCase() === 'delayed'
    );
    if (hasDelayedItem) {
      return '#FFD429'; // Yellow for delayed
    }

    return '#78C000'; // Default green
  }

  getAbsoluteValue(number: number) {
    return Math.abs(number);
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

  exportTableToExcel(data: any[], sheetName: string, filename: string) {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }
}
