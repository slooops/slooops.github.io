import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { CuiTableOptions, CuiTableColumnOption, CuiModalService } from '@cisco-ngx/cui-components';
import { formatNumber } from '@angular/common';

@Component({
  selector: 'app-daily-monitoring',
  templateUrl: './daily-monitoring.component.html',
  styleUrls: ['./daily-monitoring.component.css']
})
export class DailyMonitoringComponent implements OnInit {
  @ViewChild('viewDetails', { static: true })
  viewDetailsTemplate!: TemplateRef<any>;
  @ViewChild('numberCell', { static: true })
  numberCellTemplate!: TemplateRef<any>;

  summaryTableOptions!: CuiTableOptions;
  summaryTableData: any[] = [];

  summaryColumnMappings: Map<string, string> = new Map(Object.entries({
    ACCRUALS_NEW_PAYLOADS_RECEIVED: 'New Payloads Received',
    ACCRUALS_INPUT_TABLE_ERROR: 'Input Table Errors',
    ACCRUALS_LINE_ITEMS_ERROR: 'Line Items Errors',
    ACCRUALS_DIST_ERROR: 'Dist Errors',
    ACCRUALS_SUMMARY_ERROR: 'Summary Errors',
    ACCRUALS_AR_LINES_MISSING: 'AR Lines Missing',
    ACCRUALS_PENDING_RECORDS: 'Pending Records'
  }));

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
      this.summaryTableData = data;
      this.size = data.length

      let summaryColumns: CuiTableColumnOption[] = [];

        for (let column of Object.keys(this.summaryTableData[0])) {
          summaryColumns.push(new CuiTableColumnOption({
            'name': this.summaryColumnMappings.get(column),
            'sortable': false,
            'key': column,
            'template': this.numberCellTemplate
          }));
        }


        this.summaryTableOptions = new CuiTableOptions({
          bordered: true,
          striped: true,
          columns: summaryColumns,
          dynamicData: false
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

  transformNumber(row: any, column: any): string {
    let cell = row[column.key];
    if (!isNaN(+cell)) {
      cell = formatNumber(cell, 'en-US');
    }
    return cell;
  }

}
