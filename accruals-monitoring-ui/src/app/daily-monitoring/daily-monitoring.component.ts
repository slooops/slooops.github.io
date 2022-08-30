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
    ACCRUALS_PENDING_RECORDS: 'Kafka Eligible Records'
  }));

  detailsTableOptions!: CuiTableOptions;
  detailsTableData: any[] = [];
  detailsDataFiltered: any[] = [];

  tableName: string = '';
  orgId: string = '';
  uniqueProcessId: string = '';
  subRefId: string = '';
  selectedTable: string = 'All';
  selectedStatus: string = 'E';
  status: string[] = [''];
  tables: string[] = ['All'];

  offset = 0;
  limit = 10;
  size = 0;

  detailsOffset = 0;
  detailsLimit = 8;
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
      this.detailsDataFiltered = this.detailsTableData;
      this.filterData();
      let detailsColumns: CuiTableColumnOption[] = [];
      let tables = [...new Set(this.detailsTableData.map((row: any) => row['TABLE_NAME']))];
      this.tables.push(...tables);

      let allStatuses = [ ...new Set(
        this.detailsTableData.map((row: any) => row['PROCESS_STATUS'])) ];
      this.status.push(...allStatuses);

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
        padding: 'compressed',
        columns: detailsColumns,
        dynamicData: false,
        wrapText: true
      });
    });

  }

  onPageUpdated(pageInfo: any) {
    this.offset = pageInfo.page;
    this.getDailyMonitoringSummary();
  }

  onDetailsUpdated(pageInfo: any) {
    this.detailsOffset = pageInfo.page;
    //this.getDailyMonitoringDetails();
  }

  onTableNameChange(tableName: string): void {
    this.selectedTable = tableName;
    this.filterData();
  }

  onOrgIdChange(orgId: string): void {
    this.orgId = orgId;
    this.filterData();
  }

  onUniqueProcessIdChange(uniqueId: string): void {
    this.uniqueProcessId = uniqueId;
    this.filterData();
  }

  onSubRefIdChange(subRefId: string): void {
    this.subRefId = subRefId;
    this.filterData();
  }

  onStatusChange(status: string): void {
    this.selectedStatus = status;
    this.filterData();
  }

  filterData(): void {
    let filteredData: any[] = this.detailsTableData;
    
    filteredData = filteredData.filter((row: any) => {
      if (this.selectedTable !== "All") {
        return row.TABLE_NAME.toUpperCase().includes(this.selectedTable.toUpperCase());
      } else {
        return true;
      }
    }); 

    filteredData = filteredData.filter((row: any) => {
      if (this.orgId === '') {
        return true;
      } else return row.ORG_ID && row.ORG_ID.toString().includes(this.orgId.toUpperCase());
      });

    filteredData = filteredData.filter((row: any) => 
      {
        if (this.uniqueProcessId === '') {
          return true;
        }
        else return row.UNIQUE_PROCESS_ID && row.UNIQUE_PROCESS_ID.toString().includes(this.uniqueProcessId.toUpperCase());
      });

    filteredData = filteredData.filter((row: any) =>
      {
        if (this.subRefId === '') {
          return true;
        }
        else return row.SUBSCRIPTION_REF_ID && row.SUBSCRIPTION_REF_ID.toUpperCase().includes(this.subRefId.toUpperCase());
      });

    filteredData = filteredData.filter((row: any) => 
      row.PROCESS_STATUS.toUpperCase().includes(this.selectedStatus.toUpperCase()));

    this.detailsDataFiltered = filteredData;
    this.detailsSize = filteredData.length;
    this.detailsOffset = 0;
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
