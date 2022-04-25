import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { CuiTableOptions, CuiTableColumnOption } from '@cisco-ngx/cui-components';

@Component({
  selector: 'app-daily-monitoring',
  templateUrl: './daily-monitoring.component.html',
  styleUrls: ['./daily-monitoring.component.css']
})
export class DailyMonitoringComponent implements OnInit {

  summaryTableOptions!: CuiTableOptions;
  summaryTableData: any[] = [];

  offset = 0;
  limit = 10;
  size = 0;

  constructor(private http: ApiHttpService) { }

  ngOnInit(): void {
    this.getDailyMonitoringSummary();
  }

  getDailyMonitoringSummary() {
    this.http.get('daily-monitoring').subscribe((data: any) => {
      console.log('daily monitoring summary');
      this.summaryTableData = data;
      this.size = data.length

      let summaryColumns: CuiTableColumnOption[] = [];

        for (let column of Object.keys(this.summaryTableData[0])) {
          summaryColumns.push(new CuiTableColumnOption({
            'name': column,
            'sortable': false,
            'key': column
          }));
        }


        this.summaryTableOptions = new CuiTableOptions({
          bordered: true,
          striped: true,
          columns: summaryColumns,
          dynamicData: false,
          wrapText: true
        });
    });
  }

  onPageUpdated(pageInfo: any) {
    console.log(pageInfo);
    this.offset = pageInfo.page;
    this.getDailyMonitoringSummary();
  }

}
