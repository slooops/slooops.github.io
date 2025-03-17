import { Component, OnInit } from '@angular/core';
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
  startTimeEdit = false;
  closeTimeEdit = false;
  editComments = false;
  showpreStatusFilter = true;
  showmidStatusFilter = true;
  showComments: boolean = false;
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
  precloseSelectedEntities: string[] = [];
  precloseSelectedStatuses: string[] = [];

  midcloseSelectedEntities: string[] = [];
  midcloseSelectedStatuses: string[] = [];

  precloseDefaultSelectedEntities: string[] = localStorage.getItem(
    'precloseentity'
  )
    ? JSON.parse(localStorage.getItem('precloseentity')).includes('All')
      ? ['All']
      : JSON.parse(localStorage.getItem('precloseentity'))
    : ['All'];

  precloseAllEntitiesSelected: boolean = localStorage.getItem('precloseentity')
    ? JSON.parse(localStorage.getItem('precloseentity')).includes('All')
      ? true
      : false
    : true;

  precloseAllStatusSelected: boolean = localStorage.getItem('preclosestatus')
    ? JSON.parse(localStorage.getItem('preclosestatus')).includes('All')
      ? true
      : false
    : true;

  precloseDefaultStatus: string[] = localStorage.getItem('preclosestatus')
    ? JSON.parse(localStorage.getItem('preclosestatus')).includes('All')
      ? ['All']
      : JSON.parse(localStorage.getItem('preclosestatus'))
    : ['All'];

  midcloseAllEntitiesSelected: boolean = localStorage.getItem('midcloseentity')
    ? JSON.parse(localStorage.getItem('midcloseentity')).includes('All')
      ? true
      : false
    : true;

  midcloseAllStatusSelected: boolean = localStorage.getItem('midclosestatus')
    ? JSON.parse(localStorage.getItem('midclosestatus')).includes('All')
      ? true
      : false
    : true;

  midcloseDefaultSelectedEntities: string[] = localStorage.getItem(
    'midcloseentity'
  )
    ? JSON.parse(localStorage.getItem('midcloseentity')).includes('All')
      ? ['All']
      : JSON.parse(localStorage.getItem('midcloseentity'))
    : ['All'];
  midcloseDefaultStatus: string[] = localStorage.getItem('midclosestatus')
    ? JSON.parse(localStorage.getItem('midclosestatus')).includes('All')
      ? ['All']
      : JSON.parse(localStorage.getItem('midclosestatus'))
    : ['All'];

  pcloseEntityvalueSetOnload: boolean = true;

  pcloseStatusvalueSetOnload: boolean = true;

  mcloseEntityvalueSetOnload: boolean = true;

  mcloseStatusvalueSetOnload: boolean = true;

  precloseStatuses = new FormControl(this.precloseDefaultStatus);

  precloseEntities = new FormControl(this.precloseDefaultSelectedEntities);

  midcloseStatuses = new FormControl(this.midcloseDefaultStatus);

  midcloseEntities = new FormControl(this.midcloseDefaultSelectedEntities);

  preCloseStartTime: String;
  preCloseEndTime: String;
  preCloseActualEndTime: String;
  midCloseStartTime: String;
  midCloseEndTime: String;
  midCloseActualEndTime: String;
  productVolume: Number;
  serviceVolume: Number;

  dashComments: commentsModel[];

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
  // qeCashCollectedTableOptions!: CuiTableOptions;

  entityList: string[] = [];
  statusList: string[] = [];
  pcloseMonthEndStatusData: any[] = [];
  mcloseMonthEndStatusData: any[] = [];
  pcloseMonthEndStatusTableData: any[] = [];
  mcloseMonthEndStatusTableData: any[] = [];

  pcloseSelectedOUData: any[] = [];
  pcloseSelectedStatusData: any[] = [];
  pcloseSelectedMonthEndStatusTableData: any[] = [];

  mcloseSelectedOUData: any[] = [];
  mcloseSelectedStatusData: any[] = [];
  mcloseSelectedMonthEndStatusTableData: any[] = [];

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
    '',
    '07:00 - 08:30 PST',
    '08:30 - 09:30 PST',
    '09:30 - 14:30 PST',
    '12:30 - 14:30 PST',
    '12:30 - 14:30 PST',
    '14:30 - 15:00 PST',
  ];
  mcloseExecutionWindow: string[] = [
    '',
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
    private menuService: MenuService
  ) {
    this.http = http;
    this.destroyManager = destroyManager;

    window.onbeforeunload = function () {
      localStorage.clear();
      return '';
    };
  }

  ngOnInit(): void {
    this.getPeriodQuarterStartEndTime();
    this.getPeriodCloseInvoice();
    this.getInterfaceLoad();
    this.getQECashCollected();
    this.getPrecloseMeStatus();
    this.getComments();
    this.getCurrentTime();
    this.getEstimatedCompletionTime();
    this.roles = this.authService.getRoles();
    this.getDefaultTabIndex();

    this.menuService.updateMenuItems([
      {
        category: 'Period Close Tracking',
        items: [
          {
            label: 'Pre close',
            route: '/period-close-tracking-preclose',
            role: ['ADMIN', 'PERIOD_CLOSE'],
          },
          {
            label: 'Mid close',
            route: '/period-close-tracking-midclose',
            role: ['ADMIN', 'PERIOD_CLOSE'],
          },
        ],
      },
      {
        category: 'Invoice to Cash',
        items: [
          {
            label: 'Pre Invoicing',
            route: '/pre-invoicing',
            role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          },
          {
            label: 'Invoicing',
            route: '/invoicing',
            role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          },
          {
            label: 'Post Invoicing',
            route: '/post-invoicing',
            role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          },
          {
            label: 'eInvoicing',
            route: '/einvoicing',
            role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          },
          {
            label: 'Fusion',
            route: '/fusion',
            role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          },
        ],
      },
      {
        category: 'Revenue Accounting',
        items: [
          {
            label: 'Standard Revenue',
            route: '/standard-revenue',
            role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          },
          {
            label: 'Rol',
            route: '/rol',
            role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          },
          {
            label: 'Accruals',
            route: '/accruals',
            role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          },
          {
            label: 'Accounts',
            route: '/accounts',
            role: ['ADMIN', 'ACCOUNT_RECON'],
          },
        ],
      },
      {
        category: 'GL Posting',
        items: [
          {
            label: 'General Ledger',
            route: '/general-ledger',
            role: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          },
        ],
      },
      {
        category: 'Operations Controls',
        items: [
          {
            label: 'Invoice to Cash',
            route: '',
            role: ['ADMIN'],
          },
          {
            label: 'Revenue',
            route: '',
            role: ['ADMIN'],
          },
        ],
      },
    ]);
  }

  menuOpen = false;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
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
    {
      label: 'WD+0 Mid Close Status',
      component: 'app-wd0-dash',
      role: ['ADMIN', 'WD0'],
    },
    {
      label: 'WD+0 Mid Close Volumes',
      component: 'app-wd0-historical-data',
      role: ['ADMIN', 'MIDCLOSE_VOLUMES'],
    },
    {
      label: 'Large Deal Tracker',
      component: 'app-invoice-status',
      role: ['ADMIN', 'LARGE_DEAL'],
    },
    {
      label: 'WD0',
      component: 'wd0',
      role: ['ADMIN', 'WD0'],
    },
  ];

  selectedIndex: number = 0;
  filteredTabs: { label: string; component: string }[] = [];

  getDefaultTabIndex() {
    this.filteredTabs = this.visibleTabs.filter((tab) =>
      tab.role.some((role) => this.roles.includes(role))
    );
  }

  onTabChange(index: number) {
    this.selectedIndex = index;
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
    return column
      .replace(/_/g, '-')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  getPrecloseMeStatus() {
    this.getEndpointData('preclose-me-status').subscribe((data: any) => {
      this.pcloseMonthEndStatusTableData = [];
      this.pcloseSelectedMonthEndStatusTableData = [];
      this.pcloseOuStatusMapping = {};

      this.mcloseMonthEndStatusTableData = [];
      this.mcloseSelectedMonthEndStatusTableData = [];
      this.mcloseOuStatusMapping = {};

      // create ou category status mappings { ou -> { category -> status } }
      this.pcloseMonthEndStatusData = data.filter(
        (obj) => obj['CLOSE_TYPE'] == 'PRECLOSE'
      );
      this.mcloseMonthEndStatusData = data.filter(
        (obj) => obj['CLOSE_TYPE'] == 'MIDCLOSE'
      );

      this.statusList = [];
      this.statusList.push('All');

      // setup preclose data (pcloseOuStatusMapping)
      this.pcloseMonthEndStatusData.forEach((row) => {
        let operatingUnit = row['OPERATING_UNIT'];
        let category = row['CATEGORY'];
        let stepsCompleted = row['STEPS_COMPLETED'];
        let closeStatus = row['CLOSE_STATUS'];
        // if closeStatus is not in statusList Array, add it in
        if (this.statusList.indexOf(closeStatus) === -1) {
          this.statusList.push(closeStatus);
        }

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
        // if closeStatus is not in statusList Array, add it in
        if (this.statusList.indexOf(closeStatus) === -1) {
          this.statusList.push(closeStatus);
        }

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
        // this.meStatusColumns.push(category.replace(/_/g, ' '));
        // create new object for progress bar category mappings
        this.pCloseProgBarStatusMapping[category] = {};
        this.mCloseProgBarStatusMapping[category] = {};
      }

      // Get rows of table by building each row as an object and pushing it to array
      // Preclose
      this.entityList = [];
      this.entityList.push('All');
      for (let ou of Object.keys(this.pcloseOuStatusMapping)) {
        this.entityList.push(ou);
        this.entityList.sort((a, b) => a.localeCompare(b));
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

      if (
        !localStorage.getItem('precloseentity') &&
        this.precloseEntities.value.includes('All')
      ) {
        this.selectedEntity(['All'], 'PRECLOSE');
      }

      if (
        !localStorage.getItem('midcloseentity') &&
        this.precloseEntities.value.includes('All')
      ) {
        this.selectedEntity(['All'], 'MIDCLOSE');
      }

      if (
        !localStorage.getItem('preclosestatus') &&
        this.precloseStatuses.value.includes('All')
      ) {
        this.selectedStatus(['All'], 'PRECLOSE');
      }

      if (
        !localStorage.getItem('midclosestatus') &&
        this.precloseStatuses.value.includes('All')
      ) {
        this.selectedStatus(['All'], 'MIDCLOSE');
      }

      if (localStorage.getItem('precloseentity')) {
        const data = JSON.parse(localStorage.getItem('precloseentity'));
        this.selectedEntity(data, 'PRECLOSE');
      }

      if (localStorage.getItem('midcloseentity')) {
        const data = JSON.parse(localStorage.getItem('midcloseentity'));
        this.selectedEntity(data, 'MIDCLOSE');
      }

      if (localStorage.getItem('preclosestatus')) {
        const data = JSON.parse(localStorage.getItem('preclosestatus'));
        this.selectedStatus(data, 'PRECLOSE');
      }

      if (localStorage.getItem('midclosestatus')) {
        const data = JSON.parse(localStorage.getItem('midclosestatus'));
        this.selectedStatus(data, 'MIDCLOSE');
      }
      this.showComments = this.roles.includes('ADMIN');
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
    return column
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
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

  entityChange(closeType: string) {
    if (closeType === 'PRECLOSE') {
      this.pcloseEntityvalueSetOnload = false;
      this.precloseEntities.valueChanges.subscribe((data) => {
        if (data.length === 0) {
          this.showpreStatusFilter = false;
          this.precloseSelectedStatuses = [];
        } else {
          this.showpreStatusFilter = true;
        }
        if (data.includes('All')) {
          data = data.filter((ele) => ele === 'All');
          this.precloseAllEntitiesSelected = true;
          this.precloseEntities.patchValue(['All'], {
            emitEvent: false,
            onlySelf: true,
          });
        } else {
          this.precloseAllEntitiesSelected = false;
        }
        this.selectedEntity(data, closeType);
      });
    } else if (closeType === 'MIDCLOSE') {
      this.mcloseEntityvalueSetOnload = false;
      this.midcloseEntities.valueChanges.subscribe((data) => {
        if (data.length === 0) {
          this.showmidStatusFilter = false;
          this.midcloseSelectedStatuses = [];
        } else {
          this.showmidStatusFilter = true;
        }
        if (data.includes('All')) {
          data = data.filter((ele) => ele === 'All');
          this.midcloseAllEntitiesSelected = true;
          this.midcloseEntities.patchValue(['All'], {
            emitEvent: false,
            onlySelf: true,
          });
        } else {
          this.midcloseAllEntitiesSelected = false;
        }
        this.selectedEntity(data, closeType);
      });
    }
  }

  statusChange(closeType: string) {
    if (closeType === 'PRECLOSE') {
      this.pcloseStatusvalueSetOnload = false;
      this.precloseStatuses.valueChanges.subscribe((data) => {
        if (data.includes('All')) {
          data = data.filter((ele) => ele === 'All');
          this.precloseAllStatusSelected = true;
          this.precloseStatuses.patchValue(['All'], {
            emitEvent: false,
            onlySelf: true,
          });
        } else {
          this.precloseAllStatusSelected = false;
        }
        this.selectedStatus(data, closeType);
      });
    } else if (closeType === 'MIDCLOSE') {
      this.mcloseStatusvalueSetOnload = false;
      this.midcloseStatuses.valueChanges.subscribe((data) => {
        if (data.includes('All')) {
          data = data.filter((ele) => ele === 'All');
          this.midcloseAllStatusSelected = true;
          this.midcloseStatuses.patchValue(['All'], {
            emitEvent: false,
            onlySelf: true,
          });
        } else {
          this.midcloseAllStatusSelected = false;
        }
        this.selectedStatus(data, closeType);
      });
    }
  }

  selectedEntity(data: any, closeType: string) {
    if (closeType === 'PRECLOSE') {
      this.precloseSelectedEntities = data;
      if (this.precloseSelectedEntities.includes('All')) {
        this.precloseSelectedEntities = [];
        for (let entity of this.entityList) {
          this.precloseSelectedEntities.push(entity);
        }
      }

      if (!this.pcloseEntityvalueSetOnload) {
        localStorage.setItem(
          'precloseentity',
          JSON.stringify(this.precloseSelectedEntities)
        );
      }
    } else if (closeType === 'MIDCLOSE') {
      this.midcloseSelectedEntities = data;
      if (this.midcloseSelectedEntities.includes('All')) {
        this.midcloseSelectedEntities = [];
        for (let entity of this.entityList) {
          this.midcloseSelectedEntities.push(entity);
        }
      }

      if (!this.mcloseEntityvalueSetOnload) {
        localStorage.setItem(
          'midcloseentity',
          JSON.stringify(this.midcloseSelectedEntities)
        );
      }
    }

    // Reset and update pCloseProgBarStatusMapping
    // Get categories list and use them to reset progress bar
    if (Object.keys(this.pcloseOuStatusMapping).length !== 0) {
      // Reset pCloseProgBarStatusMapping before reupdating it with new selected entities
      let ouStatusesObj = this.pcloseOuStatusMapping['America'];
      for (let category of Object.keys(ouStatusesObj)) {
        this.pCloseProgBarStatusMapping[category]['steps'] = 0;
        this.pCloseProgBarStatusMapping[category]['total'] = 0;
        this.pCloseProgBarStatusMapping[category]['value'] = 0;

        this.mCloseProgBarStatusMapping[category]['steps'] = 0;
        this.mCloseProgBarStatusMapping[category]['total'] = 0;
        this.mCloseProgBarStatusMapping[category]['value'] = 0;
      }

      // Update pCloseProgBarStatusMapping
      // Preclose
      for (let ou of Object.keys(this.pcloseOuStatusMapping)) {
        if (this.precloseSelectedEntities.includes(ou)) {
          let ouStatusesObj = this.pcloseOuStatusMapping[ou];
          for (let category of Object.keys(ouStatusesObj)) {
            this.pCloseProgBarStatusMapping[category]['steps'] +=
              this.pcloseOuStatusMapping[ou][category]['stepsCompleted'];
            this.pCloseProgBarStatusMapping[category]['total'] += 100;
            this.pCloseProgBarStatusMapping[category]['value'] =
              (100 * this.pCloseProgBarStatusMapping[category]['steps']) /
              this.pCloseProgBarStatusMapping[category]['total'];
          }
        }
      }
      // Midclose
      for (let ou of Object.keys(this.mcloseOuStatusMapping)) {
        if (this.midcloseSelectedEntities.includes(ou)) {
          let ouStatusesObj = this.mcloseOuStatusMapping[ou];
          for (let category of Object.keys(ouStatusesObj)) {
            this.mCloseProgBarStatusMapping[category]['steps'] +=
              this.mcloseOuStatusMapping[ou][category]['stepsCompleted'];
            this.mCloseProgBarStatusMapping[category]['total'] += 100;
            this.mCloseProgBarStatusMapping[category]['value'] =
              (100 * this.mCloseProgBarStatusMapping[category]['steps']) /
              this.mCloseProgBarStatusMapping[category]['total'];
          }
        }
      }
    }

    // preclose
    this.pcloseSelectedOUData = this.pcloseMonthEndStatusTableData.filter(
      (data) => this.precloseSelectedEntities.includes(data.OPERATING_UNIT)
    );
    if (
      this.precloseSelectedEntities.length !== 0 &&
      this.precloseSelectedStatuses.length === 0
    ) {
      this.pcloseSelectedMonthEndStatusTableData = this.pcloseSelectedOUData;
    } else if (
      this.precloseSelectedStatuses.length !== 0 &&
      this.precloseSelectedEntities.length === 0
    ) {
      this.pcloseSelectedMonthEndStatusTableData =
        this.pcloseSelectedStatusData;
    } else {
      this.pcloseSelectedMonthEndStatusTableData =
        this.pcloseSelectedOUData.filter((element) =>
          this.pcloseSelectedStatusData.includes(element)
        );
    }

    // midclose
    this.mcloseSelectedOUData = this.mcloseMonthEndStatusTableData.filter(
      (data) => this.midcloseSelectedEntities.includes(data.OPERATING_UNIT)
    );
    if (
      this.midcloseSelectedEntities.length !== 0 &&
      this.midcloseSelectedStatuses.length === 0
    ) {
      this.mcloseSelectedMonthEndStatusTableData = this.mcloseSelectedOUData;
    } else if (
      this.midcloseSelectedStatuses.length !== 0 &&
      this.midcloseSelectedEntities.length === 0
    ) {
      this.mcloseSelectedMonthEndStatusTableData =
        this.mcloseSelectedStatusData;
    } else {
      this.mcloseSelectedMonthEndStatusTableData =
        this.mcloseSelectedOUData.filter((element) =>
          this.mcloseSelectedStatusData.includes(element)
        );
    }
  }

  selectedStatus(data: any, closeType: string) {
    if (closeType === 'PRECLOSE') {
      this.precloseSelectedStatuses = data;
      if (this.precloseSelectedStatuses.includes('All')) {
        this.precloseSelectedStatuses = [];
        for (let status of this.statusList) {
          this.precloseSelectedStatuses.push(status);
        }
      }

      if (!this.pcloseStatusvalueSetOnload) {
        localStorage.setItem(
          'preclosestatus',
          JSON.stringify(this.precloseSelectedStatuses)
        );
      }
    } else if (closeType === 'MIDCLOSE') {
      this.midcloseSelectedStatuses = data;
      if (this.midcloseSelectedStatuses.includes('All')) {
        this.midcloseSelectedStatuses = [];
        for (let status of this.statusList) {
          this.midcloseSelectedStatuses.push(status);
        }
      }

      if (!this.mcloseStatusvalueSetOnload) {
        localStorage.setItem(
          'midclosestatus',
          JSON.stringify(this.midcloseSelectedStatuses)
        );
      }
    }

    // preclose
    this.pcloseSelectedStatusData = this.pcloseMonthEndStatusTableData.filter(
      this.precloseSelectedStatusFilter.bind(this)
    );
    if (
      this.precloseSelectedEntities.length !== 0 &&
      this.precloseSelectedStatuses.length === 0
    ) {
      this.pcloseSelectedMonthEndStatusTableData = this.pcloseSelectedOUData;
    } else if (
      // Status selected and no statuses selected means table data is just filtered OU data
      this.precloseSelectedStatuses.length !== 0 &&
      this.precloseSelectedEntities.length === 0
    ) {
      this.pcloseSelectedMonthEndStatusTableData =
        this.pcloseSelectedStatusData;
    } else {
      this.pcloseSelectedMonthEndStatusTableData =
        this.pcloseSelectedOUData.filter((element) =>
          this.pcloseSelectedStatusData.includes(element)
        );
    }

    // midclose
    this.mcloseSelectedStatusData = this.mcloseMonthEndStatusTableData.filter(
      this.midcloseSelectedStatusFilter.bind(this)
    );
    if (
      this.midcloseSelectedEntities.length !== 0 &&
      this.midcloseSelectedStatuses.length === 0
    ) {
      this.mcloseSelectedMonthEndStatusTableData = this.mcloseSelectedOUData;
    } else if (
      this.midcloseSelectedStatuses.length !== 0 &&
      this.midcloseSelectedEntities.length === 0
    ) {
      this.mcloseSelectedMonthEndStatusTableData =
        this.mcloseSelectedStatusData;
    } else {
      this.mcloseSelectedMonthEndStatusTableData =
        this.mcloseSelectedOUData.filter((element) =>
          this.mcloseSelectedStatusData.includes(element)
        );
    }
  }

  precloseSelectedStatusFilter(data) {
    for (let category of this.meStatusCategories) {
      if (this.precloseSelectedStatuses.includes(data[category])) {
        return true;
      }
    }
    return false;
  }

  midcloseSelectedStatusFilter(data) {
    for (let category of this.meStatusCategories) {
      if (this.midcloseSelectedStatuses.includes(data[category])) {
        return true;
      }
    }
    return false;
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

  getComments() {
    this.getEndpointData('pclose-dashboard-comments').subscribe((data: any) => {
      data = data.sort(
        (a, b) =>
          new Date(b['CREATION_DATE']).getTime() -
          new Date(a['CREATION_DATE']).getTime()
      );
      data.forEach((ele) => {
        ele['CREATION_DATE'] = this.extractDatePrettify(ele['CREATION_DATE']);
      });
      this.dashComments = data;
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
}

interface commentsModel {
  CLOSE_TYPE: string;
  COMMENTS: string;
  PERIOD_NAME: string;
  CREATION_DATE: Date;
}
