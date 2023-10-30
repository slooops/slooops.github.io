import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ApiHttpService } from '../providers/http.service';

import { SelectionModel } from '@angular/cdk/collections';
import { DataService } from '../providers/data.service';
import { MatPaginator } from '@angular/material/paginator';
import { FormControl, FormGroup } from '@angular/forms';
import { subDays, format } from 'date-fns';
import { groupBy, map, forEach } from 'lodash';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-error-dash',
  templateUrl: './error-dash.component.html',
  styleUrls: ['./error-dash.component.css'],
})
export class ErrorDashComponent implements OnInit {
  protected http: ApiHttpService;
  length: number;

  searchForm: FormGroup = new FormGroup({
    appName: new FormControl(''),
    batchSource: new FormControl(''),
    entity: new FormControl(''),
  });

  errorDashData: errorDashModel[];
  selectedErrors: errorDashModel[];
  dataSource: MatTableDataSource<errorDashModel>;
  appNameOptions: string[] = [];
  batchSourceOptions: string[] = [];
  entityOptions: string[] = [];

  mostRecords: errorDashModel;
  highDollar: errorDashModel;
  lowDollar: errorDashModel;

  applicationNameFilter: string[] = [];
  batchSourceFilter: string[] = [];
  entityFilter: string[] = [];

  chartOptions = {
    responsive: true,
    elements: {
      line: {
        tension: 0.3,
      },
    },
  };

  chartData = [];
  chartLabels = [];

  chartDataAppName = [];
  // chartAppNameLabels = [];

  displayedColumns: string[] = [
    'select',
    // 'PERIOD_YEAR',
    'PERIOD_NAME',
    'APPLICATION_NAME',
    'BATCH_SOURCE',
    'ENTITY',
    'TRANSACTION_TYPE',
    'AMOUNT_USD',
    'NO_OF_RECORDS',
    // 'CREATION_DATE',
    // 'PROCESSED_DATE',
  ];

  constructor(
    http: ApiHttpService,
    private router: Router,
    private dataService: DataService
  ) {
    this.http = http;
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngOnInit(): void {
    this.getErrorSummary();
  }

  getErrorSummary() {
    this.http.get('error-summary').subscribe((data: any) => {
      this.errorDashData = data;
      this.dataSource = new MatTableDataSource(this.errorDashData);
      this.filterData();
      this.length = this.errorDashData.length;
      this.setSortAndPaginator();
      this.dataSource.filterPredicate = this.filterPredicate;
      this.mostRecords = this.getMostRecords();
      this.highDollar = this.getHighDollar();
      this.lowDollar = this.getLowDollar();

      // Find the most recent date of new data
      const mostRecentDataDate = new Date(
        Math.max(
          ...this.errorDashData.map((item) =>
            this.safariFriendlyDate(item.PROCESSED_DATE).getTime()
          )
        )
      );

      // look back 90 days from the most recent date
      const oneQuarterLookback = subDays(mostRecentDataDate, 90);

      const recentData = this.errorDashData.filter(
        (item) =>
          this.safariFriendlyDate(item.CREATION_DATE) >= oneQuarterLookback
      );

      // Sort recentData based on CREATION_DATE
      recentData.sort((a, b) => {
        return (
          this.safariFriendlyDate(a.CREATION_DATE).getTime() -
          this.safariFriendlyDate(b.CREATION_DATE).getTime()
        );
      });

      // Format the ISO date to just show the date
      recentData.forEach((item) => {
        item.FORMATTED_CREATION_DATE = format(
          this.safariFriendlyDate(item.CREATION_DATE),
          'M/d'
        );
        item.FORMATTED_PROCESSED_DATE = format(
          this.safariFriendlyDate(item.PROCESSED_DATE),
          'M/d'
        );
      });

      // Now you can create the set for chartLabels
      this.chartLabels = Array.from(
        new Set(recentData.map((item) => item.FORMATTED_CREATION_DATE))
      );

      // Batch Source Graph
      const groupedByBatchSource = groupBy(recentData, 'BATCH_SOURCE');

      this.chartData = map(
        groupedByBatchSource,
        (group, batchSource, index) => {
          const data = new Array(this.chartLabels.length).fill(0);

          forEach(group, (item) => {
            const index = this.chartLabels.indexOf(
              item.FORMATTED_CREATION_DATE
            );
            if (index !== -1) {
              data[index] = item.NO_OF_RECORDS;
            }
          });

          return {
            data,
            label: batchSource,
          };
        }
      );

      // Application Name Graph
      const groupedByAppName = groupBy(recentData, 'APPLICATION_NAME');

      this.chartDataAppName = [];

      forEach(groupedByAppName, (group, appName) => {
        const creationData = new Array(this.chartLabels.length).fill(0);
        const processedData = new Array(this.chartLabels.length).fill(0);

        forEach(group, (item) => {
          const creationIndex = this.chartLabels.indexOf(
            item.FORMATTED_CREATION_DATE
          );
          const processedIndex = this.chartLabels.indexOf(
            format(this.safariFriendlyDate(item.PROCESSED_DATE), 'M/d')
          );

          if (creationIndex !== -1) {
            creationData[creationIndex] = item.NO_OF_RECORDS;
          }

          if (processedIndex !== -1) {
            processedData[processedIndex] = item.NO_OF_RECORDS;
          }
        });

        // Add the creation data series
        this.chartDataAppName.push({
          data: creationData,
          label: `${appName} (Creation)`,
        });

        // Add the processed data series if it's "AI_ERROR" (or any other condition you want)
        if (appName === 'AI_ERROR') {
          this.chartDataAppName.push({
            data: processedData,
            label: `${appName} (Processed)`,
          });
        }
      });
    });
  }

  getMostRecords() {
    return this.errorDashData.reduce((prev, current) => {
      return prev.NO_OF_RECORDS > current.NO_OF_RECORDS ? prev : current;
    });
  }

  getHighDollar() {
    return this.errorDashData.reduce((prev, current) => {
      return prev.AMOUNT_USD > current.AMOUNT_USD ? prev : current;
    });
  }

  getLowDollar() {
    return this.errorDashData.reduce((prev, current) => {
      return prev.AMOUNT_USD < current.AMOUNT_USD ? prev : current;
    });
  }

  safariFriendlyDate(dateString: string): Date {
    const [date, time] = dateString.split('T');
    const [YYYY, MM, DD] = date.split('-').map((part) => parseInt(part, 10));
    const [HH, mm, ss] = time
      .split(':')
      .map((part) => parseInt(part.split('.')[0], 10));
    return new Date(YYYY, MM - 1, DD, HH, mm, ss);
  }

  filterData() {
    let appName = [];
    let batchSource = [];
    let entity = [];
    this.errorDashData.forEach((data) => {
      appName.push(data.APPLICATION_NAME);
      batchSource.push(data.BATCH_SOURCE);
      entity.push(data.ENTITY);
    });
    this.appNameOptions = [...new Set(appName)];
    this.batchSourceOptions = [...new Set(batchSource)];
    this.entityOptions = [...new Set(entity)];
  }

  filterPredicate = (data: errorDashModel, filter: any) => {
    const filters = JSON.parse(filter);
    const appNameMatch =
      filters.applicationNameFilter.length === 0 ||
      filters.applicationNameFilter.includes(data.APPLICATION_NAME);
    const batchSourceMatch =
      filters.batchSourceFilter.length === 0 ||
      filters.batchSourceFilter.includes(data.BATCH_SOURCE);
    const entityMatch =
      filters.entityFilter.length === 0 ||
      filters.entityFilter.includes(data.ENTITY);
    return appNameMatch && batchSourceMatch && entityMatch;
  };

  filter() {
    this.searchForm.valueChanges.subscribe((data) => {
      this.applicationNameFilter = data['appName'];
      this.batchSourceFilter = data['batchSource'];
      this.entityFilter = data['entity'];
      this.dataSource.filter = JSON.stringify({
        applicationNameFilter: this.applicationNameFilter,
        batchSourceFilter: this.batchSourceFilter,
        entityFilter: this.entityFilter,
      });
    });
  }

  selection = new SelectionModel<any>(true, []);
  selectedData: errorDashModel[] = [];

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  viewDetails(data?: errorDashModel) {
    if (data) {
      this.selectedData = [data];
      this.dataService.setErrorData(this.selectedData);
    } else if (this.selection.hasValue()) {
      this.selectedData = this.selection.selected;
      this.dataService.setErrorData(this.selectedData);
    }
    this.dataService.setAllErrorsSelected(this.isAllSelected());
    this.router.navigate(['/detail-view']);
  }

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  setSortAndPaginator() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  export(sheetName: string, filename: string) {
    if (this.isAllSelected() || this.selection.selected.length === 0) {
      this.exportTableToExcel(
        this.dataSource.filteredData,
        sheetName,
        filename
      );
    } else if (!this.isAllSelected()) {
      this.exportTableToExcel(this.selection.selected, sheetName, filename);
    }
  }
  exportTableToExcel(data: any[], sheetName: string, filename: string) {
    let worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    let workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    let excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    this.saveAsExcelFile(excelBuffer, filename);
  }

  saveAsExcelFile(buffer: any, filename: string) {
    let data: Blob = new Blob([buffer], { type: 'application/octet-stream' });
    let url = window.URL.createObjectURL(data); // temp URL that points to the generated excel file data buffer
    let link = document.createElement('a'); // create link
    link.href = url;
    link.download = filename + '.xlsx';
    link.click(); // triggers the download process and save file prompt in browser
    window.URL.revokeObjectURL(url); // revoke temp URL
  }
}

export interface errorDashModel {
  FORMATTED_CREATION_DATE: string;
  FORMATTED_PROCESSED_DATE: string;
  PERIOD_YEAR: number;
  PERIOD_NAME: number;
  APPLICATION_NAME: string;
  BATCH_SOURCE: string;
  ENTITY: string;
  TRANSACTION_TYPE: string;
  AMOUNT_USD: number;
  NO_OF_RECORDS: number;
  CREATION_DATE: string;
  PROCESSED_DATE: string;
}
