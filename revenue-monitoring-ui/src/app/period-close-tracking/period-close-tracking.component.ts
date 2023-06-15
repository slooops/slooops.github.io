import {
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { ApiHttpService } from '../providers/http.service';
import {
  CuiTableColumnOption,
  CuiTableOptions
} from '@cisco-ngx/cui-components';
import { map } from 'rxjs';
import { DatePipe } from '@angular/common';
import { MatSelect } from '@angular/material/select';
import { TimeagoClock } from 'ngx-timeago';
import { switchMap, startWith } from 'rxjs/operators';
import { Observable, interval, Subscription } from 'rxjs';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-period-close-tracking',
  templateUrl: './period-close-tracking.component.html',
  styleUrls: ['./period-close-tracking.component.css']
})
export class PeriodCloseTrackingComponent implements OnInit {
  refreshInterval = 120000; //ms
  counter = 0;
  setTime: any = 0;
  updateAgo: any;
  now: any;
  timeFlag: boolean = false;
  startTimeEdit = false;
  closeTimeEdit = false;
  editComments = false;

  templateObject = Object;
  datePipe: DatePipe = new DatePipe('en-US');
  selectedEntities: string[] = [];
  selectedStatuses: string[] = [];
  entityListHardCoded: string[] = [
    'All',
    'America',
    'Australia',
    'Brazil',
    'BROADSOFT',
    'Canada',
    'China',
    'China Panyu',
    'Germany',
    'India',
    'Italy',
    'Japan',
    'Mexico',
    'Netherlands',
    'Russia',
    'South Africa',
    'South Korea',
    'United Kingdom'
  ];

  statuses = new FormControl('');
  defaultSelectedEntities: string[] = localStorage.getItem('selectentity')
    ? JSON.parse(localStorage.getItem('selectentity')).includes('All')
      ? ['All']
      : JSON.parse(localStorage.getItem('selectentity'))
    : ['All'];

  allEntitiesSelected: boolean = localStorage.getItem('selectentity')
    ? JSON.parse(localStorage.getItem('selectentity')).includes('All')
      ? true
      : false
    : true;
  valueSetOnload: boolean = true;
  subscription: Subscription;

  entities = new FormControl(this.defaultSelectedEntities);

  preCloseStartTime: String;
  preCloseEndTime: String;
  midCloseStartTime: String;
  midCloseEndTime: String;
  productVolume: Number;
  serviceVolume: Number;

  // expectedCloseTime = "25-MAR-2023 02:30:00 PM PST";
  dashComments: commentsModel[];

  programTableOptions!: CuiTableOptions;
  preCloseProgramTableData: any[] = [];
  midCloseProgramTableData: any[] = [];

  interfaceLoadHeaders: any[] = [];
  precloseInterfaceLoadData: any[] = [];
  midcloseInterfaceLoadData: any[] = [];
  precloseInterfaceLoadTableData: any[] = [];
  midcloseInterfaceLoadTableData: any[] = [];
  pclose_last_period = 'MAY-23'; // hardcoded for now
  mclose_last_period = 'APR-23'; // hardcoded for now

  qeCashCollectedData: any[] = [];
  qeCashCollectedTableOptions!: CuiTableOptions;

  entityList: string[] = [];
  statusList: string[] = [];
  entitySelected: boolean = false;
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
    'AR INTERFACE',
    'INVOICING',
    'ACCOUNTING',
    'INTERCOMPANY',
    'NGCCRM',
    'GL POSTING'
  ];
  meStatusDesiredOrder: string[] = [
    'OPERATING_UNIT',
    'AR_INTERFACE',
    'INVOICING',
    'ACCOUNTING',
    'INTERCOMPANY',
    'NGCCRM',
    'GL_POSTING'
  ];
  meStatusCategories: string[] = [
    'AR_INTERFACE',
    'INVOICING',
    'ACCOUNTING',
    'INTERCOMPANY',
    'NGCCRM',
    'GL_POSTING'
  ];

  pcloseExecutionWindow: string[] = [
    '',
    '0800-1200 PST',
    '0800-1200 PST',
    '0800-1200 PST',
    '0800-1200 PST',
    '0800-1200 PST',
    '0800-1200 PST'
  ];
  mcloseExecutionWindow: string[] = [
    '',
    '0800-1200 PST',
    '0800-1200 PST',
    '0800-1200 PST',
    '0800-1200 PST',
    '0800-1200 PST',
    '0800-1200 PST'
  ];

  pCloseProgBarStatusMapping: any = {};
  mCloseProgBarStatusMapping: any = {};
  pcloseOuStatusMapping: any = {};
  mcloseOuStatusMapping: any = {};

  preclosePeriod: String = '';
  midclosePeriod: String = '';
  precloseQuarter: String = '';
  midcloseQuarter: String = '';

  dynamicInterfaceLoadColumns: string[] = [];
  pcloseInterfaceLoadColumns: string[] = [];
  mcloseInterfaceLoadColumns: string[] = [];

  protected http: ApiHttpService;

  constructor(http: ApiHttpService) {
    this.http = http;

    window.onbeforeunload = function() {
      localStorage.clear();
      return '';
    };
  }

  ngOnInit(): void {
    this.getPeriodCloseInvoice();
    this.getInterfaceLoad();
    this.getPeriodQuarterStartEndTime();
    this.getPrecloseVolume();
    this.getQECashCollected();
    this.getPrecloseMeStatus();
    this.getComments();
    this.selectedStatus();

    sessionStorage.setItem('refreshedTime', new Date().getTime().toString());

    this.updatedAgo();
    this.subscription = interval(20000).subscribe(() => this.updatedAgo());
    // this.setRefreshTime();
  }

  extractDatePrettify(date: string) {
    let dateParts = date.split('T')[0].split('-');
    let year = dateParts[0];
    let month = dateParts[1];
    let day = dateParts[2];

    let timeParts = date.split('T')[1].split('.');
    let time = timeParts[0];

    let prettyDate = `${month}/${day}/${year} ${time} PST`;
    return prettyDate;
  }

  getPeriodQuarterStartEndTime() {
    this.getEndpointData('preclose-start-end-time').subscribe((data: any) => {
      data.forEach(row => {
        if (row['CLOSE_TYPE'] == 'PRECLOSE') {
          this.preclosePeriod = row['PERIOD_NAME'];
          this.precloseQuarter = row['QUARTER'];
          this.preCloseStartTime = this.extractDatePrettify(
            row['CLOSE_START_TIME']
          );
          this.preCloseEndTime = this.extractDatePrettify(
            row['CLOSE_END_TIME']
          );
        } else if (row['CLOSE_TYPE'] == 'MIDCLOSE') {
          this.midclosePeriod = row['PERIOD_NAME'];
          this.midcloseQuarter = row['QUARTER'];
          this.midCloseStartTime = this.extractDatePrettify(
            row['CLOSE_START_TIME']
          );
          this.midCloseEndTime = this.extractDatePrettify(
            row['CLOSE_END_TIME']
          );
        }
      });
    });
  }

  getPrecloseVolume() {
    this.getEndpointData('preclose-volume').subscribe((data: any) => {
      this.productVolume = data[0]['LINE_COUNT'].toLocaleString('en-US');
      this.serviceVolume = data[1]['LINE_COUNT'].toLocaleString('en-US');
    });
  }

  getQECashCollected() {
    this.getEndpointData('pclose-qe-cash-collected').subscribe((data: any) => {
      // Rows
      data.map(cashData => {
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

      console.log('qeCashCollectedData', this.qeCashCollectedData);

      // Columns
      let tableColumns: CuiTableColumnOption[] = [];

      for (let column_name of Object.keys(data[0])) {
        tableColumns.push(
          new CuiTableColumnOption({
            name: column_name.replace(/_/g, '-'),
            sortable: false,
            key: column_name
          })
        );
      }

      this.qeCashCollectedTableOptions = new CuiTableOptions({
        bordered: true,
        // striped: true,
        // fixed: true,
        columns: tableColumns,
        dynamicData: true
      });
    });
  }

  getPrecloseMeStatus() {
    this.getEndpointData('preclose-me-status').subscribe((data: any) => {
      this.pcloseMonthEndStatusTableData = [];
      this.pcloseSelectedMonthEndStatusTableData = [];

      this.mcloseMonthEndStatusTableData = [];
      this.mcloseSelectedMonthEndStatusTableData = [];
      // create ou category status mappings { ou -> { category -> status } }
      this.pcloseMonthEndStatusData = data.filter(
        obj => obj['CLOSE_TYPE'] == 'PRECLOSE'
      );
      this.mcloseMonthEndStatusData = data.filter(
        obj => obj['CLOSE_TYPE'] == 'MIDCLOSE'
      );

      this.statusList = [];
      this.statusList.push('All');

      // setup preclose data (pcloseOuStatusMapping)
      this.pcloseMonthEndStatusData.forEach(row => {
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
          this.pcloseOuStatusMapping[operatingUnit][category][
            'closeStatus'
          ] = closeStatus;
          this.pcloseOuStatusMapping[operatingUnit][category][
            'stepsCompleted'
          ] = stepsCompleted;
        } else if (!(category in this.pcloseOuStatusMapping[operatingUnit])) {
          this.pcloseOuStatusMapping[operatingUnit][category] = {};
          this.pcloseOuStatusMapping[operatingUnit][category][
            'closeStatus'
          ] = closeStatus;
          this.pcloseOuStatusMapping[operatingUnit][category][
            'stepsCompleted'
          ] = stepsCompleted;
        }
      });

      // setup midclose data (mcloseOuStatusMapping)
      this.mcloseMonthEndStatusData.forEach(row => {
        let operatingUnit = row['OPERATING_UNIT'];
        let category = row['CATEGORY'];
        let closeStatus = row['CLOSE_STATUS'];
        let stepsCompleted = row['STEPS_COMPLETED'];
        if (!(operatingUnit in this.mcloseOuStatusMapping)) {
          this.mcloseOuStatusMapping[operatingUnit] = {};
          this.mcloseOuStatusMapping[operatingUnit][category] = {};
          this.mcloseOuStatusMapping[operatingUnit][category][
            'closeStatus'
          ] = closeStatus;
          this.mcloseOuStatusMapping[operatingUnit][category][
            'stepsCompleted'
          ] = stepsCompleted;
        } else if (!(category in this.mcloseOuStatusMapping[operatingUnit])) {
          this.mcloseOuStatusMapping[operatingUnit][category] = {};
          this.mcloseOuStatusMapping[operatingUnit][category][
            'closeStatus'
          ] = closeStatus;
          this.mcloseOuStatusMapping[operatingUnit][category][
            'stepsCompleted'
          ] = stepsCompleted;
        }
      });

      // Get column names
      // this.meStatusColumns.push('OPERATING UNIT');

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
          tableRowObj[category] = this.pcloseOuStatusMapping[ou][category][
            'closeStatus'
          ];
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
          tableRowObj[category] = this.mcloseOuStatusMapping[ou][category][
            'closeStatus'
          ];
        }
        this.mcloseMonthEndStatusTableData.push(tableRowObj);
      }

      if (
        !localStorage.getItem('selectentity') &&
        this.entities.value.includes('All')
      ) {
        this.selectedEntity(['All']);
      }

      if (localStorage.getItem('selectentity')) {
        const data = JSON.parse(localStorage.getItem('selectentity'));
        this.selectedEntity(data);
      }
    });
  }

  getPeriodCloseInvoice() {
    this.getEndpointData('period-close-invoice-stats').subscribe(
      (data: any) => {
        data.map(invData => {
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
          obj => obj['CLOSE_TYPE'] == 'PRECLOSE'
        );
        this.midCloseProgramTableData = data.filter(
          obj => obj['CLOSE_TYPE'] == 'MIDCLOSE'
        );
        let programColumns: CuiTableColumnOption[] = [];

        console.log('midCloseProgramTableData', this.midCloseProgramTableData);

        for (let column of Object.keys(data[0])) {
          if (column !== 'CLOSE_TYPE') {
            programColumns.push(
              new CuiTableColumnOption({
                name: column.replace(/_/g, ' '),
                sortable: false,
                key: column
              })
            );
          }
        }

        this.programTableOptions = new CuiTableOptions({
          bordered: true,
          // striped: true,
          // fixed: true,
          columns: programColumns,
          dynamicData: true
        });
      }
    );
  }

  getInterfaceLoad() {
    this.getEndpointData('period-close-interface-load').subscribe(
      (data: any) => {
        this.precloseInterfaceLoadData = data.filter(
          obj => obj['CLOSE_TYPE'] == 'PRECLOSE'
        );
        this.midcloseInterfaceLoadData = data.filter(
          obj => obj['CLOSE_TYPE'] == 'MIDCLOSE'
        );

        this.precloseInterfaceLoadTableData = [];
        this.midcloseInterfaceLoadTableData = [];

        this.pcloseInterfaceLoadColumns = [];
        this.pcloseInterfaceLoadColumns.push('Line Type');

        this.mcloseInterfaceLoadColumns = [];
        this.mcloseInterfaceLoadColumns.push('Line Type');

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

        // preclose
        this.precloseInterfaceLoadData.forEach(row => {
          if (
            !this.pcloseInterfaceLoadColumns.includes(row['PERIOD_NAME']) &&
            row['PERIOD_NAME'] !== undefined
          ) {
            this.pcloseInterfaceLoadColumns.push(row['PERIOD_NAME']);
          }
          if (row['LINE_TYPE'] === 'PRODUCT') {
            preclose_prod_row[row['PERIOD_NAME']] = row[
              'LINE_COUNT'
            ].toLocaleString('en-US');
            if (
              row['MOM_PERCENTAGE'] != null &&
              row['PERIOD_NAME'] === this.pclose_last_period
            ) {
              this.pcloseInterfaceLoadColumns.push(
                'Month Over Month Percentage'
              );
              preclose_prod_row['Month Over Month Percentage'] =
                row['MOM_PERCENTAGE'].toFixed(0) + '%';
            }
            if (
              row['PQM_PERCENTAGE'] != null &&
              row['PERIOD_NAME'] === this.pclose_last_period
            ) {
              this.pcloseInterfaceLoadColumns.push(
                'Prior Quarter Month Percentage'
              );
              preclose_prod_row['Prior Quarter Month Percentage'] =
                row['PQM_PERCENTAGE'].toFixed(0) + '%';
            }
            if (
              row['QOQ_PERCENTAGE'] != null &&
              row['PERIOD_NAME'] === this.pclose_last_period
            ) {
              this.pcloseInterfaceLoadColumns.push(
                'Quarter Over Quarter Percentage'
              );
              preclose_prod_row['Quarter Over Quarter Percentage'] =
                row['QOQ_PERCENTAGE'].toFixed(0) + '%';
            }
            if (
              row['YOY_PERCENTAGE'] != null &&
              row['PERIOD_NAME'] === this.pclose_last_period
            ) {
              this.pcloseInterfaceLoadColumns.push('Year over Year Percentage');
              preclose_prod_row['Year over Year Percentage'] =
                row['YOY_PERCENTAGE'].toFixed(0) + '%';
            }
          } else if (row['LINE_TYPE'] === 'SERVICE') {
            preclose_service_row[row['PERIOD_NAME']] = row[
              'LINE_COUNT'
            ].toLocaleString('en-US');
            if (
              row['MOM_PERCENTAGE'] != null &&
              row['PERIOD_NAME'] === this.pclose_last_period
            ) {
              preclose_service_row['Month Over Month Percentage'] =
                row['MOM_PERCENTAGE'].toFixed(0) + '%';
            }
            if (
              row['PQM_PERCENTAGE'] != null &&
              row['PERIOD_NAME'] === this.pclose_last_period
            ) {
              preclose_service_row['Prior Quarter Month Percentage'] =
                row['PQM_PERCENTAGE'].toFixed(0) + '%';
            }
            if (
              row['QOQ_PERCENTAGE'] != null &&
              row['PERIOD_NAME'] === this.pclose_last_period
            ) {
              preclose_service_row['Quarter Over Quarter Percentage'] =
                row['QOQ_PERCENTAGE'].toFixed(0) + '%';
            }
            if (
              row['YOY_PERCENTAGE'] != null &&
              row['PERIOD_NAME'] === this.pclose_last_period
            ) {
              preclose_service_row['Year over Year Percentage'] =
                row['YOY_PERCENTAGE'].toFixed(0) + '%';
            }
          }
        });
        this.precloseInterfaceLoadTableData.push(preclose_prod_row);
        this.precloseInterfaceLoadTableData.push(preclose_service_row);

        // midclose
        this.midcloseInterfaceLoadData.forEach(row => {
          if (
            !this.mcloseInterfaceLoadColumns.includes(row['PERIOD_NAME']) &&
            row['PERIOD_NAME'] !== undefined
          ) {
            this.mcloseInterfaceLoadColumns.push(row['PERIOD_NAME']);
          }
          if (row['LINE_TYPE'] === 'PRODUCT') {
            midclose_prod_row[row['PERIOD_NAME']] = row[
              'LINE_COUNT'
            ].toLocaleString('en-US');
            if (
              row['MOM_PERCENTAGE'] != null &&
              row['PERIOD_NAME'] === this.mclose_last_period
            ) {
              this.mcloseInterfaceLoadColumns.push(
                'Month Over Month Percentage'
              );
              midclose_prod_row['Month Over Month Percentage'] =
                row['MOM_PERCENTAGE'].toFixed(0) + '%';
            }
            if (
              row['PQM_PERCENTAGE'] != null &&
              row['PERIOD_NAME'] === this.mclose_last_period
            ) {
              this.mcloseInterfaceLoadColumns.push(
                'Prior Quarter Month Percentage'
              );
              midclose_prod_row['Prior Quarter Month Percentage'] =
                row['PQM_PERCENTAGE'].toFixed(0) + '%';
            }
            if (
              row['QOQ_PERCENTAGE'] != null &&
              row['PERIOD_NAME'] === this.mclose_last_period
            ) {
              this.mcloseInterfaceLoadColumns.push(
                'Quarter Over Quarter Percentage'
              );
              midclose_prod_row['Quarter Over Quarter Percentage'] =
                row['QOQ_PERCENTAGE'].toFixed(0) + '%';
            }
            if (
              row['YOY_PERCENTAGE'] != null &&
              row['PERIOD_NAME'] === this.mclose_last_period
            ) {
              this.mcloseInterfaceLoadColumns.push('Year over Year Percentage');
              midclose_prod_row['Year over Year Percentage'] =
                row['YOY_PERCENTAGE'].toFixed(0) + '%';
            }
          } else if (row['LINE_TYPE'] === 'SERVICE') {
            midclose_service_row[row['PERIOD_NAME']] = row[
              'LINE_COUNT'
            ].toLocaleString('en-US');
            if (
              row['MOM_PERCENTAGE'] != null &&
              row['PERIOD_NAME'] === this.mclose_last_period
            ) {
              midclose_service_row['Month Over Month Percentage'] =
                row['MOM_PERCENTAGE'].toFixed(0) + '%';
            }
            if (
              row['PQM_PERCENTAGE'] != null &&
              row['PERIOD_NAME'] === this.mclose_last_period
            ) {
              midclose_service_row['Prior Quarter Month Percentage'] =
                row['PQM_PERCENTAGE'].toFixed(0) + '%';
            }
            if (
              row['QOQ_PERCENTAGE'] != null &&
              row['PERIOD_NAME'] === this.mclose_last_period
            ) {
              midclose_service_row['Quarter Over Quarter Percentage'] =
                row['QOQ_PERCENTAGE'].toFixed(0) + '%';
            }
            if (
              row['YOY_PERCENTAGE'] != null &&
              row['PERIOD_NAME'] === this.mclose_last_period
            ) {
              midclose_service_row['Year over Year Percentage'] =
                row['YOY_PERCENTAGE'].toFixed(0) + '%';
            }
          }
        });
        this.midcloseInterfaceLoadTableData.push(midclose_prod_row);
        this.midcloseInterfaceLoadTableData.push(midclose_service_row);

        console.log(
          'midcloseInterfaceLoadTableData: ',
          this.midcloseInterfaceLoadTableData
        );

        let interfaceSet = new Set<string>();
        for (let value of data.values()) {
          Object.keys(value).forEach(key => {
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

  entityChange() {
    this.valueSetOnload = false;
    this.entities.valueChanges.subscribe(data => {
      if (data.includes('All')) {
        data = data.filter(ele => ele === 'All');
        this.allEntitiesSelected = true;
        this.entities.patchValue(['All'], { emitEvent: false, onlySelf: true });
      } else {
        this.allEntitiesSelected = false;
      }
      this.selectedEntity(data);
    });
  }

  selectedEntity(data) {
    this.selectedEntities = data;
    if (this.selectedEntities.includes('All')) {
      this.selectedEntities = [];
      for (let entity of this.entityList) {
        this.selectedEntities.push(entity);
      }
    }

    if (!this.valueSetOnload) {
      localStorage.setItem(
        'selectentity',
        JSON.stringify(this.selectedEntities)
      );
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
        if (this.selectedEntities.includes(ou)) {
          let ouStatusesObj = this.pcloseOuStatusMapping[ou];
          for (let category of Object.keys(ouStatusesObj)) {
            this.pCloseProgBarStatusMapping[category][
              'steps'
            ] += this.pcloseOuStatusMapping[ou][category]['stepsCompleted'];
            this.pCloseProgBarStatusMapping[category]['total'] += 100;
            this.pCloseProgBarStatusMapping[category]['value'] =
              (100 * this.pCloseProgBarStatusMapping[category]['steps']) /
              this.pCloseProgBarStatusMapping[category]['total'];
          }
        }
      }
      // Midclose
      for (let ou of Object.keys(this.mcloseOuStatusMapping)) {
        if (this.selectedEntities.includes(ou)) {
          let ouStatusesObj = this.mcloseOuStatusMapping[ou];
          for (let category of Object.keys(ouStatusesObj)) {
            this.mCloseProgBarStatusMapping[category][
              'steps'
            ] += this.mcloseOuStatusMapping[ou][category]['stepsCompleted'];
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
      data => this.selectedEntities.includes(data.OPERATING_UNIT)
    );
    if (
      this.selectedEntities.length !== 0 &&
      this.selectedStatuses.length === 0
    ) {
      this.pcloseSelectedMonthEndStatusTableData = this.pcloseSelectedOUData;
    } else if (
      this.selectedStatus.length !== 0 &&
      this.selectedEntities.length === 0
    ) {
      this.pcloseSelectedMonthEndStatusTableData = this.pcloseSelectedStatusData;
    } else {
      this.pcloseSelectedMonthEndStatusTableData = this.pcloseSelectedOUData.filter(
        element => this.pcloseSelectedStatusData.includes(element)
      );
    }

    // midclose
    this.mcloseSelectedOUData = this.mcloseMonthEndStatusTableData.filter(
      data => this.selectedEntities.includes(data.OPERATING_UNIT)
    );
    if (
      this.selectedEntities.length !== 0 &&
      this.selectedStatuses.length === 0
    ) {
      this.mcloseSelectedMonthEndStatusTableData = this.mcloseSelectedOUData;
    } else if (
      this.selectedStatus.length !== 0 &&
      this.selectedEntities.length === 0
    ) {
      this.mcloseSelectedMonthEndStatusTableData = this.mcloseSelectedStatusData;
    } else {
      this.mcloseSelectedMonthEndStatusTableData = this.mcloseSelectedOUData.filter(
        element => this.mcloseSelectedStatusData.includes(element)
      );
    }

    console.log(
      'mcloseSelectedMonthEndStatusTableData',
      this.mcloseSelectedMonthEndStatusTableData
    );
  }

  meStatusTableFiltering(
    selectedOUData,
    selectedStatusData,
    selectedMonthEndStatusTableData
  ) {}

  selectedStatus() {
    if (this.selectedStatuses.includes('All')) {
      for (let status of this.statusList) {
        this.selectedStatuses.push(status);
      }
    }

    // preclose
    this.pcloseSelectedStatusData = this.pcloseMonthEndStatusTableData.filter(
      this.selectedStatusFilter.bind(this)
    );
    if (
      this.selectedEntities.length !== 0 &&
      this.selectedStatuses.length === 0
    ) {
      this.pcloseSelectedMonthEndStatusTableData = this.pcloseSelectedOUData;
    } else if (
      // Status selected and no statuses selected means table data is just filtered OU data
      this.selectedStatus.length !== 0 &&
      this.selectedEntities.length === 0
    ) {
      this.pcloseSelectedMonthEndStatusTableData = this.pcloseSelectedStatusData;
    } else {
      this.pcloseSelectedMonthEndStatusTableData = this.pcloseSelectedOUData.filter(
        element => this.pcloseSelectedStatusData.includes(element)
      );
    }

    // midclose
    this.mcloseSelectedStatusData = this.mcloseMonthEndStatusTableData.filter(
      this.selectedStatusFilter.bind(this)
    );
    if (
      this.selectedEntities.length !== 0 &&
      this.selectedStatuses.length === 0
    ) {
      this.mcloseSelectedMonthEndStatusTableData = this.mcloseSelectedOUData;
    } else if (
      this.selectedStatus.length !== 0 &&
      this.selectedEntities.length === 0
    ) {
      this.mcloseSelectedMonthEndStatusTableData = this.mcloseSelectedStatusData;
    } else {
      this.mcloseSelectedMonthEndStatusTableData = this.mcloseSelectedOUData.filter(
        element => this.mcloseSelectedStatusData.includes(element)
      );
    }
  }

  selectedStatusFilter(data) {
    for (let category of this.meStatusCategories) {
      if (this.selectedStatuses.includes(data[category])) {
        return true;
      }
    }
    return false;
  }

  getCircleColor(category: string, data: any[]): string {
    const hasStoppedItem = data.some(
      row => row[category] && row[category].toLowerCase() === 'stopped'
    );
    if (hasStoppedItem) {
      return '#FF0000'; // Red for stopped
    }

    const hasDelayedItem = data.some(
      row => row[category] && row[category].toLowerCase() === 'delayed'
    );
    if (hasDelayedItem) {
      return '#FFD429'; // Yellow for delayed
    }

    return '#78C000'; // Default green
  }

  editContent(event: any) {
    if (event.target.id === 'editCloseTime') {
      this.closeTimeEdit = true;
    } else if (event.target.id === 'editComments') {
      this.editComments = true;
    }
  }

  updateContent(event: any) {
    if (event.target.id === 'updateCloseTime') {
      this.closeTimeEdit = false;
    } else if (event.target.id === 'updateComments') {
      this.editComments = false;
    }
  }

  getAbsoluteValue(number: number) {
    return Math.abs(number);
  }

  updatedAgo() {
    this.updateAgo = parseInt(sessionStorage.getItem('refreshedTime'));
    this.now = new Date().getTime();
    this.setTime = this.now;
    sessionStorage.setItem('refreshedTime', this.setTime);
    if (this.now - this.updateAgo <= 10000) {
      this.timeFlag = true;
    } else {
      this.timeFlag = false;
    }
  }

  setRefreshTime() {
    // sessionStorage.setItem('refreshedTime', this.setTime);
    setTimeout(() => {
      this.setRefreshTime();
    }, this.refreshInterval);
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
    const polling$ = interval(this.refreshInterval).pipe(
      startWith(0), // Emit initial value immediately
      switchMap(() => this.http.get(endpoint))
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
      data.forEach(ele => {
        // delete later
        if (ele['COMMENTS'] === 'hello') {
          console.log('raw date: ', ele['CREATION_DATE']);
          console.log('new date: ', new Date(ele['CREATION_DATE']));
          console.log(
            'locale string date: ',
            new Date(ele['CREATION_DATE']).toLocaleString('en-us', {
              month: 'long',
              year: 'numeric',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric'
            })
          );
        }
        // to here
        const val =
          new Date(ele['CREATION_DATE']).toLocaleString('en-us', {
            month: 'long',
            year: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
          }) + ' PST';
        ele['CREATION_DATE'] = val;
      });
      this.dashComments = data;
    });
  }

  exportTableToExcel(data: any[], sheetName: string, filename: string) {
    console.log('exportTableToExcel');
    let worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    let workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    let excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
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

export class MyClock extends TimeagoClock {
  tick(then: number): Observable<number> {
    return interval(1000);
  }
}

export class commentsModel {
  CLOSE_TYPE: string;
  COMMENTS: string;
  PERIOD_NAME: string;
  CREATION_DATE: Date;
}
