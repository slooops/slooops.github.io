import { formatDate } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CuiTableColumnOption, CuiTableOptions } from '@cisco-ngx/cui-components';
import { ApiHttpService } from '../providers/http.service';

@Component({
  selector: 'app-standard-ar-exceptions',
  templateUrl: './standard-ar-exceptions.component.html',
  styleUrls: ['./standard-ar-exceptions.component.css']
})
export class StandardArExceptionsComponent implements OnInit {
  @ViewChild('dateCell')
  dateCellTemplate!: TemplateRef<any>;

  programTableOptions!: CuiTableOptions;
  programTableData: any[] = [];

  offset = 0;
  limit = 10;
  size = 0;

  programColumnMappings: Map<string, string> = new Map(Object.entries({
    PERIOD_NAME: 'Period Name',
    PERIOD_YEAR: 'Period Year',
    QUARTER: 'Quarter',
    OU_NAME: 'OU Name',
    CREATION_DATE: 'Creation Date',
    TRX_NUMBER: 'Trx Number',
    CUSTOMER_TRX_ID: 'Customer Trx Id',
    CUSTOMER_TRX_LINE_ID: 'Customer Trx Line Id',
    BATCH_SOURCE: 'Batch Source',
    TRANSACTION_TYPE: 'Transaction Type',
    TRX_NAME: 'Trx Name',
    INVENTORY_ITEM_ID: 'Inventory Item Id',
    ITEM_REV_ACCOUNT: 'Item Revenue Account',
    ITEM_CATALOG: 'Item Catalog',
    ORG_ID: 'Org Id',
    LEDGER_ID: 'Ledger Id',
    CURRENCY_CODE: 'Currency Code',
    LINE_AMOUNT_TRXN_CURR: 'Line Amount Trxn Currency',
    OA_FLAG: 'OA Flag',
    TSV_FLAG: 'TSV Flag',
    MERAKI_FLAG: 'Meraki Flag',
    REV_ACCOUNT: 'Revenue Account',
    UNEARN_ACCOUNT: 'Unearn Account',
    SLA_TRANSFERRED: 'SLA Transferred',
    ORIGINAL_LINE_REF: 'Original Line Ref',
    ORIGINAL_OA_FLAG: 'Original OA Flag',
    ORIGINAL_TSV_FLAG: 'Original TSV Flag',
    ORIGINAL_MERAKI_FLAG: 'Original Meraki Flag',
    ORIGINAL_REV_ACCOUNT: 'Original Revenue Account',
    ORIGINAL_UNEARN_ACCOUNT: 'Original Unearn Account',
    COMMENTS: 'Comments'
  }));



  constructor(private http:ApiHttpService) { }

  ngOnInit(): void {
    this.getStdArExceptions();
  }

  getStdArExceptions() {
    this.http.get('standard-ar-exceptions').subscribe((data: any) => {
      this.programTableData = data;
      console.log(this.programTableData);

      let programColumns: CuiTableColumnOption[] = [];

      for(let column of this.programColumnMappings.keys()) {
        if(column.includes('DATE')) {
          programColumns.push(new CuiTableColumnOption({
            'name': this.programColumnMappings.get(column),
            'sortable': false,
            'key': column,
            'template': this.dateCellTemplate
          }));
        } else {
          programColumns.push(new CuiTableColumnOption({
            'name': this.programColumnMappings.get(column),
            'sortable': false,
            'key': column
          }));
        }
      }

      this.programTableOptions = new CuiTableOptions({
        bordered: true,
        striped: true,
        columns: programColumns,
        dynamicData: false
      });
    });
  }

  transformDate(row: any, column: any): string {
    let cell = row[column.key];
    return formatDate(cell, 'M/d/yy, h:mm a z', 'en-US');

  }

}
