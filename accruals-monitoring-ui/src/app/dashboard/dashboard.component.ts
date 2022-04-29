import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CuiTableColumnOption, CuiTableOptions } from '@cisco-ngx/cui-components';
import { ApiHttpService } from '../providers/http.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  @ViewChild('dateCell')
  dateCellTemplate!: TemplateRef<any>;

  programTableOptions!: CuiTableOptions;
  programTableData: any[] = [];

  programColumnMappings: Map<string, string> = new Map(Object.entries({
    OU_NAME: 'Operating Unit',
    STATUS: 'Status',
    COMPLETION_DATE: 'Completion Date' 
  }));

  offset = 0;
  limit = 10;
  size = 0;

  constructor(private http:ApiHttpService) { }

  ngOnInit(): void {
    this.getLastRun();
  }

  getLastRun() {
    this.http.get('last-program-run').subscribe((data: any) => {
      this.programTableData = data;
      this.size = data.length;

      let programColumns: CuiTableColumnOption[] = [];

      for(let column of Object.keys(this.programTableData[0])) {
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

}
