import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { CuiTableOptions, CuiTableColumnOption } from '@cisco-ngx/cui-components';
import { CngProgressbarColor } from '@cisco/cui-ng';
import { ApiHttpService } from 'src/app/providers/http.service';
import { NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap';

// export interface PeriodClose {
//   operatingUnit: string;
//   arInterface: string;
//   invoicing: string;
//   accounting: string;
//   glPosting: string;
//   ngccrm: string;
//   interCompany: string;
// }

@Component({
  selector: 'app-preclose',
  templateUrl: './preclose.component.html',
  styleUrls: ['./preclose.component.css']
})
export class PrecloseComponent implements OnInit {

  arInterfaceCompletionValue = 1;
  startTimeEdit = false;
  closeTimeEdit = false;
  editComments = false;

  templateObject = Object;

  selectedEntities: string[] = [];
  prevSelectedEntities: string[] = [];

  entities = new FormControl('');

  preCloseStartTime: String;
  preCloseEndTime: String;
  productVolume: Number;
  serviceVolume: Number;

  expectedCloseTime = "25-MAR-2023 02:30:00 PM PST";
  comments: any[] = [
    "Lockbox is delayed as treasurey didn’t receive the file",
    "Accounting is running long US entity by 30 minutes due to service",
    "VT extracts are running long by 30 minutes"
  ];
  public pctTracking = new FormGroup({
		value: new FormControl(this.arInterfaceCompletionValue),
		color: new FormControl(CngProgressbarColor.SUCCESS),
		label: new FormControl(true),
		customLabel: new FormControl((this.arInterfaceCompletionValue*100+'%').toString())
	});

  entityList: string[] = [];

  // periodCloseData: PeriodClose[] = [
  //   {operatingUnit: 'CN', arInterface: 'Completed', invoicing: 'Completed', accounting: 'Completed', glPosting: 'Completed', ngccrm: 'Completed', interCompany: 'Completed'},
  //   {operatingUnit: 'PY', arInterface: 'Completed', invoicing: 'Completed', accounting: 'Completed', glPosting: 'Completed', ngccrm: 'Completed', interCompany: 'Completed'},
  //   {operatingUnit: 'AUS', arInterface: 'Completed', invoicing: 'Completed', accounting: 'Completed', glPosting: 'Completed', ngccrm: 'Completed', interCompany: 'Completed'},
  //   {operatingUnit: 'ITL', arInterface: 'In Progress', invoicing: 'In Progress', accounting: 'In Progress', glPosting: 'In Progress', ngccrm: 'In Progress', interCompany: 'In Progress'},
  //   {operatingUnit: 'NZ', arInterface: 'In Progress', invoicing: 'In Progress', accounting: 'In Progress', glPosting: 'In Progress', ngccrm: 'In Progress', interCompany: 'In Progress'},
  //   {operatingUnit: 'UK', arInterface: 'Yet to Start', invoicing: 'Yet to Start', accounting: 'Yet to Start', glPosting: 'Yet to Start', ngccrm: 'Yet to Start', interCompany: 'Yet to Start'},
  //   {operatingUnit: 'US', arInterface: 'Yet to Start', invoicing: 'Yet to Start', accounting: 'Yet to Start', glPosting: 'Yet to Start', ngccrm: 'Yet to Start', interCompany: 'Yet to Start'}
  // ]

  selectedPeriodCloseData: any[] = [];
  entitySelected: boolean = false;



  programTableOptions!: CuiTableOptions;
  preCloseProgramTableData: any[] = [];
  midCloseProgramTableData: any[] = [];

  interfaceLoadHeaders: any[] = [];
  interfaceLoadData: any[] = [];
  qeCashCollectedData: any[] = [];
  qeCashCollectedTableOptions!: CuiTableOptions;

  monthEndStatusData: any[] = [];
  selectedMonthEndStatusData: any[] = [];
  meStatusColumns: string[] = []
  // monthEndStatusDataTableOptions!: CuiTableOptions;


  periodQuarterData: any[] = [];
  periodQuarter: String;
  period: String;
  quarter: String;

  dynamicInterfaceLoadColumns: string[] = [];
  interfaceLoadColumns: string[] = [];

  // programColumnMappings: Map<string, string> = new Map(Object.entries({
  //   QUARTER: 'Quarter',
  //   INVOICE_COUNT: 'Invoice Count',
  //   TRANSACTION_AMOUNT: 'Transaction Amount',
  //   USD_AMOUNT: 'USD Amount'
  // }));


  constructor(private http:ApiHttpService) { }

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
    this.http.get('period-quarter-details').subscribe((data:any) => {
      // console.log("period-quarter-details Data", data);
      this.period = data[0]["PERIOD_NAME"];
      this.quarter = data[0]["QUARTER"];
    })
  }

  getStartEndTime() {
    this.http.get('preclose-start-end-time').subscribe((data:any) => {
      console.log("preclose-start-end-time", data);
      this.preCloseStartTime = new Date(data[0]["CLOSE_START_TIME"]).toLocaleString('en-US') + ' PST';
      this.preCloseEndTime = new Date(data[0]["CLOSE_END_TIME"]).toLocaleString('en-US') + ' PST';
    })
  }

  getPrecloseVolume() {
    this.http.get('preclose-volume').subscribe((data:any) => {
      console.log("preclose-volume", data);
      this.productVolume = data[0]["LINE_COUNT"].toLocaleString('en-US');
      this.serviceVolume = data[1]["LINE_COUNT"].toLocaleString('en-US');
    })
  }

  getQECashCollected() {
    this.http.get('pclose-qe-cash-collected').subscribe((data:any) => {
      console.log("pclose-qe-cash-collected", data);

      // Rows
      data.map(cashData => {
        console.log("cashCollectedData: ", cashData);
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
        tableColumns.push(new CuiTableColumnOption({
          'name': column_name.replace(/_/g, ' '),
          'sortable': false,
          'key': column_name
        }));
      }

      this.qeCashCollectedTableOptions = new CuiTableOptions({
        bordered: true,
        // striped: true,
        // fixed: true,
        columns: tableColumns,
        dynamicData: true
      });
    })
  }

  getPrecloseMeStatus() {
    this.http.get('preclose-me-status').subscribe((data:any) => {
      console.log("preclose-me-status", data);

      // create ou category status mappings { ou -> { category -> status } }
      let ouStatusMapping: any = {};
      data.forEach(row => {
        let operatingUnit = row['OPERATING_UNIT'];
        let category = row['CATEGORY'];
        let closeStatus = row['CLOSE_STATUS'];
        if (!(operatingUnit in ouStatusMapping)) {
          ouStatusMapping[operatingUnit] = {};
          ouStatusMapping[operatingUnit][category] = closeStatus;
        }
        else {
          ouStatusMapping[operatingUnit][category] = closeStatus;
        }
      });

      console.log("ouStatusMapping", ouStatusMapping);

      // Get column names
      this.meStatusColumns.push('OPERATING UNIT');

      // For any operating unit, iterate through all the categories
      // These categories will be columns for the new table
      let tempOperatingUnit = data[0]['OPERATING_UNIT'];
      for (let category of Object.keys(ouStatusMapping[tempOperatingUnit])) {
        this.meStatusColumns.push(category.replace(/_/g, ' '));
      }

      // Get rows by building each row as an object and pushing it to array of rows
      for (let ou of Object.keys(ouStatusMapping)) {
        this.entityList.push(ou);
        let tableRowObj = {};
        let ouStatusesObj = ouStatusMapping[ou];
        tableRowObj['OPERATING_UNIT'] = ou;
        for (let category of Object.keys(ouStatusesObj)) {
          tableRowObj[category] = ouStatusMapping[ou][category];
        }
        this.monthEndStatusData.push(tableRowObj);
      }

      console.log("monthEndStatusData", this.monthEndStatusData);
      console.log("entityList", this.entityList);
    })
  }

  getPeriodCloseInvoice(){
    this.http.get('period-close-invoice-stats').subscribe((data: any) => {
      data.map(invData => {
        console.log("invData: ", invData);
        invData.TRANSACTION_AMOUNT = invData.TRANSACTION_AMOUNT.toLocaleString('en-US');
        invData.USD_AMOUNT = '$' + invData.USD_AMOUNT.toLocaleString('en-US');
        invData.INVOICE_COUNT = invData.INVOICE_COUNT.toLocaleString('en-US');
        return invData;
      });
      this.preCloseProgramTableData = data.filter(invData => invData.CLOSE_TYPE.trim() === 'PRECLOSE');

      // console.log("this.preCloseProgramTableData", this.preCloseProgramTableData);
      this.midCloseProgramTableData = data.filter(invData => invData.CLOSE_TYPE.trim() === 'MIDCLOSE');
      let programColumns: CuiTableColumnOption[] = [];

      for(let column of Object.keys(data[0])) {
        if (column !== 'CLOSE_TYPE') {
          programColumns.push(new CuiTableColumnOption({
            'name': column.replace(/_/g, ' '),
            'sortable': false,
            'key': column
          }));
        }
      }

      this.programTableOptions = new CuiTableOptions({
        bordered: true,
        // striped: true,
        // fixed: true,
        columns: programColumns,
        dynamicData: true
      });

      console.log("preCloseProgramTableData: ", this.preCloseProgramTableData);

    })
  }


  getInterfaceLoad(){
    this.http.get('period-close-interface-load').subscribe((data:any) => {

        console.log("period-close-interface-load Data", data);
        this.interfaceLoadColumns.push('Line Type');

        const emptyArray: number[] = [];

        let prod_array: any[] = ['PROD'];
        let service_array: any[] = ['SERVICE'];

        data.forEach(row => {
          // console.log(row);

          if (!this.interfaceLoadColumns.includes(row['QUARTER'])) {
            this.interfaceLoadColumns.push(row['QUARTER']);
          }
          if (row['LINE_TYPE'] === "PRODUCT") {
            prod_array.push(row['LINE_COUNT']);
            if (row['MOM_COMP_PERCENTAGE'] != null) {
              prod_array.push(row['MOM_COMP_PERCENTAGE'].toFixed(2) + '%');
            }
            if (row['QOQ_COMP_PERCENTAGE'] != null) {
              prod_array.push(row['QOQ_COMP_PERCENTAGE'].toFixed(2) + '%');
            }
          }
          else if (row['LINE_TYPE'] === "SERVICE") {
            service_array.push(row['LINE_COUNT']);
            if (row['MOM_COMP_PERCENTAGE'] != null) {
              service_array.push(row['MOM_COMP_PERCENTAGE'].toFixed(2) + '%');
            }
            if (row['QOQ_COMP_PERCENTAGE'] != null) {
              service_array.push(row['QOQ_COMP_PERCENTAGE'].toFixed(2) + '%');
            }
          }
        });
        this.interfaceLoadColumns.push('Quarter over Quarter');
        this.interfaceLoadColumns.push('Year over Year');
        this.interfaceLoadData.push(prod_array);
        this.interfaceLoadData.push(service_array);

        console.log("RESULT");
        console.log("COLS", this.interfaceLoadColumns);
        console.log("ROWS", this.interfaceLoadData);

        let interfaceSet = new Set<string>();
        for(let value of data.values()){
          Object.keys(value).forEach(key => {
            if(key === 'QUARTER'){
              interfaceSet.add(value[key]);
            }
          })
        }
        this.dynamicInterfaceLoadColumns.push(...interfaceSet.values());
        // this.setInterfaceLoadColumns();
    })
  }

  setInterfaceLoadColumns(){
    this.interfaceLoadColumns = ['Line Type', ...this.dynamicInterfaceLoadColumns, 'Quarter over Quarter', 'Month over Month'];
    console.log(this.interfaceLoadColumns);
  }

  selectedEntity(){

    console.log("selectedEntities: ", this.selectedEntities);
    console.log("this.monthEndStatusData ", this.monthEndStatusData);
    // console.log("2: ", this.periodCloseData);

    if(this.selectedEntities.length>0){
      this.entitySelected = true;
    } else {
      this.entitySelected = false;
    }
    if(this.selectedEntities.includes('ALL')) {
      for (let entity of this.entityList) {
        this.selectedEntities.push(entity);
      }
    }

    // this.selectedEntities = this.selectedEntities.filter((element) => element !== 'ALL');
    this.selectedPeriodCloseData = this.monthEndStatusData.filter(data => this.selectedEntities.includes(data.OPERATING_UNIT));

    // this.prevSelectedEntities = this.selectedEntities;
    console.log("selectedPeriodCloseData: ", this.selectedPeriodCloseData);
  }


  editContent(event:any){
    if(event.target.id === "editCloseTime"){
      this.closeTimeEdit = true;
    } else if(event.target.id === "editComments"){
      this.editComments = true;
    }
  }

  updateContent(event:any){
    if(event.target.id === "updateCloseTime"){
      this.closeTimeEdit = false;
    } else if(event.target.id === "updateComments"){
      this.editComments = false;
    }
  }

}
