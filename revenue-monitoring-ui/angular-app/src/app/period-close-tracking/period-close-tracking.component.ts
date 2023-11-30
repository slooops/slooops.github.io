import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ApiHttpService } from '../providers/http.service';
import {
  CuiTableColumnOption,
  CuiTableOptions,
} from '@cisco-ngx/cui-components';
import { DatePipe } from '@angular/common';
import { switchMap, startWith } from 'rxjs/operators';
import { Observable, interval } from 'rxjs';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-period-close-tracking',
  templateUrl: './period-close-tracking.component.html',
  styleUrls: ['./period-close-tracking.component.css'],
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

  pcloseInvGenTableOptions!: CuiTableOptions;
  mcloseInvGenTableOptions!: CuiTableOptions;

  preCloseProgramTableData: any[] = [];
  midCloseProgramTableData: any[] = [];

  interfaceLoadHeaders: any[] = [];
  precloseInterfaceLoadData: any[] = [];
  midcloseInterfaceLoadData: any[] = [];
  precloseInterfaceLoadTableData: any[] = [];
  midcloseInterfaceLoadTableData: any[] = [];

  qeCashCollectedData: any[] = [];
  qeCashCollectedTableOptions!: CuiTableOptions;

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

  constructor(http: ApiHttpService) {
    this.http = http;

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

  getQECashCollected() {
    this.getEndpointData('pclose-qe-cash-collected').subscribe((data: any) => {
      // Rows
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

      // Columns
      let tableColumns: CuiTableColumnOption[] = [];

      for (let column_name of Object.keys(data[0])) {
        tableColumns.push(
          new CuiTableColumnOption({
            name: column_name.replace(/_/g, '-'),
            sortable: false,
            key: column_name,
          })
        );
      }

      this.qeCashCollectedTableOptions = new CuiTableOptions({
        bordered: true,
        // striped: true,
        // fixed: true,
        columns: tableColumns,
        dynamicData: true,
      });
    });
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
    });
  }

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
        // array.filter(obj => obj.category === category);
        this.preCloseProgramTableData = data.filter(
          (obj) => obj['CLOSE_TYPE'] == 'PRECLOSE'
        );
        this.midCloseProgramTableData = data.filter(
          (obj) => obj['CLOSE_TYPE'] == 'MIDCLOSE'
        );
        let programColumns: CuiTableColumnOption[] = [];
        let precloseProgramColumns: CuiTableColumnOption[] = [];
        let midcloseProgramColumns: CuiTableColumnOption[] = [];

        for (let column of Object.keys(data[0])) {
          if (column !== 'CLOSE_TYPE') {
            programColumns.push(
              new CuiTableColumnOption({
                name: column.replace(/_/g, ' '),
                sortable: false,
                key: column,
              })
            );
          }
        }

        precloseProgramColumns = programColumns;
        midcloseProgramColumns = programColumns;

        if (!this.isQuarterEnd) {
          precloseProgramColumns = programColumns.filter(
            (ele) => ele.name !== 'QUARTER'
          );
          midcloseProgramColumns = programColumns.filter(
            (ele) => ele.name !== 'QUARTER'
          );
        }

        this.pcloseInvGenTableOptions = new CuiTableOptions({
          bordered: true,
          // striped: true,
          // fixed: true,
          columns: precloseProgramColumns,
          dynamicData: true,
        });
        this.mcloseInvGenTableOptions = new CuiTableOptions({
          bordered: true,
          // striped: true,
          // fixed: true,
          columns: midcloseProgramColumns,
          dynamicData: true,
        });
      }
    );
  }

  getInterfaceLoad() {
    this.getEndpointData('period-close-interface-load').subscribe(
      (data: any) => {
        this.precloseInterfaceLoadData = data.filter(
          (obj) => obj['CLOSE_TYPE'] == 'PRECLOSE'
        );
        this.midcloseInterfaceLoadData = data.filter(
          (obj) => obj['CLOSE_TYPE'] == 'MIDCLOSE'
        );

        this.precloseInterfaceLoadTableData = [];
        this.midcloseInterfaceLoadTableData = [];

        this.pcloseInterfaceLoadColumns = [];
        this.pcloseInterfaceLoadColumns.push('LINE TYPE');

        this.mcloseInterfaceLoadColumns = [];
        this.mcloseInterfaceLoadColumns.push('LINE TYPE');

        const emptyArray: number[] = [];

        let preclose_prod_row = {};
        let preclose_service_row = {};
        let midclose_prod_row = {};
        let midclose_service_row = {};

        preclose_prod_row['LINE_TYPE'] = 'PROD';
        preclose_service_row['LINE_TYPE'] = 'SERVICE';
        midclose_prod_row['LINE_TYPE'] = 'PROD';
        midclose_service_row['LINE_TYPE'] = 'SERVICE';

        // let preclose_prod_array: any[] = ['PROD'];
        // let preclose_service_array: any[] = ['SERVICE'];
        // let midclose_prod_array: any[] = ['PROD'];
        // let midclose_service_array: any[] = ['SERVICE'];

        let fiscalType = '';
        if (this.isQuarterEnd) {
          fiscalType = 'QUARTER';
        } else {
          fiscalType = 'PERIOD_NAME';
        }

        // preclose
        this.precloseInterfaceLoadData.forEach((row) => {
          if (
            !this.pcloseInterfaceLoadColumns.includes(row[fiscalType]) &&
            row[fiscalType] !== undefined
          ) {
            this.pcloseInterfaceLoadColumns.push(row[fiscalType]);
          }
          if (row['LINE_TYPE'] === 'PRODUCT') {
            preclose_prod_row[row[fiscalType]] =
              row['LINE_COUNT'].toLocaleString('en-US');
            if (row['MOM_PERCENTAGE'] != null && !this.isQuarterEnd) {
              this.pcloseInterfaceLoadColumns.push('MONTH OVER MONTH');
              preclose_prod_row['MONTH OVER MONTH'] =
                row['MOM_PERCENTAGE'].toFixed(0) + '%';
            }
            if (row['PQM_PERCENTAGE'] != null && !this.isQuarterEnd) {
              this.pcloseInterfaceLoadColumns.push('PRIOR QUARTER MONTH');
              preclose_prod_row['PRIOR QUARTER MONTH'] =
                row['PQM_PERCENTAGE'].toFixed(0) + '%';
            }
            if (row['QOQ_PERCENTAGE'] != null && this.isQuarterEnd) {
              this.pcloseInterfaceLoadColumns.push('QUARTER OVER QUARTER');
              preclose_prod_row['QUARTER OVER QUARTER'] =
                row['QOQ_PERCENTAGE'].toFixed(0) + '%';
            }
            if (row['YOY_PERCENTAGE'] != null && this.isQuarterEnd) {
              this.pcloseInterfaceLoadColumns.push('YEAR OVER YEAR');
              preclose_prod_row['YEAR OVER YEAR'] =
                row['YOY_PERCENTAGE'].toFixed(0) + '%';
            }
          } else if (row['LINE_TYPE'] === 'SERVICE') {
            preclose_service_row[row[fiscalType]] =
              row['LINE_COUNT'].toLocaleString('en-US');
            if (row['MOM_PERCENTAGE'] != null && !this.isQuarterEnd) {
              preclose_service_row['MONTH OVER MONTH'] =
                row['MOM_PERCENTAGE'].toFixed(0) + '%';
            }
            if (row['PQM_PERCENTAGE'] != null && !this.isQuarterEnd) {
              preclose_service_row['PRIOR QUARTER MONTH'] =
                row['PQM_PERCENTAGE'].toFixed(0) + '%';
            }
            if (row['QOQ_PERCENTAGE'] != null && this.isQuarterEnd) {
              preclose_service_row['QUARTER OVER QUARTER'] =
                row['QOQ_PERCENTAGE'].toFixed(0) + '%';
            }
            if (row['YOY_PERCENTAGE'] != null && this.isQuarterEnd) {
              preclose_service_row['YEAR OVER YEAR'] =
                row['YOY_PERCENTAGE'].toFixed(0) + '%';
            }
          }
        });
        this.precloseInterfaceLoadTableData.push(preclose_prod_row);
        this.precloseInterfaceLoadTableData.push(preclose_service_row);

        // midclose
        this.midcloseInterfaceLoadData.forEach((row) => {
          if (
            !this.mcloseInterfaceLoadColumns.includes(row[fiscalType]) &&
            row[fiscalType] !== undefined
          ) {
            this.mcloseInterfaceLoadColumns.push(row[fiscalType]);
          }
          if (row['LINE_TYPE'] === 'PRODUCT') {
            midclose_prod_row[row[fiscalType]] =
              row['LINE_COUNT'].toLocaleString('en-US');
            if (row['MOM_PERCENTAGE'] != null && !this.isQuarterEnd) {
              this.mcloseInterfaceLoadColumns.push('MONTH OVER MONTH');
              midclose_prod_row['MONTH OVER MONTH'] =
                row['MOM_PERCENTAGE'].toFixed(0) + '%';
            }
            if (row['PQM_PERCENTAGE'] != null && !this.isQuarterEnd) {
              this.mcloseInterfaceLoadColumns.push('PRIOR QUARTER MONTH');
              midclose_prod_row['PRIOR QUARTER MONTH'] =
                row['PQM_PERCENTAGE'].toFixed(0) + '%';
            }
            if (row['QOQ_PERCENTAGE'] != null && this.isQuarterEnd) {
              this.mcloseInterfaceLoadColumns.push('QUARTER OVER QUARTER');
              midclose_prod_row['QUARTER OVER QUARTER'] =
                row['QOQ_PERCENTAGE'].toFixed(0) + '%';
            }
            if (row['YOY_PERCENTAGE'] != null && this.isQuarterEnd) {
              this.mcloseInterfaceLoadColumns.push('YEAR OVER YEAR');
              midclose_prod_row['YEAR OVER YEAR'] =
                row['YOY_PERCENTAGE'].toFixed(0) + '%';
            }
          } else if (row['LINE_TYPE'] === 'SERVICE') {
            midclose_service_row[row[fiscalType]] =
              row['LINE_COUNT'].toLocaleString('en-US');
            if (row['MOM_PERCENTAGE'] != null && !this.isQuarterEnd) {
              midclose_service_row['MONTH OVER MONTH'] =
                row['MOM_PERCENTAGE'].toFixed(0) + '%';
            }
            if (row['PQM_PERCENTAGE'] != null && !this.isQuarterEnd) {
              midclose_service_row['PRIOR QUARTER MONTH'] =
                row['PQM_PERCENTAGE'].toFixed(0) + '%';
            }
            if (row['QOQ_PERCENTAGE'] != null && this.isQuarterEnd) {
              midclose_service_row['QUARTER OVER QUARTER'] =
                row['QOQ_PERCENTAGE'].toFixed(0) + '%';
            }
            if (row['YOY_PERCENTAGE'] != null && this.isQuarterEnd) {
              midclose_service_row['YEAR OVER YEAR'] =
                row['YOY_PERCENTAGE'].toFixed(0) + '%';
            }
          }
        });
        this.midcloseInterfaceLoadTableData.push(midclose_prod_row);
        this.midcloseInterfaceLoadTableData.push(midclose_service_row);

        let interfaceSet = new Set<string>();
        for (let value of data.values()) {
          Object.keys(value).forEach((key) => {
            if (key === 'QUARTER') {
              interfaceSet.add(value[key]);
            }
          });
        }
        this.dynamicInterfaceLoadColumns.push(...interfaceSet.values());
        // this.setInterfaceLoadColumns();
      }
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
      switchMap(() => this.http.get(cacheBustingUrl))
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
