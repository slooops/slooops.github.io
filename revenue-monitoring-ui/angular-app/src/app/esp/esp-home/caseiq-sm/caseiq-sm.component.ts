import {
  Component,
  OnInit,
  OnChanges,
  SimpleChanges,
  Input,
  ViewChild,
  HostListener,
  Output,
  EventEmitter,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ApiHttpService } from 'src/app/providers/http.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { StackedBarChartDataPoint } from 'src/app/components/bar-chart/bar-chart.component';
import { CaseiqTableComponent } from 'src/app/components/caseiq-table/caseiq-table.component';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorInfoBold,
  phosphorFunnelSimpleBold,
} from '@ng-icons/phosphor-icons/bold';
import { coolExpand } from '@ng-icons/coolicons';
import { CaseiqExpandModalComponent } from 'src/app/components/caseiq-expand-modal/caseiq-expand-modal.component';
import { BarChartComponent } from '../../../components/bar-chart/bar-chart.component';

interface SmAccuracyData {
  TEAM_NAME: string;
  CATEGORY: number;
  CORE_ISSUE: number;
  TOTAL_ACCURACY: number;
  TOTAL_VALIDATED_CASES: number;
}

@Component({
  selector: 'app-caseiq-sm',
  templateUrl: './caseiq-sm.component.html',
  styleUrl: './caseiq-sm.component.css',
  imports: [
    CommonModule,
    MatIconModule,
    MatTabsModule,
    MatTooltipModule,
    NgIcon,
    BarChartComponent,
    CaseiqTableComponent,
    CaseiqExpandModalComponent,
  ],
  providers: [
    provideIcons({
      phosphorInfoBold,
      phosphorFunnelSimpleBold,
      coolExpand,
    }),
  ],
  standalone: true,
})
export class CaseiqSmComponent implements OnInit, OnChanges {
  @Input() selectedQuarter!: string; // Quarter filter from parent
  @ViewChild('smTable') smTable!: CaseiqTableComponent;
  @Output() uploadSuccess = new EventEmitter<void>();
  @Input() caseIqMetrics: any;

  constructor(
    private readonly http: ApiHttpService,
    private readonly destroyManager: DestroyManager,
  ) {}

  i2cChartData: StackedBarChartDataPoint[] = [];
  i2cSimpleChartData: StackedBarChartDataPoint[] = [];

  categoryAccuracy: number | string = '-';
  coreIssueAccuracy: number | string = '-';
  totalCases: number | string = '-';

  i2cTableData = new MatTableDataSource<any>([]);
  i2cTableColumns: string[] = [];
  totalRecords: number = 0;
  fullTableData: any[] = []; // Store unfiltered table data

  // Filter and threshold state
  showCategoryFilters = false;
  showCoreIssueFilters = false;
  showCategorySelect = false;
  showCoreIssueSelect = false;
  categoryMinThreshold = 0;
  coreIssueMinThreshold = 0;

  // Multi-select state
  allCategoryLabels: string[] = [];
  allCoreIssueLabels: string[] = [];
  selectedCategoryLabels: Set<string> = new Set();
  selectedCoreIssueLabels: Set<string> = new Set();

  // Cached data for reapplying filters
  cachedCategoryData: any[] = [];
  cachedCoreIssueData: any[] = [];

  // Cached transformed chart data for expand modal (stable references)
  expandedCategoryData: StackedBarChartDataPoint[] = [];
  expandedCoreIssueData: StackedBarChartDataPoint[] = [];
  expandedCategoryTotal = 0;
  expandedCoreIssueTotal = 0;

  // Visibility totals
  visibleCategoryTotal = 0;
  visibleCoreIssueTotal = 0;

  // Loading state for refresh
  refreshingData = false;

  // Active chart filter tracking for table integration
  activeChartCategoryFilter: string | null = null;
  activeChartCoreIssueFilter: string | null = null;

  ngOnInit(): void {
    this.loadAllData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // React to quarter or metrics changes
    if (
      (changes['selectedQuarter'] && !changes['selectedQuarter'].firstChange) ||
      (changes['caseIqMetrics'] && !changes['caseIqMetrics'].firstChange)
    ) {
      this.refreshingData = true; // Show loading overlay
      this.loadAllData();
    }
  }

  /**
   * CaseIQ metrics filtered by selectedQuarter for SM.
   *
   * - If selectedQuarter is empty, returns the original input.
   * - If caseIqMetrics is an array, picks the SM row whose FISCAL_QTR
   *   matches selectedQuarter.
   * - If caseIqMetrics is a single object with FISCAL_QTR, it is returned
   *   only when its FISCAL_QTR matches selectedQuarter; otherwise null.
   */
  get filteredCaseIqMetrics(): any {
    if (!this.caseIqMetrics) {
      return null;
    }

    if (!this.selectedQuarter) {
      return this.caseIqMetrics;
    }

    if (Array.isArray(this.caseIqMetrics)) {
      const row = this.caseIqMetrics.find(
        (m: any) =>
          m &&
          m.FISCAL_QTR === this.selectedQuarter &&
          m.TEAM_NAME &&
          m.TEAM_NAME.toString().toUpperCase() === 'SM',
      );
      return row || null;
    }

    if (
      (this.caseIqMetrics as any).FISCAL_QTR &&
      (this.caseIqMetrics as any).FISCAL_QTR !== this.selectedQuarter
    ) {
      return null;
    }

    return this.caseIqMetrics;
  }
  getAgentRatio(): number {
    const m = this.filteredCaseIqMetrics;
    if (!m) return 0;
    const total = m.TOTAL_CASES - m.SERVICE_INCIDENTS;
    if (!total) return 0;
    const agentTotal =
      (m.RESOLVED_AGENT ?? 0) +
      (m.IN_PROGRESS_AGENT ?? 0) +
      (m.RECOMMENDED_ROUTED_OUT ?? 0) +
      (m.RECOMMENDED_CANCELLED ?? 0);
    return Math.round((agentTotal / total) * 100);
  }

  private loadAllData(): void {
    this.getXxcaseiqValidatedCasesAccuracyV();
    this.getXxcaseiqCategoryGraphVSm();
    this.getXxcaseiqCoreIssueGraphVSm();
    this.getXxcaseiqSmCaseDetailsV();
  }

  /**
   * Merges data by grouping all match statuses under each category/issue
   */
  private mergeByCategoryOrIssue(
    data: any[],
    groupColumn: string,
    countColumn: string,
  ): any[] {
    const groupMap = new Map<string, any>();

    data.forEach((item) => {
      const key = item[groupColumn] ?? ''; // Convert null/undefined to empty string

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          [groupColumn]: key,
          [`${groupColumn}_COUNT`]: 0,
          data: [],
        });
      }

      const group = groupMap.get(key)!;
      group[`${groupColumn}_COUNT`] += item[countColumn];
      group.data.push({
        MATCH_STATUS: item.MATCH_STATUS,
        COUNT: item[countColumn],
      });
    });

    return Array.from(groupMap.values());
  }

  getXxcaseiqCategoryGraphVSm() {
    this.http
      .get('xxcaseiq-category-graph-v-sm', this.destroyManager)
      .subscribe((data: any) => {
        // Filter data by selected quarter
        const filteredByQuarter = this.selectedQuarter
          ? data.filter((item: any) => item.Quarter === this.selectedQuarter)
          : data;

        // Merge data by category
        const mergedData = this.mergeByCategoryOrIssue(
          filteredByQuarter,
          'CATEGORY',
          'CATEGORY_COUNT',
        );

        // Cache for reapplying filters
        this.cachedCategoryData = mergedData;
        this.updateExpandedCategoryData();

        // Extract all unique category labels for multi-select
        this.allCategoryLabels = mergedData.map((item) => item.CATEGORY);

        // Apply initial threshold filter
        this.reapplyCategoryFilters();
      });
  }

  getXxcaseiqCoreIssueGraphVSm() {
    this.http
      .get('xxcaseiq-core-issue-graph-v-sm', this.destroyManager)
      .subscribe((data: any) => {
        // Filter data by selected quarter
        const filteredByQuarter = this.selectedQuarter
          ? data.filter((item: any) => item.Quarter === this.selectedQuarter)
          : data;

        // Merge data by core issue
        const mergedData = this.mergeByCategoryOrIssue(
          filteredByQuarter,
          'CORE_ISSUE',
          'CORE_ISSUE_COUNT',
        );

        // Cache for reapplying filters
        this.cachedCoreIssueData = mergedData;
        this.updateExpandedCoreIssueData();

        // Extract all unique core issue labels
        this.allCoreIssueLabels = mergedData.map((item) => item.CORE_ISSUE);

        // Apply initial threshold filter
        this.reapplyCoreIssueFilters();
      });
  }

  getXxcaseiqSmCaseDetailsV() {
    this.http
      .get('xxcaseiq-sm-case-details-v', this.destroyManager)
      .subscribe((data: any) => {
        // Filter data by selected quarter
        const filteredByQuarter = this.selectedQuarter
          ? data.filter((item: any) => item.Quarter === this.selectedQuarter)
          : data;

        this.updateTableData(filteredByQuarter);

        // Hide loading overlay after data is loaded
        this.refreshingData = false;
      });
  }

  getXxcaseiqValidatedCasesAccuracyV() {
    this.http
      .get('xxcaseiq-validated-cases-accuracy-v', this.destroyManager)
      .subscribe((data: any) => {
        // Filter data by selected quarter and team
        const filteredByQuarter = this.selectedQuarter
          ? data.filter(
              (item: any) =>
                item.Quarter === this.selectedQuarter &&
                item.TEAM_NAME === 'SM',
            )
          : data.filter((item: any) => item.TEAM_NAME === 'SM');

        this.updateSmMetrics(filteredByQuarter);
      });
  }

  /**
   * Callback for upload success
   */
  handleUploadResult(success: boolean): void {
    if (success) {
      // Emit event to parent component to refresh overall accuracy
      this.uploadSuccess.emit();
      this.refreshAllData();
    }
  }

  /**
   * Refresh all data sources in parallel
   */
  refreshAllData(): Promise<void> {
    this.refreshingData = true;

    return Promise.all([
      this.http
        .get('xxcaseiq-validated-cases-accuracy-v', this.destroyManager)
        .toPromise()
        .then((data: any) => {
          this.updateSmMetrics(data);
        }),
      this.http
        .get('xxcaseiq-category-graph-v-sm', this.destroyManager)
        .toPromise()
        .then((data: any) => {
          const mergedData = this.mergeByCategoryOrIssue(
            data,
            'CATEGORY',
            'CATEGORY_COUNT',
          );
          this.cachedCategoryData = mergedData;
          this.updateExpandedCategoryData();
          this.allCategoryLabels = mergedData.map((item) => item.CATEGORY);
          this.reapplyCategoryFilters();
        }),
      this.http
        .get('xxcaseiq-core-issue-graph-v-sm', this.destroyManager)
        .toPromise()
        .then((data: any) => {
          const mergedData = this.mergeByCategoryOrIssue(
            data,
            'CORE_ISSUE',
            'CORE_ISSUE_COUNT',
          );
          this.cachedCoreIssueData = mergedData;
          this.updateExpandedCoreIssueData();
          this.allCoreIssueLabels = mergedData.map((item) => item.CORE_ISSUE);
          this.reapplyCoreIssueFilters();
        }),
      this.http
        .get('xxcaseiq-sm-case-details-v', this.destroyManager)
        .toPromise()
        .then((data: any) => {
          this.updateTableData(data);
        }),
    ])
      .then(() => {
        this.refreshingData = false;
      })
      .catch((err) => {
        this.refreshingData = false;
        console.error('Error refreshing data sources:', err);
      });
  }

  /**
   * Filter control methods
   */
  toggleCategoryFilters(): void {
    this.showCategoryFilters = !this.showCategoryFilters;
    if (!this.showCategoryFilters) {
      this.showCategorySelect = false;
    }
  }

  toggleCoreIssueFilters(): void {
    this.showCoreIssueFilters = !this.showCoreIssueFilters;
    if (!this.showCoreIssueFilters) {
      this.showCoreIssueSelect = false;
    }
  }

  toggleCategorySelect(): void {
    this.showCategorySelect = !this.showCategorySelect;
  }

  toggleCoreIssueSelect(): void {
    this.showCoreIssueSelect = !this.showCoreIssueSelect;
  }

  /**
   * Threshold adjustment methods
   */
  adjustCategoryThreshold(direction: number): void {
    this.categoryMinThreshold = Math.max(
      10,
      this.categoryMinThreshold + direction * 5,
    );
    this.reapplyCategoryFilters();
  }

  adjustCoreIssueThreshold(direction: number): void {
    this.coreIssueMinThreshold = Math.max(
      10,
      this.coreIssueMinThreshold + direction * 5,
    );
    this.reapplyCoreIssueFilters();
  }

  /**
   * Reapply category filters with threshold and selection
   */
  reapplyCategoryFilters(): void {
    let filtered = this.cachedCategoryData.filter(
      (item) => item.CATEGORY_COUNT > this.categoryMinThreshold,
    );

    // If no data passes threshold, show all data instead
    if (filtered.length === 0 && this.cachedCategoryData.length > 0) {
      filtered = this.cachedCategoryData;
    }

    if (this.selectedCategoryLabels.size > 0) {
      filtered = filtered.filter((item) =>
        this.selectedCategoryLabels.has(item.CATEGORY),
      );
    }

    this.visibleCategoryTotal = this.computeStackedTotal(filtered, 'data');
    this.i2cChartData = this.transformMatchStatusData(
      filtered,
      'CATEGORY',
      'CATEGORY_COUNT',
    );
    this.syncTableFilters();
  }

  /**
   * Reapply core issue filters with threshold and selection
   */
  reapplyCoreIssueFilters(): void {
    let filtered = this.cachedCoreIssueData.filter(
      (item) => item.CORE_ISSUE_COUNT > this.coreIssueMinThreshold,
    );

    // If no data passes threshold, show all data instead
    if (filtered.length === 0 && this.cachedCoreIssueData.length > 0) {
      filtered = this.cachedCoreIssueData;
    }

    if (this.selectedCoreIssueLabels.size > 0) {
      filtered = filtered.filter((item) =>
        this.selectedCoreIssueLabels.has(item.CORE_ISSUE),
      );
    }

    this.visibleCoreIssueTotal = this.computeStackedTotal(filtered, 'data');
    this.i2cSimpleChartData = this.transformMatchStatusData(
      filtered,
      'CORE_ISSUE',
      'CORE_ISSUE_COUNT',
    );
    this.syncTableFilters();
  }

  /**
   * Handle category bar click - filter table by clicked category
   */
  onCategoryBarClick(label: string): void {
    // Toggle filter: if same category clicked, clear filter; otherwise set new filter
    if (this.activeChartCategoryFilter === label) {
      this.activeChartCategoryFilter = null;
      this.selectedCategoryLabels.clear();
    } else {
      this.activeChartCategoryFilter = label;
      // Add to selectedCategoryLabels to filter the chart
      this.selectedCategoryLabels.clear();
      this.selectedCategoryLabels.add(label);
    }
    this.reapplyCategoryFilters();
    this.syncTableFilters();
  }

  /**
   * Handle core issue bar click - filter table by clicked core issue
   */
  onCoreIssueBarClick(label: string): void {
    // Toggle filter: if same core issue clicked, clear filter; otherwise set new filter
    if (this.activeChartCoreIssueFilter === label) {
      this.activeChartCoreIssueFilter = null;
      this.selectedCoreIssueLabels.clear();
    } else {
      this.activeChartCoreIssueFilter = label;
      // Add to selectedCoreIssueLabels to filter the chart
      this.selectedCoreIssueLabels.clear();
      this.selectedCoreIssueLabels.add(label);
    }
    this.reapplyCoreIssueFilters();
    this.syncTableFilters();
  }

  /**
   * Sync table filters based on active chart filters and dropdown selections
   */
  syncTableFilters(): void {
    if (!this.smTable) {
      return;
    }

    // Build combined filter criteria
    const categoryFilters: string[] = [];
    const coreIssueFilters: string[] = [];

    // Add chart click filter (takes precedence if active)
    if (this.activeChartCategoryFilter) {
      categoryFilters.push(this.activeChartCategoryFilter);
    } else if (this.selectedCategoryLabels.size > 0) {
      // Add dropdown selections if no chart click filter
      categoryFilters.push(...Array.from(this.selectedCategoryLabels));
    }

    if (this.activeChartCoreIssueFilter) {
      coreIssueFilters.push(this.activeChartCoreIssueFilter);
    } else if (this.selectedCoreIssueLabels.size > 0) {
      // Add dropdown selections if no chart click filter
      coreIssueFilters.push(...Array.from(this.selectedCoreIssueLabels));
    }
    // If no filters active, show all data and clear any table filters
    if (categoryFilters.length === 0 && coreIssueFilters.length === 0) {
      this.smTable.clearAllFilters();

      // Reset both charts to their original filtered state (based on threshold)
      const categoryEffectiveData = this.cachedCategoryData.filter(
        (item: any) => item.CATEGORY_COUNT > this.categoryMinThreshold,
      );
      this.i2cChartData = this.transformMatchStatusData(
        categoryEffectiveData.length > 0
          ? categoryEffectiveData
          : this.cachedCategoryData,
        'CATEGORY',
        'CATEGORY_COUNT',
      );
      this.visibleCategoryTotal = this.computeStackedTotal(
        categoryEffectiveData.length > 0
          ? categoryEffectiveData
          : this.cachedCategoryData,
        'data',
      );

      const coreIssueEffectiveData = this.cachedCoreIssueData.filter(
        (item: any) => item.CORE_ISSUE_COUNT > this.coreIssueMinThreshold,
      );
      this.i2cSimpleChartData = this.transformMatchStatusData(
        coreIssueEffectiveData.length > 0
          ? coreIssueEffectiveData
          : this.cachedCoreIssueData,
        'CORE_ISSUE',
        'CORE_ISSUE_COUNT',
      );
      this.visibleCoreIssueTotal = this.computeStackedTotal(
        coreIssueEffectiveData.length > 0
          ? coreIssueEffectiveData
          : this.cachedCoreIssueData,
        'data',
      );
      return;
    }

    // Apply filters to table
    let filteredData = [...this.fullTableData];
    if (categoryFilters.length > 0) {
      const categoryFiltersLower = categoryFilters.map((f) => f.toLowerCase());
      filteredData = filteredData.filter((row) =>
        categoryFiltersLower.includes((row.CATEGORY || '').toLowerCase()),
      );
    }

    if (coreIssueFilters.length > 0) {
      const coreIssueFiltersLower = coreIssueFilters.map((f) =>
        f.toLowerCase(),
      );
      filteredData = filteredData.filter((row) =>
        coreIssueFiltersLower.includes((row.CORE_ISSUE || '').toLowerCase()),
      );
    }
    // Dynamically filter charts based on filtered table data
    if (categoryFilters.length > 0) {
      const uniqueCoreIssues = Array.from(
        new Set(
          filteredData
            .map((row) => row.CORE_ISSUE.toLowerCase())
            .filter((v) => v),
        ),
      );
      const completeCoreIssueChartData = this.transformMatchStatusData(
        this.cachedCoreIssueData,
        'CORE_ISSUE',
        'CORE_ISSUE_COUNT',
      );
      this.i2cSimpleChartData = completeCoreIssueChartData.filter((item) =>
        uniqueCoreIssues.includes(item.label.toLowerCase()),
      );
      const filteredCoreIssueData = this.cachedCoreIssueData.filter(
        (item: any) => uniqueCoreIssues.includes(item.CORE_ISSUE.toLowerCase()),
      );
      this.visibleCoreIssueTotal = this.computeStackedTotal(
        filteredCoreIssueData,
        'data',
      );
    } else if (coreIssueFilters.length === 0) {
      const effectiveData = this.cachedCoreIssueData.filter(
        (item: any) => item.CORE_ISSUE_COUNT > this.coreIssueMinThreshold,
      );
      this.i2cSimpleChartData = this.transformMatchStatusData(
        effectiveData.length > 0 ? effectiveData : this.cachedCoreIssueData,
        'CORE_ISSUE',
        'CORE_ISSUE_COUNT',
      );
      this.visibleCoreIssueTotal = this.computeStackedTotal(
        effectiveData.length > 0 ? effectiveData : this.cachedCoreIssueData,
        'data',
      );
    }

    if (coreIssueFilters.length > 0) {
      const uniqueCategories = Array.from(
        new Set(
          filteredData
            .map((row) => row.CATEGORY.toLowerCase())
            .filter((v) => v),
        ),
      );
      const completeCategoryChartData = this.transformMatchStatusData(
        this.cachedCategoryData,
        'CATEGORY',
        'CATEGORY_COUNT',
      );
      this.i2cChartData = completeCategoryChartData.filter((item) =>
        uniqueCategories.includes(item.label.toLowerCase()),
      );
      const filteredCategoryData = this.cachedCategoryData.filter((item: any) =>
        uniqueCategories.includes(item.CATEGORY.toLowerCase()),
      );
      this.visibleCategoryTotal = this.computeStackedTotal(
        filteredCategoryData,
        'data',
      );
    } else if (categoryFilters.length === 0) {
      const effectiveData = this.cachedCategoryData.filter(
        (item: any) => item.CATEGORY_COUNT > this.categoryMinThreshold,
      );
      this.i2cChartData = this.transformMatchStatusData(
        effectiveData.length > 0 ? effectiveData : this.cachedCategoryData,
        'CATEGORY',
        'CATEGORY_COUNT',
      );
      this.visibleCategoryTotal = this.computeStackedTotal(
        effectiveData.length > 0 ? effectiveData : this.cachedCategoryData,
        'data',
      );
    }

    // Update table data source
    this.smTable.dataSource.data = filteredData;
    this.smTable.currentPage = 0;
  }

  /**
   * Multi-select handlers for category
   */
  toggleCategorySelection(label: string): void {
    if (this.selectedCategoryLabels.has(label)) {
      this.selectedCategoryLabels.delete(label);
    } else {
      this.selectedCategoryLabels.add(label);
    }
    // Clear chart click filter when using dropdown
    this.activeChartCategoryFilter = null;
    this.reapplyCategoryFilters();
    this.syncTableFilters();
  }

  clearCategorySelection(event: Event): void {
    event.stopPropagation();
    this.selectedCategoryLabels.clear();
    this.activeChartCategoryFilter = null;
    this.reapplyCategoryFilters();
    this.syncTableFilters();
  }

  /**
   * Multi-select handlers for core issue
   */
  toggleCoreIssueSelection(label: string): void {
    if (this.selectedCoreIssueLabels.has(label)) {
      this.selectedCoreIssueLabels.delete(label);
    } else {
      this.selectedCoreIssueLabels.add(label);
    }
    // Clear chart click filter when using dropdown
    this.activeChartCoreIssueFilter = null;
    this.reapplyCoreIssueFilters();
    this.syncTableFilters();
  }

  clearCoreIssueSelection(event: Event): void {
    event.stopPropagation();
    this.selectedCoreIssueLabels.clear();
    this.activeChartCoreIssueFilter = null;
    this.reapplyCoreIssueFilters();
    this.syncTableFilters();
  }

  // Get filter text for display
  getCategoryFilterText(): string {
    if (this.selectedCategoryLabels.size === 1) {
      const label = Array.from(this.selectedCategoryLabels)[0];
      return label.length > 20 ? label.substring(0, 20) + '...' : label;
    }
    return 'Filter';
  }

  getCoreIssueFilterText(): string {
    if (this.selectedCoreIssueLabels.size === 1) {
      const label = Array.from(this.selectedCoreIssueLabels)[0];
      return label.length > 20 ? label.substring(0, 20) + '...' : label;
    }
    return 'Filter';
  }

  /**
   * Close dropdowns when clicking outside
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-wrapper')) {
      this.showCategoryFilters = false;
      this.showCoreIssueFilters = false;
      this.showCategorySelect = false;
      this.showCoreIssueSelect = false;
    }
  }

  /**
   * Compute total visible cases from stacked data
   */
  computeStackedTotal(data: any[], dataKey: string): number {
    return data.reduce((sum, item) => {
      if (item[dataKey] && Array.isArray(item[dataKey])) {
        const itemSum = item[dataKey].reduce(
          (s: number, d: any) => s + (d.COUNT || 0),
          0,
        );
        return sum + itemSum;
      }
      return sum;
    }, 0);
  }

  // Expand chart modal state
  expandedChart: { type: 'CATEGORY' | 'CORE_ISSUE' } | null = null;

  onExpandChart(chartType: 'CATEGORY' | 'CORE_ISSUE'): void {
    this.expandedChart = { type: chartType };
  }

  closeExpandModal(): void {
    this.expandedChart = null;
  }

  private updateExpandedCategoryData(): void {
    this.expandedCategoryData = this.transformMatchStatusData(
      this.cachedCategoryData,
      'CATEGORY',
      'CATEGORY_COUNT',
    );
    this.expandedCategoryTotal = this.computeStackedTotal(
      this.cachedCategoryData,
      'data',
    );
  }

  private updateExpandedCoreIssueData(): void {
    this.expandedCoreIssueData = this.transformMatchStatusData(
      this.cachedCoreIssueData,
      'CORE_ISSUE',
      'CORE_ISSUE_COUNT',
    );
    this.expandedCoreIssueTotal = this.computeStackedTotal(
      this.cachedCoreIssueData,
      'data',
    );
  }

  /**
   * Updates table data and columns from API response
   * Dynamically sets columns based on the first record's keys
   */
  private updateTableData(apiData: any[]): void {
    if (Array.isArray(apiData) && apiData.length > 0) {
      this.fullTableData = [...apiData]; // Store full unfiltered data
      this.i2cTableData.data = apiData;

      // Set total records for pagination
      this.totalRecords = apiData.length;
      this.i2cTableColumns = Object.keys(apiData[0]).filter(
        (key) =>
          key !== 'DESCRIPTION' &&
          key !== 'SUMMARY' &&
          key !== 'Quarter' &&
          key !== 'Cancelled reason',
      );
      // Manually trigger paginator setup after data is loaded
      setTimeout(() => {
        if (this.smTable) {
          this.smTable.initializePaginator();
        }
      }, 100);
    } else {
      // No data received, keep empty state
      this.i2cTableData.data = [];
      this.i2cTableColumns = [];
      this.totalRecords = 0;
    }
  }

  totalAccuracy: any;
  /**
   * Updates SM metrics from API data
   * Finds the SM team data and sets the component properties
   */
  private updateSmMetrics(apiData: SmAccuracyData[]): void {
    if (Array.isArray(apiData)) {
      const smData = apiData.find(
        (item) => item.TEAM_NAME && item.TEAM_NAME.toUpperCase() === 'SM',
      );

      if (smData) {
        this.categoryAccuracy =
          Math.round(smData['Category Accuracy'] * 100) / 100;
        this.coreIssueAccuracy =
          Math.round(smData['Core Issue Accuracy'] * 100) / 100;
        this.totalCases = smData['Total Cases'];
        this.totalAccuracy =
          smData['Total Accuracy'] !== undefined
            ? Math.round(smData['Total Accuracy'] * 100) / 100
            : '-';
      } else {
        // No SM data found, keep defaults
        this.categoryAccuracy = '-';
        this.coreIssueAccuracy = '-';
        this.totalCases = '-';
        this.totalAccuracy = '-';
      }
    }
  }

  /**
   * Generic method to transform match status API data into stacked bar chart format
   * Groups by specified groupColumn and creates segments for each MATCH_STATUS
   */
  private transformMatchStatusData(
    apiData: any[],
    groupColumn: string,
    countColumn: string,
  ): StackedBarChartDataPoint[] {
    if (!Array.isArray(apiData)) {
      return [];
    }

    // Handle merged data structure with nested data array
    const chartData = apiData.map((item) => {
      const segments = item.data
        ? item.data.map((statusItem: any) => ({
            name: statusItem.MATCH_STATUS,
            value: statusItem.COUNT,
            color: this.getMatchStatusColor(statusItem.MATCH_STATUS),
          }))
        : [
            {
              name: item.MATCH_STATUS,
              value: item[countColumn],
              color: this.getMatchStatusColor(item.MATCH_STATUS),
            },
          ];

      return {
        label: item[groupColumn] ?? '', // Convert null/undefined to empty string
        segments: segments,
      };
    });
    return chartData;
  }

  /**
   * Returns color based on match status
   */
  private getMatchStatusColor(matchStatus: string): string {
    switch (matchStatus.toUpperCase()) {
      case 'MATCHED':
        return '#36A2EB'; // Blue for matched
      case 'NOT MATCHED':
        return '#cacacaff'; // Grey for not matched
      case 'ANALYZED':
        return '#FFCE56'; // Yellow for analyzed
      default:
        return '#FF6384'; // Red for unknown
    }
  }
}
