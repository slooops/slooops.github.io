import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { formatDate, formatNumber } from '@angular/common';
import { CuiTableColumnOption, CuiTableOptions } from '@cisco-ngx/cui-components';
import { ApiHttpService } from '../providers/http.service';

@Component({
  selector: 'app-exception-report',
  templateUrl: './exception-report.component.html',
  styleUrls: ['./exception-report.component.css']
})
export class ExceptionReportComponent implements OnInit {
  @ViewChild('dateCell')
  dateCellTemplate!: TemplateRef<any>;
  @ViewChild('amountCell')
  amountCellTemplate!: TemplateRef<any>;

  subId: string = '';
  itemName: string = '';

  // trxStatus: string[] = ['Open', 'Fixed'];
  // selectedTrxStatus: string = 'Open';

  ouName: string = '';
  
  startDate?: Date;
  endDate?: Date;

  size = 0;
  limit = 10;
  offset = 0;

  reportTableLoading = false;

  reportTableAllData: any[] = [];
  reportTableFiltered: any[] = [];
  reportTableOptions!: CuiTableOptions;
  reportColumnOptions: CuiTableColumnOption[] = [];

  reportColumnMappings: Map<string, string> = new Map(Object.entries({
    DATA_CREATION_DATE: 'Date Created',
    ORG_ID: 'Org ID',
    SUBSCRIPTION_REF_ID: 'Subscription Ref ID',
    ITEM_NAME: 'SKU',
    TRX_NUMBER: 'Trx Number',
    TRX_DATE: 'Trx Date',
    CURRENCY_CODE: 'Currency',
    CUSTOMER_TRX_LINE_ID: 'Trx Line ID',
    CHARGE_CYCLE_START_DATE: 'Charge Cycle Start Date',
    CHARGE_CYCLE_END_DATE: 'Charge Cycle End Date',
    AMOUNT: 'Amount',
    ACCOUNTED_AMOUNT: 'Accounted Amount'
  }));

  constructor(private http: ApiHttpService) { }

  ngOnInit(): void {
    this.getExceptionReport();
  }

  getExceptionReport() {
    this.reportTableLoading = true;
    this.http.get('exception-report').subscribe((data: any) => {
      this.reportTableAllData = data;
      this.reportTableFiltered = data;
      this.filterData();
      this.size = data.length;

      this.reportColumnOptions = [];
      for (let column of this.reportColumnMappings.keys()) {
        if (column.includes('DATE')) {
          this.reportColumnOptions.push(new CuiTableColumnOption({
            'name': this.reportColumnMappings.get(column),
            'sortable': true,
            'key': column,
            'template': this.dateCellTemplate
          }));
        }
        else if (column.includes('AMOUNT')) {
          this.reportColumnOptions.push(new CuiTableColumnOption({
            'name': this.reportColumnMappings.get(column),
            'sortable': true,
            'key': column,
            'template': this.amountCellTemplate
          }));
        }
        else {
          this.reportColumnOptions.push(new CuiTableColumnOption({
            'name': this.reportColumnMappings.get(column),
            'sortable': true,
            'key': column
          }));
        }
      }
      this.reportTableOptions = new CuiTableOptions({
        bordered: true,
        striped: true,
        columns: this.reportColumnOptions,
        singleSelect: true,
        dynamicData: false,
        wrapText: true
      });

      this.reportTableLoading = false;
    });
  }

  onSubIdChange(subId: string): void {
    this.subId = subId;
    this.filterData();
  }

  onItemNameChange(itemName: string): void {
    this.itemName = itemName;
    this.filterData();
  }

  // onTrxStatusChange(trxStatus: string): void {
  //   this.selectedTrxStatus = trxStatus;
  //   this.filterData();
  // }

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

  onPageUpdated(pageInfo: any) {
    this.offset = pageInfo.page;
  }

  transformNumber(row: any, column: any): string {
    let cell = row[column.key];
    if (!isNaN(+cell)) {
      cell = formatNumber(cell, 'en-US');
    }
    return cell;
  }

  transformDate(row: any, column: any) {
    let cell = row[column.key];
    return formatDate(cell, 'M/d/yy', 'en-US');
  }

}
