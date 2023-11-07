import { formatDate } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CuiTableColumnOption, CuiTableOptions } from '@cisco-ngx/cui-components';
import { ApiHttpService } from '../providers/http.service';

@Component({
  selector: 'app-revenue-controls',
  templateUrl: './revenue-controls.component.html',
  styleUrls: ['./revenue-controls.component.css']
})
export class RevenueControlsComponent implements OnInit {

  programTableOptions!: CuiTableOptions;
  programTableData: any[] = [];

  programColumnMappings: Map<string, string> = new Map(Object.entries({
    OU_NAME: 'OU Name',
    TRANSACTION_TYPE: 'Transaction Type',
    AMOUNT: 'Amount',
    COMMENTS: 'Comments'
  }));

  constructor(private http:ApiHttpService) { }

  ngOnInit(): void {
    this.getRevenueControls();
  }

  getRevenueControls() {
    this.http.get('revenue-controls').subscribe((data: any) => {
      this.programTableData = data;
      let programColumns: CuiTableColumnOption[] = [];

      for(let column of this.programColumnMappings.keys()) {
          programColumns.push(new CuiTableColumnOption({
            'name': this.programColumnMappings.get(column),
            'sortable': true,
            'key': column
          }));
      }

      this.programTableOptions = new CuiTableOptions({
        bordered: true,
        striped: true,
        columns: programColumns,
        dynamicData: false
      });
    });
  }

}
