import { formatDate } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CuiTableColumnOption, CuiTableOptions } from '@cisco-ngx/cui-components';
import { ApiHttpService } from '../providers/http.service';

@Component({
  selector: 'app-tsv-exceptions-top-sku',
  templateUrl: './tsv-exceptions-top-sku.component.html',
  styleUrls: ['./tsv-exceptions-top-sku.component.css']
})
export class TsvExceptionsTopSkuComponent implements OnInit {

  @ViewChild('dateCell')
  dateCellTemplate!: TemplateRef<any>;

  programTableOptions!: CuiTableOptions;
  programTableData: any[] = [];

  offset = 0;
  limit = 10;
  size = 0;

  programColumnMappings: Map<string, string> = new Map(Object.entries({
    TRANSACTION_ID: 'Transaction Id',
    SUBSCRIPTION_REF_ID: 'Subscription Ref Id',
    UNIQUE_ID: 'Unique Id',
    TRANSACTION_SOURCE: 'Transaction Source',
    TRANSACTION_TYPE: 'Transaction Type',
    INVENTORY_ITEM_ID: 'Inventory Item Id',
    ITEM_NAME: 'Item Name',
    MERAKI_FLAG: 'Meraki Flag',
    ELEMENT_TYPE: 'Element Type',
    AMOUNT: 'AMOUNT',
    ATTRIBUTE8: 'ATTRIBUTE8',
    COMMENTS: 'Comments'
  }));

  constructor(private http:ApiHttpService) { }

  ngOnInit(): void {
    this.getTsvTopSkuExceptions();
  }

  getTsvTopSkuExceptions() {
    this.http.get('tsv-topsku-exceptions').subscribe((data: any) => {
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
