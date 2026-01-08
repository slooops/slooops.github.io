import {
  Component,
  ViewChild,
  ElementRef,
  OnDestroy,
  signal,
  computed,
  effect,
} from '@angular/core';
import { Router } from '@angular/router';
import { ApiHttpService } from '../providers/http.service';
import { DataService } from '../providers/data.service';
import { DestroyManager } from '../providers/destroy-manager.service';
import { AuthenticationService } from '../providers/authentication.service';
import { MockHomeDataService } from './mock-home-data.service';
import { HomeDataService } from './home-data.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Chart, ChartConfiguration, Plugin } from 'chart.js/auto';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [DestroyManager],
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
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
    private mockDataService: MockHomeDataService,
    private homeDataService: HomeDataService
  ) {
    // Initialize user info
    this.userRoles.set(this.authService.getRoles());
    this.username.set(this.authService.getUserName());

    // Load dashboard data on initialization
    this.loadDashboardData();

    // Effect to update header columns when displayed columns change
    effect(() => {
      const cols = this.displayedColumns();
      if (cols.length > 0) {
        this.headerColumns.set(['select', ...cols]);
      }
    });
  }

  // Dashboard data signals
  dashboardData = signal<any>(null);
  periodInfo = signal<any>(null);
  kpis = signal<any>(null);
  charts = signal<any>(null);
  issuesList = signal<any[]>([]);
  // Mat Table integration
  displayedColumns = signal<string[]>([]);
  // Combined columns including selection checkbox column for mat-table header/rows
  headerColumns = signal<string[]>([]);
  // Columns to hide from display
  columnsToHide = signal<string[]>(['assignedTo']);
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
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
  resultCount = computed(() => this.dataSource?.data?.length || 0);

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

  // User info
  userRoles = signal<any>(null);
  username = signal<string>('');

  // Pagination
  currentPage = signal<number>(1);
  rowsPerPage = signal<number>(10);
  totalResults = signal<number>(0);
  // Length bound to paginator: total results (server-side) unless filters applied (then show filtered count for clarity)
  paginatorLength = signal<number>(0);

  /**
   * Load all dashboard data from mock service
   */
  loadDashboardData(): void {
    this.dataLoading.set(true);
    this.homeLoading.set(true);

    // Load period info from real backend service
    this.homeDataService.getPeriodInfo(this.destroyManager).subscribe({
      next: (periodData) => {
        this.periodInfo.set(periodData);
      },
      error: (error) => {
        console.error('Error loading period info:', error);
        // Set default empty period info on error
        this.periodInfo.set({
          periodName: '',
          periodEndDate: '',
          lastUpdated: new Date().toLocaleString(),
        });
      },
    });

    this.homeDataService.getHighPriorityIssues(this.destroyManager).subscribe({
      next: (highPriorityIssues) => {
        console.log('High Priority Issues:', highPriorityIssues);

        // Initialize KPIs with high priority issues data
        this.kpis.set({
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

    this.homeDataService.getIssuesList(this.destroyManager).subscribe({
      next: (issues) => {
        console.log('Issues List from real service:', issues);

        // Update KPIs with issues list data
        const currentKpis = this.kpis();
        if (currentKpis) {
          this.kpis.set({
            ...currentKpis,
            totalIssues: issues[0].TOTAL_ISSUES || 0,
            openIssues: issues[0].OPEN_ISSUES || 0,
            unassignedIssues: issues[0].UNASSIGNED || 0,
            assignedIssues: issues[0].ASSIGNED || 0,
            inProgressIssues: issues[0].IN_PROGRESS || 0,
          });
        }
        console.log('Updated KPIs:', this.kpis());
      },
      error: (error) => {
        console.error('Error loading issues list from real service:', error);
      },
    });

    // Simulate HTTP GET request for other dashboard data
    this.mockDataService.getDashboardData().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        // Period info and KPIs loaded separately from real service above
        this.charts.set(data.charts);
        this.issuesList.set(data.issuesList);
        this.totalResults.set(data.pagination.totalResults);
        this.currentPage.set(data.pagination.currentPage);
        this.rowsPerPage.set(data.pagination.rowsPerPage);

        // Generate columns dynamically from data
        if (this.issuesList().length > 0) {
          this.displayedColumns.set(Object.keys(this.issuesList()[0]));
        }
        const filtered = this.displayedColumns().filter(
          (col) => !this.columnsToHide().includes(col)
        );
        this.displayedColumns.set(filtered);
        this.headerColumns.set(['select', ...this.displayedColumns()]);

        // Calculate issue distribution from issues list
        this.calculateIssueDistribution();

        // Initialize MatTable dataSource
        this.dataSource.data = this.issuesList();
        // Server-side pagination: do NOT attach paginator to dataSource to prevent double slicing
        this.paginatorLength.set(this.totalResults());
        this.applyFilters();
        // Initialize charts once view has updated with canvas elements
        setTimeout(() => this.initCharts(), 0);
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.dataLoading.set(false);
        this.homeLoading.set(false);
      },
      complete: () => {
        this.dataLoading.set(false);
        this.homeLoading.set(false);
      },
    });
  }

  /**
   * Load issues list with pagination
   */
  loadIssues(page: number = 1): void {
    this.dataLoading.set(true);

    this.mockDataService.getIssuesList(page, this.rowsPerPage()).subscribe({
      next: (data) => {
        this.issuesList.set(data.issues);
        this.totalResults.set(data.totalResults);
        this.currentPage.set(data.currentPage);
        this.dataSource.data = this.issuesList();
        this.paginatorLength.set(this.totalResults());
        this.applyFilters();
        // Sync paginator indexes only; length already set
        if (this.paginator) {
          this.paginator.pageIndex = this.currentPage() - 1; // 0-based
          this.paginator.pageSize = this.rowsPerPage();
        }
      },
      error: (error) => {
        console.error('Error loading issues:', error);
        this.dataLoading.set(false);
      },
      complete: () => {
        this.dataLoading.set(false);
      },
    });
  }

  /**
   * Handle page change
   */
  // Legacy manual pagination handlers removed after MatPaginator integration

  navigateTo(page: string): void {
    this.router.navigate([page]);
  }

  formatData(data): any[] {
    let formattedAmount;
    formattedAmount = `$${Number(data).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;

    return formattedAmount;
  }

  /**
   * Get status badge class based on status
   */
  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      Open: 'status-open',
      'In Progress': 'status-in-progress',
      Unassigned: 'status-unassigned',
    };
    return statusMap[status] || 'status-default';
  }

  /**
   * Navigate to issue details
   */
  viewIssueDetails(issueId: string): void {
    // Add navigation logic here
  }

  /**
   * Assign user to issue
   */
  assignUser(issueId: string): void {
    // Add assignment logic here
  }

  // ------------ Filter Logic (simplified compared to CaseIQ) ------------
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
    this.applyFilters();
  }

  removeFilter(key: string, value: string) {
    this.activeFilters.update((filters) =>
      filters.filter((f) => !(f.key === key && f.value === value))
    );
    this.applyFilters();
  }

  clearAllFilters() {
    this.activeFilters.set([]);
    this.applyFilters();
  }

  /**
   * Filter table by assignee category from pie chart click
   */
  filterByAssignee(category: string): void {
    // Clear existing filters first
    this.activeFilters.set([]);

    let filtered = [...this.issuesList()];

    if (category === 'AI Agent') {
      filtered = filtered.filter(
        (row) => row.assignedTo?.trim() === 'AI Agent'
      );
    } else if (category === 'Human') {
      filtered = filtered.filter((row) => {
        const assignedTo = row.assignedTo?.trim();
        return (
          assignedTo && assignedTo !== 'AI Agent' && assignedTo !== 'Unassigned'
        );
      });
    } else if (category === 'Unassigned') {
      filtered = filtered.filter(
        (row) =>
          !row.assignedTo?.trim() || row.assignedTo?.trim() === 'Unassigned'
      );
    } else if (category === 'Other') {
      // "Other" category logic (if needed)
      filtered = filtered.filter((row) => {
        const assignedTo = row.assignedTo?.trim();
        return (
          assignedTo && assignedTo !== 'AI Agent' && assignedTo !== 'Unassigned'
        );
      });
    }

    this.dataSource.data = filtered;
    this.paginatorLength.set(filtered.length);

    // Add visual indicator that filter is active
    this.activeFilters.set([{ key: 'assignedTo', value: category }]);
  }

  getSelectedCount(filterId: string): number {
    return this.activeFilters().filter((f) => f.key === filterId).length;
  }

  applyFilters() {
    if (!this.dataSource) return;
    let filtered = [...this.issuesList()];

    // Group filters by key for OR within, AND between groups
    const filterMap = new Map<string, Set<string>>();
    this.activeFilters().forEach((f) => {
      if (!filterMap.has(f.key)) filterMap.set(f.key, new Set());
      filterMap.get(f.key)!.add(f.value);
    });

    if (filterMap.size > 0) {
      filtered = filtered.filter((row) => {
        for (const [key, values] of filterMap.entries()) {
          const rowVal = (row[key] ?? '').toString().trim();
          if (!values.has(rowVal)) return false; // AND logic between groups
        }
        return true;
      });
    }

    this.dataSource.data = filtered;
    // Adjust paginator length when filters are active (client-side filtering of current page slice only)
    const filtersActive = this.activeFilters().length > 0;
    this.paginatorLength.set(
      filtersActive ? filtered.length : this.totalResults()
    );
  }

  // Material paginator event handler
  onMatPage(event: PageEvent) {
    this.rowsPerPage.set(event.pageSize);
    this.currentPage.set(event.pageIndex + 1); // convert to 1-based for backend
    this.loadIssues(this.currentPage());
  }

  toggleTableVisibility(): void {
    this.isTableVisible.update((v) => !v);
  }

  /**
   * Calculate issue distribution based on issues list data
   */
  calculateIssueDistribution(): void {
    const issues = this.issuesList();
    if (!issues || issues.length === 0) return;

    const total = issues.length;
    let aiAgentCount = 0;
    let humanCount = 0;
    let unassignedCount = 0;

    issues.forEach((issue) => {
      const assignedTo = issue.assignedTo?.trim();

      if (!assignedTo || assignedTo === 'Unassigned') {
        unassignedCount++;
      } else if (assignedTo === 'AI Agent') {
        aiAgentCount++;
      } else {
        // All other assignees are mapped to "Human"
        humanCount++;
      }
    });

    // Calculate percentages
    const aiAgentPercent = Math.round((aiAgentCount / total) * 100);
    const humanPercent = Math.round((humanCount / total) * 100);
    const unassignedPercent = Math.round((unassignedCount / total) * 100);
    const otherPercent =
      100 - aiAgentPercent - humanPercent - unassignedPercent;

    // Update charts data
    const currentCharts = this.charts();
    if (currentCharts && currentCharts.issueDistribution) {
      currentCharts.issueDistribution.aiAgent = aiAgentPercent;
      currentCharts.issueDistribution.human = humanPercent;
      currentCharts.issueDistribution.unassigned = unassignedPercent;
      currentCharts.issueDistribution.other = Math.max(0, otherPercent);
      this.charts.set(currentCharts);
    }
  }

  /**
   * Apply search filter across all columns
   */
  applySearch(): void {
    const searchValue = this.searchTerm().toLowerCase().trim();

    if (!searchValue) {
      // If search is empty, apply existing filters or show all data
      this.applyFilters();
      return;
    }

    // Filter data based on search term matching any visible column value
    const filteredData = this.issuesList().filter((row) => {
      return this.displayedColumns().some((key) => {
        const value = row[key];
        if (value === null || value === undefined) return false;
        return value.toString().toLowerCase().includes(searchValue);
      });
    });

    this.dataSource.data = filteredData;
    this.paginatorLength.set(filteredData.length);

    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  /**
   * Highlight search term in text
   */
  highlightText(text: any): string {
    if (!text || !this.searchTerm()) {
      return text;
    }

    const textStr = text.toString();
    const searchValue = this.searchTerm().trim();

    if (!searchValue) {
      return textStr;
    }

    const regex = new RegExp(`(${searchValue})`, 'gi');
    return textStr.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  /**
   * Replace underscores with spaces and title case, add space before capital letters
   */
  replaceUnderscore(str: string): string {
    return str
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  // ---------------- Chart.js Integration ----------------
  private initCharts(): void {
    if (!this.charts()) return;
    this.buildTransactionFailuresChart();
    this.buildEspCasesChart();
    this.buildIssueDistributionChart();
  }

  private commonLineOptions(
    color: string,
    dashed: boolean = false,
    dotted: boolean = false
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

  private buildTransactionFailuresChart(): void {
    const chartsData = this.charts();
    if (!chartsData) return;
    const weeks = chartsData.transactionFailures.weeks;
    const dataObj = chartsData.transactionFailures;
    const ctx = this.transactionFailuresCanvas?.nativeElement.getContext('2d');
    if (!ctx) return;
    // Destroy existing
    this.transactionFailuresChart?.destroy();
    this.transactionFailuresChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: weeks,
        datasets: [
          {
            label: 'AI Agent',
            data: dataObj.aiAgent,
            type: 'line',
            tension: 0.3,
            fill: false,
            backgroundColor: 'rgba(124, 26, 71, 0.1)',
            borderColor: '#7C1A47',
            borderWidth: 2,
            pointBackgroundColor: '#7C1A47',
            pointBorderColor: '#7C1A47',
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Support Team',
            data: dataObj.supportTeam,
            type: 'line',
            tension: 0.3,
            fill: false,
            backgroundColor: 'rgba(91, 143, 215, 0.1)',
            borderColor: '#5B8FD7',
            borderWidth: 2,
            pointBackgroundColor: '#5B8FD7',
            pointBorderColor: '#5B8FD7',
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'In Progress',
            data: dataObj.inProgress,
            type: 'line',
            tension: 0.3,
            fill: false,
            backgroundColor: 'rgba(232, 185, 89, 0.1)',
            borderColor: '#E8B959',
            borderWidth: 2,
            borderDash: [5, 5],
            pointBackgroundColor: '#E8B959',
            pointBorderColor: '#E8B959',
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Resolved (Agent)',
            data: dataObj.resolvedAgent,
            type: 'line',
            tension: 0.3,
            fill: false,
            backgroundColor: 'rgba(216, 150, 224, 0.1)',
            borderColor: '#D896E0',
            borderWidth: 2,
            pointBackgroundColor: '#D896E0',
            pointBorderColor: '#D896E0',
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Resolved (Team)',
            data: dataObj.resolvedTeam,
            type: 'line',
            tension: 0.3,
            fill: false,
            backgroundColor: 'rgba(155, 155, 155, 0.1)',
            borderColor: '#9B9B9B',
            borderWidth: 2,
            borderDash: [2, 2],
            pointBackgroundColor: '#9B9B9B',
            pointBorderColor: '#9B9B9B',
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: this.mixedChartOptions('Transaction Failures'),
    });
  }

  private buildEspCasesChart(): void {
    const chartsData = this.charts();
    if (!chartsData) return;
    const weeks = chartsData.espCases.weeks;
    const dataObj = chartsData.espCases;
    const ctx = this.espCasesCanvas?.nativeElement.getContext('2d');
    if (!ctx) return;
    this.espCasesChart?.destroy();
    this.espCasesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: weeks,
        datasets: [
          {
            type: 'bar',
            label: '',
            data: dataObj.aiAgent,
            backgroundColor: '#c9e7e7',
            borderRadius: 0,
            barPercentage: 0.5,
            categoryPercentage: 0.85,
          },
          {
            label: 'AI Agent',
            data: dataObj.aiAgent,
            ...this.commonLineOptions('#6C0436'),
          },
          {
            label: 'Suport Team',
            data: dataObj.supportTeam,
            ...this.commonLineOptions('#4A64AD'),
          },
          {
            label: 'In Progress',
            data: dataObj.inProgress,
            ...this.commonLineOptions('#D4A048', true),
          },
          {
            label: 'Resolved (Agent)',
            data: dataObj.resolvedAgent,
            ...this.commonLineOptions('#C26CC7'),
          },
          {
            label: 'Resolved (Team)',
            data: dataObj.resolvedTeam,
            ...this.commonLineOptions('#6C6C6C', false, true),
          },
        ],
      },
      options: this.mixedChartOptions('ESP Cases'),
    });
  }

  private buildIssueDistributionChart(): void {
    const chartsData = this.charts();
    if (!chartsData) return;
    const dist = chartsData.issueDistribution;
    const ctx = this.issueDistributionCanvas?.nativeElement.getContext('2d');
    if (!ctx) return;
    this.issueDistributionChart?.destroy();

    // Filter out zero values
    const allLabels = ['AI Agent', 'Human', 'Unassigned', 'Other'];
    const allData = [dist.aiAgent, dist.human, dist.unassigned, dist.other];
    const allColors = ['#5A8E39', '#E0A227', '#E0A227', '#7A7A7A'];

    const filteredLabels: string[] = [];
    const filteredData: number[] = [];
    const filteredColors: string[] = [];
    const legends: { label: string; value: number; color: string }[] = [];

    allLabels.forEach((label, index) => {
      if (allData[index] > 0) {
        filteredLabels.push(label);
        filteredData.push(allData[index]);
        filteredColors.push(allColors[index]);

        // Build legends array
        legends.push({
          label: label,
          value: allData[index],
          color: allColors[index],
        });
      }
    });

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
        const kpisData = this.kpis();
        ctx.fillText(
          kpisData?.totalIssues?.toString() || '',
          chart.getDatasetMeta(0).data[0].x,
          chart.getDatasetMeta(0).data[0].y - 8
        );
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(
          'Total Issues',
          chart.getDatasetMeta(0).data[0].x,
          chart.getDatasetMeta(0).data[0].y + 12
        );
        ctx.restore();
      },
    };
    this.issueDistributionChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: filteredLabels,
        datasets: [
          {
            data: filteredData,
            backgroundColor: filteredColors,
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        onClick: (event, activeElements) => {
          if (activeElements.length > 0) {
            const index = activeElements[0].index;
            const label = filteredLabels[index];
            this.filterByAssignee(label);
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
            maxRotation: 0,
            minRotation: 0,
            callback: function (value, index) {
              return 'Week ' + (index + 1);
            },
          },
        },
        y: {
          beginAtZero: true,
          max: 100,
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

  ngOnDestroy(): void {
    this.transactionFailuresChart?.destroy();
    this.espCasesChart?.destroy();
    this.issueDistributionChart?.destroy();
  }
}
