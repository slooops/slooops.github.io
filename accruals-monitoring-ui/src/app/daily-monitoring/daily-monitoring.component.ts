import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { CuiTableOptions, CuiTableColumnOption, CuiModalService } from '@cisco-ngx/cui-components';

@Component({
  selector: 'app-daily-monitoring',
  templateUrl: './daily-monitoring.component.html',
  styleUrls: ['./daily-monitoring.component.css']
})
export class DailyMonitoringComponent implements OnInit {
  @ViewChild('viewDetails', { static: true })
  viewDetailsTemplate!: TemplateRef<any>;

  summaryTableOptions!: CuiTableOptions;
  summaryTableData: any[] = [];

  detailsTableOptions!: CuiTableOptions;
  detailsTableData: any[] = [];

  offset = 0;
  limit = 10;
  size = 0;

  detailsOffset = 0;
  detailsLimit = 10;
  detailsSize = 0;

  constructor(private http: ApiHttpService, private modal: CuiModalService) { }

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

  getDailyMonitoringDetails() {
    this.modal.show(this.viewDetailsTemplate, 'full');
    this.http.get('daily-monitoring/details').subscribe((data:any) => {
      this.detailsTableData = data;
      this.detailsSize = data.length;
      console.log(this.detailsSize);
      let detailsColumns: CuiTableColumnOption[] = [];

        for (let column of Object.keys(this.detailsTableData[0])) {
          detailsColumns.push(new CuiTableColumnOption({
            'name': column,
            'sortable': false,
            'key': column
          }));
        }

        this.detailsTableOptions = new CuiTableOptions({
          bordered: true,
          striped: true,
          columns: detailsColumns,
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

  onDetailsUpdated(pageInfo: any) {
    console.log(pageInfo);
    this.detailsOffset = pageInfo.page;
    //this.getDailyMonitoringDetails();
  }

  closeModal() {
    this.modal.hide();
  }

}
