import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { CuiTableOptions, CuiTableColumnOption, CuiModalService } from '@cisco-ngx/cui-components';
import { formatNumber } from '@angular/common';
import { ChartConfiguration } from 'chart.js';
import { ChartOptions } from 'chart.js';
import { stringify } from 'qs';


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
  @ViewChild('dateCell', { static: true })
  dateCellTemplate!: TemplateRef<any>;

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

  detailsColumnMappings: Map<string, string> = new Map(Object.entries({
    CREATION_DATE: 'Creation Date',
    ORG_ID: 'Org ID',
    TABLE_NAME: 'Table Name',
    UNIQUE_PROCESS_ID: 'Unique Process ID',
    TRX_SOURCE: 'Transaction Source',
    SUBSCRIPTION_REF_ID: 'Subscription Ref ID',
    ITEM_NAME: 'Item Name',
    UNIQUE_ID: 'Unique ID',
    TRANSACTION_ID: 'Transaction ID',
    CUSTOMER_TRX_LINE_ID: 'Customer Trx Line ID',
    AMOUNT: 'Amount',
    PROCESS_STATUS: 'Process Status',
    ERROR_MESSAGE: 'Error Message',
    ERROR_CATEGORY: 'Error Category'
  }));

  tableName: string = '';
  orgId: string = '';
  uniqueProcessId: string = '';
  subRefId: string = '';
  selectedTable: string = 'All';
  selectedStatus: string = 'E';
  status: string[] = ['All'];
  tables: string[] = ['All'];

  detailsLineChartLegend: boolean = true;
  detailsGraphLabels: string[] = [];
  detailsDateErrorsMap: Map<string, Map<string, number>> = new Map();
  detailsErrorCatCountMap: Map<string, number> = new Map();
  detailsErrorCatDatasetMap: Map<string, number[]> = new Map();
  detailsLineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Creation Days'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Error Count'
        }
      }
    }
  }
  detailsLineChartData: ChartConfiguration<'line'>['data'] = {
    labels: this.detailsGraphLabels,
    datasets: [
      {
        label: 'Daily Monitoring Details Total Error Count by Creation Day',
        data: []
      }
    ]
  };

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
      // console.log(this.detailsTableData);
      this.detailsDataFiltered = this.detailsTableData;
      this.filterData();
      let detailsColumns: CuiTableColumnOption[] = [];
      let tables = [...new Set(this.detailsTableData.map((row: any) => row['TABLE_NAME']))];
      this.tables.push(...tables);

      let allStatuses = [ ...new Set(
        this.detailsTableData.map((row: any) => row['PROCESS_STATUS'])) ];
      this.status.push(...allStatuses);
      for (let column of this.detailsColumnMappings.keys()) {
        if(column.includes('DATE')) {
          detailsColumns.push(new CuiTableColumnOption({
            'name': this.detailsColumnMappings.get(column),
            'sortable': false,
            'key': column,
            'template': this.dateCellTemplate
          }));
        } else {
          detailsColumns.push(new CuiTableColumnOption({
            'name': this.detailsColumnMappings.get(column),
            'sortable': false,
            'key': column
          }));
        }
      }

      this.detailsTableOptions = new CuiTableOptions({
        bordered: true,
        striped: true,
        padding: 'compressed',
        columns: detailsColumns,
        dynamicData: false,
        wrapText: true
      });

      // Remove and refactor later
      var detailsGraphElt = document.getElementById("dailyMonitoringDetailsChart")!;
      var tableBtnElt = document.getElementById("detailsTableBtn")!;
      tableBtnElt.style.display = "none";
      detailsGraphElt.style.display = "none";
    });

  }

  getDetailsTableView(): void {
    var tableBtnElt = document.getElementById("detailsTableBtn")!;
    var graphBtnElt = document.getElementById("detailsGraphBtn")!;
    var detailsGraphElt = document.getElementById("dailyMonitoringDetailsChart")!;
    var detailsTableElt = document.getElementById("dailyMonitoringDetailsTable")!;
    var detailsTablePagerElt = document.getElementById("dailyMonitoringDetailsTable")!;

    //reveal
    graphBtnElt.style.display = "block";
    detailsTableElt.style.display = "block";
    detailsTablePagerElt.style.display = "block";

    //hide
    tableBtnElt.style.display = "none";
    detailsGraphElt.style.display = "none";

  }
  getDetailsGraphView(): void {
    var tableBtnElt = document.getElementById("detailsTableBtn")!;
    var graphBtnElt = document.getElementById("detailsGraphBtn")!;
    var detailsGraphElt = document.getElementById("dailyMonitoringDetailsChart")!;
    var detailsTableElt = document.getElementById("dailyMonitoringDetailsTable")!;
    var detailsTablePagerElt = document.getElementById("dailyMonitoringDetailsTable")!;

    //reveal
    tableBtnElt.style.display = "block";
    detailsGraphElt.style.display = "block";

    //hide
    graphBtnElt.style.display = "none";
    detailsTableElt.style.display = "none";
    detailsTablePagerElt.style.display = "none";
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
    this.detailsDateErrorsMap = new Map();
    this.detailsGraphLabels = [];
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

    filteredData = filteredData.filter((row: any) => {
      if (this.selectedStatus !== 'All') {
        return row.PROCESS_STATUS.toUpperCase().includes(this.selectedStatus.toUpperCase());
      } else {
        return true;
      }
    });

    this.detailsDataFiltered = filteredData;
    this.detailsSize = filteredData.length;
    this.detailsOffset = 0;

    // Get creation days data
    for (let i = 0; i < this.detailsDataFiltered.length; i++) {
      let creationDate: string = this.detailsDataFiltered[i]['CREATION_DATE'];
      let creationDay = creationDate.split("T")[0];
     // console.log(creationDay);
      if (!this.detailsGraphLabels.includes(creationDay)) {
        this.detailsGraphLabels.push(creationDay);
        this.detailsErrorCatCountMap = new Map();
        this.detailsErrorCatCountMap.set("total", 0);
        this.detailsDateErrorsMap.set(creationDay, this.detailsErrorCatCountMap);
      }
    }

    // Get error categories

    // detailsDateErrorsMap: Map<string, Map<string, number>> = new Map();
    // detailsErrorCatCountMap: Map<string, number> = new Map();
    console.log(this.detailsDateErrorsMap);
    console.log(this.detailsDataFiltered);

    // for each date, get the error count
    this.detailsDateErrorsMap.forEach((value: Map<String, number>, key: string) => {
      let errorCountMap = this.detailsDateErrorsMap.get(key);
      for (let i = 0; i < this.detailsDataFiltered.length; i++) {
        let creationDate: string = this.detailsDataFiltered[i]['CREATION_DATE'];
        let creationDay = creationDate.split("T")[0];
        if (creationDay === key) {
          let errorCategory: string = this.detailsDataFiltered[i]['ERROR_CATEGORY'];
          let curTotalErrorCountDate = errorCountMap!.get('total');
          errorCountMap!.set('total', curTotalErrorCountDate! + 1);
          if (!errorCountMap!.has(errorCategory)) {
            errorCountMap!.set(errorCategory, 1);
          }
          else {
            let curErrorCategoryCount = errorCountMap!.get(errorCategory);
            errorCountMap!.set(errorCategory, curErrorCategoryCount! + 1);
          }
          this.detailsDateErrorsMap.set(key, errorCountMap!);
        }
      }
      console.log(this.detailsDateErrorsMap);
    });
    // populate datasets for graphs for each day
    for (let i = 0; i < this.detailsGraphLabels.length; i++) {
      let creationDay = this.detailsGraphLabels[i];
      // for each
      let errorCountMap = this.detailsDateErrorsMap.get(creationDay);
      console.log(errorCountMap);
      errorCountMap!.forEach((value: number, key: string) => {
        let arrayDateErrorCounts: any = this.detailsErrorCatDatasetMap.get(key);
        console.log(arrayDateErrorCounts);
        if (arrayDateErrorCounts === undefined || arrayDateErrorCounts.length == 0) {
          let newArrayDateErrorCounts: any = [];
          newArrayDateErrorCounts!.push(value);
          this.detailsErrorCatDatasetMap.set(key, newArrayDateErrorCounts!)
        }
        else {
          arrayDateErrorCounts!.push(value);
          this.detailsErrorCatDatasetMap.set(key, arrayDateErrorCounts!);
        }
      });
    }
    console.log(this.detailsErrorCatDatasetMap);

    let errorDatasets: { label: string, data: any[] }[] = [];
    this.detailsErrorCatDatasetMap.forEach((value: Array<number>, key: string) => {
      let errorDataset: { label: string, data: any[] } = {
        label: "Error Category " + key,
        data: value
      };
      errorDatasets.push(errorDataset)
    });

    // Update the graph
    this.detailsLineChartData = {
      labels: this.detailsGraphLabels,
      datasets: errorDatasets
    };
  }

  closeModal() {
    this.getDetailsTableView();
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
