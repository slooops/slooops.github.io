import { formatDate } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CuiTableColumnOption, CuiTableOptions } from '@cisco-ngx/cui-components';
import { ApiHttpService } from '../providers/http.service';

@Component({
  selector: 'app-program-details',
  templateUrl: './program-details.component.html',
  styleUrls: ['./program-details.component.css']
})
export class ProgramDetailsComponent implements OnInit {
  @ViewChild('dateCell')
  dateCellTemplate!: TemplateRef<any>;

  programTableOptions!: CuiTableOptions;
  programTableData: any[] = [];

  offset = 0;
  limit = 10;
  size = 0;

  programColumnMappings: Map<string, string> = new Map(Object.entries({
    OU_NAME: 'Operating Unit',
    RESPONSIBILITY_NAME: 'Responsibility Name',
    USER_CONCURRENT_PROGRAM_NAME: 'Program Name',
    ACTUAL_START_DATE: 'Start Date',
    ACTUAL_COMPLETION_DATE: 'End Date',
    PHASE_CODE: 'Phase Code',
    STATUS_CODE: 'Status Code',
  }));

  constructor(private http:ApiHttpService) { }

  ngOnInit(): void {
    this.getLastRun();
  }

  getLastRun() {
    this.http.get('last-program-run').subscribe((data: any) => {
      this.programTableData = data;

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
