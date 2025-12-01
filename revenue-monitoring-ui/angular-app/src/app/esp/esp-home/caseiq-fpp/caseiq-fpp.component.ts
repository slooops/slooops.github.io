import {
  Component,
  OnInit,
  OnChanges,
  SimpleChanges,
  Input,
  ViewChild,
  HostListener,
  Inject,
  Output,
  EventEmitter,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ApiHttpService } from 'src/app/providers/http.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { StackedBarChartDataPoint } from 'src/app/components/bar-chart/bar-chart.component';
import { CaseiqTableComponent } from 'src/app/components/caseiq-table/caseiq-table.component';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
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
    BarChartComponent,
    CaseiqTableComponent,
  ],
  standalone: true,
})
export class CaseiqFppComponent implements OnInit, OnChanges {
  @Input() selectedQuarter!: string; // Quarter filter from parent
  @ViewChild('fppTable') fppTable!: CaseiqTableComponent;
  @Output() uploadSuccess = new EventEmitter<void>();

  constructor(
    private readonly http: ApiHttpService,
    private readonly destroyManager: DestroyManager,
    private readonly dialog: MatDialog
  ) {}

  i2cChartData: StackedBarChartDataPoint[] = [];
  i2cSimpleChartData: StackedBarChartDataPoint[] = [];

  categoryAccuracy: number | string = '-';
  coreIssueAccuracy: number | string = '-';
  totalCases: number | string = '-';

  i2cTableData = new MatTableDataSource<any>([]);
  i2cTableColumns: string[] = [];
  totalRecords: number = 0;

  // Filter and threshold state
  showCategoryFilters = false;
  showCoreIssueFilters = false;
  showCategorySelect = false;
  showCoreIssueSelect = false;

  allCategoryLabels: string[] = [];
  allCoreIssueLabels: string[] = [];
  selectedCategoryLabels: Set<string> = new Set();
  selectedCoreIssueLabels: Set<string> = new Set();

  categoryMinThreshold = 10;
  coreIssueMinThreshold = 10;

  // Cached full data
  cachedCategoryData: any[] = [];
  cachedCoreIssueData: any[] = [];

  // Visible totals
  visibleCategoryTotal = 0;
  visibleCoreIssueTotal = 0;

  // Loading state
  refreshingData = false;

  ngOnInit(): void {
    this.loadAllData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // React to quarter changes
    if (changes['selectedQuarter'] && !changes['selectedQuarter'].firstChange) {
      console.log('FPP: Quarter changed to', this.selectedQuarter);
      this.refreshingData = true; // Show loading overlay
      this.loadAllData();
    }
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
    countKey: string
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
        console.log('xxcaseiqCategoryGraphVFpp:', data);

        // Filter data by selected quarter
        const filteredByQuarter = this.selectedQuarter
          ? data.filter((item: any) => item.Quarter === this.selectedQuarter)
          : data;

        // Merge by category
        const mergedData = this.mergeByCategoryOrIssue(
          filteredByQuarter,
          'CATEGORY',
          'CATEGORY_COUNT'
        );
        this.cachedCategoryData = mergedData;
        this.allCategoryLabels = mergedData.map((item) => item.CATEGORY);
        this.reapplyCategoryFilters();
      });
  }

  getXxcaseiqCoreIssueGraphVFpp() {
    this.http
      .get('xxcaseiq-core-issue-graph-v-fpp', this.destroyManager)
      .subscribe((data: any) => {
        console.log('xxcaseiqCoreIssueGraphVFpp:', data);

        // Filter data by selected quarter
        const filteredByQuarter = this.selectedQuarter
          ? data.filter((item: any) => item.Quarter === this.selectedQuarter)
          : data;

        // Merge by core issue
        const mergedData = this.mergeByCategoryOrIssue(
          filteredByQuarter,
          'CORE_ISSUE',
          'CORE_ISSUE_COUNT'
        );
        this.cachedCoreIssueData = mergedData;
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
        console.log(data);

        // Filter data by selected quarter and team
        const filteredByQuarter = this.selectedQuarter
          ? data.filter(
              (item: any) =>
                item.Quarter === this.selectedQuarter &&
                item.TEAM_NAME === 'FPP'
            )
          : data.filter((item: any) => item.TEAM_NAME === 'FPP');
        this.updateFppMetrics(filteredByQuarter);
      });
  }

  // Handle upload result with overlay
  handleUploadResult(event: { success: boolean; message: string }) {
    console.log('Upload result:', event);
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
                  'CATEGORY_COUNT'
                );
                this.cachedCategoryData = mergedData;
                this.allCategoryLabels = mergedData.map(
                  (item) => item.CATEGORY
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
                  'CORE_ISSUE_COUNT'
                );
                this.cachedCoreIssueData = mergedData;
                this.allCoreIssueLabels = mergedData.map(
                  (item) => item.CORE_ISSUE
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
      this.categoryMinThreshold + direction * 5
    );
    this.reapplyCategoryFilters();
  }

  adjustCoreIssueThreshold(direction: number) {
    this.coreIssueMinThreshold = Math.max(
      10,
      this.coreIssueMinThreshold + direction * 5
    );
    this.reapplyCoreIssueFilters();
  }

  // Reapply filters
  reapplyCategoryFilters() {
    let filteredData = this.cachedCategoryData;

    if (this.selectedCategoryLabels.size > 0) {
      filteredData = filteredData.filter((item) =>
        this.selectedCategoryLabels.has(item.CATEGORY)
      );
    } else {
      filteredData = filteredData.filter(
        (item) => item.CATEGORY_COUNT > this.categoryMinThreshold
      );

      // If no data passes threshold, show all data instead
      if (filteredData.length === 0 && this.cachedCategoryData.length > 0) {
        filteredData = this.cachedCategoryData;
      }
    }

    this.i2cChartData = this.transformMatchStatusData(
      filteredData,
      'CATEGORY',
      'CATEGORY_COUNT'
    );
    this.visibleCategoryTotal = this.computeStackedTotal(this.i2cChartData);
  }

  reapplyCoreIssueFilters() {
    let filteredData = this.cachedCoreIssueData;

    if (this.selectedCoreIssueLabels.size > 0) {
      filteredData = filteredData.filter((item) =>
        this.selectedCoreIssueLabels.has(item.CORE_ISSUE)
      );
    } else {
      filteredData = filteredData.filter(
        (item) => item.CORE_ISSUE_COUNT > this.coreIssueMinThreshold
      );

      // If no data passes threshold, show all data instead
      if (filteredData.length === 0 && this.cachedCoreIssueData.length > 0) {
        filteredData = this.cachedCoreIssueData;
      }
    }

    this.i2cSimpleChartData = this.transformMatchStatusData(
      filteredData,
      'CORE_ISSUE',
      'CORE_ISSUE_COUNT'
    );
    this.visibleCoreIssueTotal = this.computeStackedTotal(
      this.i2cSimpleChartData
    );
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

  // Close dropdowns when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-wrapper')) {
      this.showCategorySelect = false;
      this.showCoreIssueSelect = false;
    }
  }

  // Compute stacked total
  computeStackedTotal(chartData: StackedBarChartDataPoint[]): number {
    return chartData.reduce((sum, bar) => {
      const barTotal = bar.segments.reduce(
        (segSum, seg) => segSum + seg.value,
        0
      );
      return sum + barTotal;
    }, 0);
  }

  // Expand chart dialog
  onExpandChart(chartType: 'CATEGORY' | 'CORE_ISSUE') {
    // Transform complete cached data for dialog
    const completeCategoryData = this.transformMatchStatusData(
      this.cachedCategoryData,
      'CATEGORY',
      'CATEGORY_COUNT'
    );
    const completeCoreIssueData = this.transformMatchStatusData(
      this.cachedCoreIssueData,
      'CORE_ISSUE',
      'CORE_ISSUE_COUNT'
    );

    // Compute totals from complete data
    const categoryTotal = this.computeStackedTotal(completeCategoryData);
    const coreIssueTotal = this.computeStackedTotal(completeCoreIssueData);

    this.dialog.open(CaseiqFppExpandDialogComponent, {
      width: '90vw',
      maxWidth: '2000px',
      height: '70vh',
      data: {
        chartType,
        categoryData: completeCategoryData,
        coreIssueData: completeCoreIssueData,
        categoryAccuracy: this.categoryAccuracy,
        coreIssueAccuracy: this.coreIssueAccuracy,
        categoryTotal,
        coreIssueTotal,
      },
      panelClass: 'caseiq-expand-dialog',
    });
  }

  private updateTableData(apiData: any[]): void {
    if (Array.isArray(apiData) && apiData.length > 0) {
      this.totalRecords = apiData.length;
      this.i2cTableData = new MatTableDataSource(apiData);
      this.i2cTableColumns = Object.keys(apiData[0]).filter(
        (key) =>
          key !== 'DESCRIPTION' &&
          key !== 'SUMMARY' &&
          key !== 'Quarter' &&
          key !== 'Cancelled reason'
      );
    } else {
      this.totalRecords = 0;
      this.i2cTableData = new MatTableDataSource([]);
      this.i2cTableColumns = [];
    }
  }

  private updateFppMetrics(apiData: FppAccuracyData[]): void {
    if (Array.isArray(apiData)) {
      const fppData = apiData.find(
        (item) => item.TEAM_NAME && item.TEAM_NAME.toLowerCase() === 'fpp'
      );

      if (fppData) {
        this.categoryAccuracy = fppData['Category Accuracy'] ?? '-';
        this.coreIssueAccuracy = fppData['Core Issue Accuracy'] ?? '-';
        this.totalCases = fppData['Total Cases'] ?? '-';
      }
    }
  }

  private transformMatchStatusData(
    apiData: any[],
    groupColumn: string,
    countColumn: string
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

// Expand Dialog Component
@Component({
  selector: 'app-caseiq-fpp-expand-dialog',
  template: `
    <div class="expand-dialog-header" role="heading" aria-level="2">
      <span class="expand-dialog-title">
        FPP {{ chartType === 'CATEGORY' ? 'Category' : 'Core Issue' }} Details
      </span>
      <a style="text-decoration: none; cursor: pointer">
        <i
          class="fa fa-close"
          style="font-size: 16px; color: white"
          (click)="onClose()"
        ></i>
      </a>
    </div>
    <mat-dialog-content class="expand-dialog-content" tabindex="0">
      <div class="expand-charts-wrapper">
        @if (chartType === 'CATEGORY') {
        <div class="expand-chart-block">
          <div class="expand-chart-header">
            <h3 class="subheading">
              Category Accuracy – {{ data.categoryAccuracy }}% ( Total:
              {{ data.categoryTotal }} )
            </h3>
            <div class="filter-wrapper">
              <mat-icon
                style="cursor: pointer; font-size: 24px"
                (click)="toggleCategoryFiltersInDialog()"
                (keydown.enter)="toggleCategoryFiltersInDialog()"
                (keydown.space)="toggleCategoryFiltersInDialog()"
                tabindex="0"
                title="Category Chart Filters"
                aria-label="Category Chart Filters"
                >filter_list</mat-icon
              >
              @if (showCategoryFiltersInDialog) {
              <div
                class="chart-filter-panel"
                aria-label="Expanded category chart filters panel"
              >
                <div class="multi-select-wrapper">
                  <button
                    class="multi-select-trigger"
                    (click)="toggleCategorySelectInDialog()"
                    type="button"
                  >
                    Filter
                    <span
                      class="chevron"
                      [class.open]="showCategorySelectInDialog"
                      >▾</span
                    >
                  </button>
                  @if (showCategorySelectInDialog) {
                  <div
                    class="multi-select-dropdown"
                    (click)="$event.stopPropagation()"
                  >
                    <div class="multi-select-options">
                      @for (label of dialogCategoryLabels; track label) {
                      <div
                        class="multi-option"
                        [class.selected]="
                          selectedCategoryLabelsInDialog.has(label)
                        "
                        (click)="toggleCategorySelectionInDialog(label)"
                      >
                        <input
                          type="checkbox"
                          [checked]="selectedCategoryLabelsInDialog.has(label)"
                        />
                        <span class="option-label">{{ label }}</span>
                      </div>
                      }
                    </div>
                    <div class="multi-select-actions">
                      <button
                        type="button"
                        class="clear-btn"
                        (click)="clearCategorySelectionInDialog($event)"
                        [disabled]="selectedCategoryLabelsInDialog.size === 0"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        class="close-btn"
                        (click)="toggleCategorySelectInDialog()"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  }
                </div>
                @if (selectedCategoryLabelsInDialog.size === 0) {
                <div class="filter-hint">Showing all categories.</div>
                } @if (selectedCategoryLabelsInDialog.size > 0) {
                <div class="filter-hint">
                  Showing {{ selectedCategoryLabelsInDialog.size }} selected
                  category(ies).
                </div>
                }
              </div>
              }
            </div>
          </div>
          <div class="chart-frame">
            <app-bar-chart
              [data]="filteredCategoryData"
              [stacked]="true"
              [isLoading]="false"
              [chartHeight]="510"
              canvasId="expandedCategoryChartFpp"
            ></app-bar-chart>
          </div>
        </div>
        } @if (chartType === 'CORE_ISSUE') {
        <div class="expand-chart-block">
          <div class="expand-chart-header">
            <h3 class="subheading">
              Core Issue Accuracy – {{ data.coreIssueAccuracy }}% ( Total:
              {{ data.coreIssueTotal }} )
            </h3>
            <div class="filter-wrapper">
              <mat-icon
                style="cursor: pointer; font-size: 24px"
                (click)="toggleCoreIssueFiltersInDialog()"
                (keydown.enter)="toggleCoreIssueFiltersInDialog()"
                (keydown.space)="toggleCoreIssueFiltersInDialog()"
                tabindex="0"
                title="Core Issue Chart Filters"
                aria-label="Core Issue Chart Filters"
                >filter_list</mat-icon
              >
              @if (showCoreIssueFiltersInDialog) {
              <div
                class="chart-filter-panel"
                aria-label="Expanded core issue chart filters panel"
              >
                <div class="multi-select-wrapper">
                  <button
                    class="multi-select-trigger"
                    (click)="toggleCoreIssueSelectInDialog()"
                    type="button"
                  >
                    Filter
                    <span
                      class="chevron"
                      [class.open]="showCoreIssueSelectInDialog"
                      >▾</span
                    >
                  </button>
                  @if (showCoreIssueSelectInDialog) {
                  <div
                    class="multi-select-dropdown"
                    (click)="$event.stopPropagation()"
                  >
                    <div class="multi-select-options">
                      @for (label of dialogCoreIssueLabels; track label) {
                      <div
                        class="multi-option"
                        [class.selected]="
                          selectedCoreIssueLabelsInDialog.has(label)
                        "
                        (click)="toggleCoreIssueSelectionInDialog(label)"
                      >
                        <input
                          type="checkbox"
                          [checked]="selectedCoreIssueLabelsInDialog.has(label)"
                        />
                        <span class="option-label">{{ label }}</span>
                      </div>
                      }
                    </div>
                    <div class="multi-select-actions">
                      <button
                        type="button"
                        class="clear-btn"
                        (click)="clearCoreIssueSelectionInDialog($event)"
                        [disabled]="selectedCoreIssueLabelsInDialog.size === 0"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        class="close-btn"
                        (click)="toggleCoreIssueSelectInDialog()"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  }
                </div>
                @if (selectedCoreIssueLabelsInDialog.size === 0) {
                <div class="filter-hint">Showing all core issues.</div>
                } @if (selectedCoreIssueLabelsInDialog.size > 0) {
                <div class="filter-hint">
                  Showing {{ selectedCoreIssueLabelsInDialog.size }} selected
                  core issue(s).
                </div>
                }
              </div>
              }
            </div>
          </div>
          <div class="chart-frame">
            <app-bar-chart
              [data]="filteredCoreIssueData"
              [stacked]="true"
              [isLoading]="false"
              [chartHeight]="510"
              canvasId="expandedCoreIssueChartFpp"
            ></app-bar-chart>
          </div>
        </div>
        }
      </div>
    </mat-dialog-content>
  `,
  styles: [
    `
      .expand-charts-wrapper {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      .expand-dialog-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 20px 10px 20px;
        background-color: #08ace4;
        color: #ffffff;
        font-weight: 600;
        font-size: 16px;
        margin: -24px -24px 0 -24px;
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
      }
      .expand-dialog-title {
        line-height: 1.2;
      }
      .close-icon {
        cursor: pointer;
        user-select: none;
        font-size: 24px;
      }
      .close-icon:hover {
        opacity: 0.85;
      }
      .close-icon:focus {
        outline: 2px solid #ffffff;
        outline-offset: 2px;
        border-radius: 4px;
      }
      .subheading {
        font-weight: 500;
        margin: 12px 0 8px;
      }
      .expand-chart-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .chart-frame {
        border-radius: 6px;
        padding: 8px 12px 0;
        background: #ffffff;
      }

      /* Dialog filter styles */
      .filter-wrapper {
        position: relative;
        margin-top: 10px;
      }
      .chart-filter-panel {
        position: absolute;
        top: 32px;
        right: 0;
        background: #fff;
        border: 1px solid #d0d7de;
        border-radius: 4px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
        padding: 12px 14px 14px;
        width: 220px;
        z-index: 60;
        font-size: 12px;
      }
      .multi-select-wrapper {
        position: relative;
        margin-bottom: 10px;
      }
      .multi-select-trigger {
        width: 100%;
        text-align: left;
        background: #fff;
        border: 1px solid #d0d7de;
        padding: 6px 10px;
        font-size: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-radius: 4px;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }
      .multi-select-trigger:hover {
        border-color: #08ace4;
      }
      .multi-select-trigger:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(8, 172, 228, 0.3);
      }
      .chevron {
        transition: transform 0.2s ease;
        font-size: 10px;
      }
      .chevron.open {
        transform: rotate(180deg);
      }
      .multi-select-dropdown {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        width: 100%;
        max-height: 200px;
        background: #fff;
        border: 1px solid #d0d7de;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
        border-radius: 4px;
        z-index: 70;
        display: flex;
        flex-direction: column;
      }
      .multi-select-options {
        overflow-y: auto;
        padding: 4px 0;
      }
      .multi-option {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        font-size: 12px;
        cursor: pointer;
      }
      .multi-option:hover {
        background: #f3f4f6;
      }
      .multi-option.selected {
        font-weight: 600;
        background: #eef7ff;
      }
      .multi-option input {
        pointer-events: none;
      }
      .multi-select-actions {
        display: flex;
        justify-content: space-between;
        padding: 6px 8px;
        border-top: 1px solid #e5e7eb;
        gap: 8px;
      }
      .multi-select-actions .clear-btn,
      .multi-select-actions .close-btn {
        flex: 1;
        border: none;
        background: #08ace4;
        color: #fff;
        font-size: 11px;
        padding: 6px 8px;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .multi-select-actions .clear-btn[disabled] {
        background: #c8e9f5;
        cursor: not-allowed;
      }
      .multi-select-actions .clear-btn:hover:not([disabled]),
      .multi-select-actions .close-btn:hover {
        background: #0692c2;
      }
      .filter-hint {
        margin-top: 8px;
        font-size: 11px;
        color: #555;
      }
    `,
  ],
  imports: [
    CommonModule,
    MatIconModule,
    MatTabsModule,
    MatTooltipModule,
    BarChartComponent,
    // CaseiqTableComponent,
    MatDialogModule,
  ],
  standalone: true,
})
export class CaseiqFppExpandDialogComponent implements OnInit {
  chartType: 'CATEGORY' | 'CORE_ISSUE';

  constructor(
    public dialogRef: MatDialogRef<CaseiqFppExpandDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.chartType = data.chartType;
  }

  onClose(): void {
    this.dialogRef.close();
  }

  // Dialog-specific multi-select state
  showCategorySelectInDialog: boolean = false;
  showCoreIssueSelectInDialog: boolean = false;
  dialogCategoryLabels: string[] = [];
  dialogCoreIssueLabels: string[] = [];
  selectedCategoryLabelsInDialog: Set<string> = new Set();
  selectedCoreIssueLabelsInDialog: Set<string> = new Set();
  filteredCategoryData: StackedBarChartDataPoint[] = [];
  filteredCoreIssueData: StackedBarChartDataPoint[] = [];
  showCategoryFiltersInDialog: boolean = false;
  showCoreIssueFiltersInDialog: boolean = false;

  toggleCategoryFiltersInDialog() {
    this.showCategoryFiltersInDialog = !this.showCategoryFiltersInDialog;
    if (this.showCategoryFiltersInDialog) {
      this.showCoreIssueFiltersInDialog = false;
    }
  }

  toggleCoreIssueFiltersInDialog() {
    this.showCoreIssueFiltersInDialog = !this.showCoreIssueFiltersInDialog;
    if (this.showCoreIssueFiltersInDialog) {
      this.showCategoryFiltersInDialog = false;
    }
  }

  ngOnInit() {
    // Initialize labels from passed data
    if (Array.isArray(this.data?.categoryData)) {
      this.dialogCategoryLabels = this.data.categoryData
        .map((d: any) => d.label)
        .sort((a: string, b: string) => a.localeCompare(b));
      this.filteredCategoryData = this.data.categoryData;
    }
    if (Array.isArray(this.data?.coreIssueData)) {
      this.dialogCoreIssueLabels = this.data.coreIssueData
        .map((d: any) => d.label)
        .sort((a: string, b: string) => a.localeCompare(b));
      this.filteredCoreIssueData = this.data.coreIssueData;
    }
  }

  // Toggle dropdown visibility
  toggleCategorySelectInDialog() {
    this.showCategorySelectInDialog = !this.showCategorySelectInDialog;
  }

  toggleCoreIssueSelectInDialog() {
    this.showCoreIssueSelectInDialog = !this.showCoreIssueSelectInDialog;
  }

  // Selection handlers
  toggleCategorySelectionInDialog(label: string) {
    if (this.selectedCategoryLabelsInDialog.has(label)) {
      this.selectedCategoryLabelsInDialog.delete(label);
    } else {
      this.selectedCategoryLabelsInDialog.add(label);
    }
    this.applyDialogCategoryFilter();
  }

  clearCategorySelectionInDialog(event?: Event) {
    if (event) event.stopPropagation();
    this.selectedCategoryLabelsInDialog.clear();
    this.applyDialogCategoryFilter();
  }

  toggleCoreIssueSelectionInDialog(label: string) {
    if (this.selectedCoreIssueLabelsInDialog.has(label)) {
      this.selectedCoreIssueLabelsInDialog.delete(label);
    } else {
      this.selectedCoreIssueLabelsInDialog.add(label);
    }
    this.applyDialogCoreIssueFilter();
  }

  clearCoreIssueSelectionInDialog(event?: Event) {
    if (event) event.stopPropagation();
    this.selectedCoreIssueLabelsInDialog.clear();
    this.applyDialogCoreIssueFilter();
  }

  private applyDialogCategoryFilter() {
    if (!Array.isArray(this.data?.categoryData)) return;
    this.filteredCategoryData = this.selectedCategoryLabelsInDialog.size
      ? this.data.categoryData.filter((d: any) =>
          this.selectedCategoryLabelsInDialog.has(d.label)
        )
      : this.data.categoryData;
  }

  private applyDialogCoreIssueFilter() {
    if (!Array.isArray(this.data?.coreIssueData)) return;
    this.filteredCoreIssueData = this.selectedCoreIssueLabelsInDialog.size
      ? this.data.coreIssueData.filter((d: any) =>
          this.selectedCoreIssueLabelsInDialog.has(d.label)
        )
      : this.data.coreIssueData;
  }
}
