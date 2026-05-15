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
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorInfoBold,
  phosphorFunnelSimpleBold,
} from '@ng-icons/phosphor-icons/bold';
import { coolExpand } from '@ng-icons/coolicons';
import { CaseiqExpandModalComponent } from 'src/app/components/caseiq-expand-modal/caseiq-expand-modal.component';
import { BarChartComponent } from '../../../components/bar-chart/bar-chart.component';

export interface TeamConfig {
  /** Display name: 'OM', 'SM', 'Capital', etc. */
  displayName: string;
  /** Lowercase API suffix: 'om', 'sm', 'capital', 'fpp', 'p2p', 'i2c', 'ait' */
  apiSuffix: string;
  /** TEAM_NAME value used in accuracy API filter (uppercase): 'OM', 'SM', 'CAPITAL', etc. */
  teamFilterName: string;
  /** Source string for upload dialog: 'om', 'sm', 'cap', 'fpp', 'p2p', 'i2c', 'ait' */
  tableSource: string;
  /** Export filename prefix: 'OM_Validation_Summary', etc. */
  exportFileName: string;
}

interface AccuracyData {
  TEAM_NAME: string;
  CATEGORY: number;
  CORE_ISSUE: number;
  TOTAL_ACCURACY: number;
  TOTAL_VALIDATED_CASES: number;
}

@Component({
  selector: 'app-caseiq-team',
  templateUrl: './caseiq-team.component.html',
  styleUrl: './caseiq-team.component.css',
  imports: [
    CommonModule,
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
export class CaseiqTeamComponent implements OnInit, OnChanges {
  @Input() teamConfig!: TeamConfig;
  @Input() selectedQuarter!: string;
  @Input() caseIqMetrics: any;
  @Output() uploadSuccess = new EventEmitter<void>();
  @ViewChild('teamTable') teamTable!: CaseiqTableComponent;

  totalAccuracy: any;

  constructor(
    private readonly http: ApiHttpService,
    private readonly destroyManager: DestroyManager,
  ) {}

  // Chart data
  categoryChartData: StackedBarChartDataPoint[] = [];
  coreIssueChartData: StackedBarChartDataPoint[] = [];

  // KPI values
  categoryAccuracy: number | string = '-';
  coreIssueAccuracy: number | string = '-';
  totalCases: number | string = '-';

  // Table state
  tableData = new MatTableDataSource<any>([]);
  tableColumns: string[] = [];
  totalRecords: number = 0;
  fullTableData: any[] = [];

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

  // Expand chart modal state
  expandedChart: { type: 'CATEGORY' | 'CORE_ISSUE' } | null = null;

  // Dynamic IDs derived from config
  get stackedCanvasId(): string {
    return `${this.teamConfig.tableSource}StackedChart`;
  }
  get simpleCanvasId(): string {
    return `${this.teamConfig.tableSource}SimpleChart`;
  }
  get expandCanvasPrefix(): string {
    return `expanded${this.teamConfig.displayName.replace(/\s/g, '')}`;
  }
  get tableTitle(): string {
    return `${this.teamConfig.displayName} Classification Summary`;
  }

  ngOnInit(): void {
    this.loadAllData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['selectedQuarter'] && !changes['selectedQuarter'].firstChange) ||
      (changes['caseIqMetrics'] && !changes['caseIqMetrics'].firstChange)
    ) {
      this.refreshingData = true;
      this.loadAllData();
    }
  }

  /**
   * CaseIQ metrics filtered by selectedQuarter for this team.
   */
  get filteredCaseIqMetrics(): any {
    if (!this.caseIqMetrics) return null;
    if (!this.selectedQuarter) return this.caseIqMetrics;

    if (Array.isArray(this.caseIqMetrics)) {
      const row = this.caseIqMetrics.find(
        (m: any) =>
          m &&
          m.FISCAL_QTR === this.selectedQuarter &&
          m.TEAM_NAME &&
          m.TEAM_NAME.toString().toUpperCase() ===
            this.teamConfig.teamFilterName,
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

  // ── Data loading ──────────────────────────────────────────────

  private loadAllData(): void {
    this.fetchAccuracy();
    this.fetchCategoryGraph();
    this.fetchCoreIssueGraph();
    this.fetchCaseDetails();
  }

  private fetchAccuracy(): void {
    this.http
      .get('xxcaseiq-validated-cases-accuracy-v', this.destroyManager)
      .subscribe((data: any) => {
        const filtered = this.selectedQuarter
          ? data.filter(
              (item: any) =>
                item.Quarter === this.selectedQuarter &&
                item.TEAM_NAME?.toUpperCase() ===
                  this.teamConfig.teamFilterName,
            )
          : data.filter(
              (item: any) =>
                item.TEAM_NAME?.toUpperCase() ===
                this.teamConfig.teamFilterName,
            );
        this.updateAccuracyMetrics(filtered);
      });
  }

  private fetchCategoryGraph(): void {
    this.http
      .get(
        `xxcaseiq-category-graph-v-${this.teamConfig.apiSuffix}`,
        this.destroyManager,
      )
      .subscribe((data: any) => {
        const filteredByQuarter = this.selectedQuarter
          ? data.filter((item: any) => item.Quarter === this.selectedQuarter)
          : data;

        const mergedData = this.mergeByCategoryOrIssue(
          filteredByQuarter,
          'CATEGORY',
          'CATEGORY_COUNT',
        );
        this.cachedCategoryData = mergedData;
        this.updateExpandedCategoryData();
        this.allCategoryLabels = mergedData.map((item: any) => item.CATEGORY);
        this.reapplyCategoryFilters();
      });
  }

  private fetchCoreIssueGraph(): void {
    this.http
      .get(
        `xxcaseiq-core-issue-graph-v-${this.teamConfig.apiSuffix}`,
        this.destroyManager,
      )
      .subscribe((data: any) => {
        const filteredByQuarter = this.selectedQuarter
          ? data.filter((item: any) => item.Quarter === this.selectedQuarter)
          : data;

        const mergedData = this.mergeByCategoryOrIssue(
          filteredByQuarter,
          'CORE_ISSUE',
          'CORE_ISSUE_COUNT',
        );
        this.cachedCoreIssueData = mergedData;
        this.updateExpandedCoreIssueData();
        this.allCoreIssueLabels = mergedData.map(
          (item: any) => item.CORE_ISSUE,
        );
        this.reapplyCoreIssueFilters();
      });
  }

  private fetchCaseDetails(): void {
    this.http
      .get(
        `xxcaseiq-${this.teamConfig.apiSuffix}-case-details-v`,
        this.destroyManager,
      )
      .subscribe((data: any) => {
        const filteredByQuarter = this.selectedQuarter
          ? data.filter((item: any) => item.Quarter === this.selectedQuarter)
          : data;

        this.updateTableData(filteredByQuarter);
        this.refreshingData = false;
      });
  }

  // ── Upload / Refresh ──────────────────────────────────────────

  handleUploadResult(event: { success: boolean; message: string }): void {
    if (event.success) {
      this.uploadSuccess.emit();
      this.refreshAllData();
    }
  }

  async refreshAllData(): Promise<void> {
    this.refreshingData = true;

    try {
      await Promise.all([
        new Promise<void>((resolve) => {
          this.http
            .get('xxcaseiq-validated-cases-accuracy-v', this.destroyManager)
            .subscribe({
              next: (data: any) => {
                this.updateAccuracyMetrics(data);
                resolve();
              },
              error: () => resolve(),
            });
        }),
        new Promise<void>((resolve) => {
          this.http
            .get(
              `xxcaseiq-category-graph-v-${this.teamConfig.apiSuffix}`,
              this.destroyManager,
            )
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
                  (item: any) => item.CATEGORY,
                );
                this.reapplyCategoryFilters();
                resolve();
              },
              error: () => resolve(),
            });
        }),
        new Promise<void>((resolve) => {
          this.http
            .get(
              `xxcaseiq-core-issue-graph-v-${this.teamConfig.apiSuffix}`,
              this.destroyManager,
            )
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
                  (item: any) => item.CORE_ISSUE,
                );
                this.reapplyCoreIssueFilters();
                resolve();
              },
              error: () => resolve(),
            });
        }),
        new Promise<void>((resolve) => {
          this.http
            .get(
              `xxcaseiq-${this.teamConfig.apiSuffix}-case-details-v`,
              this.destroyManager,
            )
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

  // ── Merge helper ──────────────────────────────────────────────

  private mergeByCategoryOrIssue(
    data: any[],
    groupKey: string,
    countKey: string,
  ): any[] {
    if (!Array.isArray(data) || data.length === 0) return [];

    const grouped = new Map<string, any>();

    data.forEach((item) => {
      const key = item[groupKey] ?? '';

      if (!grouped.has(key)) {
        grouped.set(key, {
          [groupKey]: key,
          [countKey]: item[countKey],
          data: [{ MATCH_STATUS: item.MATCH_STATUS, COUNT: item[countKey] }],
        });
      } else {
        const existing = grouped.get(key)!;
        existing[countKey] += item[countKey];
        existing.data.push({
          MATCH_STATUS: item.MATCH_STATUS,
          COUNT: item[countKey],
        });
      }
    });

    return Array.from(grouped.values());
  }

  // ── Filter toggles ───────────────────────────────────────────

  toggleCategoryFilters(): void {
    this.showCategoryFilters = !this.showCategoryFilters;
    if (!this.showCategoryFilters) this.showCategorySelect = false;
  }

  toggleCoreIssueFilters(): void {
    this.showCoreIssueFilters = !this.showCoreIssueFilters;
    if (!this.showCoreIssueFilters) this.showCoreIssueSelect = false;
  }

  toggleCategorySelect(): void {
    this.showCategorySelect = !this.showCategorySelect;
  }

  toggleCoreIssueSelect(): void {
    this.showCoreIssueSelect = !this.showCoreIssueSelect;
  }

  // ── Threshold adjustment ──────────────────────────────────────

  adjustCategoryThreshold(direction: number): void {
    this.categoryMinThreshold = Math.max(
      0,
      this.categoryMinThreshold + direction * 5,
    );
    this.reapplyCategoryFilters();
  }

  adjustCoreIssueThreshold(direction: number): void {
    this.coreIssueMinThreshold = Math.max(
      0,
      this.coreIssueMinThreshold + direction * 5,
    );
    this.reapplyCoreIssueFilters();
  }

  // ── Reapply filters ───────────────────────────────────────────

  reapplyCategoryFilters(): void {
    let filteredData = this.cachedCategoryData;

    if (this.selectedCategoryLabels.size > 0) {
      filteredData = filteredData.filter((item) =>
        this.selectedCategoryLabels.has(item.CATEGORY),
      );
    } else {
      filteredData = filteredData.filter(
        (item) => item.CATEGORY_COUNT > this.categoryMinThreshold,
      );
      if (filteredData.length === 0 && this.cachedCategoryData.length > 0) {
        filteredData = this.cachedCategoryData;
      }
    }

    this.categoryChartData = this.transformMatchStatusData(
      filteredData,
      'CATEGORY',
      'CATEGORY_COUNT',
    );
    this.visibleCategoryTotal = this.computeStackedTotal(
      this.categoryChartData,
    );
    this.syncTableFilters();
  }

  reapplyCoreIssueFilters(): void {
    let filteredData = this.cachedCoreIssueData;

    if (this.selectedCoreIssueLabels.size > 0) {
      filteredData = filteredData.filter((item) =>
        this.selectedCoreIssueLabels.has(item.CORE_ISSUE),
      );
    } else {
      filteredData = filteredData.filter(
        (item) => item.CORE_ISSUE_COUNT > this.coreIssueMinThreshold,
      );
      if (filteredData.length === 0 && this.cachedCoreIssueData.length > 0) {
        filteredData = this.cachedCoreIssueData;
      }
    }

    this.coreIssueChartData = this.transformMatchStatusData(
      filteredData,
      'CORE_ISSUE',
      'CORE_ISSUE_COUNT',
    );
    this.visibleCoreIssueTotal = this.computeStackedTotal(
      this.coreIssueChartData,
    );
    this.syncTableFilters();
  }

  // ── Selection handlers ────────────────────────────────────────

  toggleCategorySelection(label: string): void {
    if (this.selectedCategoryLabels.has(label)) {
      this.selectedCategoryLabels.delete(label);
    } else {
      this.selectedCategoryLabels.add(label);
    }
    this.reapplyCategoryFilters();
  }

  toggleCoreIssueSelection(label: string): void {
    if (this.selectedCoreIssueLabels.has(label)) {
      this.selectedCoreIssueLabels.delete(label);
    } else {
      this.selectedCoreIssueLabels.add(label);
    }
    this.reapplyCoreIssueFilters();
  }

  clearCategorySelection(event: Event): void {
    event.stopPropagation();
    this.selectedCategoryLabels.clear();
    this.reapplyCategoryFilters();
  }

  clearCoreIssueSelection(event: Event): void {
    event.stopPropagation();
    this.selectedCoreIssueLabels.clear();
    this.reapplyCoreIssueFilters();
  }

  onCategoryBarClick(categoryLabel: string): void {
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

  onCoreIssueBarClick(coreIssueLabel: string): void {
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

  // ── Table filter sync ─────────────────────────────────────────

  syncTableFilters(): void {
    if (!this.teamTable) return;

    const categoryFilters = Array.from(this.selectedCategoryLabels);
    const coreIssueFilters = Array.from(this.selectedCoreIssueLabels);

    if (categoryFilters.length === 0 && coreIssueFilters.length === 0) {
      this.teamTable.clearAllFilters();

      const categoryEffective = this.cachedCategoryData.filter(
        (item: any) => item.CATEGORY_COUNT > this.categoryMinThreshold,
      );
      this.categoryChartData = this.transformMatchStatusData(
        categoryEffective.length > 0
          ? categoryEffective
          : this.cachedCategoryData,
        'CATEGORY',
        'CATEGORY_COUNT',
      );
      this.visibleCategoryTotal = this.computeStackedTotal(
        this.categoryChartData,
      );

      const coreIssueEffective = this.cachedCoreIssueData.filter(
        (item: any) => item.CORE_ISSUE_COUNT > this.coreIssueMinThreshold,
      );
      this.coreIssueChartData = this.transformMatchStatusData(
        coreIssueEffective.length > 0
          ? coreIssueEffective
          : this.cachedCoreIssueData,
        'CORE_ISSUE',
        'CORE_ISSUE_COUNT',
      );
      this.visibleCoreIssueTotal = this.computeStackedTotal(
        this.coreIssueChartData,
      );
      return;
    }

    let filteredData = [...this.fullTableData];
    if (categoryFilters.length > 0) {
      const lower = categoryFilters.map((f) => f.toLowerCase());
      filteredData = filteredData.filter((row) =>
        lower.includes((row.CATEGORY || '').toLowerCase()),
      );
    }
    if (coreIssueFilters.length > 0) {
      const lower = coreIssueFilters.map((f) => f.toLowerCase());
      filteredData = filteredData.filter((row) =>
        lower.includes((row.CORE_ISSUE || '').toLowerCase()),
      );
    }

    // Cross-filter charts
    if (categoryFilters.length > 0) {
      const uniqueCoreIssues = Array.from(
        new Set(
          filteredData
            .map((row) => (row.CORE_ISSUE || '').toLowerCase())
            .filter((v) => v),
        ),
      );
      const completeCoreIssueChart = this.transformMatchStatusData(
        this.cachedCoreIssueData,
        'CORE_ISSUE',
        'CORE_ISSUE_COUNT',
      );
      this.coreIssueChartData = completeCoreIssueChart.filter((item) =>
        uniqueCoreIssues.includes(item.label.toLowerCase()),
      );
      this.visibleCoreIssueTotal = this.computeStackedTotal(
        this.coreIssueChartData,
      );
    } else if (coreIssueFilters.length === 0) {
      const effective = this.cachedCoreIssueData.filter(
        (item: any) => item.CORE_ISSUE_COUNT > this.coreIssueMinThreshold,
      );
      this.coreIssueChartData = this.transformMatchStatusData(
        effective.length > 0 ? effective : this.cachedCoreIssueData,
        'CORE_ISSUE',
        'CORE_ISSUE_COUNT',
      );
      this.visibleCoreIssueTotal = this.computeStackedTotal(
        this.coreIssueChartData,
      );
    }

    if (coreIssueFilters.length > 0) {
      const uniqueCategories = Array.from(
        new Set(
          filteredData
            .map((row) => (row.CATEGORY || '').toLowerCase())
            .filter((v) => v),
        ),
      );
      const completeCategoryChart = this.transformMatchStatusData(
        this.cachedCategoryData,
        'CATEGORY',
        'CATEGORY_COUNT',
      );
      this.categoryChartData = completeCategoryChart.filter((item) =>
        uniqueCategories.includes(item.label.toLowerCase()),
      );
      this.visibleCategoryTotal = this.computeStackedTotal(
        this.categoryChartData,
      );
    } else if (categoryFilters.length === 0) {
      const effective = this.cachedCategoryData.filter(
        (item: any) => item.CATEGORY_COUNT > this.categoryMinThreshold,
      );
      this.categoryChartData = this.transformMatchStatusData(
        effective.length > 0 ? effective : this.cachedCategoryData,
        'CATEGORY',
        'CATEGORY_COUNT',
      );
      this.visibleCategoryTotal = this.computeStackedTotal(
        this.categoryChartData,
      );
    }

    this.teamTable.dataSource.data = filteredData;
    this.teamTable.currentPage = 0;
  }

  // ── Close dropdowns on outside click ──────────────────────────

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
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

  // ── Expand modal ──────────────────────────────────────────────

  onExpandChart(chartType: 'CATEGORY' | 'CORE_ISSUE'): void {
    this.expandedChart = { type: chartType };
  }

  closeExpandModal(): void {
    this.expandedChart = null;
  }

  // ── Private helpers ───────────────────────────────────────────

  computeStackedTotal(chartData: StackedBarChartDataPoint[]): number {
    if (!Array.isArray(chartData)) return 0;
    return chartData.reduce((sum, bar) => {
      if (!bar?.segments) return sum;
      return (
        sum + bar.segments.reduce((s, seg) => s + (Number(seg.value) || 0), 0)
      );
    }, 0);
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
      this.fullTableData = [...apiData];
      this.tableData.data = apiData;
      this.totalRecords = apiData.length;
      this.tableColumns = Object.keys(apiData[0]).filter(
        (key) =>
          key !== 'DESCRIPTION' &&
          key !== 'SUMMARY' &&
          key !== 'Quarter' &&
          key !== 'Cancelled reason',
      );
    } else {
      this.fullTableData = [];
      this.totalRecords = 0;
      this.tableData.data = [];
      this.tableColumns = [];
    }
  }

  private updateAccuracyMetrics(apiData: any[]): void {
    if (Array.isArray(apiData)) {
      const teamData = apiData.find(
        (item) =>
          item.TEAM_NAME?.toUpperCase() === this.teamConfig.teamFilterName,
      );

      if (teamData) {
        this.categoryAccuracy = teamData['Category Accuracy'] ?? '-';
        this.coreIssueAccuracy = teamData['Core Issue Accuracy'] ?? '-';
        this.totalCases = teamData['Total Cases'] ?? '-';
        this.totalAccuracy = teamData['Total Accuracy'] ?? '-';
      }
    }
  }

  private transformMatchStatusData(
    apiData: any[],
    groupColumn: string,
    countColumn: string,
  ): StackedBarChartDataPoint[] {
    if (!Array.isArray(apiData)) return [];

    return apiData.map((item) => {
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

      return { label: item[groupColumn] ?? '', segments };
    });
  }

  private getMatchStatusColor(matchStatus: string): string {
    switch (matchStatus.toUpperCase()) {
      case 'MATCHED':
        return '#00bceb';
      case 'NOT MATCHED':
        return '#b0b8c1';
      case 'ANALYZED':
        return '#f0a500';
      default:
        return '#d1d5db';
    }
  }
}
