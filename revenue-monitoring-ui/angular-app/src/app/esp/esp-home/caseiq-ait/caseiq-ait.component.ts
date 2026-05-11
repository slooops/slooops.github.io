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

interface AitAccuracyData {
  TEAM_NAME: string;
  CATEGORY: number;
  CORE_ISSUE: number;
  TOTAL_ACCURACY: number;
  TOTAL_VALIDATED_CASES: number;
}

@Component({
  selector: 'app-caseiq-ait',
  templateUrl: './caseiq-ait.component.html',
  styleUrl: './caseiq-ait.component.css',
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
export class CaseiqAitComponent implements OnInit, OnChanges {
  @Input() selectedQuarter!: string; // Quarter filter from parent
  @ViewChild('aitTable') aitTable!: CaseiqTableComponent;
  @Output() uploadSuccess = new EventEmitter<void>();
  @Input() caseIqMetrics: any;

  constructor(
    private readonly http: ApiHttpService,
    private readonly destroyManager: DestroyManager,
  ) {}

  i2cChartData: StackedBarChartDataPoint[] = [];
  i2cSimpleChartData: StackedBarChartDataPoint[] = [];
  completeI2cChartData: StackedBarChartDataPoint[] = [];
  completeI2cSimpleChartData: StackedBarChartDataPoint[] = [];
  visibleCategoryTotal: number = 0; // Sum of counts for currently shown (filtered) categories
  visibleCoreIssueTotal: number = 0; // Sum of counts for currently shown (filtered) core issues

  // Chart filter state
  showCategoryFilters: boolean = false; // controls category chart filter popover
  showCoreIssueFilters: boolean = false; // controls core issue chart filter popover
  categoryMinThreshold: number = 0;
  coreIssueMinThreshold: number = 0;

  // Multi-select dropdown filter state for charts
  allCategoryLabels: string[] = [];
  selectedCategoryLabels: Set<string> = new Set();
  showCategorySelect: boolean = false;

  allCoreIssueLabels: string[] = [];
  selectedCoreIssueLabels: Set<string> = new Set();
  showCoreIssueSelect: boolean = false;

  categoryAccuracy: number | string = '-';
  coreIssueAccuracy: number | string = '-';
  totalCases: number | string = '-';
  totalAccuracy: number | string = '-';

  i2cTableData = new MatTableDataSource<any>([]);
  i2cTableColumns: string[] = [];
  totalRecords: number = 0;
  fullTableData: any[] = []; // Store unfiltered table data
  refreshingData: boolean = false; // Full-screen overlay during post-upload refresh

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

  private loadAllData(): void {
    this.getXxcaseiqValidatedCasesAccuracyV();
    this.getXxcaseiqCategoryGraphVAit();
    this.getXxcaseiqCoreIssueGraphVAit();
    this.getXxcaseiqAitCaseDetailsV();
  }

  /**
   * CaseIQ metrics filtered by selectedQuarter.
   *
   * - If selectedQuarter is empty, returns the original input.
   * - If caseIqMetrics is an array, picks the AIT row whose FISCAL_QTR
   *   matches selectedQuarter.
   * - If caseIqMetrics is a single object with FISCAL_QTR, it is returned
   *   only when its FISCAL_QTR matches selectedQuarter; otherwise null.
   */
  get filteredCaseIqMetrics(): any {
    if (!this.caseIqMetrics) {
      return null;
    }

    // No quarter filter applied
    if (!this.selectedQuarter) {
      return this.caseIqMetrics;
    }

    // When parent passes an array of metrics, select the AIT row for the quarter
    if (Array.isArray(this.caseIqMetrics)) {
      const row = this.caseIqMetrics.find(
        (m: any) =>
          m &&
          m.FISCAL_QTR === this.selectedQuarter &&
          m.TEAM_NAME &&
          m.TEAM_NAME.toString().toUpperCase() === 'AIT',
      );
      return row || null;
    }

    // When parent passes a single object, ensure its FISCAL_QTR matches
    if (
      (this.caseIqMetrics as any).FISCAL_QTR &&
      (this.caseIqMetrics as any).FISCAL_QTR !== this.selectedQuarter
    ) {
      return null;
    }

    return this.caseIqMetrics;
  }

  /** Agent percentage of total for ratio bar */
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

  // Cached raw responses for dynamic threshold re-filtering
  private completeCategoryRaw: any[] = [];
  private completeCoreIssueRaw: any[] = [];

  /**
   * Restructures data by grouping match statuses under each category/core issue
   * Returns format: { CATEGORY: "INVOICING", data: [{MATCH_STATUS: "MATCHED", COUNT: 250}, ...] }
   */
  private mergeByCategoryOrIssue(
    data: any[],
    groupKey: string,
    countKey: string,
  ): any[] {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    const grouped = new Map<string, any>();

    data.forEach((item) => {
      const key = item[groupKey] ?? ''; // Convert null/undefined to empty string

      if (!grouped.has(key)) {
        // First occurrence: create new grouped object with data array
        grouped.set(key, {
          [groupKey]: key,
          TEAM_NAME: item.TEAM_NAME,
          data: [
            {
              MATCH_STATUS: item.MATCH_STATUS,
              COUNT: item[countKey],
            },
          ],
          [countKey]: item[countKey], // Keep total count for filtering
        });
      } else {
        // Subsequent occurrence: add to data array and sum total count
        const existing = grouped.get(key);
        existing.data.push({
          MATCH_STATUS: item.MATCH_STATUS,
          COUNT: item[countKey],
        });
        existing[countKey] += item[countKey];
      }
    });

    return Array.from(grouped.values());
  }

  getXxcaseiqCategoryGraphVAit() {
    this.http
      .get('xxcaseiq-category-graph-v-ait', this.destroyManager)
      .subscribe((data: any) => {
        // Filter data by selected quarter
        const filteredByQuarter = this.selectedQuarter
          ? data.filter((item: any) => item.Quarter === this.selectedQuarter)
          : data;

        // Merge objects with same CATEGORY into single objects
        const mergedData = this.mergeByCategoryOrIssue(
          filteredByQuarter,
          'CATEGORY',
          'CATEGORY_COUNT',
        );
        this.completeCategoryRaw = mergedData; // cache merged data for re-filtering

        // Populate distinct category labels
        this.allCategoryLabels = Array.from(
          new Set<string>(
            mergedData.map((item: any) =>
              (item.CATEGORY || '').toString().trim(),
            ),
          ),
        )
          .map((v) => v)
          .sort((a: string, b: string) => a.localeCompare(b));

        // Filter out data points with count <= 10
        // BUT if ALL items have count <= threshold, show all of them
        let filteredData = mergedData.filter(
          (item: any) => item.CATEGORY_COUNT > this.categoryMinThreshold,
        );

        // If no data passes threshold, show all data instead
        if (filteredData.length === 0 && mergedData.length > 0) {
          filteredData = mergedData;
        }

        this.i2cChartData = this.transformMatchStatusData(
          filteredData,
          'CATEGORY',
          'CATEGORY_COUNT',
        );
        this.visibleCategoryTotal = this.computeStackedTotal(this.i2cChartData);

        this.completeI2cChartData = this.transformMatchStatusData(
          mergedData,
          'CATEGORY',
          'CATEGORY_COUNT',
        );
      });
  }

  getXxcaseiqCoreIssueGraphVAit() {
    this.http
      .get('xxcaseiq-core-issue-graph-v-ait', this.destroyManager)
      .subscribe((data: any) => {
        // Filter data by selected quarter
        const filteredByQuarter = this.selectedQuarter
          ? data.filter((item: any) => item.Quarter === this.selectedQuarter)
          : data;

        // Merge objects with same CORE_ISSUE into single objects
        const mergedData = this.mergeByCategoryOrIssue(
          filteredByQuarter,
          'CORE_ISSUE',
          'CORE_ISSUE_COUNT',
        );
        this.completeCoreIssueRaw = mergedData; // cache merged data

        // Populate distinct core issue labels
        this.allCoreIssueLabels = Array.from(
          new Set<string>(
            mergedData.map((item: any) =>
              (item.CORE_ISSUE || '').toString().trim(),
            ),
          ),
        )
          .map((v) => v)
          .sort((a: string, b: string) => a.localeCompare(b));

        // Filter out data points with count <= 10
        // BUT if ALL items have count <= threshold, show all of them
        let filteredData = mergedData.filter(
          (item: any) => item.CORE_ISSUE_COUNT > this.coreIssueMinThreshold,
        );

        // If no data passes threshold, show all data instead
        if (filteredData.length === 0 && mergedData.length > 0) {
          filteredData = mergedData;
        }

        this.i2cSimpleChartData = this.transformMatchStatusData(
          filteredData,
          'CORE_ISSUE',
          'CORE_ISSUE_COUNT',
        );
        this.visibleCoreIssueTotal = this.computeStackedTotal(
          this.i2cSimpleChartData,
        );
        this.completeI2cSimpleChartData = this.transformMatchStatusData(
          mergedData,
          'CORE_ISSUE',
          'CORE_ISSUE_COUNT',
        );
      });
  }

  getXxcaseiqAitCaseDetailsV() {
    this.http
      .get('xxcaseiq-ait-case-details-v', this.destroyManager)
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
                item.TEAM_NAME === 'AIT',
            )
          : data.filter((item: any) => item.TEAM_NAME === 'AIT');

        this.updateAitMetrics(filteredByQuarter);
      });
  }

  // Handle upload dialog results (emitted from table component)
  handleUploadResult(result: any) {
    if (result?.success) {
      // Emit event to parent component to refresh overall accuracy
      this.uploadSuccess.emit();

      // Show full-screen overlay
      this.refreshingData = true;

      // Refresh all data sources
      Promise.all([this.refreshAllData()])
        .then(() => {
          // Hide overlay after a brief delay to show completion
          setTimeout(() => {
            this.refreshingData = false;
          }, 500);
        })
        .catch((error) => {
          console.error('Error refreshing AIT data:', error);
          // Hide overlay even on error after delay
          setTimeout(() => {
            this.refreshingData = false;
          }, 1000);
        });
    } else if (result) {
      console.warn('Upload did not succeed, no refresh triggered');
    }
  }

  // Centralized method to refresh all data
  private refreshAllData(): Promise<void> {
    return new Promise((resolve, reject) => {
      let completedCalls = 0;
      const totalCalls = 4;
      let hasError = false;

      const checkComplete = () => {
        completedCalls++;
        if (completedCalls === totalCalls) {
          if (hasError) {
            reject(new Error('One or more data refresh calls failed'));
          } else {
            resolve();
          }
        }
      };

      // Refresh accuracy metrics
      this.http
        .get('xxcaseiq-validated-cases-accuracy-v', this.destroyManager)
        .subscribe({
          next: (data: any) => {
            this.updateAitMetrics(data);
            checkComplete();
          },
          error: (err) => {
            console.error('Failed to refresh accuracy data', err);
            hasError = true;
            checkComplete();
          },
        });

      // Refresh category chart
      this.http
        .get('xxcaseiq-category-graph-v-ait', this.destroyManager)
        .subscribe({
          next: (data: any) => {
            const mergedData = this.mergeByCategoryOrIssue(
              data,
              'CATEGORY',
              'CATEGORY_COUNT',
            );
            this.completeCategoryRaw = mergedData;
            this.allCategoryLabels = Array.from(
              new Set<string>(
                mergedData.map((item: any) =>
                  (item.CATEGORY || '').toString().trim(),
                ),
              ),
            ).sort((a: string, b: string) => a.localeCompare(b));

            const filteredData = mergedData.filter(
              (item: any) => item.CATEGORY_COUNT > this.categoryMinThreshold,
            );
            this.i2cChartData = this.transformMatchStatusData(
              filteredData,
              'CATEGORY',
              'CATEGORY_COUNT',
            );
            this.visibleCategoryTotal = this.computeStackedTotal(
              this.i2cChartData,
            );
            this.completeI2cChartData = this.transformMatchStatusData(
              mergedData,
              'CATEGORY',
              'CATEGORY_COUNT',
            );
            checkComplete();
          },
          error: (err) => {
            console.error('Failed to refresh category chart', err);
            hasError = true;
            checkComplete();
          },
        });

      // Refresh core issue chart
      this.http
        .get('xxcaseiq-core-issue-graph-v-ait', this.destroyManager)
        .subscribe({
          next: (data: any) => {
            const mergedData = this.mergeByCategoryOrIssue(
              data,
              'CORE_ISSUE',
              'CORE_ISSUE_COUNT',
            );
            this.completeCoreIssueRaw = mergedData;
            this.allCoreIssueLabels = Array.from(
              new Set<string>(
                mergedData.map((item: any) =>
                  (item.CORE_ISSUE || '').toString().trim(),
                ),
              ),
            ).sort((a: string, b: string) => a.localeCompare(b));

            const filteredData = mergedData.filter(
              (item: any) => item.CORE_ISSUE_COUNT > this.coreIssueMinThreshold,
            );
            this.i2cSimpleChartData = this.transformMatchStatusData(
              filteredData,
              'CORE_ISSUE',
              'CORE_ISSUE_COUNT',
            );
            this.visibleCoreIssueTotal = this.computeStackedTotal(
              this.i2cSimpleChartData,
            );
            this.completeI2cSimpleChartData = this.transformMatchStatusData(
              mergedData,
              'CORE_ISSUE',
              'CORE_ISSUE_COUNT',
            );
            checkComplete();
          },
          error: (err) => {
            console.error('Failed to refresh core issue chart', err);
            hasError = true;
            checkComplete();
          },
        });

      // Refresh table data
      this.http
        .get('xxcaseiq-ait-case-details-v', this.destroyManager)
        .subscribe({
          next: (data: any) => {
            this.updateTableData(data);
            checkComplete();
          },
          error: (err) => {
            console.error('Failed to refresh table data', err);
            hasError = true;
            checkComplete();
          },
        });
    });
  }

  // Toggle filter panel visibility
  toggleCategoryFilters() {
    this.showCategoryFilters = !this.showCategoryFilters;
    if (this.showCategoryFilters) {
      this.showCoreIssueFilters = false; // only one open at a time
    }
  }

  toggleCategorySelect() {
    this.showCategorySelect = !this.showCategorySelect;
  }

  toggleCoreIssueFilters() {
    this.showCoreIssueFilters = !this.showCoreIssueFilters;
    if (this.showCoreIssueFilters) {
      this.showCategoryFilters = false;
    }
  }

  toggleCoreIssueSelect() {
    this.showCoreIssueSelect = !this.showCoreIssueSelect;
  }

  // Adjust category threshold value
  adjustCategoryThreshold(direction: 1 | -1) {
    const newValue = this.categoryMinThreshold + direction * 5;
    if (newValue < 10) return; // enforce minimum 10
    this.categoryMinThreshold = newValue;
    this.reapplyCategoryFilter();
  }

  // Adjust core issue threshold value
  adjustCoreIssueThreshold(direction: 1 | -1) {
    const newValue = this.coreIssueMinThreshold + direction * 5;
    if (newValue < 10) return;
    this.coreIssueMinThreshold = newValue;
    this.reapplyCoreIssueFilter();
  }

  private reapplyCategoryFilter() {
    if (this.completeCategoryRaw.length) {
      // If user has selected specific labels, ignore threshold and show those labels (even if below min)
      // Otherwise apply threshold filtering as default behavior
      const effectiveData = this.selectedCategoryLabels.size
        ? this.completeCategoryRaw.filter((item: any) =>
            this.selectedCategoryLabels.has(item.CATEGORY),
          )
        : this.completeCategoryRaw.filter(
            (item: any) => item.CATEGORY_COUNT > this.categoryMinThreshold,
          );

      this.i2cChartData = this.transformMatchStatusData(
        effectiveData,
        'CATEGORY',
        'CATEGORY_COUNT',
      );
      this.visibleCategoryTotal = this.computeStackedTotal(this.i2cChartData);
    }
    this.syncTableFilters();
  }

  private reapplyCoreIssueFilter() {
    if (this.completeCoreIssueRaw.length) {
      // Selected labels override threshold; show them regardless of count
      const effectiveData = this.selectedCoreIssueLabels.size
        ? this.completeCoreIssueRaw.filter((item: any) =>
            this.selectedCoreIssueLabels.has(item.CORE_ISSUE),
          )
        : this.completeCoreIssueRaw.filter(
            (item: any) => item.CORE_ISSUE_COUNT > this.coreIssueMinThreshold,
          );

      this.i2cSimpleChartData = this.transformMatchStatusData(
        effectiveData,
        'CORE_ISSUE',
        'CORE_ISSUE_COUNT',
      );
      this.visibleCoreIssueTotal = this.computeStackedTotal(
        this.i2cSimpleChartData,
      );
    }
    this.syncTableFilters();
  }

  // Selection handlers
  toggleCategorySelection(label: string) {
    if (this.selectedCategoryLabels.has(label)) {
      this.selectedCategoryLabels.delete(label);
    } else {
      this.selectedCategoryLabels.add(label);
    }
    this.reapplyCategoryFilter();
  }

  clearCategorySelection(event?: Event) {
    if (event) event.stopPropagation();
    this.selectedCategoryLabels.clear();
    this.reapplyCategoryFilter();
  }

  toggleCoreIssueSelection(label: string) {
    if (this.selectedCoreIssueLabels.has(label)) {
      this.selectedCoreIssueLabels.delete(label);
    } else {
      this.selectedCoreIssueLabels.add(label);
    }
    this.reapplyCoreIssueFilter();
  }

  clearCoreIssueSelection(event?: Event) {
    if (event) event.stopPropagation();
    this.selectedCoreIssueLabels.clear();
    this.reapplyCoreIssueFilter();
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
    this.reapplyCategoryFilter();
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
    this.reapplyCoreIssueFilter();
  }

  /**
   * Sync table filters based on dropdown selections
   */
  syncTableFilters(): void {
    if (!this.aitTable) return;

    // Build combined filter criteria
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
      this.aitTable.clearAllFilters();

      // Reset both charts to their original filtered state (based on threshold)
      // Do NOT call reapplyCategoryFilter/reapplyCoreIssueFilter as they call syncTableFilters again
      const categoryEffectiveData = this.completeCategoryRaw.filter(
        (item: any) => item.CATEGORY_COUNT > this.categoryMinThreshold,
      );
      this.i2cChartData = this.transformMatchStatusData(
        categoryEffectiveData,
        'CATEGORY',
        'CATEGORY_COUNT',
      );
      this.visibleCategoryTotal = this.computeStackedTotal(this.i2cChartData);

      const coreIssueEffectiveData = this.completeCoreIssueRaw.filter(
        (item: any) => item.CORE_ISSUE_COUNT > this.coreIssueMinThreshold,
      );
      this.i2cSimpleChartData = this.transformMatchStatusData(
        coreIssueEffectiveData,
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
      // Extract unique CORE_ISSUE values from filtered data
      const uniqueCoreIssues = Array.from(
        new Set(
          filteredData
            .map((row) => row.CORE_ISSUE.toLowerCase())
            .filter((v) => v),
        ),
      );
      // Filter core issue chart to show only these values
      this.i2cSimpleChartData = this.completeI2cSimpleChartData.filter((item) =>
        uniqueCoreIssues.includes(item.label.toLowerCase()),
      );
      this.visibleCoreIssueTotal = this.computeStackedTotal(
        this.i2cSimpleChartData,
      );
    } else if (coreIssueFilters.length === 0) {
      // Only reset core issue chart if no core issue filters are active
      const effectiveData = this.completeCoreIssueRaw.filter(
        (item: any) => item.CORE_ISSUE_COUNT > this.coreIssueMinThreshold,
      );
      this.i2cSimpleChartData = this.transformMatchStatusData(
        effectiveData,
        'CORE_ISSUE',
        'CORE_ISSUE_COUNT',
      );
      this.visibleCoreIssueTotal = this.computeStackedTotal(
        this.i2cSimpleChartData,
      );
    }

    if (coreIssueFilters.length > 0) {
      // Extract unique CATEGORY values from filtered data
      const uniqueCategories = Array.from(
        new Set(
          filteredData
            .map((row) => row.CATEGORY.toLowerCase())
            .filter((v) => v),
        ),
      );
      // Filter category chart to show only these values
      this.i2cChartData = this.completeI2cChartData.filter((item) =>
        uniqueCategories.includes(item.label.toLowerCase()),
      );
      this.visibleCategoryTotal = this.computeStackedTotal(this.i2cChartData);
    } else if (categoryFilters.length === 0) {
      // Only reset category chart if no category filters are active
      const effectiveData = this.completeCategoryRaw.filter(
        (item: any) => item.CATEGORY_COUNT > this.categoryMinThreshold,
      );
      this.i2cChartData = this.transformMatchStatusData(
        effectiveData,
        'CATEGORY',
        'CATEGORY_COUNT',
      );
      this.visibleCategoryTotal = this.computeStackedTotal(this.i2cChartData);
    }

    // Update table data source
    this.aitTable.dataSource.data = filteredData;
    this.aitTable.currentPage = 0;
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

  // Close panels if clicking outside
  @HostListener('document:click', ['$event']) onDocumentClick(event: Event) {
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
    }
  }

  // Computes total of all segment values across all bars
  computeStackedTotal(data: StackedBarChartDataPoint[]): number {
    if (!Array.isArray(data)) return 0;
    return data.reduce((sum, dp) => {
      if (!dp?.segments) return sum;
      return (
        sum +
        dp.segments.reduce(
          (s: number, seg: any) => s + (Number(seg.value) || 0),
          0,
        )
      );
    }, 0);
  }

  // Expand chart modal state
  expandedChart: { type: 'CATEGORY' | 'CORE_ISSUE' } | null = null;

  onExpandChart(type: 'CATEGORY' | 'CORE_ISSUE') {
    this.expandedChart = { type };
  }

  closeExpandModal() {
    this.expandedChart = null;
  }

  /**
   * Updates table data and columns from API response
   * Dynamically sets columns based on the first record's keys
   */
  private updateTableData(apiData: any[]): void {
    if (Array.isArray(apiData) && apiData.length > 0) {
      this.fullTableData = [...apiData]; // Store full unfiltered data
      this.totalRecords = apiData.length;
      this.i2cTableData = new MatTableDataSource(apiData);
      this.i2cTableColumns = Object.keys(apiData[0]).filter(
        (key) =>
          key !== 'DESCRIPTION' &&
          key !== 'SUMMARY' &&
          key !== 'Quarter' &&
          key !== 'Cancelled reason',
      );
    } else {
      this.totalRecords = 0;
      this.i2cTableData = new MatTableDataSource([]);
      this.i2cTableColumns = [];
    }
  }

  /**
   * Updates AIT metrics from API data
   * Finds the AIT team data and sets the component properties
   */
  private updateAitMetrics(apiData: AitAccuracyData[]): void {
    if (Array.isArray(apiData)) {
      const aitData = apiData.find(
        (item) => item.TEAM_NAME && item.TEAM_NAME.toLowerCase() === 'ait',
      );

      if (aitData) {
        this.categoryAccuracy = aitData['Category Accuracy'] ?? '-';
        this.coreIssueAccuracy = aitData['Core Issue Accuracy'] ?? '-';
        this.totalCases = aitData['Total Cases'] ?? '-';
        this.totalAccuracy = aitData['Total Accuracy'] ?? '-';
      }
    }
  }

  /**
   * Generic method to transform match status API data into stacked bar chart format
   * Works with merged data structure where match statuses are in nested 'data' array
   */
  private transformMatchStatusData(
    apiData: any[],
    groupColumn: string,
    countColumn: string,
  ): StackedBarChartDataPoint[] {
    if (!Array.isArray(apiData)) {
      return [];
    }

    // Transform to stacked bar chart format
    const chartData = apiData.map((item) => {
      // Check if data is in the new merged format (with nested 'data' array)
      const segments = item.data
        ? item.data.map((statusItem: any) => ({
            name: statusItem.MATCH_STATUS,
            value: statusItem.COUNT,
            color: this.getMatchStatusColor(statusItem.MATCH_STATUS),
          }))
        : [
            // Fallback for old format (direct MATCH_STATUS on item)
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
