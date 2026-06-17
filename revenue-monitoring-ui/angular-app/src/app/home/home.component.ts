import {
  Component,
  HostBinding,
  HostListener,
  OnDestroy,
  signal,
  computed,
  Injector,
} from '@angular/core';
import { Router } from '@angular/router';
import { ApiHttpService } from '../providers/http.service';
import { DataService } from '../providers/data.service';
import { DestroyManager } from '../providers/destroy-manager.service';
import { AuthenticationService } from '../providers/authentication.service';
import { HomeDataService } from './home-data.service';
import { ExportService } from '../monitoring-dashboard/providers/export.service';
import { ThemeService } from '../providers/theme.service';
import { MatTableDataSource } from '@angular/material/table';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';

echarts.use([
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { PaginationComponent } from '../ui/atoms/pagination/pagination.component';
import { PageChangeEvent } from '../ui';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoadingSymbolComponent } from '../loading-symbol/loading-symbol.component';
import { LoadingSymbolSmallComponent } from '../loading-symbol-small/loading-symbol-small.component';
import {
  ActionButtonConfig,
  FilterButtonBarComponent,
  FilterConfig,
  FilterValues,
} from '../components/filter-button-bar/filter-button-bar.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [provideEchartsCore({ echarts }), DestroyManager],
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatTableModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    LoadingSymbolComponent,
    LoadingSymbolSmallComponent,
    PaginationComponent,
    FilterButtonBarComponent,
    NgxEchartsDirective,
  ],
  standalone: true,
})
export class HomeComponent implements OnDestroy {
  @HostBinding('class.dark-theme') get darkThemeClass() {
    return this.themeService.isDarkMode;
  }
  constructor(
    private router: Router,
    private http: ApiHttpService,
    private dataService: DataService,
    private destroyManager: DestroyManager,
    private authService: AuthenticationService,
    private homeDataService: HomeDataService,
    private injector: Injector,
    private exportService: ExportService,
    public themeService: ThemeService,
  ) {
    // Initialize user info
    this.userRoles.set(this.authService.getUserAccessRoles());
    this.username.set(this.authService.getUserName());

    // Re-render charts when theme changes
    this.themeService.isDarkMode$.subscribe(() => {
      this.rebuildChartsForTheme();
    });

    // Load dashboard data
    this.loadDashboardData();
  }

  // Dashboard data signals
  dashboardData = signal<any>(null);
  periodInfo = signal<any>(null);
  highPriorityKpis = signal<any>(null);
  issueKpis = signal<any>(null);
  charts = signal<any>(null);
  issuesList = signal<any[]>([]);
  // Mat Table integration
  displayedColumns: string[] = [];
  displayedColumnsWithSelect: string[] = [];
  dataSource: any;
  paginatedDataSource: any;
  searchTerm = signal<string>('');
  currentPage = 0;
  pageSize = 10;

  // Chart options (ECharts)
  transactionFailuresChartOptions: EChartsOption = {};
  espCasesChartOptions: EChartsOption = {};

  // SVG Donut state
  donutSlices = signal<
    {
      label: string;
      dasharray: string;
      dashoffset: number;
      color: string;
      colorEnd: string;
    }[]
  >([]);
  donutTotal = signal<string>('0');

  // Issue distribution legends (dynamic)
  issueDistributionLegends = signal<
    { label: string; value: number; color: string }[]
  >([]);

  // Computed signals
  hasActiveFilters = computed(() => this.activeFilters().length > 0);
  resultCount = signal(0);

  // Reusable filter bar state
  activeFilters = signal<{ key: string; value: string }[]>([]);
  filterConfigs: FilterConfig[] = [
    {
      id: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search this table',
    },
    {
      id: 'status',
      label: 'Status',
      type: 'multi-select',
      placeholder: 'Select Status',
      options: [],
    },
  ];
  filterValues: FilterValues = {
    search: '',
    status: [],
  };

  get actionButtons(): ActionButtonConfig[] {
    return [
      {
        id: 'download',
        label: 'Download',
        variant: 'secondary',
        icon: 'phosphorArrowLineDownBold',
        visible: true,
        disabled: this.resultCount() === 0,
      },
    ];
  }

  // Loading states
  homeLoading = signal<boolean>(true);
  dataLoading = signal<boolean>(true);
  transactionFailuresLoading = signal<boolean>(true);
  espCasesLoading = signal<boolean>(true);
  issueDistributionLoading = signal<boolean>(true);

  // User info
  userRoles = signal<any>(null);
  username = signal<string>('');

  // ── Quarter filter state ──
  selectedQuarter = signal<string>('');
  showQuarterDropdown = signal<boolean>(false);
  availableQuarters = signal<{ label: string; value: string }[]>([]);
  private rawEspCasesData: any[] = [];
  private rawHighPriorityData: any[] = [];
  private rawTransactionFailuresData: any[] = [];
  private rawIssuesListData: any[] = [];
  private rawIssuesData: any[] = [];
  private rawIssuesDistributionData: any[] = [];

  /** Close the quarter dropdown when clicking outside */
  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.showQuarterDropdown()) {
      this.showQuarterDropdown.set(false);
    }
  }

  /** Get the display label for the current quarter */
  get selectedQuarterLabel(): string {
    const q = this.selectedQuarter();
    const match = this.availableQuarters().find((item) => item.value === q);
    return match ? match.label : q || '—';
  }

  /** Toggle the quarter dropdown */
  toggleQuarterDropdown(event: Event): void {
    event.stopPropagation();
    this.showQuarterDropdown.update((v) => !v);
  }

  /** Select a quarter, close dropdown, and re-filter all datasets */
  selectQuarter(quarter: string): void {
    this.selectedQuarter.set(quarter);
    this.showQuarterDropdown.set(false);
    this.applyHighPriorityQuarterFilter();
    this.applyTransactionFailuresQuarterFilter();
    this.applyEspCasesQuarterFilter();
    this.applyIssuesQuarterFilter();
    this.applyIssuesDistributionQuarterFilter();
    this.applyIssuesListQuarterFilter();
  }

  /**
   * Load all dashboard data
   */
  loadDashboardData(): void {
    this.dataLoading.set(true);
    this.homeLoading.set(true);

    // Load all data
    this.loadPeriodInfo();
    this.loadHighPriorityIssues();
    this.loadIssues();
    this.loadIssuesDistribution();
    this.loadTransactionFailures();
    this.loadEspCases();
    this.loadIssuesList();
  }

  /**
   * Load period information
   */
  private loadPeriodInfo(): void {
    this.homeDataService.getPeriodInfo(this.destroyManager).subscribe({
      next: (periodData) => {
        this.periodInfo.set(periodData);
      },
      error: (error) => {
        console.error('Error loading period info:', error);
        this.periodInfo.set({
          periodName: '',
          periodEndDate: '',
          lastUpdated: new Date().toLocaleString(),
        });
      },
    });
  }

  /**
   * Load high priority issues
   */
  private loadHighPriorityIssues(): void {
    this.homeDataService.getHighPriorityIssues(this.destroyManager).subscribe({
      next: (highPriorityIssues) => {
        console.log('High Priority Issues:', highPriorityIssues);
        this.rawHighPriorityData =
          highPriorityIssues && highPriorityIssues.length > 0
            ? highPriorityIssues
            : [];
        this.rebuildAvailableQuarters();
        this.applyHighPriorityQuarterFilter();
      },
      error: (error) => {
        console.error('Error loading high priority issues:', error);
      },
    });
  }

  /**
   * Load issues data
   */
  private loadIssues(): void {
    this.homeDataService.getIssues(this.destroyManager).subscribe({
      next: (issues) => {
        console.log('Issues from real service:', issues);
        this.rawIssuesData = issues && issues.length > 0 ? issues : [];
        this.rebuildAvailableQuarters();
        this.applyIssuesQuarterFilter();
      },
      error: (error) => {
        console.error('Error loading issues:', error);
      },
    });
  }

  /**
   * Load transaction failures data
   */
  private loadTransactionFailures(): void {
    this.homeDataService.getTransactionFailures(this.destroyManager).subscribe({
      next: (data) => {
        console.log('Transaction Failures API Response:', data);
        this.rawTransactionFailuresData = data && data.length > 0 ? data : [];
        this.rebuildAvailableQuarters();
        this.applyTransactionFailuresQuarterFilter();
      },
      error: (error) => {
        console.error('Error loading transaction failures:', error);
        this.transactionFailuresLoading.set(false);
      },
    });
  }

  /**
   * Load ESP cases data
   */
  private loadEspCases(): void {
    this.homeDataService.getEspCases(this.destroyManager).subscribe({
      next: (data) => {
        console.log('ESP Cases API Response:', data);

        // Store raw data for re-filtering on quarter change
        this.rawEspCasesData = data && data.length > 0 ? data : [];

        // ── Rebuild available quarters from all datasets ──
        this.rebuildAvailableQuarters();

        // Render chart with the selected quarter
        this.applyEspCasesQuarterFilter();
      },
      error: (error) => {
        console.error('Error loading ESP cases:', error);
        this.espCasesLoading.set(false);
      },
    });
  }

  /**
   * Merge quarters from ALL raw datasets (ESP → FISCAL_QTR, others → QUARTER),
   * sort newest-first, and default selectedQuarter to the latest.
   */
  private rebuildAvailableQuarters(): void {
    const extract = (data: any[], field: string): string[] =>
      (data || [])
        .map((item: any) => ((item[field] || '') as string).trim())
        .filter((q: string) => !!q);

    const allValues = [
      ...extract(this.rawEspCasesData, 'FISCAL_QTR'),
      ...extract(this.rawHighPriorityData, 'QUARTER'),
      ...extract(this.rawTransactionFailuresData, 'QUARTER'),
      ...extract(this.rawIssuesData, 'QUARTER'),
      ...extract(this.rawIssuesDistributionData, 'FISCAL_QTR'),
      ...extract(this.rawIssuesListData, 'QUARTER'),
    ];

    const unique = Array.from(new Set(allValues));

    // Sort newest first (e.g. Q4FY26 before Q1FY26)
    unique.sort((a, b) => {
      const parse = (val: string) => {
        const m = val.match(/Q(\d)FY(\d+)/i);
        return m ? { q: Number(m[1]), fy: Number(m[2]) } : { q: 0, fy: 0 };
      };
      const pa = parse(a);
      const pb = parse(b);
      return pa.fy !== pb.fy ? pb.fy - pa.fy : pb.q - pa.q;
    });

    this.availableQuarters.set(
      unique.map((v) => ({ value: v, label: v.replace('FY', ' FY') })),
    );

    // Default to the latest quarter if nothing is selected yet
    const current = this.selectedQuarter();
    if (!current || !unique.includes(current)) {
      this.selectedQuarter.set(unique[0] || '');
    }
  }

  /**
   * Re-filter raw ESP data by the currently selected quarter
   * and rebuild the ESP Cases chart.
   */
  private applyEspCasesQuarterFilter(): void {
    const quarter = this.selectedQuarter();
    const data = this.rawEspCasesData;

    const weekMap = new Map<
      number,
      {
        totalCases: number;
        resolvedAgent: number;
        resolvedOps: number;
        inProgress: number;
      }
    >();

    if (data && data.length > 0) {
      data
        .filter((item: any) => item.FISCAL_QTR === quarter)
        .forEach((item: any) => {
          const weekNum = Number(item.WEEK_NUMBER) || 0;
          weekMap.set(weekNum, {
            totalCases: Number(item.TOTAL_CASES) || 0,
            resolvedAgent: Number(item.RESOLVED_AGENT) || 0,
            resolvedOps: Number(item.RESOLVED_OPS) || 0,
            inProgress: Number(item.IN_PROGRESS) || 0,
          });
        });
    }

    // Always use a fixed range of weeks: Week 1 to Week 13
    const fixedWeeks = Array.from({ length: 13 }, (_, i) => `Week ${i + 1}`);
    const defaultWeek = {
      totalCases: 0,
      resolvedAgent: 0,
      resolvedOps: 0,
      inProgress: 0,
    };

    const chartData = {
      weeks: fixedWeeks,
      totalCases: fixedWeeks.map(
        (_, i) => (weekMap.get(i + 1) || defaultWeek).totalCases,
      ),
      resolvedAgent: fixedWeeks.map(
        (_, i) => (weekMap.get(i + 1) || defaultWeek).resolvedAgent,
      ),
      resolvedOps: fixedWeeks.map(
        (_, i) => (weekMap.get(i + 1) || defaultWeek).resolvedOps,
      ),
      inProgress: fixedWeeks.map(
        (_, i) => (weekMap.get(i + 1) || defaultWeek).inProgress,
      ),
    };

    console.log('Parsed ESP Cases chart data:', chartData);
    // Show canvas instead of loader, then build chart when canvas is ready
    this.espCasesLoading.set(false);
    this.buildEspCasesChart(chartData);
  }

  /**
   * Re-filter raw High Priority data by the currently selected quarter
   * and rebuild the KPI bar.
   */
  private applyHighPriorityQuarterFilter(): void {
    const quarter = this.selectedQuarter();
    const data = this.rawHighPriorityData;

    if (!data || data.length === 0) return;

    const filtered = quarter
      ? data.filter((item: any) => item.QUARTER === quarter)
      : data;

    if (filtered.length > 0) {
      this.highPriorityKpis.set({
        highPriorityIssues: filtered[0].HIGH_PRIORITY_ISSUES || 0,
        inProgress: filtered[0].IN_PROGRESS || 0,
        totalAging: filtered[0].TOTAL_AGING || 0,
        lessThan48Hours: filtered[0]['<48 Hours'] || 0,
        moreThan48Hours: filtered[0]['>48 Hours'] || 0,
      });
    } else {
      this.highPriorityKpis.set({
        highPriorityIssues: 0,
        inProgress: 0,
        totalAging: 0,
        lessThan48Hours: 0,
        moreThan48Hours: 0,
      });
    }
  }

  /**
   * Re-filter raw Transaction Failures data by the currently selected quarter
   * and rebuild the Transaction Failures chart.
   */
  private applyTransactionFailuresQuarterFilter(): void {
    const quarter = this.selectedQuarter();
    const data = this.rawTransactionFailuresData;

    const weekMap = new Map<
      string,
      {
        totalIssues: number;
        inProgress: number;
        resolvedOps: number;
        resolvedAgent: number;
      }
    >();

    if (data && data.length > 0) {
      const filtered = quarter
        ? data.filter((item: any) => item.QUARTER === quarter)
        : data;

      filtered.forEach((item: any) => {
        const weekNum = item.WEEK_NUMBER;
        const weekLabel = `Week ${weekNum}`;
        const count = item.COUNT || 0;
        const category = (item.CATEGORY || '').toString().toLowerCase().trim();

        if (!weekMap.has(weekLabel)) {
          weekMap.set(weekLabel, {
            totalIssues: 0,
            inProgress: 0,
            resolvedOps: 0,
            resolvedAgent: 0,
          });
        }

        const weekData = weekMap.get(weekLabel)!;
        if (category === 'total issue' || category === 'total issues') {
          weekData.totalIssues = count;
        } else if (category === 'in progress') {
          weekData.inProgress = count;
        } else if (category === 'resolved (ops)') {
          weekData.resolvedOps = count;
        } else if (category === 'resolved (agent)') {
          weekData.resolvedAgent = count;
        }
      });
    }

    // Always use a fixed range of weeks: Week 1 to Week 13
    const fixedWeeks = Array.from({ length: 13 }, (_, i) => `Week ${i + 1}`);
    const defaultWeek = {
      totalIssues: 0,
      inProgress: 0,
      resolvedOps: 0,
      resolvedAgent: 0,
    };

    const chartData = {
      weeks: fixedWeeks,
      totalIssues: fixedWeeks.map(
        (week) => (weekMap.get(week) || defaultWeek).totalIssues,
      ),
      inProgress: fixedWeeks.map(
        (week) => (weekMap.get(week) || defaultWeek).inProgress,
      ),
      resolvedOps: fixedWeeks.map(
        (week) => (weekMap.get(week) || defaultWeek).resolvedOps,
      ),
      resolvedAgent: fixedWeeks.map(
        (week) => (weekMap.get(week) || defaultWeek).resolvedAgent,
      ),
    };

    console.log('Parsed Transaction Failures chart data:', chartData);
    this.transactionFailuresLoading.set(false);
    this.buildTransactionFailuresChart(chartData);
  }

  /**
   * Re-filter raw Issues data by the currently selected quarter
   * and rebuild the issue KPI bar.
   */
  private applyIssuesQuarterFilter(): void {
    const quarter = this.selectedQuarter();
    const data = this.rawIssuesData;

    if (!data || data.length === 0) return;

    const filtered = quarter
      ? data.filter((item: any) => item.FISCAL_QTR === quarter)
      : data;

    if (filtered.length > 0) {
      // Use the second element (index 1) as original logic did
      const row = filtered.length > 1 ? filtered[1] : filtered[0];
      this.issueKpis.set({
        total: row?.TOTAL_ISSUES || 0,
        resolved: row?.RESOLVED || 0,
        inProgress: row?.IN_PROGRESS || 0,
        assigned: row?.ASSIGNED || 0,
        unassigned: row?.UNASSIGNED || 0,
      });
    } else {
      this.issueKpis.set({
        total: 0,
        resolved: 0,
        inProgress: 0,
        assigned: 0,
        unassigned: 0,
      });
    }
    this.refreshIssueDistributionCenterText();
    console.log('Updated issue KPIs:', this.issueKpis());
  }

  /**
   * Re-filter raw Issues Distribution data by the currently selected quarter
   * and rebuild the doughnut chart.
   */
  private applyIssuesDistributionQuarterFilter(): void {
    const quarter = this.selectedQuarter();
    const data = this.rawIssuesDistributionData;

    let resolvedAgentPct = 0;
    let resolvedOpsPct = 0;
    let resolvedAgentCount = 0;
    let resolvedOpsCount = 0;
    let totalIssues = 0;

    if (data && data.length > 0) {
      const filtered = quarter
        ? data.filter((item: any) => item.FISCAL_QTR === quarter)
        : data;

      if (filtered.length > 0) {
        const row = filtered[0];
        resolvedAgentPct = Number(row.RESOLVED_AGENT_PRECENTAGE) || 0;
        resolvedOpsPct = Number(row.RESOLVED_OPS_PRECENTAGE) || 0;
        resolvedAgentCount = Number(row.RESOLVED_AGENT) || 0;
        resolvedOpsCount = Number(row.RESOLVED_OPS) || 0;
        totalIssues = Number(row.TOTAL_ISSUES) || 0;
      }
    }

    console.log('Parsed distribution:', {
      resolvedAgentPct,
      resolvedOpsPct,
      resolvedAgentCount,
      resolvedOpsCount,
      totalIssues,
    });
    this.issueDistributionLoading.set(false);
    this.buildIssueDistributionChart(
      resolvedAgentPct,
      resolvedOpsPct,
      resolvedAgentCount,
      resolvedOpsCount,
      totalIssues,
    );
  }

  /**
   * Re-filter raw Issues List data by the currently selected quarter
   * and rebuild the issues table.
   */
  private applyIssuesListQuarterFilter(): void {
    const quarter = this.selectedQuarter();
    const data = this.rawIssuesListData;

    if (!data || data.length === 0) return;

    const filtered = quarter
      ? data.filter((item: any) => item.QUARTER === quarter)
      : data;

    this.issuesList.set(filtered);
    if (filtered.length > 0) {
      // Hide FISCAL_QTR and QUARTER columns from the table
      this.displayedColumns = Object.keys(filtered[0]).filter(
        (col) => col !== 'FISCAL_QTR' && col !== 'QUARTER',
      );
      this.displayedColumnsWithSelect = [...this.displayedColumns];
    }

    this.dataSource = new MatTableDataSource<any>(filtered);
    this.rebuildFilterConfigs(filtered);
    this.updateTableFilter();
    this.currentPage = 0;
    this.paginateTable();
  }

  /**
   * Load issues distribution data
   */
  private loadIssuesDistribution(): void {
    this.homeDataService.getIssuesDistribution(this.destroyManager).subscribe({
      next: (data) => {
        console.log('Issues Distribution API Response:', data);
        this.rawIssuesDistributionData = data && data.length > 0 ? data : [];
        this.rebuildAvailableQuarters();
        this.applyIssuesDistributionQuarterFilter();
      },
      error: (error) => {
        console.error('Error loading issues distribution:', error);
        this.issueDistributionLoading.set(false);
      },
    });
  }

  /**
   * Load issues list data
   */
  loadIssuesList(): void {
    this.homeDataService.getIssuesList(this.destroyManager).subscribe({
      next: (issuesList) => {
        console.log('Issues list loaded:', issuesList);
        this.rawIssuesListData =
          issuesList && issuesList.length > 0 ? issuesList : [];
        this.rebuildAvailableQuarters();
        this.applyIssuesListQuarterFilter();

        this.dataLoading.set(false);
        this.homeLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading issues list:', error);
        this.dataLoading.set(false);
        this.homeLoading.set(false);
      },
    });
  }

  /**
   * Handle page change from app-pagination
   */
  onPageChange(event: PageChangeEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.paginateTable();
  }

  /**
   * Slice filtered data for the current page
   */
  private paginateTable(): void {
    if (!this.dataSource) return;
    const filtered = this.dataSource.filteredData || this.dataSource.data || [];
    this.resultCount.set(filtered.length);
    const start = this.currentPage * this.pageSize;
    this.paginatedDataSource = new MatTableDataSource<any>(
      filtered.slice(start, start + this.pageSize),
    );
  }

  navigateTo(page: string): void {
    this.router.navigate([page]);
  }

  exportIssuesToExcel(): void {
    if (!this.dataSource) {
      return;
    }

    const rawData: any[] =
      this.dataSource.filteredData && this.dataSource.filteredData.length
        ? this.dataSource.filteredData
        : this.dataSource.data || [];

    if (!rawData || rawData.length === 0) {
      return;
    }

    const exportData = rawData.map((row) => {
      const mapped: any = {};
      this.displayedColumns.forEach((col) => {
        const header = this.replaceUnderscore(col) || col;
        mapped[header] = row[col];
      });
      return mapped;
    });

    const sheetName = this.exportService.generateSheetName('Issues List');
    const filename = `issues-list-${new Date().toISOString().slice(0, 10)}`;
    this.exportService.exportTableToExcel(exportData, sheetName, filename);
  }

  formatData(data): any[] {
    let formattedAmount;
    formattedAmount = `$${Number(data).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;

    return formattedAmount;
  }

  // ------------ Table filters & search ------------

  onFilterChange(values: FilterValues): void {
    this.filterValues = values;
    const statusValues = Array.isArray(values['status'])
      ? (values['status'] as string[])
      : [];
    const searchValue = (values['search'] as string) || '';

    this.activeFilters.set(
      statusValues.map((status) => ({ key: 'status', value: status })),
    );
    this.searchTerm.set(searchValue);
    this.updateTableFilter();
  }

  onFilterClear(): void {
    this.filterValues = {
      search: '',
      status: [],
    };
    this.activeFilters.set([]);
    this.searchTerm.set('');
    this.updateTableFilter();
  }

  onActionButtonClick(actionId: string): void {
    if (actionId === 'download') {
      this.exportIssuesToExcel();
    }
  }

  private rebuildFilterConfigs(rows: any[]): void {
    const statusValues = Array.from(
      new Set(
        (rows || [])
          .map((row) => this.getRowFieldValue(row, 'status'))
          .filter((value) => !!value),
      ),
    );

    this.filterConfigs = [
      {
        id: 'search',
        label: 'Search',
        type: 'text',
        placeholder: 'Search this table',
      },
      {
        id: 'status',
        label: 'Status',
        type: 'multi-select',
        placeholder: 'Select Status',
        options: statusValues.map((value) => ({ label: value, value })),
      },
    ];
  }

  /**
   * Filter table by assignee category from pie chart click
   */
  filterByAssignee(category: string): void {
    this.activeFilters.set([{ key: 'assignedTo', value: category }]);
    this.updateTableFilter();
  }

  /**
   * Unified filtering (status filters + assignee filters + search)
   */
  private updateTableFilter(): void {
    if (!this.dataSource) return;

    const filtersSnapshot = [...this.activeFilters()];
    const searchValue = this.searchTerm().toLowerCase().trim();

    // Build map of key -> allowed values (lowercased)
    const filterMap = new Map<string, Set<string>>();
    filtersSnapshot.forEach(({ key, value }) => {
      const normalizedKey = key;
      const val = (value ?? '').toString().toLowerCase();
      if (!filterMap.has(normalizedKey)) {
        filterMap.set(normalizedKey, new Set<string>());
      }
      filterMap.get(normalizedKey)!.add(val);
    });

    this.dataSource.filterPredicate = (row: any, _filter: string) => {
      // 1) Apply key-based filters
      if (filterMap.size > 0) {
        for (const [key, values] of filterMap.entries()) {
          if (key === 'assignedTo') {
            const assignedTo = this.getAssignedToValue(row).toLowerCase();
            const category = this.getAssigneeCategory(assignedTo);
            if (!values.has(category)) {
              return false;
            }
          } else {
            const rowVal = this.getRowFieldValue(row, key).toLowerCase();
            if (!rowVal || !values.has(rowVal)) {
              return false;
            }
          }
        }
      }

      // 2) Apply free-text search across all values
      if (searchValue) {
        const concatenated = Object.values(row)
          .join(' ')
          .toString()
          .toLowerCase();
        if (!concatenated.includes(searchValue)) {
          return false;
        }
      }

      return true;
    };

    // Trigger predicate; filter string content is ignored
    this.dataSource.filter = 'active';

    this.currentPage = 0;
    this.paginateTable();
  }

  /**
   * Safely get a row field by logical key (e.g., 'status')
   */
  private getRowFieldValue(row: any, key: string): string {
    if (!row) return '';

    if (row[key] !== undefined && row[key] !== null) {
      return row[key].toString().trim();
    }

    const lowerKey = key.toLowerCase();
    const matchKey = Object.keys(row).find((k) => {
      const lk = k.toLowerCase();
      return lk === lowerKey || lk.includes(lowerKey);
    });

    if (matchKey && row[matchKey] !== undefined && row[matchKey] !== null) {
      return row[matchKey].toString().trim();
    }

    return '';
  }

  /**
   * Extract assigned-to string from a row, handling different field names
   */
  private getAssignedToValue(row: any): string {
    if (!row) return '';

    const keys = Object.keys(row);
    const assignedKey = keys.find((k) => k.toLowerCase().includes('assigned'));
    if (assignedKey && row[assignedKey] != null) {
      return row[assignedKey].toString().trim();
    }
    return '';
  }

  /**
   * Map an assignee name to a logical category used by filters
   */
  private getAssigneeCategory(assignedToLower: string): string {
    const name = (assignedToLower || '').trim().toLowerCase();
    if (!name || name === 'unassigned') {
      return 'unassigned';
    }
    if (name === 'ai agent') {
      return 'ai agent';
    }
    // Treat all other names as "human" category
    return 'human';
  }

  /**
   * No-op: kept for API compatibility. SVG donut is signal-driven.
   */
  private refreshIssueDistributionCenterText(): void {
    // SVG donut updates automatically via signals
  }

  specialWords: string[] = [
    'name',
    'amount',
    'interface',
    'error',
    'number',
    'total',
    'hold',
    'pending',
    'status',
    'num',
    'year',
    'status',
    'sub',
    'staging',
    'id',
    'line',
  ];

  skippedWords: string[] = ['IOL', 'AR', 'ID'];

  replaceUnderscore(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    return value
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => {
        if (!this.skippedWords.includes(word)) {
          const lowerWord = word.toLowerCase();
          if (this.specialWords.includes(lowerWord)) {
            return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
          }
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        } else {
          return word;
        }
      })
      .join(' ');
  }

  private commonLineOptions(
    color: string,
    dashed: boolean = false,
    dotted: boolean = false,
  ) {
    return {
      type: 'line' as const,
      borderColor: color,
      backgroundColor: color,
      tension: 0.25,
      pointRadius: 0,
      pointHoverRadius: 0,
      borderWidth: 1.8,
      fill: false,
      spanGaps: true,
      borderDash: dashed ? [6, 6] : dotted ? [2, 4] : [],
    };
  }

  private buildTransactionFailuresChart(chartData: any): void {
    const totalIssuesSum = (chartData.totalIssues || []).reduce(
      (sum: number, value: number) => sum + (Number(value) || 0),
      0,
    );
    const totalIssuesLabel = `Total Issues (${totalIssuesSum.toLocaleString('en-US')})`;

    const inProgressSum = (chartData.inProgress || []).reduce(
      (sum: number, value: number) => sum + (Number(value) || 0),
      0,
    );
    const inProgressLabel = `In Progress (${inProgressSum.toLocaleString('en-US')})`;

    const resolvedOpsSum = (chartData.resolvedOps || []).reduce(
      (sum: number, value: number) => sum + (Number(value) || 0),
      0,
    );
    const resolvedOpsLabel = `Resolved (Ops) (${resolvedOpsSum.toLocaleString('en-US')})`;

    const resolvedAgentSum = (chartData.resolvedAgent || []).reduce(
      (sum: number, value: number) => sum + (Number(value) || 0),
      0,
    );
    const resolvedAgentLabel = `Resolved (Agent) (${resolvedAgentSum.toLocaleString('en-US')})`;

    const weeks = (chartData.weeks || []).map(
      (_: any, i: number) => `Week ${i + 1}`,
    );

    this.transactionFailuresChartOptions = this.buildMixedChartOptions(
      weeks,
      chartData.totalIssues,
      chartData.inProgress,
      chartData.resolvedOps,
      chartData.resolvedAgent,
      totalIssuesLabel,
      inProgressLabel,
      resolvedOpsLabel,
      resolvedAgentLabel,
    );
  }

  private buildEspCasesChart(chartData: any): void {
    const totalCasesSum = (chartData.totalCases || []).reduce(
      (sum: number, value: number) => sum + (Number(value) || 0),
      0,
    );
    const totalCasesLabel = `Total Cases (${totalCasesSum.toLocaleString('en-US')})`;

    const inProgressSum = (chartData.inProgress || []).reduce(
      (sum: number, value: number) => sum + (Number(value) || 0),
      0,
    );
    const inProgressLabel = `In Progress (${inProgressSum.toLocaleString('en-US')})`;

    const resolvedOpsSum = (chartData.resolvedOps || []).reduce(
      (sum: number, value: number) => sum + (Number(value) || 0),
      0,
    );
    const resolvedOpsLabel = `Resolved (Ops) (${resolvedOpsSum.toLocaleString('en-US')})`;

    const resolvedAgentSum = (chartData.resolvedAgent || []).reduce(
      (sum: number, value: number) => sum + (Number(value) || 0),
      0,
    );
    const resolvedAgentLabel = `Resolved (Agent) (${resolvedAgentSum.toLocaleString('en-US')})`;

    const weeks = (chartData.weeks || []).map(
      (_: any, i: number) => `Week ${i + 1}`,
    );

    this.espCasesChartOptions = this.buildMixedChartOptions(
      weeks,
      chartData.totalCases,
      chartData.inProgress,
      chartData.resolvedOps,
      chartData.resolvedAgent,
      totalCasesLabel,
      inProgressLabel,
      resolvedOpsLabel,
      resolvedAgentLabel,
    );
  }

  private buildMixedChartOptions(
    weeks: string[],
    barData1: number[],
    barData2: number[],
    lineData1: number[],
    lineData2: number[],
    barLabel1: string,
    barLabel2: string,
    lineLabel1: string,
    lineLabel2: string,
  ): EChartsOption {
    const isDark = this.themeService.isDarkMode;
    const legendColor = isDark ? '#e0e6ed' : '#4f4f4f';
    const tickColor = isDark ? '#8899a6' : '#666';
    const gridColor = isDark ? 'rgba(136,153,166,0.18)' : '#f0f0f0';

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#222',
        textStyle: { color: '#fff' },
      },
      legend: {
        top: 0,
        textStyle: { color: legendColor, fontSize: 12 },
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
      },
      grid: { top: 34, right: 8, bottom: 10, left: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: weeks,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: tickColor, fontSize: 11, margin: 6 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: gridColor } },
        axisLabel: {
          color: isDark ? '#8899a6' : '#999',
          fontSize: 11,
          margin: 6,
        },
      },
      series: [
        {
          name: barLabel1,
          type: 'bar',
          data: barData1,
          itemStyle: { color: '#909ca8', borderRadius: [2, 2, 0, 0] },
          barMaxWidth: 20,
        },
        {
          name: barLabel2,
          type: 'bar',
          data: barData2,
          itemStyle: { color: '#f39c12', borderRadius: [2, 2, 0, 0] },
          barMaxWidth: 20,
        },
        {
          name: lineLabel1,
          type: 'line',
          data: lineData1,
          smooth: 0.25,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: '#9933ff' },
          lineStyle: { width: 2, color: '#9933ff' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(153, 51, 255, 0.5)' },
              { offset: 1, color: 'rgba(153, 51, 255, 0)' },
            ]),
          },
        },
        {
          name: lineLabel2,
          type: 'line',
          data: lineData2,
          smooth: 0.25,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: '#6ebe4a' },
          lineStyle: { width: 2, color: '#6ebe4a' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(110, 190, 74, 0.5)' },
              { offset: 1, color: 'rgba(110, 190, 74, 0)' },
            ]),
          },
        },
      ],
    };
  }

  private rebuildChartsForTheme(): void {
    if (
      this.transactionFailuresChartOptions &&
      Object.keys(this.transactionFailuresChartOptions).length
    ) {
      this.transactionFailuresChartOptions = {
        ...this.transactionFailuresChartOptions,
      };
    }
    if (
      this.espCasesChartOptions &&
      Object.keys(this.espCasesChartOptions).length
    ) {
      this.espCasesChartOptions = { ...this.espCasesChartOptions };
    }
  }

  private buildIssueDistributionChart(
    resolvedAgentPct: number,
    resolvedOpsPct: number,
    resolvedAgentCount: number,
    resolvedOpsCount: number,
    totalIssues: number,
  ): void {
    if (!resolvedAgentPct && !resolvedOpsPct) {
      this.donutSlices.set([]);
      this.donutTotal.set('0');
      return;
    }

    const circumference = 2 * Math.PI * 16; // r=16 in viewBox 36x36
    const gap = 1; // small gap between segments

    const agentLen = (resolvedAgentPct / 100) * circumference;
    const opsLen = (resolvedOpsPct / 100) * circumference;

    // Ops drawn first (underneath), Agent drawn second (on top, at 12 o'clock)
    const slices = [
      {
        label: 'Ops',
        dasharray: `${opsLen} ${circumference - opsLen}`,
        dashoffset: -(agentLen + gap),
        color: '#b8cad8',
        colorEnd: '#e1eef2e2',
      },
      {
        label: 'Agent',
        dasharray: `${agentLen} ${circumference - agentLen}`,
        dashoffset: 0,
        color: '#26d1fc',
        colorEnd: '#4ab5f8',
      },
    ];

    this.donutSlices.set(slices);
    this.donutTotal.set(totalIssues.toLocaleString('en-US'));

    this.issueDistributionLegends.set([
      { label: 'Agent', value: resolvedAgentPct, color: '#00bceb' },
      { label: 'Ops', value: resolvedOpsPct, color: '#8899a6' },
    ]);
  }

  ngOnDestroy(): void {}
}
