import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-exception-report',
  templateUrl: './exception-report.component.html',
  styleUrls: ['./exception-report.component.css']
})
export class ExceptionReportComponent implements OnInit {

  subId: string = '';
  itemName: string = '';

  trxStatus: string[] = ['Open', 'Fixed'];
  selectedTrxStatus: string = 'Open';

  ouName: string = '';
  
  startDate?: Date;
  endDate?: Date;

  constructor() { }

  ngOnInit(): void {
  }

  onSubIdChange(subId: string): void {
    this.subId = subId;
    this.filterData();
  }

  onItemNameChange(itemName: string): void {
    this.itemName = itemName;
    this.filterData();
  }

  onTrxStatusChange(trxStatus: string): void {
    this.selectedTrxStatus = trxStatus;
    this.filterData();
  }

  onOuNameChange(ouName: string): void {
    this.ouName = ouName;
    this.filterData();
  }

  onStartDateChange(startDate: string): void {
    this.startDate = new Date(startDate);
    this.filterData();
  }

  onEndDateChange(endDate: string): void {
    this.endDate = new Date(endDate);
    this.filterData();
  }

  filterData(): void {

  }

}
