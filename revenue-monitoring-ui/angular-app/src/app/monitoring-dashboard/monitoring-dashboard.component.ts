import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Observable, takeUntil } from 'rxjs';
import { DataService } from '../providers/data.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ExportService } from './providers/export.service';
import { DataFormattingService } from './providers/data-formatting.service';
import { MonitoringDataService } from './providers/data.service';
import { UtilsService } from './providers/utils.service';
import { BaseComponent } from './shared/base.component';
import { HttpService } from './providers/http.service';

@Component({
  selector: 'app-monitoring-dashboard',
  templateUrl: './monitoring-dashboard.component.html',
  styleUrl: './monitoring-dashboard.component.css',
})
export class MonitoringDashboardComponent<T>
  extends BaseComponent
  implements OnInit, OnChanges
{
  @ViewChild('detailsPaginator') detailsPaginator: MatPaginator;
  @ViewChild('summaryPaginator') summaryPaginator: MatPaginator;
  @Input() urls: { [key: string]: string };
  @Input() keysToMap: string[];
  @Input() processFlowKeys: { [key: string]: number };
  @Input() periodStatus: any;
  @Input() componentName: string;
  @Input() processFlowTabsToDisplay: string[];
  @Input() subAppMapping: { [key: string]: string };
  @Input() dynamicTemplate: TemplateRef<any> | null = null;
  @Input() dynamicCss: string = '';
  @Input() isSubAppMapping: boolean = false;
  @Input() warningMessage: string = '';
  @Input() columnsToFilter: {
    formControlName: string;
    columnName: string;
    type: string;
    subAppMapping: boolean;
  }[];
  @Input() summaryColumnsToHide: string[] = [];
  @Input() detailsColumnsToHide: string[] = [];
  @Input() assignmentDialogFieldConfig: any[] = [];
  @Input() submitKeysToMap: string[] = [];
  @Input() webexKeysToMap: string[] = [];
  @Input() assignmentUsersFilter: string = '';
  // @Input() apiUrl: string;

  periodName: string = '';
  periodEnd: string = '';
  totalImpactData$: Observable<any>;
  updateUrl: string;
  webexUrl: string;
  searchForm: FormGroup = new FormGroup({});
  textFilters: any[] = [];
  selectFilters: any[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private dataService: DataService,
    private fb: FormBuilder,
    private exportService: ExportService,
    private dataFormattingService: DataFormattingService,
    private monitoringDataService: MonitoringDataService,
    private utilService: UtilsService,
    private httpService: HttpService
  ) {
    super();
  }
  ngOnInit(): void {
    // if (this.apiUrl) {
    //   this.httpService.setHostUrl(this.apiUrl);
    // }
    this.getErrorSummary();
    this.getErrorDetails();
    this.updateUrl = this.urls['summaryUpdateUrl'];
    this.webexUrl = this.urls['webexMessageUrl'];
    this.initializeForm();
    this.getProcessFlowTotals();
  }
  ngOnChanges(changes: SimpleChanges) {
    // if (changes['apiUrl'] && changes['apiUrl'].currentValue) {
    //   this.httpService.setHostUrl(changes['apiUrl'].currentValue);
    // }
    if (this.periodStatus) {
      this.periodName = this.periodStatus[0].PERIOD_NAME;
      this.periodEnd = this.dataFormattingService.dateTransform(
        this.periodStatus[0].END_DATE
      );
    }

    if (changes['columnsToFilter'] && this.columnsToFilter) {
      this.initializeForm();
    }
  }

  summaryLoadTime: string;
  summaryData: any[];
  summaryDatasource: any;
  summaryColumns: string[] = [];
  summaryDisplayedColumns: string[] = [];
  totalSummaryRecords: number = 0;
  summaryLoading: boolean = false;
  originalData: any[] = [];
  originalDetailsData: any[] = [];
  originalFilteredData: any[] = [];
  getErrorSummary() {
    this.summaryLoading = true;
    this.summaryLoadTime = `Last Updated: ...`;
    this.monitoringDataService
      .getSummary(this.urls['summaryUrl'])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.summaryData = this.dataFormattingService.formatData(data);
          if (this.summaryData.length > 0) {
            this.summaryColumns = Object.keys(this.summaryData[0]);
          }
          this.summaryColumns = this.summaryColumns.filter(
            (data) => !this.summaryColumnsToHide.includes(data)
          );
          this.summaryDisplayedColumns = ['select', ...this.summaryColumns];
          this.originalData = this.summaryData;
          this.summaryDatasource = new MatTableDataSource<T>(this.summaryData);
          if (this.summaryPaginator) {
            if (this.summaryDatasource.paginator !== this.summaryPaginator) {
              this.summaryDatasource.paginator = this.summaryPaginator;
            }
            this.totalSummaryRecords = this.summaryData.length;
          }
          this.summaryLoadTime = `Last Updated: ${new Date().toLocaleString()}`;
        },
        error: (err) => {
          console.error('Error fetching data', err);
          this.summaryLoading = false;
        },
        complete: () => {
          this.summaryLoading = false;
        },
      });
  }

  processFlowTotals: any[] = [];
  getProcessFlowTotals() {
    const params = { compName: this.componentName };
    this.httpService
      .get('process-flow-total', { params: params })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          console.log('Process flow totals:', data);
          this.processFlowTotals = data;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error fetching process flow totals', err);
        },
      });
  }

  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' | '' = '';
  sortData(column: string, sortOn: string) {
    this.sortDirection = this.dataFormattingService.getNextSortDirection(
      this.sortColumn,
      column,
      this.sortDirection
    );
    this.sortColumn = column;

    let dataArr, originalArr, dataSetter;
    if (sortOn === 'summary') {
      dataArr = this.summaryDatasource.data;
      originalArr = this.originalData;
      dataSetter = (d: any[]) => (this.summaryDatasource.data = d);
    } else if (sortOn === 'filteredDetails') {
      dataArr = this.filtereddataSource.data;
      originalArr = this.originalFilteredData;
      dataSetter = (d: any[]) => (this.filtereddataSource.data = d);
    } else {
      dataArr = this.dataSource.data;
      originalArr = this.originalDetailsData;
      dataSetter = (d: any[]) => (this.dataSource.data = d);
    }

    if (this.sortDirection === '') {
      dataSetter([...originalArr]);
    } else {
      dataSetter(
        this.dataFormattingService.sortData(dataArr, column, this.sortDirection)
      );
    }
  }

  getSortIcon(): string {
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  isSortedColumn(column: string): boolean {
    return this.sortColumn === column && this.sortDirection !== '';
  }

  isEscalated(element: any): boolean {
    const aging = element.AGING.split(' ')[0];
    return Number(aging) > 6;
  }

  escalationLevel: any = 0;
  getCircleNumber(element: any): any {
    const aging = Number(element.AGING.split(' ')[0]);
    if (aging >= 7 && aging <= 11) {
      this.escalationLevel = 1;
    } else if (aging > 11) {
      this.escalationLevel = 2;
    }
    return this.escalationLevel;
  }

  formatTimestamp(timestamp: string): string {
    if (!timestamp || !/^\d{14}$/.test(timestamp)) {
      return timestamp;
    }

    try {
      // Extract parts from the timestamp (format: yyyyMMddHHmmss)
      const year = timestamp.substring(0, 4);
      const month = timestamp.substring(4, 6);
      const day = timestamp.substring(6, 8);

      // Return formatted date (MM/dd/yyyy)
      return `${month}/${day}/${year}`;
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return timestamp;
    }
  }

  selection = new SelectionModel<any>(true, []);
  selectedSummaryData: any[] = [];
  isModalOpen: boolean = false;
  selectedRows: any[] = [];
  onRowSelectionChange(event: MatCheckboxChange, row: any) {
    this.selection.toggle(row);

    if (event.checked) {
      this.selectedRows.push(row);
    } else {
      this.selectedRows = this.selectedRows.filter(
        (selectedRow) => selectedRow !== row
      );
    }

    if (this.selectedRows.length > 0) {
      this.getErrorDetailsFiltered(this.selectedRows);
    } else {
      this.isFiltered = false;
      this.dataSource = new MatTableDataSource<T>(this.errorDetails);
      this.dataSource.paginator = this.detailsPaginator;
      this.filtereddataSource = null;
      this.detailsPaginator.length = this.totalRecords;
      this.filterData();
      this.cdr.detectChanges();
    }
  }

  viewDetails() {
    this.selectedSummaryData = this.selection.selected;
    if (!this.selectedSummaryData || this.selectedSummaryData.length === 0) {
      console.error('No data selected.');
      return;
    }
    this.openRowModal();
  }

  openRowModal(): void {
    if (!this.selectedSummaryData || this.selectedSummaryData.length === 0) {
      console.error('No selectedSummaryData found:', this.selectedSummaryData);
      return;
    }

    this.isModalOpen = true;
  }

  closeAssignModal(event: any): void {
    this.isModalOpen = false;
    if (event === 'successful') {
      this.resetSelection();
      this.summaryDatasource = null;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.getErrorSummary();
      }, 0);
    }
  }

  resetSelection() {
    this.selection.clear();
    this.selectedRows = [];
    this.isFiltered = false;
    this.filtereddataSource = null;
    this.filterData();
    this.cdr.detectChanges();
  }

  dataSource: any;
  errorDetails: any[];
  errorDetailsFiltered: any[];
  isFiltered: boolean = false;
  filtereddataSource: any;
  totalRecords: number = 0;
  isLoading: boolean = false;
  totalRecordsFiltered: number = 0;
  detailsDisplayedColumns: string[] = [];
  getErrorDetails() {
    this.isLoading = true;
    this.isFiltered = false;
    this.monitoringDataService
      .getDetails(this.urls['detailsUrl'])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.errorDetails = data;
          this.errorDetails = this.dataFormattingService.formatData(
            this.errorDetails
          );
          if (this.errorDetails.length > 0) {
            this.detailsDisplayedColumns = Object.keys(this.errorDetails[0]);
          }
          this.detailsDisplayedColumns = this.detailsDisplayedColumns.filter(
            (data) => !this.detailsColumnsToHide.includes(data)
          );
          this.errorDetails.forEach((row) => {
            this.detailsDisplayedColumns.forEach((column) => {
              if (row[column] === '-') {
                row[column] = '--';
              }
            });
          });
          this.originalDetailsData = this.errorDetails;
          this.dataSource = new MatTableDataSource<T>(this.errorDetails);
          if (this.detailsPaginator) {
            if (this.dataSource.paginator !== this.detailsPaginator) {
              this.dataSource.paginator = this.detailsPaginator;
            }
            this.totalRecords = this.errorDetails.length;
          }
          this.filterData();
          this.dataSource.filterPredicate = this.filterPredicate;
        },
        error: (err) => {
          console.error('Error fetching data', err);
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        },
      });
  }

  getErrorDetailsFiltered(data: any) {
    this.isLoading = true;
    this.isFiltered = true;
    this.monitoringDataService
      .getFilteredDetails(this.urls['filteredDetailsUrl'], data, this.keysToMap)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.errorDetailsFiltered = data.errorDetailsFiltered;
          this.errorDetailsFiltered = this.dataFormattingService.formatData(
            this.errorDetailsFiltered
          );
          this.originalFilteredData = this.errorDetailsFiltered;
          this.filtereddataSource = new MatTableDataSource<T>(
            this.errorDetailsFiltered
          );
          if (this.detailsPaginator) {
            this.filtereddataSource.paginator = this.detailsPaginator;
            setTimeout(() => {
              this.detailsPaginator.length = this.errorDetailsFiltered.length;
              this.cdr.detectChanges();
            });
            this.filterData();
            this.filtereddataSource.filterPredicate = this.filterPredicate;
          }
        },
        error: (err) => {
          console.error('Error fetching filtered data', err);
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        },
      });
  }

  filterOptions: { [key: string]: string[] } = {}; // Store dynamic filter options

  filterData() {
    this.filterOptions = this.utilService.filterDataForSelectFilters(
      this.filterOptions,
      this.selectFilters,
      this.errorDetails,
      this.isFiltered,
      this.errorDetailsFiltered
    );
  }

  private initializeForm() {
    const { form, textFilters, selectFilters } =
      this.utilService.initializeForm(this.columnsToFilter, this.searchForm);
    this.searchForm = form;
    this.textFilters = textFilters;
    this.selectFilters = selectFilters;
  }

  filter() {
    this.searchForm.valueChanges.subscribe(() => this.applyFilter());
  }

  applyFilter() {
    this.utilService.applyFilter(
      this.textFilters,
      this.selectFilters,
      this.searchForm,
      this.dataSource,
      this.filtereddataSource
    );
  }

  filterPredicate = (data: any, filter: string): boolean => {
    return this.utilService.filterPredicate(
      data,
      filter,
      this.selectFilters,
      this.textFilters
    );
  };

  clearFilters() {
    if (this.isFiltered) {
      this.filtereddataSource.filter = '';
    } else {
      this.dataSource.filter = '';
    }
    this.searchForm.reset();
  }

  replaceUnderscore(columnName: string): string {
    return this.dataFormattingService.replaceUnderscore(columnName);
  }

  exportSummary(data: any[], sheetName: string, filename: string) {
    this.exportService.exportTableToExcel(data, sheetName, filename);
  }
  exportDetails() {
    if (this.isFiltered) {
      this.exportService.exportTableToExcel(
        this.errorDetailsFiltered,
        this.exportService.generateSheetName(
          this.componentName + ' Error Details Filtered'
        ),
        this.componentName + '_Error_Details_Filtered'
      );
    } else {
      this.exportService.exportTableToExcel(
        this.errorDetails,
        this.exportService.generateSheetName(
          this.componentName + ' Error Details'
        ),
        this.componentName + '_Error_Details'
      );
    }
  }
}
