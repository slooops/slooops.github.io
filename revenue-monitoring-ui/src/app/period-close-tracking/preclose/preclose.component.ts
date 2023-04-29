import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { CuiTableOptions, CuiTableColumnOption } from '@cisco-ngx/cui-components';
import { CngProgressbarColor } from '@cisco/cui-ng';
import { ApiHttpService } from 'src/app/providers/http.service';

export interface PeriodClose {
  operatingUnit: string;
  arInterface: string;
  invoicing: string;
  accounting: string;
  glPosting: string;
  ngccrm: string;
  interCompany: string;
}

@Component({
  selector: 'app-preclose',
  templateUrl: './preclose.component.html',
  styleUrls: ['./preclose.component.css']
})
export class PrecloseComponent implements OnInit {

  arInterfaceCompletionValue = 0;
  startTimeEdit = false;
  closeTimeEdit = false;
  editComments = false;

  selectedEntities: string[] = [];

  entities = new FormControl('');

  preCloseStartTime = "29-APR-2023 07:00:00 AM PST";
  expectedCloseTime = "29-APR-2023 02:30:00 PM PST";
  currentQuarter = "Q3FY23";
  comments: any[] = [];
  public pctTracking = new FormGroup({
		value: new FormControl(this.arInterfaceCompletionValue),
		color: new FormControl(CngProgressbarColor.SUCCESS),
		label: new FormControl(true),
		customLabel: new FormControl((this.arInterfaceCompletionValue*100+'%').toString())
	});

  entityList: string[] = ['ALL', 'CN', 'PY', 'AUS', 'ITL', 'NZ', 'UK', 'US'];

  periodCloseColumns: string[] = ['operatingUnit', 'arInterface', 'invoicing', 'accounting', 'glPosting', 'ngccrm', 'interCompany'];

  periodCloseData: PeriodClose[] = [
    {operatingUnit: 'CN', arInterface: 'Completed', invoicing: 'Completed', accounting: 'Completed', glPosting: 'Completed', ngccrm: 'Completed', interCompany: 'Completed'},
    {operatingUnit: 'PY', arInterface: 'Completed', invoicing: 'Completed', accounting: 'Completed', glPosting: 'Completed', ngccrm: 'Completed', interCompany: 'Completed'},
    {operatingUnit: 'AUS', arInterface: 'Completed', invoicing: 'Completed', accounting: 'Completed', glPosting: 'Completed', ngccrm: 'Completed', interCompany: 'Completed'},
    {operatingUnit: 'ITL', arInterface: 'In Progress', invoicing: 'In Progress', accounting: 'In Progress', glPosting: 'In Progress', ngccrm: 'In Progress', interCompany: 'In Progress'},
    {operatingUnit: 'NZ', arInterface: 'In Progress', invoicing: 'In Progress', accounting: 'In Progress', glPosting: 'In Progress', ngccrm: 'In Progress', interCompany: 'In Progress'},
    {operatingUnit: 'UK', arInterface: 'Yet to Start', invoicing: 'Yet to Start', accounting: 'Yet to Start', glPosting: 'Yet to Start', ngccrm: 'Yet to Start', interCompany: 'Yet to Start'},
    {operatingUnit: 'US', arInterface: 'Yet to Start', invoicing: 'Yet to Start', accounting: 'Yet to Start', glPosting: 'Yet to Start', ngccrm: 'Yet to Start', interCompany: 'Yet to Start'}
  ]

  selectedPeriodCloseData: PeriodClose[] = [];
  entitySelected: boolean = false;

  programTableOptions!: CuiTableOptions;
  preCloseProgramTableData: any[] = [];
  midCloseProgramTableData: any[] = [];

  dynamicInterfaceLoadColumns: string[] = [];
  interfaceLoadColumns: string[] = [];

  programColumnMappings: Map<string, string> = new Map(Object.entries({
    QUARTER: 'Quarter',
    INVOICE_COUNT: 'Invoice Count',
    TRANSACTION_AMOUNT: 'Transaction Amount',
    USD_AMOUNT: 'USD Amount'
  }));


  constructor(private http:ApiHttpService) { }

  ngOnInit(): void {
    this.getPeriodCloseInvoice();
    this.getInterfaceLoad();
  }

  getPeriodCloseInvoice(){
    this.http.get('period-close-invoice-stats').subscribe((data: any) => {
      data.map(invData => {
        invData.TRANSACTION_AMOUNT = invData.TRANSACTION_AMOUNT.toLocaleString('en-US');
        return invData;
      });
      this.preCloseProgramTableData = data.filter(invData => invData.CLOSE_TYPE.trim() === 'PRECLOSE');
      this.midCloseProgramTableData = data.filter(invData => invData.CLOSE_TYPE.trim() === 'MIDCLOSE');
      let programColumns: CuiTableColumnOption[] = [];

      for(let column of this.programColumnMappings.keys()) {
        programColumns.push(new CuiTableColumnOption({
          'name': this.programColumnMappings.get(column),
          'sortable': false,
          'key': column
        }));
      }

      this.programTableOptions = new CuiTableOptions({
        bordered: true,
        // striped: true,
        // fixed: true,
        columns: programColumns,
        dynamicData: true
      });
    })
  }


  getInterfaceLoad(){
    this.http.get('period-close-interface-load').subscribe((data:any) => {
        let interfaceSet = new Set<string>();
        for(let value of data.values()){
          Object.keys(value).forEach(key => {
            if(key === 'QUARTER'){
              interfaceSet.add(value[key]);
            }
          })
        }
        this.dynamicInterfaceLoadColumns.push(...interfaceSet.values());
        this.setInterfaceLoadColumns();
    })
  }

  setInterfaceLoadColumns(){
    this.interfaceLoadColumns = ['Line Type', ...this.dynamicInterfaceLoadColumns, 'Quarter over Quarter', 'Month over Month'];
    console.log(this.interfaceLoadColumns);
  }

  selectedEntity(){
    if(this.selectedEntities.length>0){
      this.entitySelected = true;
    } else {
      this.entitySelected = false;
    }
    if(this.selectedEntities.includes('ALL')){
      this.selectedPeriodCloseData = this.periodCloseData;
    } else {
      this.selectedPeriodCloseData = this.periodCloseData.filter(data => this.selectedEntities.includes(data.operatingUnit));
    }
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
