import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';
import { ApiHttpService } from '../providers/http.service';
import { DataService } from '../providers/data.service';
import { DestroyManager } from '../providers/destroy-manager.service';
import { AuthenticationService } from '../providers/authentication.service';
import { MockHomeDataService } from './mock-home-data.service';
import { takeUntil } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Chart, ChartConfiguration, Plugin } from 'chart.js/auto';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [DestroyManager],
})
export class HomeComponent implements OnInit, OnDestroy {
  constructor(
    private router: Router,
    private http: ApiHttpService,
    private dataService: DataService,
    private destroyManager: DestroyManager,
    private authService: AuthenticationService,
    private mockDataService: MockHomeDataService
  ) {}

  // Dashboard data
  dashboardData: any;
  periodInfo: any;
  kpis: any;
  charts: any;
  issuesList: any[] = [];
  // Mat Table integration
  displayedColumns: string[] = [];
  // Combined columns including selection checkbox column for mat-table header/rows
  headerColumns: string[] = [];
  // Columns to hide from display
  columnsToHide: string[] = ['assignedTo'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  searchTerm: string = '';
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
  issueDistributionLegends: { label: string; value: number; color: string }[] =
    [];

  // Simple filters (extendable)
  showFiltersDropdown: boolean = false;
  activeFilters: { key: string; value: string }[] = [];
  isTableVisible: boolean = true;
  filterOptions: { id: string; label: string; values: string[] }[] = [
    {
      id: 'status',
      label: 'Status',
      values: ['Open', 'In Progress', 'Unassigned'],
    },
  ];

  // Loading states
  homeLoading: boolean = true;
  dataLoading: boolean = true;

  // User info
  userRoles: any;
  username: string;

  // Pagination
  currentPage: number = 1;
  rowsPerPage: number = 10;
  totalResults: number = 0;
  // Length bound to paginator: total results (server-side) unless filters applied (then show filtered count for clarity)
  paginatorLength: number = 0;

  ngOnInit(): void {
    this.userRoles = this.authService.getRoles();
    this.username = this.authService.getUserName();
    // Initialize header columns (Angular template doesn't support spread syntax inside array literal)
    this.headerColumns = ['select', ...this.displayedColumns];
    this.loadDashboardData();
  }

  /**
   * Load all dashboard data from mock service
   */
  loadDashboardData(): void {
    this.dataLoading = true;
    this.homeLoading = true;

    // Simulate HTTP GET request
    this.mockDataService.getDashboardData().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.periodInfo = data.periodInfo;
        this.kpis = data.kpis;
        this.charts = data.charts;
        this.issuesList = data.issuesList;
        this.totalResults = data.pagination.totalResults;
        this.currentPage = data.pagination.currentPage;
        this.rowsPerPage = data.pagination.rowsPerPage;

        // Generate columns dynamically from data
        if (this.issuesList.length > 0) {
          this.displayedColumns = Object.keys(this.issuesList[0]);
        }
        this.displayedColumns = this.displayedColumns.filter(
          (col) => !this.columnsToHide.includes(col)
        );
        this.headerColumns = ['select', ...this.displayedColumns];

        // Calculate issue distribution from issues list
        this.calculateIssueDistribution();

        // Initialize MatTable dataSource
        this.dataSource.data = this.issuesList;
        // Server-side pagination: do NOT attach paginator to dataSource to prevent double slicing
        this.paginatorLength = this.totalResults;
        this.applyFilters();
        // Initialize charts once view has updated with canvas elements
        setTimeout(() => this.initCharts(), 0);

        console.log('Dashboard data loaded:', data);
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.dataLoading = false;
        this.homeLoading = false;
      },
      complete: () => {
        this.dataLoading = false;
        this.homeLoading = false;
      },
    });
  }

  /**
   * Load issues list with pagination
   */
  loadIssues(page: number = 1): void {
    this.dataLoading = true;

    this.mockDataService.getIssuesList(page, this.rowsPerPage).subscribe({
      next: (data) => {
        this.issuesList = data.issues;
        this.totalResults = data.totalResults;
        this.currentPage = data.currentPage;
        this.dataSource.data = this.issuesList;
        this.paginatorLength = this.totalResults;
        this.applyFilters();
        // Sync paginator indexes only; length already set
        if (this.paginator) {
          this.paginator.pageIndex = this.currentPage - 1; // 0-based
          this.paginator.pageSize = this.rowsPerPage;
        }
      },
      error: (error) => {
        console.error('Error loading issues:', error);
        this.dataLoading = false;
      },
      complete: () => {
        this.dataLoading = false;
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
    console.log('Viewing issue:', issueId);
    // Add navigation logic here
  }

  /**
   * Assign user to issue
   */
  assignUser(issueId: string): void {
    console.log('Assigning user to issue:', issueId);
    // Add assignment logic here
  }

  // ------------ Filter Logic (simplified compared to CaseIQ) ------------
  toggleFiltersDropdown(event: Event) {
    event.stopPropagation();
    this.showFiltersDropdown = !this.showFiltersDropdown;
  }

  isFilterActive(key: string, value: string): boolean {
    return this.activeFilters.some((f) => f.key === key && f.value === value);
  }

  addFilter(key: string, label: string, value: string) {
    const idx = this.activeFilters.findIndex(
      (f) => f.key === key && f.value === value
    );
    if (idx > -1) {
      this.activeFilters.splice(idx, 1); // toggle off
    } else {
      this.activeFilters.push({ key, value });
    }
    this.applyFilters();
  }

  removeFilter(key: string, value: string) {
    this.activeFilters = this.activeFilters.filter(
      (f) => !(f.key === key && f.value === value)
    );
    this.applyFilters();
  }

  clearAllFilters() {
    this.activeFilters = [];
    this.applyFilters();
  }

  /**
   * Filter table by assignee category from pie chart click
   */
  filterByAssignee(category: string): void {
    // Clear existing filters first
    this.activeFilters = [];

    let filtered = [...this.issuesList];

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
    this.paginatorLength = filtered.length;

    // Add visual indicator that filter is active
    this.activeFilters.push({ key: 'assignedTo', value: category });
  }

  getSelectedCount(filterId: string): number {
    return this.activeFilters.filter((f) => f.key === filterId).length;
  }

  applyFilters() {
    if (!this.dataSource) return;
    let filtered = [...this.issuesList];

    // Group filters by key for OR within, AND between groups
    const filterMap = new Map<string, Set<string>>();
    this.activeFilters.forEach((f) => {
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
    const filtersActive = this.activeFilters.length > 0;
    this.paginatorLength = filtersActive ? filtered.length : this.totalResults;
  }

  // Material paginator event handler
  onMatPage(event: PageEvent) {
    this.rowsPerPage = event.pageSize;
    this.currentPage = event.pageIndex + 1; // convert to 1-based for backend
    this.loadIssues(this.currentPage);
  }

  toggleTableVisibility(): void {
    this.isTableVisible = !this.isTableVisible;
  }

  /**
   * Calculate issue distribution based on issues list data
   */
  calculateIssueDistribution(): void {
    if (!this.issuesList || this.issuesList.length === 0) return;

    const total = this.issuesList.length;
    let aiAgentCount = 0;
    let humanCount = 0;
    let unassignedCount = 0;

    this.issuesList.forEach((issue) => {
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
    if (this.charts && this.charts.issueDistribution) {
      this.charts.issueDistribution.aiAgent = aiAgentPercent;
      this.charts.issueDistribution.human = humanPercent;
      this.charts.issueDistribution.unassigned = unassignedPercent;
      this.charts.issueDistribution.other = Math.max(0, otherPercent);
    }

    // Update KPIs total issues count
    if (this.kpis) {
      this.kpis.totalIssues = total;
    }
  }

  /**
   * Apply search filter across all columns
   */
  applySearch(): void {
    const searchValue = this.searchTerm.toLowerCase().trim();

    if (!searchValue) {
      // If search is empty, apply existing filters or show all data
      this.applyFilters();
      return;
    }

    // Filter data based on search term matching any visible column value
    const filteredData = this.issuesList.filter((row) => {
      return this.displayedColumns.some((key) => {
        const value = row[key];
        if (value === null || value === undefined) return false;
        return value.toString().toLowerCase().includes(searchValue);
      });
    });

    this.dataSource.data = filteredData;
    this.paginatorLength = filteredData.length;

    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  /**
   * Highlight search term in text
   */
  highlightText(text: any): string {
    if (!text || !this.searchTerm) {
      return text;
    }

    const textStr = text.toString();
    const searchValue = this.searchTerm.trim();

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
    if (!this.charts) return;
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
    const weeks = this.charts.transactionFailures.weeks;
    const dataObj = this.charts.transactionFailures;
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
    const weeks = this.charts.espCases.weeks;
    const dataObj = this.charts.espCases;
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
    const dist = this.charts.issueDistribution;
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
    this.issueDistributionLegends = [];

    allLabels.forEach((label, index) => {
      if (allData[index] > 0) {
        filteredLabels.push(label);
        filteredData.push(allData[index]);
        filteredColors.push(allColors[index]);

        // Build legends array
        this.issueDistributionLegends.push({
          label: label,
          value: allData[index],
          color: allColors[index],
        });
      }
    });

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
        ctx.fillText(
          this.kpis.totalIssues?.toString() || '',
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
