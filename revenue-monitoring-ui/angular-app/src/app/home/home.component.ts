import {
  Component,
  ViewChild,
  ElementRef,
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
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Chart, ChartConfiguration, Plugin } from 'chart.js/auto';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingSymbolComponent } from '../loading-symbol/loading-symbol.component';
import { LoadingSymbolSmallComponent } from '../loading-symbol-small/loading-symbol-small.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorSparkleBold } from '@ng-icons/phosphor-icons/bold';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [DestroyManager, provideIcons({ phosphorSparkleBold })],
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    LoadingSymbolComponent,
    LoadingSymbolSmallComponent,
    NgIcon,
  ],
  standalone: true,
})
export class HomeComponent implements OnDestroy {
  constructor(
    private router: Router,
    private http: ApiHttpService,
    private dataService: DataService,
    private destroyManager: DestroyManager,
    private authService: AuthenticationService,
    private homeDataService: HomeDataService,
    private injector: Injector,
    private exportService: ExportService,
  ) {
    // Initialize user info
    this.userRoles.set(this.authService.getRoles());
    this.username.set(this.authService.getUserName());

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
  searchTerm = signal<string>('');
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('transactionFailuresCanvas')
  transactionFailuresCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('espCasesCanvas') espCasesCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('issueDistributionCanvas')
  issueDistributionCanvas!: ElementRef<HTMLCanvasElement>;

  // Chart instances
  private transactionFailuresChart?: Chart;
  private espCasesChart?: Chart;
  private issueDistributionChart?: Chart;

  // Issue distribution legends (dynamic)
  issueDistributionLegends = signal<
    { label: string; value: number; color: string }[]
  >([]);

  // Computed signals
  hasActiveFilters = computed(() => this.activeFilters().length > 0);
  resultCount = computed(() => {
    // Use filteredData if filtering is active, otherwise use full data
    if (this.dataSource?.filteredData) {
      return this.dataSource.filteredData.length;
    }
    return this.dataSource?.data?.length || 0;
  });

  // Simple filters (extendable)
  showFiltersDropdown = signal<boolean>(false);
  activeFilters = signal<{ key: string; value: string }[]>([]);
  isTableVisible = signal<boolean>(true);
  filterOptions = signal<{ id: string; label: string; values: string[] }[]>([
    {
      id: 'status',
      label: 'Status',
      values: ['Open', 'In Progress', 'Unassigned'],
    },
  ]);

  // Loading states
  homeLoading = signal<boolean>(true);
  dataLoading = signal<boolean>(true);
  transactionFailuresLoading = signal<boolean>(true);
  espCasesLoading = signal<boolean>(true);
  issueDistributionLoading = signal<boolean>(true);

  // User info
  userRoles = signal<any>(null);
  username = signal<string>('');

  /**
   * Build chart when canvas elements are ready (with retry logic)
   */
  private buildChartWhenReady(
    buildFn: () => void,
    chart: 'transactionFailures' | 'espCases' | 'issueDistribution',
    attempt = 0,
  ): void {
    let canvasEl: HTMLCanvasElement | null | undefined;

    if (chart === 'transactionFailures') {
      canvasEl = this.transactionFailuresCanvas?.nativeElement;
    } else if (chart === 'espCases') {
      canvasEl = this.espCasesCanvas?.nativeElement;
    } else {
      canvasEl = this.issueDistributionCanvas?.nativeElement;
    }

    if (canvasEl) {
      buildFn();
      return;
    }

    if (attempt < 50) {
      setTimeout(
        () => this.buildChartWhenReady(buildFn, chart, attempt + 1),
        100,
      );
    } else {
      console.warn('Chart canvas not ready, skipping render for', chart);
    }
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
        this.highPriorityKpis.set({
          highPriorityIssues: highPriorityIssues[0].HIGH_PRIORITY_ISSUES || 0,
          inProgress: highPriorityIssues[0].IN_PROGRESS || 0,
          totalAging: highPriorityIssues[0].TOTAL_AGING || 0,
          lessThan48Hours: highPriorityIssues[0]['<48 Hours'] || 0,
          moreThan48Hours: highPriorityIssues[0]['>48 Hours'] || 0,
        });
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
        this.issueKpis.set({
          totalIssues: issues[1]?.TOTAL_ISSUES || 0,
          resolvedIssues: issues[1]?.RESOLVED || 0,
          inProgressIssues: issues[1]?.IN_PROGRESS || 0,
          assignedIssues: issues[1]?.ASSIGNED || 0,
          unassignedIssues: issues[1]?.UNASSIGNED || 0,
        });
        // Ensure issue distribution center text reflects latest totalIssues
        this.refreshIssueDistributionCenterText();
        console.log('Updated issue KPIs:', this.issueKpis());
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

        // Parse API response: Array of {WEEK_NUMBER, COUNT, CATEGORY}
        const weekMap = new Map<
          string,
          {
            supportTeam: number;
            inProgress: number;
            resolved: number;
            totalIssues: number;
            agent: number;
          }
        >();

        if (data && data.length > 0) {
          data.forEach((item: any) => {
            const weekNum = item.WEEK_NUMBER;
            const weekLabel = `Week ${weekNum}`;
            const count = item.COUNT || 0;
            const category = (item.CATEGORY || '')
              .toString()
              .toLowerCase()
              .trim();

            if (!weekMap.has(weekLabel)) {
              weekMap.set(weekLabel, {
                supportTeam: 0,
                inProgress: 0,
                resolved: 0,
                totalIssues: 0,
                agent: 0,
              });
            }

            const weekData = weekMap.get(weekLabel)!;
            if (category === 'support team') {
              weekData.supportTeam = count;
            } else if (category === 'in progress') {
              weekData.inProgress = count;
            } else if (category === 'resolved') {
              weekData.resolved = count;
            } else if (
              category === 'total issue' ||
              category === 'total issues'
            ) {
              weekData.totalIssues = count;
            } else if (category === 'agent') {
              weekData.agent = count;
            }
          });
        }

        // Always use a fixed range of weeks: Week 1 to Week 13
        const fixedWeeks = Array.from(
          { length: 13 },
          (_, i) => `Week ${i + 1}`,
        );

        // Compute percentage of In Progress over Total Issues for each week
        const percentInProgress = fixedWeeks.map((week) => {
          const weekData = weekMap.get(week) || {
            supportTeam: 0,
            inProgress: 0,
            resolved: 0,
            totalIssues: 0,
          };
          const total = weekData.totalIssues || 0;
          const inProg = weekData.inProgress || 0;
          if (!total) {
            return 0;
          }
          return +((inProg / total) * 100).toFixed(1);
        });

        const chartData = {
          weeks: fixedWeeks,
          supportTeam: fixedWeeks.map(
            (week) => (weekMap.get(week) || { supportTeam: 0 }).supportTeam,
          ),
          inProgress: fixedWeeks.map(
            (week) => (weekMap.get(week) || { inProgress: 0 }).inProgress,
          ),
          resolved: fixedWeeks.map(
            (week) => (weekMap.get(week) || { resolved: 0 }).resolved,
          ),
          totalIssues: fixedWeeks.map(
            (week) => (weekMap.get(week) || { totalIssues: 0 }).totalIssues,
          ),
          agent: fixedWeeks.map(
            (week) => (weekMap.get(week) || { agent: 0 }).agent,
          ),
          percentInProgress,
        };

        console.log('Parsed Transaction Failures chart data:', chartData);
        // Show canvas instead of loader, then build chart when canvas is ready
        this.transactionFailuresLoading.set(false);
        this.buildChartWhenReady(
          () => this.buildTransactionFailuresChart(chartData),
          'transactionFailures',
        );
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

        // Parse API response: Array of {FISCAL_QTR, WEEK_NUMBER, TOTAL_CASES, RESOLVED_AGENT, RESOLVED_OPS, IN_PROGRESS}
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
            .filter((item: any) => item.FISCAL_QTR === 'Q3FY26')
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
        const fixedWeeks = Array.from(
          { length: 13 },
          (_, i) => `Week ${i + 1}`,
        );
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
        this.buildChartWhenReady(
          () => this.buildEspCasesChart(chartData),
          'espCases',
        );
      },
      error: (error) => {
        console.error('Error loading ESP cases:', error);
        this.espCasesLoading.set(false);
      },
    });
  }

  /**
   * Load issues distribution data
   */
  private loadIssuesDistribution(): void {
    this.homeDataService.getIssuesDistribution(this.destroyManager).subscribe({
      next: (data) => {
        console.log('Issues Distribution API Response:', data);

        let aiAgent = 0;
        let human = 0;

        if (data && data.length > 0) {
          data.forEach((item: any) => {
            const percentage = Number(item.PERCENTAGE) || 0;
            const source = (item.SOURCE || '').toLowerCase().trim();

            if (source === 'ai agent') {
              aiAgent = percentage;
            } else if (source === 'human') {
              human = percentage;
            }
          });
        }

        console.log('Parsed distribution:', { aiAgent, human });

        // Build chart when canvas is ready
        this.issueDistributionLoading.set(false);
        this.buildChartWhenReady(
          () => this.buildIssueDistributionChart(aiAgent, human),
          'issueDistribution',
        );
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

        if (issuesList.length === 0) {
          // this.isLoading = false;
        }
        this.issuesList.set(issuesList);
        if (issuesList.length > 0) {
          this.displayedColumns = Object.keys(issuesList[0]);
          this.displayedColumnsWithSelect = [
            'select',
            ...this.displayedColumns,
          ];
        }

        this.dataSource = new MatTableDataSource<any>(issuesList);

        // Initialize unified filtering (no filters/search applied yet)
        this.updateTableFilter();

        // Connect paginator after data is set - use longer timeout
        setTimeout(() => {
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
            console.log('✅ Paginator connected successfully');
            console.log('Total records:', issuesList.length);
            console.log('Page size:', this.paginator.pageSize);
            console.log(
              'Total pages:',
              Math.ceil(issuesList.length / this.paginator.pageSize),
            );
          } else {
            console.error('❌ Paginator not available!');
          }
        }, 100);

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
   * Handle page change
   */
  onMatPage(event: PageEvent) {
    // Material Table handles pagination automatically
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

  toggleFiltersDropdown(event: Event) {
    event.stopPropagation();
    this.showFiltersDropdown.update((v) => !v);
  }

  isFilterActive(key: string, value: string): boolean {
    return this.activeFilters().some((f) => f.key === key && f.value === value);
  }

  addFilter(key: string, label: string, value: string) {
    const filters = this.activeFilters();
    const idx = filters.findIndex((f) => f.key === key && f.value === value);
    if (idx > -1) {
      const updated = [...filters];
      updated.splice(idx, 1); // toggle off
      this.activeFilters.set(updated);
    } else {
      this.activeFilters.update((f) => [...f, { key, value }]);
    }
    this.updateTableFilter();
  }

  removeFilter(key: string, value: string) {
    this.activeFilters.update((filters) =>
      filters.filter((f) => !(f.key === key && f.value === value)),
    );
    this.updateTableFilter();
  }

  clearAllFilters() {
    this.activeFilters.set([]);
    this.updateTableFilter();
  }

  /**
   * Filter table by assignee category from pie chart click
   */
  filterByAssignee(category: string): void {
    this.activeFilters.set([{ key: 'assignedTo', value: category }]);
    this.updateTableFilter();
  }

  /**
   * Apply search filter across all columns
   */
  applySearch(): void {
    if (!this.dataSource) {
      return;
    }
    this.updateTableFilter();
  }

  toggleTableVisibility(): void {
    this.isTableVisible.update((v) => !v);
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

    if (this.paginator) {
      this.paginator.firstPage();
    }
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
   * Trigger a redraw of the issue distribution chart so the
   * center text plugin picks up the latest KPI values.
   */
  private refreshIssueDistributionCenterText(): void {
    this.issueDistributionChart?.update();
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
    console.log('buildTransactionFailuresChart called with:', chartData);

    const ctx = this.transactionFailuresCanvas?.nativeElement?.getContext('2d');
    if (!ctx) {
      console.error('Transaction failures canvas not found');
      return;
    }

    const totalIssuesSum = (chartData.totalIssues || []).reduce(
      (sum: number, value: number) => sum + (Number(value) || 0),
      0,
    );
    const totalIssuesLabel = `Total Issues (${totalIssuesSum.toLocaleString(
      'en-US',
    )})`;

    const inProgressSum = (chartData.inProgress || []).reduce(
      (sum: number, value: number) => sum + (Number(value) || 0),
      0,
    );
    const inProgressLabel = `In Progress (${inProgressSum.toLocaleString(
      'en-US',
    )})`;

    const supportTeamSum = (chartData.supportTeam || []).reduce(
      (sum: number, value: number) => sum + (Number(value) || 0),
      0,
    );
    const supportTeamLabel = `Support Team (${supportTeamSum.toLocaleString(
      'en-US',
    )})`;

    const resolvedSum = (chartData.resolved || []).reduce(
      (sum: number, value: number) => sum + (Number(value) || 0),
      0,
    );
    const resolvedLabel = `Resolved (${resolvedSum.toLocaleString('en-US')})`;

    const agentSum = (chartData.agent || []).reduce(
      (sum: number, value: number) => sum + (Number(value) || 0),
      0,
    );
    const agentLabel = `Agent (${agentSum.toLocaleString('en-US')})`;

    this.transactionFailuresChart?.destroy();
    this.transactionFailuresChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartData.weeks,
        datasets: [
          // 1. Total Issues (Bar)
          {
            type: 'bar',
            label: totalIssuesLabel,
            data: chartData.totalIssues,
            backgroundColor: '#c0504d',
            borderColor: '#c0504d',
            borderWidth: 1,
            barPercentage: 0.5,
            categoryPercentage: 0.7,
          },
          // 2. Resolved (Line)
          {
            type: 'line',
            label: resolvedLabel,
            data: chartData.resolved,
            borderColor: '#9b59b6',
            backgroundColor: '#9b59b6',
            tension: 0.25,
            pointRadius: 3,
            pointHoverRadius: 5,
            borderWidth: 2,
            fill: false,
          },
          // 3. Support Team (Line)
          {
            type: 'line',
            label: supportTeamLabel,
            data: chartData.supportTeam,
            borderColor: '#5a7abf',
            backgroundColor: '#5a7abf',
            tension: 0.25,
            pointRadius: 3,
            pointHoverRadius: 5,
            borderWidth: 2,
            fill: false,
          },
          // 4. Agent (Line)
          {
            type: 'line',
            label: agentLabel,
            data: chartData.agent,
            borderColor: '#5c9e6b',
            backgroundColor: '#5c9e6b',
            tension: 0.25,
            pointRadius: 3,
            pointHoverRadius: 5,
            borderWidth: 2,
            fill: false,
          },
          // 5. In Progress (Bar)
          {
            type: 'bar',
            label: inProgressLabel,
            data: chartData.inProgress,
            backgroundColor: '#f4a259',
            borderColor: '#f4a259',
            borderWidth: 1,
            barPercentage: 0.5,
            categoryPercentage: 0.7,
          },
        ],
      },
      options: this.mixedChartOptions('Transaction Failures'),
    });
  }

  private buildEspCasesChart(chartData: any): void {
    console.log('buildEspCasesChart called with:', chartData);

    const ctx = this.espCasesCanvas?.nativeElement?.getContext('2d');
    if (!ctx) {
      console.error('ESP cases canvas not found');
      return;
    }

    const totalCasesSum = (chartData.totalCases || []).reduce(
      (sum: number, value: number) => sum + (Number(value) || 0),
      0,
    );
    const totalCasesLabel = `Total Cases (${totalCasesSum.toLocaleString(
      'en-US',
    )})`;

    const inProgressSumEsp = (chartData.inProgress || []).reduce(
      (sum: number, value: number) => sum + (Number(value) || 0),
      0,
    );
    const inProgressLabelEsp = `In Progress (${inProgressSumEsp.toLocaleString(
      'en-US',
    )})`;

    const resolvedOpsSum = (chartData.resolvedOps || []).reduce(
      (sum: number, value: number) => sum + (Number(value) || 0),
      0,
    );
    const resolvedOpsLabel = `Resolved (Ops) (${resolvedOpsSum.toLocaleString(
      'en-US',
    )})`;

    const resolvedAgentSum = (chartData.resolvedAgent || []).reduce(
      (sum: number, value: number) => sum + (Number(value) || 0),
      0,
    );
    const resolvedAgentLabel = `Resolved (Agent) (${resolvedAgentSum.toLocaleString(
      'en-US',
    )})`;

    this.espCasesChart?.destroy();
    this.espCasesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartData.weeks,
        datasets: [
          {
            type: 'bar',
            label: totalCasesLabel,
            data: chartData.totalCases,
            borderColor: '#c0504d',
            backgroundColor: '#c0504d',
            borderWidth: 1,
            barPercentage: 0.5,
            categoryPercentage: 0.7,
          },
          {
            type: 'bar',
            label: inProgressLabelEsp,
            data: chartData.inProgress,
            borderColor: '#f4a259',
            backgroundColor: '#f4a259',
            borderWidth: 1,
            barPercentage: 0.5,
            categoryPercentage: 0.7,
          },
          {
            type: 'line',
            label: resolvedOpsLabel,
            data: chartData.resolvedOps,
            borderColor: '#9b59b6',
            backgroundColor: '#9b59b6',
            tension: 0.25,
            pointRadius: 3,
            pointHoverRadius: 5,
            borderWidth: 2,
            fill: false,
          },
          {
            type: 'line',
            label: resolvedAgentLabel,
            data: chartData.resolvedAgent,
            borderColor: '#5c9e6b',
            backgroundColor: '#5c9e6b',
            tension: 0.25,
            pointRadius: 3,
            pointHoverRadius: 5,
            borderWidth: 2,
            fill: false,
          },
        ],
      },
      options: this.mixedChartOptions('ESP Cases'),
    });
  }

  private buildIssueDistributionChart(aiAgent: number, human: number): void {
    console.log('buildIssueDistributionChart called with:', { aiAgent, human });

    if (!aiAgent && !human) {
      console.log('No data to display');
      return;
    }

    const canvas = this.issueDistributionCanvas?.nativeElement;
    if (!canvas) {
      console.error('Canvas element not found!');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get 2d context!');
      return;
    }

    this.issueDistributionChart?.destroy();

    const labels = ['AI Agent', 'Human'];
    const data = [aiAgent, human];
    const colors = ['#5A8E39', '#E0A227'];

    // Build legends array
    const legends: { label: string; value: number; color: string }[] = [
      { label: 'AI Agent', value: aiAgent, color: '#5A8E39' },
      { label: 'Human', value: human, color: '#E0A227' },
    ];

    console.log('Creating chart with data:', data);

    this.issueDistributionLegends.set(legends);

    const centerTextPlugin: Plugin = {
      id: 'centerTextPlugin',
      afterDraw: (chart) => {
        const {
          ctx,
          chartArea: { width, height },
        } = chart;
        ctx.save();
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const issueKpisData = this.issueKpis();
        ctx.fillText(
          issueKpisData?.totalIssues?.toString() || '',
          chart.getDatasetMeta(0).data[0].x,
          chart.getDatasetMeta(0).data[0].y - 8,
        );
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(
          'Total Issues',
          chart.getDatasetMeta(0).data[0].x,
          chart.getDatasetMeta(0).data[0].y + 12,
        );
        ctx.restore();
      },
    };
    this.issueDistributionChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: colors,
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        onClick: (event, activeElements) => {
          if (activeElements.length > 0) {
            const index = activeElements[0].index;
            const label = labels[index];
            // this.filterByAssignee(label);
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true },
          datalabels: {
            color: '#ffffff',
            font: {
              size: 11,
              weight: 'bold',
              family: 'Inter, sans-serif',
            },
            formatter: (value) => {
              return value > 0 ? value + '%' : '';
            },
          },
        },
      },
      plugins: [centerTextPlugin],
    } as any);
  }

  private mixedChartOptions(title: string): ChartConfiguration['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'center',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 8,
            boxHeight: 8,
            padding: 15,
            font: { family: 'Inter, sans-serif', size: 12, weight: 'normal' },
            color: '#4f4f4f',
          },
        },
        title: { display: false },
        tooltip: {
          enabled: true,
          displayColors: false,
          backgroundColor: '#222',
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 10,
          cornerRadius: 4,
        },
        datalabels: {
          display: false,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: 'Inter, sans-serif', size: 11, weight: 'normal' },
            color: '#666',
            maxRotation: 45,
            minRotation: 45,
            autoSkip: false,
            callback: function (value, index) {
              return 'Week ' + (index + 1);
            },
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: '#f0f0f0', lineWidth: 1 },
          ticks: {
            font: { family: 'Inter, sans-serif', size: 11 },
            color: '#999',
            stepSize: 10,
          },
        },
      },
    };
  }

  private mixedChartWithSecondaryAxis(
    title: string,
  ): ChartConfiguration['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'center',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 8,
            boxHeight: 8,
            padding: 15,
            font: { family: 'Inter, sans-serif', size: 12, weight: 'normal' },
            color: '#4f4f4f',
          },
        },
        title: { display: false },
        tooltip: {
          enabled: true,
          displayColors: false,
          backgroundColor: '#222',
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 10,
          cornerRadius: 4,
        },
        datalabels: {
          display: false,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: 'Inter, sans-serif', size: 11, weight: 'normal' },
            color: '#666',
            maxRotation: 0,
            minRotation: 0,
            callback: function (value, index) {
              return 'Week ' + (index + 1);
            },
          },
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true,
          grid: { color: '#f0f0f0', lineWidth: 1 },
          ticks: {
            font: { family: 'Inter, sans-serif', size: 11 },
            color: '#999',
          },
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          beginAtZero: true,
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            font: { family: 'Inter, sans-serif', size: 11 },
            color: '#5B8FD7',
          },
        },
      },
    };
  }

  ngOnDestroy(): void {
    this.transactionFailuresChart?.destroy();
    this.espCasesChart?.destroy();
    this.issueDistributionChart?.destroy();
  }
}
