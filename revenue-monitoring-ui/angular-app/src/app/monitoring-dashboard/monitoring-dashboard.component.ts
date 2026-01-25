import {
  Component,
  computed,
  effect,
  input,
  signal,
  ViewChild,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Observable, takeUntil } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { ExportService } from './providers/export.service';
import { DataFormattingService } from './providers/data-formatting.service';
import { MonitoringDataService } from './providers/data.service';
import { UtilsService } from './providers/utils.service';
import { BaseComponent } from './shared/base.component';
import { HttpService } from './providers/http.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { UserAssignmentComponent } from './user-assignment/user-assignment.component';
import { ProcessFlowTooltipComponent } from './process-flow-tooltip/process-flow-tooltip.component';
import { LoadingSymbolComponent } from './shared/loading-symbol/loading-symbol.component';

export interface UserContext {
  username: string;
  userId: string;
  roles: string[];
  apiUrl: string;
  assignmentUsersFilterKey: string;
}

@Component({
  selector: 'app-monitoring-dashboard',
  templateUrl: './monitoring-dashboard.component.html',
  styleUrl: './monitoring-dashboard.component.css',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    UserAssignmentComponent,
    ProcessFlowTooltipComponent,
    LoadingSymbolComponent,
  ],
  standalone: true,
})
export class MonitoringDashboardComponent<T> extends BaseComponent {
  @ViewChild('detailsPaginator') detailsPaginator: MatPaginator;
  @ViewChild('summaryPaginator') summaryPaginator: MatPaginator;

  urls = input.required<{ [key: string]: string }>();
  keysToMap = input.required<string[]>();
  componentName = input.required<string>();
  columnsToFilter = input.required<
    {
      formControlName: string;
      columnName: string;
      type: string;
      subAppMapping: boolean;
    }[]
  >();
  summaryColumnsToHide = input<string[]>([]);
  detailsColumnsToHide = input<string[]>([]);
  assignmentDialogFieldConfig = input<any[]>([]);
  submitKeysToMap = input<string[]>([]);
  webexKeysToMap = input<string[]>([]);
  userContext = input.required<UserContext>();

  periodName = signal<string>('');
  periodEnd = signal<string>('');
  totalImpactData$: Observable<any>;
  updateUrl = signal<string>('');
  webexUrl = signal<string>('');
  searchForm: FormGroup = new FormGroup({});
  textFilters: any[] = [];
  selectFilters: any[] = [];
  isSubAppMapping: boolean = false;
  isModalOpen = signal<boolean>(false);

  constructor(
    private exportService: ExportService,
    private dataFormattingService: DataFormattingService,
    private monitoringDataService: MonitoringDataService,
    private utilService: UtilsService,
    private httpService: HttpService,
  ) {
    super();

    // Effect to handle userContext changes and set API URL
    effect(() => {
      const userContext = this.userContext();
      if (userContext?.apiUrl) {
        this.httpService.setHostUrl(userContext.apiUrl);
      } else {
        console.warn(
          'MonitoringDashboard - userContext or apiUrl not available',
        );
      }
    });

    // Effect to handle urls changes and initialize data fetching
    // allowSignalWrites: true allows the data fetching methods to update signals
    effect(
      () => {
        const urls = this.urls();
        this.updateUrl.set(urls['summaryUpdateUrl']);
        this.webexUrl.set(urls['webexMessageUrl']);

        // Fetch data when URLs are available
        this.getPeriodStatus();
        this.getErrorSummary();
        this.getErrorDetails();
        this.getProcessFlowTotals();
        this.getSummaryAssignableUsers();
      },
      { allowSignalWrites: true },
    );

    // Effect to handle columnsToFilter changes (replaces ngOnChanges)
    effect(() => {
      const columnsToFilter = this.columnsToFilter();
      if (columnsToFilter) {
        this.initializeForm();
      }
    });
  }

  getPeriodStatus() {
    this.monitoringDataService
      .getMonitoringPeriodStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          if (data && data.length > 0) {
            this.periodName.set(data[0].PERIOD_NAME);
            this.periodEnd.set(
              this.dataFormattingService.dateTransform(data[0].END_DATE),
            );
          }
        },
        error: (err) => {
          console.error('Error fetching period status', err);
        },
      });
  }

  getSummaryAssignableUsers() {
    return this.monitoringDataService.getAssignableUsers();
  }

  summaryLoadTime = signal<string>('');
  summaryData = signal<any[]>([]);
  summaryDatasource: any;
  summaryColumns: string[] = [];
  summaryDisplayedColumns: string[] = [];
  totalSummaryRecords: number = 0;
  summaryLoading = signal<boolean>(false);
  originalData = signal<any[]>([]);
  originalDetailsData = signal<any[]>([]);
  originalFilteredData = signal<any[]>([]);

  // Computed signals for derived data
  hasSelectedRows = computed(() => this.selectedRows().length > 0);
  hasSingleSelectedRow = computed(() => this.selectedRows().length === 1);
  canAssignUser = computed(() => this.selectedRows().length === 1);
  canResetSelection = computed(() => this.selectedRows().length > 0);
  hasSummaryData = computed(() => this.summaryData().length > 0);
  hasErrorDetails = computed(() => this.errorDetails().length > 0);
  hasErrorDetailsFiltered = computed(
    () => this.errorDetailsFiltered().length > 0,
  );

  getErrorSummary() {
    this.summaryLoading.set(true);
    this.summaryLoadTime.set(`Last Updated: ...`);
    this.monitoringDataService
      .getSummary(this.urls()['summaryUrl'])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          const formattedData = this.dataFormattingService.formatData(data);
          this.summaryData.set(formattedData);
          if (this.summaryData().length > 0) {
            this.summaryColumns = Object.keys(this.summaryData()[0]);
          }
          this.summaryColumns = this.summaryColumns.filter(
            (data) => !this.summaryColumnsToHide().includes(data),
          );
          this.summaryDisplayedColumns = ['select', ...this.summaryColumns];
          this.originalData.set(this.summaryData());
          this.summaryDatasource = new MatTableDataSource<T>(
            this.summaryData(),
          );
          if (this.summaryPaginator) {
            if (this.summaryDatasource.paginator !== this.summaryPaginator) {
              this.summaryDatasource.paginator = this.summaryPaginator;
            }
            this.totalSummaryRecords = this.summaryData().length;
          }
          this.summaryLoadTime.set(
            `Last Updated: ${new Date().toLocaleString()}`,
          );
        },
        error: (err) => {
          console.error('Error fetching data', err);
          this.summaryLoading.set(false);
        },
        complete: () => {
          this.summaryLoading.set(false);
        },
      });
  }

  processFlowTotals = signal<any[]>([]);
  getProcessFlowTotals() {
    const params = { compName: this.componentName() };
    this.httpService
      .get('process-flow-total', { params: params })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.processFlowTotals.set(data);
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
      this.sortDirection,
    );
    this.sortColumn = column;

    let dataArr, originalArr, dataSetter;
    if (sortOn === 'summary') {
      dataArr = this.summaryDatasource.data;
      originalArr = this.originalData();
      dataSetter = (d: any[]) => (this.summaryDatasource.data = d);
    } else if (sortOn === 'filteredDetails') {
      dataArr = this.filtereddataSource.data;
      originalArr = this.originalFilteredData();
      dataSetter = (d: any[]) => (this.filtereddataSource.data = d);
    } else {
      dataArr = this.dataSource.data;
      originalArr = this.originalDetailsData();
      dataSetter = (d: any[]) => (this.dataSource.data = d);
    }

    if (this.sortDirection === '') {
      dataSetter([...originalArr]);
    } else {
      dataSetter(
        this.dataFormattingService.sortData(
          dataArr,
          column,
          this.sortDirection,
        ),
      );
    }
  }

  getSortIcon(): string {
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  isSortedColumn(column: string): boolean {
    return this.sortColumn === column && this.sortDirection !== '';
  }

  selection = new SelectionModel<any>(true, []);
  selectedSummaryData = signal<any[]>([]);
  selectedRows = signal<any[]>([]);
  onRowSelectionChange(event: MatCheckboxChange, row: any) {
    this.selection.toggle(row);

    if (event.checked) {
      this.selectedRows.update((rows) => [...rows, row]);
    } else {
      this.selectedRows.update((rows) =>
        rows.filter((selectedRow) => selectedRow !== row),
      );
    }

    if (this.hasSelectedRows()) {
      this.getErrorDetailsFiltered(this.selectedRows());
    } else {
      this.isFiltered.set(false);
      this.dataSource = new MatTableDataSource<T>(this.errorDetails());
      this.dataSource.paginator = this.detailsPaginator;
      this.filtereddataSource = null;
      // Safety check: Only set paginator length if paginator is available
      if (this.detailsPaginator) {
        this.detailsPaginator.length = this.totalRecords;
      }
      this.filterData();
    }
  }

  viewDetails() {
    this.selectedSummaryData.set(this.selection.selected);
    if (
      !this.selectedSummaryData() ||
      this.selectedSummaryData().length === 0
    ) {
      console.error('No data selected.');
      return;
    }
    this.openRowModal();
  }

  openRowModal(): void {
    if (
      !this.selectedSummaryData() ||
      this.selectedSummaryData().length === 0
    ) {
      console.error(
        'No selectedSummaryData found:',
        this.selectedSummaryData(),
      );
      return;
    }

    this.isModalOpen.set(true);
  }

  closeAssignModal(event: any): void {
    this.isModalOpen.set(false);
    if (event === 'successful') {
      this.resetSelection();
      this.summaryDatasource = null;
      setTimeout(() => {
        this.getErrorSummary();
      }, 0);
    }
  }

  resetSelection() {
    this.selection.clear();
    this.selectedRows.set([]);
    this.isFiltered.set(false);
    this.filtereddataSource = null;
    this.filterData();
  }

  dataSource: any;
  errorDetails = signal<any[]>([]);
  errorDetailsFiltered = signal<any[]>([]);
  isFiltered = signal<boolean>(false);
  filtereddataSource: any;
  totalRecords: number = 0;
  isLoading = signal<boolean>(false);
  totalRecordsFiltered: number = 0;
  detailsDisplayedColumns: string[] = [];
  getErrorDetails() {
    this.isLoading.set(true);
    this.isFiltered.set(false);
    this.monitoringDataService
      .getDetails(this.urls()['detailsUrl'])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          let details = data;
          details = this.dataFormattingService.formatData(details);
          if (details.length > 0) {
            this.detailsDisplayedColumns = Object.keys(details[0]);
          }
          this.detailsDisplayedColumns = this.detailsDisplayedColumns.filter(
            (data) => !this.detailsColumnsToHide().includes(data),
          );
          details.forEach((row) => {
            this.detailsDisplayedColumns.forEach((column) => {
              if (row[column] === '-') {
                row[column] = '--';
              }
            });
          });
          this.errorDetails.set(details);
          this.originalDetailsData.set(this.errorDetails());
          this.dataSource = new MatTableDataSource<T>(this.errorDetails());
          if (this.detailsPaginator) {
            if (this.dataSource.paginator !== this.detailsPaginator) {
              this.dataSource.paginator = this.detailsPaginator;
            }
            this.totalRecords = this.errorDetails().length;
          }
          this.filterData();
          this.dataSource.filterPredicate = this.filterPredicate;
        },
        error: (err) => {
          console.error('Error fetching data', err);
          this.isLoading.set(false);
        },
        complete: () => {
          this.isLoading.set(false);
        },
      });
  }

  getErrorDetailsFiltered(data: any) {
    this.isLoading.set(true);
    this.isFiltered.set(true);
    this.monitoringDataService
      .getFilteredDetails(
        this.urls()['filteredDetailsUrl'],
        data,
        this.keysToMap(),
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          let filteredDetails = data.errorDetailsFiltered;
          filteredDetails =
            this.dataFormattingService.formatData(filteredDetails);
          this.errorDetailsFiltered.set(filteredDetails);
          this.originalFilteredData.set(this.errorDetailsFiltered());
          this.filtereddataSource = new MatTableDataSource<T>(
            this.errorDetailsFiltered(),
          );
          if (this.detailsPaginator) {
            this.filtereddataSource.paginator = this.detailsPaginator;
            setTimeout(() => {
              this.detailsPaginator.length = this.errorDetailsFiltered().length;
            });
            this.filterData();
            this.filtereddataSource.filterPredicate = this.filterPredicate;
          }
        },
        error: (err) => {
          console.error('Error fetching filtered data', err);
          this.isLoading.set(false);
        },
        complete: () => {
          this.isLoading.set(false);
        },
      });
  }

  filterOptions: { [key: string]: string[] } = {}; // Store dynamic filter options

  filterData() {
    this.filterOptions = this.utilService.filterDataForSelectFilters(
      this.filterOptions,
      this.selectFilters,
      this.errorDetails(),
      this.isFiltered(),
      this.errorDetailsFiltered(),
    );
  }

  private initializeForm() {
    const { form, textFilters, selectFilters } =
      this.utilService.initializeForm(this.columnsToFilter(), this.searchForm);
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
      this.filtereddataSource,
    );
  }

  filterPredicate = (data: any, filter: string): boolean => {
    return this.utilService.filterPredicate(
      data,
      filter,
      this.selectFilters,
      this.textFilters,
    );
  };

  clearFilters() {
    if (this.isFiltered()) {
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
    if (this.isFiltered()) {
      this.exportService.exportTableToExcel(
        this.errorDetailsFiltered(),
        this.exportService.generateSheetName(
          this.componentName() + ' Error Details Filtered',
        ),
        this.componentName() + '_Error_Details_Filtered',
      );
    } else if (this.errorDetails().length) {
      this.exportService.exportTableToExcel(
        this.errorDetails(),
        this.exportService.generateSheetName(
          this.componentName() + ' Error Details',
        ),
        this.componentName() + '_Error_Details',
      );
    } else {
      console.warn('No data available to export');
    }
  }
}
