import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { CngProgressbarColor } from '@cisco/cui-ng';
import { ApiHttpService } from '../providers/http.service';
import {
  CuiTableColumnOption,
  CuiTableOptions
} from '@cisco-ngx/cui-components';
import { map } from 'rxjs';
import { DatePipe } from '@angular/common';
import { MatSelect } from '@angular/material/select';

@Component({
  selector: 'app-period-close-tracking',
  templateUrl: './period-close-tracking.component.html',
  styleUrls: ['./period-close-tracking.component.css']
})
export class PeriodCloseTrackingComponent implements OnInit {
  startTimeEdit = false;
  closeTimeEdit = false;
  editComments = false;

  templateObject = Object;
  datePipe: DatePipe = new DatePipe('en-US');

  selectedEntities: string[] = [];
  prevSelectedEntities: string[] = [];
  selectedStatuses: string[] = [];

  entities = new FormControl('');
  statuses = new FormControl('');

  preCloseStartTime: String;
  preCloseEndTime: String;
  midCloseStartTime: String;
  midCloseEndTime: String;
  productVolume: Number;
  serviceVolume: Number;

  // expectedCloseTime = "25-MAR-2023 02:30:00 PM PST";
  comments: any[] = [
    'Lockbox is delayed as treasurey didn’t receive the file',
    'Accounting is running long US entity by 30 minutes due to service',
    'VT extracts are running long by 30 minutes'
  ];

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

  pCloseProgBarStatusMapping: any = {};
  mCloseProgBarStatusMapping: any = {};
  pcloseOuStatusMapping: any = {};
  mcloseOuStatusMapping: any = {};

  periodQuarterData: any[] = [];
  periodQuarter: String;
  period: String;
  quarter: String;

  dynamicInterfaceLoadColumns: string[] = [];
  pcloseInterfaceLoadColumns: string[] = [];
  mcloseInterfaceLoadColumns: string[] = [];

  protected http: ApiHttpService;

  constructor(http: ApiHttpService) {
    this.http = http;
  }

  ngOnInit(): void {
    this.getPeriodCloseInvoice();
    this.getInterfaceLoad();
    this.getPeriodQuarter();
    this.getStartEndTime();
    this.getPrecloseVolume();
    this.getQECashCollected();
    this.getPrecloseMeStatus();
  }

  getPeriodQuarter() {
    this.http.get('period-quarter-details').subscribe((data: any) => {
      console.log('period-quarter-details Data', data);
      this.period = data[0]['PERIOD_NAME'];
      this.quarter = data[0]['QUARTER'];
    });
  }

  getStartEndTime() {
    this.http.get('preclose-start-end-time').subscribe((data: any) => {
      console.log('preclose-start-end-time', data);

      data.forEach(row => {
        if (row['CLOSE_TYPE'] == 'PRECLOSE') {
          // let startDate = new Date(row["CLOSE_START_TIME"]);
          // let endDate = new Date(row["CLOSE_END_TIME"]);
          // this.preCloseStartTime = this.datePipe.transform(startDate.toISOString(), 'short', 'en-US') + ' PST';
          // this.preCloseEndTime = this.datePipe.transform(endDate.toISOString(), 'short', 'en-US') + ' PST';
          this.preCloseStartTime = row['CLOSE_START_TIME'] + ' PST';
          this.preCloseEndTime = row['CLOSE_END_TIME'] + ' PST';
        } else if (row['CLOSE_TYPE'] == 'MIDCLOSE') {
          // let startDate = new Date(row["CLOSE_START_TIME"]);
          // let endDate = new Date(row["CLOSE_END_TIME"]);
          // this.midCloseStartTime = this.datePipe.transform(startDate.toISOString(), 'short', 'en-US') + ' PST';
          // this.midCloseEndTime = this.datePipe.transform(endDate.toISOString(), 'short', 'en-US') + ' PST';
          this.midCloseStartTime = row['CLOSE_START_TIME'] + ' PST';
          this.midCloseEndTime = row['CLOSE_END_TIME'] + ' PST';
        }
      });

      console.log('preCloseStartTime', this.preCloseStartTime);
      console.log('preCloseEndTime', this.preCloseEndTime);
      console.log('midCloseStartTime', this.midCloseStartTime);
      console.log('midCloseEndTime', this.midCloseEndTime);
    });
  }

  getPrecloseVolume() {
    this.http.get('preclose-volume').subscribe((data: any) => {
      console.log('preclose-volume', data);
      this.productVolume = data[0]['LINE_COUNT'].toLocaleString('en-US');
      this.serviceVolume = data[1]['LINE_COUNT'].toLocaleString('en-US');
    });
  }

  getQECashCollected() {
    this.http.get('pclose-qe-cash-collected').subscribe((data: any) => {
      console.log('pclose-qe-cash-collected', data);

      // Rows
      data.map(cashData => {
        // console.log("cashCollectedData: ", cashData);
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
    this.http.get('preclose-me-status').subscribe((data: any) => {
      console.log('PRECLOSE-ME-STATUS', data);

      // create ou category status mappings { ou -> { category -> status } }
      this.pcloseMonthEndStatusData = data.filter(
        obj => obj['CLOSE_TYPE'] == 'PRECLOSE'
      );
      this.mcloseMonthEndStatusData = data.filter(
        obj => obj['CLOSE_TYPE'] == 'MIDCLOSE'
      );

      // setup preclose data (pcloseOuStatusMapping)
      this.statusList.push('All');
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

      console.log('pcloseOuStatusMapping', this.pcloseOuStatusMapping);
      console.log('mcloseOuStatusMapping', this.mcloseOuStatusMapping);

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

      console.log('meStatusColumns: ', this.meStatusColumns);

      // Get rows of table by building each row as an object and pushing it to array
      // Preclose
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
      console.log(
        'pcloseMonthEndStatusTableData',
        this.pcloseMonthEndStatusTableData
      );
      console.log(
        'mcloseMonthEndStatusTableData',
        this.mcloseMonthEndStatusTableData
      );
      console.log('entityList', this.entityList);
    });
  }

  getPeriodCloseInvoice() {
    this.http.get('period-close-invoice-stats').subscribe((data: any) => {
      data.map(invData => {
        // console.log("PERIOD-CLOSE-INVOICE-STATS: ", invData);

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
      console.log('PERIOD-CLOSE-INVOICE-STATS: ', data);
      // array.filter(obj => obj.category === category);
      this.preCloseProgramTableData = data.filter(
        obj => obj['CLOSE_TYPE'] == 'PRECLOSE'
      );
      this.midCloseProgramTableData = data.filter(
        obj => obj['CLOSE_TYPE'] == 'MIDCLOSE'
      );
      let programColumns: CuiTableColumnOption[] = [];

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

      console.log('preCloseProgramTableData: ', this.preCloseProgramTableData);
    });
  }

  getInterfaceLoad() {
    this.http.get('period-close-interface-load').subscribe((data: any) => {
      this.precloseInterfaceLoadData = data.filter(
        obj => obj['CLOSE_TYPE'] == 'PRECLOSE'
      );
      this.midcloseInterfaceLoadData = data.filter(
        obj => obj['CLOSE_TYPE'] == 'MIDCLOSE'
      );

      console.log('PERIOD-CLOSE-INTERFACE-LOAD DATA', data);
      this.pcloseInterfaceLoadColumns.push('Line Type');
      this.mcloseInterfaceLoadColumns.push('Line Type');

      const emptyArray: number[] = [];

      let preclose_prod_array: any[] = ['PROD'];
      let preclose_service_array: any[] = ['SERVICE'];
      let midclose_prod_array: any[] = ['PROD'];
      let midclose_service_array: any[] = ['SERVICE'];

      // preclose
      this.precloseInterfaceLoadData.forEach(row => {
        if (
          !this.pcloseInterfaceLoadColumns.includes(row['PERIOD_NAME']) &&
          row['PERIOD_NAME'] !== undefined
        ) {
          this.pcloseInterfaceLoadColumns.push(row['PERIOD_NAME']);
        }
        if (row['LINE_TYPE'] === 'PRODUCT') {
          preclose_prod_array.push(row['LINE_COUNT'].toLocaleString('en-US'));
          if (
            row['MOM_PERCENTAGE'] != null &&
            row['PERIOD_NAME'] === this.pclose_last_period
          ) {
            this.pcloseInterfaceLoadColumns.push('MOM Percentage');
            preclose_prod_array.push(row['MOM_PERCENTAGE'].toFixed(0) + '%');
          }
          if (
            row['PQM_PERCENTAGE'] != null &&
            row['PERIOD_NAME'] === this.pclose_last_period
          ) {
            this.pcloseInterfaceLoadColumns.push('PQM Percentage');
            preclose_prod_array.push(row['PQM_PERCENTAGE'].toFixed(0) + '%');
          }
          if (
            row['QOQ_PERCENTAGE'] != null &&
            row['PERIOD_NAME'] === this.pclose_last_period
          ) {
            this.pcloseInterfaceLoadColumns.push('QOQ PERCENTAGE');
            preclose_prod_array.push(row['QOQ_PERCENTAGE'].toFixed(0) + '%');
          }
          if (
            row['YOY_PERCENTAGE'] != null &&
            row['PERIOD_NAME'] === this.pclose_last_period
          ) {
            this.pcloseInterfaceLoadColumns.push('YOY PERCENTAGE');
            preclose_prod_array.push(row['YOY_PERCENTAGE'].toFixed(0) + '%');
          }
        } else if (row['LINE_TYPE'] === 'SERVICE') {
          preclose_service_array.push(
            row['LINE_COUNT'].toLocaleString('en-US')
          );
          if (
            row['MOM_PERCENTAGE'] != null &&
            row['PERIOD_NAME'] === this.pclose_last_period
          ) {
            preclose_service_array.push(row['MOM_PERCENTAGE'].toFixed(0) + '%');
          }
          if (
            row['PQM_PERCENTAGE'] != null &&
            row['PERIOD_NAME'] === this.pclose_last_period
          ) {
            preclose_service_array.push(row['PQM_PERCENTAGE'].toFixed(0) + '%');
          }
          if (
            row['QOQ_PERCENTAGE'] != null &&
            row['PERIOD_NAME'] === this.pclose_last_period
          ) {
            preclose_service_array.push(row['QOQ_PERCENTAGE'].toFixed(0) + '%');
          }
          if (
            row['YOY_PERCENTAGE'] != null &&
            row['PERIOD_NAME'] === this.pclose_last_period
          ) {
            preclose_service_array.push(row['YOY_PERCENTAGE'].toFixed(0) + '%');
          }
        }
      });
      this.precloseInterfaceLoadTableData.push(preclose_prod_array);
      this.precloseInterfaceLoadTableData.push(preclose_service_array);

      // midclose
      this.midcloseInterfaceLoadData.forEach(row => {
        if (
          !this.mcloseInterfaceLoadColumns.includes(row['PERIOD_NAME']) &&
          row['PERIOD_NAME'] !== undefined
        ) {
          this.mcloseInterfaceLoadColumns.push(row['PERIOD_NAME']);
        }
        if (row['LINE_TYPE'] === 'PRODUCT') {
          midclose_prod_array.push(row['LINE_COUNT'].toLocaleString('en-US'));
          if (
            row['MOM_PERCENTAGE'] != null &&
            row['PERIOD_NAME'] === this.mclose_last_period
          ) {
            this.mcloseInterfaceLoadColumns.push('MOM Percentage');
            midclose_prod_array.push(row['MOM_PERCENTAGE'].toFixed(0) + '%');
          }
          if (
            row['PQM_PERCENTAGE'] != null &&
            row['PERIOD_NAME'] === this.mclose_last_period
          ) {
            this.mcloseInterfaceLoadColumns.push('PQM Percentage');
            midclose_prod_array.push(row['PQM_PERCENTAGE'].toFixed(0) + '%');
          }
          if (
            row['QOQ_PERCENTAGE'] != null &&
            row['PERIOD_NAME'] === this.mclose_last_period
          ) {
            this.mcloseInterfaceLoadColumns.push('QOQ PERCENTAGE');
            midclose_prod_array.push(row['QOQ_PERCENTAGE'].toFixed(0) + '%');
          }
          if (
            row['YOY_PERCENTAGE'] != null &&
            row['PERIOD_NAME'] === this.mclose_last_period
          ) {
            this.mcloseInterfaceLoadColumns.push('YOY PERCENTAGE');
            midclose_prod_array.push(row['YOY_PERCENTAGE'].toFixed(0) + '%');
          }
        } else if (row['LINE_TYPE'] === 'SERVICE') {
          midclose_service_array.push(
            row['LINE_COUNT'].toLocaleString('en-US')
          );
          if (
            row['MOM_PERCENTAGE'] != null &&
            row['PERIOD_NAME'] === this.mclose_last_period
          ) {
            midclose_service_array.push(row['MOM_PERCENTAGE'].toFixed(0) + '%');
          }
          if (
            row['PQM_PERCENTAGE'] != null &&
            row['PERIOD_NAME'] === this.mclose_last_period
          ) {
            midclose_service_array.push(row['PQM_PERCENTAGE'].toFixed(0) + '%');
          }
          if (
            row['QOQ_PERCENTAGE'] != null &&
            row['PERIOD_NAME'] === this.mclose_last_period
          ) {
            midclose_service_array.push(row['QOQ_PERCENTAGE'].toFixed(0) + '%');
          }
          if (
            row['YOY_PERCENTAGE'] != null &&
            row['PERIOD_NAME'] === this.mclose_last_period
          ) {
            midclose_service_array.push(row['YOY_PERCENTAGE'].toFixed(0) + '%');
          }
        }
      });
      this.midcloseInterfaceLoadTableData.push(midclose_prod_array);
      this.midcloseInterfaceLoadTableData.push(midclose_service_array);

      console.log('RESULT');
      console.log('PCLOSE COLS', this.pcloseInterfaceLoadColumns);
      console.log('MCLOSE COLS', this.mcloseInterfaceLoadColumns);
      console.log(
        'precloseInterfaceLoadTableData',
        this.precloseInterfaceLoadTableData
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
    });
  }

  // setInterfaceLoadColumns() {
  //   this.interfaceLoadColumns = ['Line Type', ...this.dynamicInterfaceLoadColumns, 'Quarter over Quarter', 'Month over Month'];
  //   console.log(this.interfaceLoadColumns);
  // }

  selectedEntity() {
    console.log('selectedEntity selectedStatuses: ', this.selectedStatuses);
    console.log('selectedEntity selectedEntities: ', this.selectedEntities);

    if (this.selectedEntities.length > 0) {
      this.entitySelected = true;
    } else {
      this.entitySelected = false;
    }
    if (this.selectedEntities.includes('All')) {
      for (let entity of this.entityList) {
        this.selectedEntities.push(entity);
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
  }

  selectedStatus() {
    console.log('selectedStatus selectedStatuses: ', this.selectedStatuses);
    console.log('selectedStatus selectedEntities: ', this.selectedEntities);

    if (this.selectedStatuses.includes('All')) {
      for (let status of this.statusList) {
        this.selectedStatuses.push(status);
      }
    }

    console.log(
      'pcloseSelectedMonthEndStatusTableData selectedStatus() 1: ',
      this.pcloseSelectedMonthEndStatusTableData
    );

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
      'pcloseSelectedMonthEndStatusTableData selectedStatus() 2: ',
      this.pcloseSelectedMonthEndStatusTableData
    );
  }

  meStatusTableFiltering(
    selectedOUData,
    selectedStatusData,
    selectedMonthEndStatusTableData
  ) {}

  selectedStatusFilter(data) {
    for (let category of this.meStatusCategories) {
      // if (data['OPERATING_UNIT'] === 'BROADSOFT') {
      //   console.log('selectedStatusFilter category');
      //   console.log(this.selectedStatuses.includes(data[category]));
      // }
      if (this.selectedStatuses.includes(data[category])) {
        return true;
      }
    }
    return false;
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
}
