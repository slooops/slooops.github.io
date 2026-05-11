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

interface FppAccuracyData {
  TEAM_NAME: string;
  CATEGORY: number;
  CORE_ISSUE: number;
  TOTAL_ACCURACY: number;
  TOTAL_VALIDATED_CASES: number;
}

@Component({
  selector: 'app-caseiq-fpp',
  templateUrl: './caseiq-fpp.component.html',
  styleUrl: './caseiq-fpp.component.css',
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
export class CaseiqFppComponent implements OnInit, OnChanges {
  @Input() selectedQuarter!: string; // Quarter filter from parent
  @ViewChild('fppTable') fppTable!: CaseiqTableComponent;
  @Output() uploadSuccess = new EventEmitter<void>();
  @Input() caseIqMetrics: any;
  totalAccuracy: any;

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

  allCategoryLabels: string[] = [];
  allCoreIssueLabels: string[] = [];
  selectedCategoryLabels: Set<string> = new Set();
  selectedCoreIssueLabels: Set<string> = new Set();

  categoryMinThreshold = 0;
  coreIssueMinThreshold = 0;

  // Cached full data
  cachedCategoryData: any[] = [];
  cachedCoreIssueData: any[] = [];

  // Cached transformed chart data for expand modal (stable references)
  expandedCategoryData: StackedBarChartDataPoint[] = [];
  expandedCoreIssueData: StackedBarChartDataPoint[] = [];
  expandedCategoryTotal = 0;
  expandedCoreIssueTotal = 0;

  // Visible totals
  visibleCategoryTotal = 0;
  visibleCoreIssueTotal = 0;

  // Loading state
  refreshingData = false;

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
   * CaseIQ metrics filtered by selectedQuarter for FPP.
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
          m.TEAM_NAME.toString().toUpperCase() === 'FPP',
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
    this.getXxcaseiqCategoryGraphVFpp();
    this.getXxcaseiqCoreIssueGraphVFpp();
    this.getXxcaseiqFppCaseDetailsV();
  }

  // Merge objects by CATEGORY or CORE_ISSUE
  private mergeByCategoryOrIssue(
    data: any[],
    groupKey: string,
    countKey: string,
  ): any[] {
    const grouped = new Map<string, any>();

    data.forEach((item) => {
      const key = item[groupKey] ?? ''; // Convert null/undefined to empty string

      if (!grouped.has(key)) {
        grouped.set(key, {
          [groupKey]: key,
          [countKey]: 0,
          data: [],
        });
      }
      const group = grouped.get(key)!;
      group[countKey] += item[countKey];
      group.data.push({
        MATCH_STATUS: item.MATCH_STATUS,
        COUNT: item[countKey],
      });
    });

    return Array.from(grouped.values());
  }

  getXxcaseiqCategoryGraphVFpp() {
    this.http
      .get('xxcaseiq-category-graph-v-fpp', this.destroyManager)
      .subscribe((data: any) => {
        // Filter data by selected quarter
        const filteredByQuarter = this.selectedQuarter
          ? data.filter((item: any) => item.Quarter === this.selectedQuarter)
          : data;

        // Merge by category
        const mergedData = this.mergeByCategoryOrIssue(
          filteredByQuarter,
          'CATEGORY',
          'CATEGORY_COUNT',
        );
        this.cachedCategoryData = mergedData;
        this.updateExpandedCategoryData();
        this.allCategoryLabels = mergedData.map((item) => item.CATEGORY);
        this.reapplyCategoryFilters();
      });
  }

  getXxcaseiqCoreIssueGraphVFpp() {
    this.http
      .get('xxcaseiq-core-issue-graph-v-fpp', this.destroyManager)
      .subscribe((data: any) => {
        // Filter data by selected quarter
        const filteredByQuarter = this.selectedQuarter
          ? data.filter((item: any) => item.Quarter === this.selectedQuarter)
          : data;

        // Merge by core issue
        const mergedData = this.mergeByCategoryOrIssue(
          filteredByQuarter,
          'CORE_ISSUE',
          'CORE_ISSUE_COUNT',
        );
        this.cachedCoreIssueData = mergedData;
        this.updateExpandedCoreIssueData();
        this.allCoreIssueLabels = mergedData.map((item) => item.CORE_ISSUE);
        this.reapplyCoreIssueFilters();
      });
  }

  getXxcaseiqFppCaseDetailsV() {
    this.http
      .get('xxcaseiq-fpp-case-details-v', this.destroyManager)
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
                item.TEAM_NAME === 'FPP',
            )
          : data.filter((item: any) => item.TEAM_NAME === 'FPP');
        this.updateFppMetrics(filteredByQuarter);
      });
  }

  // Handle upload result with overlay
  handleUploadResult(event: { success: boolean; message: string }) {
    if (event.success) {
      // Emit event to parent component to refresh overall accuracy
      this.uploadSuccess.emit();
      this.refreshAllData();
    }
  }

  // Refresh all data with loading overlay
  async refreshAllData(): Promise<void> {
    this.refreshingData = true;

    try {
      await Promise.all([
        new Promise<void>((resolve) => {
          this.http
            .get('xxcaseiq-validated-cases-accuracy-v', this.destroyManager)
            .subscribe({
              next: (data: any) => {
                this.updateFppMetrics(data);
                resolve();
              },
              error: () => resolve(),
            });
        }),
        new Promise<void>((resolve) => {
          this.http
            .get('xxcaseiq-category-graph-v-fpp', this.destroyManager)
            .subscribe({
              next: (data: any) => {
                const mergedData = this.mergeByCategoryOrIssue(
                  data,
                  'CATEGORY',
                  'CATEGORY_COUNT',
                );
                this.cachedCategoryData = mergedData;
                this.updateExpandedCategoryData();
                this.allCategoryLabels = mergedData.map(
                  (item) => item.CATEGORY,
                );
                this.reapplyCategoryFilters();
                resolve();
              },
              error: () => resolve(),
            });
        }),
        new Promise<void>((resolve) => {
          this.http
            .get('xxcaseiq-core-issue-graph-v-fpp', this.destroyManager)
            .subscribe({
              next: (data: any) => {
                const mergedData = this.mergeByCategoryOrIssue(
                  data,
                  'CORE_ISSUE',
                  'CORE_ISSUE_COUNT',
                );
                this.cachedCoreIssueData = mergedData;
                this.updateExpandedCoreIssueData();
                this.allCoreIssueLabels = mergedData.map(
                  (item) => item.CORE_ISSUE,
                );
                this.reapplyCoreIssueFilters();
                resolve();
              },
              error: () => resolve(),
            });
        }),
        new Promise<void>((resolve) => {
          this.http
            .get('xxcaseiq-fpp-case-details-v', this.destroyManager)
            .subscribe({
              next: (data: any) => {
                this.updateTableData(data);
                resolve();
              },
              error: () => resolve(),
            });
        }),
      ]);
    } finally {
      this.refreshingData = false;
    }
  }

  // Filter toggle methods
  toggleCategoryFilters() {
    this.showCategoryFilters = !this.showCategoryFilters;
    if (!this.showCategoryFilters) {
      this.showCategorySelect = false;
    }
  }

  toggleCoreIssueFilters() {
    this.showCoreIssueFilters = !this.showCoreIssueFilters;
    if (!this.showCoreIssueFilters) {
      this.showCoreIssueSelect = false;
    }
  }

  toggleCategorySelect() {
    this.showCategorySelect = !this.showCategorySelect;
  }

  toggleCoreIssueSelect() {
    this.showCoreIssueSelect = !this.showCoreIssueSelect;
  }

  // Threshold adjustment
  adjustCategoryThreshold(direction: number) {
    this.categoryMinThreshold = Math.max(
      10,
      this.categoryMinThreshold + direction * 5,
    );
    this.reapplyCategoryFilters();
  }

  adjustCoreIssueThreshold(direction: number) {
    this.coreIssueMinThreshold = Math.max(
      10,
      this.coreIssueMinThreshold + direction * 5,
    );
    this.reapplyCoreIssueFilters();
  }

  // Reapply filters
  reapplyCategoryFilters() {
    let filteredData = this.cachedCategoryData;

    if (this.selectedCategoryLabels.size > 0) {
      filteredData = filteredData.filter((item) =>
        this.selectedCategoryLabels.has(item.CATEGORY),
      );
    } else {
      filteredData = filteredData.filter(
        (item) => item.CATEGORY_COUNT > this.categoryMinThreshold,
      );

      // If no data passes threshold, show all data instead
      if (filteredData.length === 0 && this.cachedCategoryData.length > 0) {
        filteredData = this.cachedCategoryData;
      }
    }

    this.i2cChartData = this.transformMatchStatusData(
      filteredData,
      'CATEGORY',
      'CATEGORY_COUNT',
    );
    this.visibleCategoryTotal = this.computeStackedTotal(this.i2cChartData);
    this.syncTableFilters();
  }

  reapplyCoreIssueFilters() {
    let filteredData = this.cachedCoreIssueData;

    if (this.selectedCoreIssueLabels.size > 0) {
      filteredData = filteredData.filter((item) =>
        this.selectedCoreIssueLabels.has(item.CORE_ISSUE),
      );
    } else {
      filteredData = filteredData.filter(
        (item) => item.CORE_ISSUE_COUNT > this.coreIssueMinThreshold,
      );

      // If no data passes threshold, show all data instead
      if (filteredData.length === 0 && this.cachedCoreIssueData.length > 0) {
        filteredData = this.cachedCoreIssueData;
      }
    }

    this.i2cSimpleChartData = this.transformMatchStatusData(
      filteredData,
      'CORE_ISSUE',
      'CORE_ISSUE_COUNT',
    );
    this.visibleCoreIssueTotal = this.computeStackedTotal(
      this.i2cSimpleChartData,
    );
    this.syncTableFilters();
  }

  // Selection handlers
  toggleCategorySelection(label: string) {
    if (this.selectedCategoryLabels.has(label)) {
      this.selectedCategoryLabels.delete(label);
    } else {
      this.selectedCategoryLabels.add(label);
    }
    this.reapplyCategoryFilters();
  }

  toggleCoreIssueSelection(label: string) {
    if (this.selectedCoreIssueLabels.has(label)) {
      this.selectedCoreIssueLabels.delete(label);
    } else {
      this.selectedCoreIssueLabels.add(label);
    }
    this.reapplyCoreIssueFilters();
  }

  clearCategorySelection(event: Event) {
    event.stopPropagation();
    this.selectedCategoryLabels.clear();
    this.reapplyCategoryFilters();
  }

  clearCoreIssueSelection(event: Event) {
    event.stopPropagation();
    this.selectedCoreIssueLabels.clear();
    this.reapplyCoreIssueFilters();
  }

  // Handle category bar click
  onCategoryBarClick(categoryLabel: string): void {
    // Toggle: if already selected, clear it; otherwise set it as the only selection
    if (this.selectedCategoryLabels.has(categoryLabel)) {
      this.selectedCategoryLabels.clear();
    } else {
      this.selectedCategoryLabels.clear();
      if (categoryLabel && categoryLabel.trim()) {
        this.selectedCategoryLabels.add(categoryLabel);
      }
    }
    this.reapplyCategoryFilters();
  }

  // Handle core issue bar click
  onCoreIssueBarClick(coreIssueLabel: string): void {
    // Toggle: if already selected, clear it; otherwise set it as the only selection
    if (this.selectedCoreIssueLabels.has(coreIssueLabel)) {
      this.selectedCoreIssueLabels.clear();
    } else {
      this.selectedCoreIssueLabels.clear();
      if (coreIssueLabel && coreIssueLabel.trim()) {
        this.selectedCoreIssueLabels.add(coreIssueLabel);
      }
    }
    this.reapplyCoreIssueFilters();
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
   * Sync table filters based on dropdown selections
   */
  syncTableFilters(): void {
    if (!this.fppTable) return;

    const categoryFilters: string[] = [];
    const coreIssueFilters: string[] = [];

    if (this.selectedCategoryLabels.size > 0) {
      categoryFilters.push(...Array.from(this.selectedCategoryLabels));
    }
    if (this.selectedCoreIssueLabels.size > 0) {
      coreIssueFilters.push(...Array.from(this.selectedCoreIssueLabels));
    }

    // If no filters active, show all data and clear any table filters
    if (categoryFilters.length === 0 && coreIssueFilters.length === 0) {
      this.fppTable.clearAllFilters();

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
      this.visibleCategoryTotal = this.computeStackedTotal(this.i2cChartData);

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
        this.i2cSimpleChartData,
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
      this.visibleCoreIssueTotal = this.computeStackedTotal(
        this.i2cSimpleChartData,
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
        this.i2cSimpleChartData,
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
      this.visibleCategoryTotal = this.computeStackedTotal(this.i2cChartData);
    } else if (categoryFilters.length === 0) {
      const effectiveData = this.cachedCategoryData.filter(
        (item: any) => item.CATEGORY_COUNT > this.categoryMinThreshold,
      );
      this.i2cChartData = this.transformMatchStatusData(
        effectiveData.length > 0 ? effectiveData : this.cachedCategoryData,
        'CATEGORY',
        'CATEGORY_COUNT',
      );
      this.visibleCategoryTotal = this.computeStackedTotal(this.i2cChartData);
    }

    this.fppTable.dataSource.data = filteredData;
    this.fppTable.currentPage = 0;
  }

  // Close dropdowns when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // If click inside a filter panel or on filter icon/button, ignore
    if (
      target.closest('.chart-filter-panel') ||
      target.closest('.filter-wrapper')
    ) {
      return;
    }
    if (this.showCategoryFilters || this.showCoreIssueFilters) {
      this.showCategoryFilters = false;
      this.showCoreIssueFilters = false;
      this.showCategorySelect = false;
      this.showCoreIssueSelect = false;
    }
  }

  // Compute stacked total
  computeStackedTotal(chartData: StackedBarChartDataPoint[]): number {
    return chartData.reduce((sum, bar) => {
      const barTotal = bar.segments.reduce(
        (segSum, seg) => segSum + seg.value,
        0,
      );
      return sum + barTotal;
    }, 0);
  }

  // Expand chart modal state
  expandedChart: { type: 'CATEGORY' | 'CORE_ISSUE' } | null = null;

  onExpandChart(chartType: 'CATEGORY' | 'CORE_ISSUE') {
    this.expandedChart = { type: chartType };
  }

  closeExpandModal() {
    this.expandedChart = null;
  }

  private updateExpandedCategoryData(): void {
    this.expandedCategoryData = this.transformMatchStatusData(
      this.cachedCategoryData,
      'CATEGORY',
      'CATEGORY_COUNT',
    );
    this.expandedCategoryTotal = this.computeStackedTotal(
      this.expandedCategoryData,
    );
  }

  private updateExpandedCoreIssueData(): void {
    this.expandedCoreIssueData = this.transformMatchStatusData(
      this.cachedCoreIssueData,
      'CORE_ISSUE',
      'CORE_ISSUE_COUNT',
    );
    this.expandedCoreIssueTotal = this.computeStackedTotal(
      this.expandedCoreIssueData,
    );
  }

  private updateTableData(apiData: any[]): void {
    if (Array.isArray(apiData) && apiData.length > 0) {
      this.fullTableData = [...apiData]; // Store full unfiltered data
      this.i2cTableData.data = apiData;
      this.totalRecords = apiData.length;
      this.i2cTableColumns = Object.keys(apiData[0]).filter(
        (key) =>
          key !== 'DESCRIPTION' &&
          key !== 'SUMMARY' &&
          key !== 'Quarter' &&
          key !== 'Cancelled reason',
      );
    } else {
      this.fullTableData = [];
      this.totalRecords = 0;
      this.i2cTableData.data = [];
      this.i2cTableColumns = [];
    }
  }

  private updateFppMetrics(apiData: FppAccuracyData[]): void {
    if (Array.isArray(apiData)) {
      const fppData = apiData.find(
        (item) => item.TEAM_NAME && item.TEAM_NAME.toLowerCase() === 'fpp',
      );

      if (fppData) {
        this.categoryAccuracy = fppData['Category Accuracy'] ?? '-';
        this.coreIssueAccuracy = fppData['Core Issue Accuracy'] ?? '-';
        this.totalCases = fppData['Total Cases'] ?? '-';
        this.totalAccuracy = fppData['Total Accuracy'] ?? '-';
      }
    }
  }

  private transformMatchStatusData(
    apiData: any[],
    groupColumn: string,
    countColumn: string,
  ): StackedBarChartDataPoint[] {
    if (!Array.isArray(apiData)) {
      return [];
    }

    const chartData = apiData.map((item) => {
      // Handle nested data structure from merge
      const segments = item.data
        ? item.data.map((statusItem: any) => ({
            name: statusItem.MATCH_STATUS,
            value: statusItem.COUNT,
            color: this.getMatchStatusColor(statusItem.MATCH_STATUS),
          }))
        : [
            {
              name: item.MATCH_STATUS || 'Unknown',
              value: item[countColumn] || 0,
              color: this.getMatchStatusColor(item.MATCH_STATUS || 'Unknown'),
            },
          ];

      return { label: item[groupColumn] ?? '', segments }; // Convert null/undefined to empty string
    });

    return chartData;
  }

  private getMatchStatusColor(matchStatus: string): string {
    switch (matchStatus.toUpperCase()) {
      case 'MATCHED':
        return '#36A2EB';
      case 'NOT MATCHED':
        return '#cacacaff';
      case 'ANALYZED':
        return '#FFCE56';
      default:
        return '#E5E5E5';
    }
  }
}
