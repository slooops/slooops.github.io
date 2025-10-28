import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { ApiHttpService } from 'src/app/providers/http.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { StackedBarChartDataPoint } from 'src/app/components/bar-chart/bar-chart.component';
import { CaseiqTableComponent } from 'src/app/components/caseiq-table/caseiq-table.component';

interface I2CAccuracyData {
  TEAM_NAME: string;
  CATEGORY: number;
  CORE_ISSUE: number;
  TOTAL_ACCURACY: number;
  TOTAL_VALIDATED_CASES: number;
}

@Component({
  selector: 'app-caseiq-i2c',
  templateUrl: './caseiq-i2c.component.html',
  styleUrl: './caseiq-i2c.component.css',
})
export class CaseiqI2cComponent implements OnInit {
  @ViewChild('i2cTable') i2cTable!: CaseiqTableComponent;

  constructor(
    private readonly http: ApiHttpService,
    private readonly destroyManager: DestroyManager,
    private readonly dialog: MatDialog
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
  categoryMinThreshold: number = 10; // default threshold for category chart
  coreIssueMinThreshold: number = 10; // default threshold for core issue chart

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

  i2cTableData = new MatTableDataSource<any>([]);
  i2cTableColumns: string[] = [];
  totalRecords: number = 0;
  backendMatchLoading: boolean = false;

  ngOnInit(): void {
    this.getXxcaseiqValidatedCasesAccuracyV();
    this.getXxcaseiqCategoryGraphVI2c();
    this.getXxcaseiqCoreIssueGraphVI2c();
    this.getXxcaseiqI2cCaseDetailsV();
  }

  getXxcaseiqCategoryGraphVI2c() {
    this.http
      .get('xxcaseiq-category-graph-v-i2c', this.destroyManager)
      .subscribe((data: any) => {
        console.log('xxcaseiqCategoryGraphVI2c: new query', data);
        this.completeCategoryRaw = data; // cache original raw list for re-filtering

        // Populate distinct category labels
        this.allCategoryLabels = Array.from(
          new Set<string>(
            data.map((item: any) => (item.CATEGORY || '').toString().trim())
          )
        )
          .map((v) => v)
          .sort((a: string, b: string) => a.localeCompare(b));

        // Apply dynamic filter (strictly greater than threshold like original >10 logic)
        const filteredData = data.filter(
          (item: any) => item.CATEGORY_COUNT > this.categoryMinThreshold
        );

        this.i2cChartData = this.transformMatchStatusData(
          filteredData,
          'CATEGORY',
          'CATEGORY_COUNT'
        );
        this.visibleCategoryTotal = this.computeStackedTotal(this.i2cChartData);

        this.completeI2cChartData = this.transformMatchStatusData(
          data,
          'CATEGORY',
          'CATEGORY_COUNT'
        );
      });
  }

  getXxcaseiqCoreIssueGraphVI2c() {
    this.http
      .get('xxcaseiq-core-issue-graph-v-i2c', this.destroyManager)
      .subscribe((data: any) => {
        console.log('xxcaseiqCoreIssueGraphVI2c: new query', data);
        this.completeCoreIssueRaw = data; // cache original raw list

        // Populate distinct core issue labels
        this.allCoreIssueLabels = Array.from(
          new Set<string>(
            data.map((item: any) => (item.CORE_ISSUE || '').toString().trim())
          )
        )
          .map((v) => v)
          .sort((a: string, b: string) => a.localeCompare(b));

        const filteredData = data.filter(
          (item: any) => item.CORE_ISSUE_COUNT > this.coreIssueMinThreshold
        );

        this.i2cSimpleChartData = this.transformMatchStatusData(
          filteredData,
          'CORE_ISSUE',
          'CORE_ISSUE_COUNT'
        );
        this.visibleCoreIssueTotal = this.computeStackedTotal(
          this.i2cSimpleChartData
        );
        this.completeI2cSimpleChartData = this.transformMatchStatusData(
          data,
          'CORE_ISSUE',
          'CORE_ISSUE_COUNT'
        );
      });
  }

  getXxcaseiqI2cCaseDetailsV() {
    this.http
      .get('xxcaseiq-i2c-case-details-v', this.destroyManager)
      .subscribe((data: any) => {
        console.log('xxcaseiqI2cCaseDetailsV: new query', data);
        this.updateTableData(data);
      });
  }

  // Cached raw responses for dynamic threshold re-filtering
  private completeCategoryRaw: any[] = [];
  private completeCoreIssueRaw: any[] = [];

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
            this.selectedCategoryLabels.has(item.CATEGORY)
          )
        : this.completeCategoryRaw.filter(
            (item: any) => item.CATEGORY_COUNT > this.categoryMinThreshold
          );

      this.i2cChartData = this.transformMatchStatusData(
        effectiveData,
        'CATEGORY',
        'CATEGORY_COUNT'
      );
      this.visibleCategoryTotal = this.computeStackedTotal(this.i2cChartData);
    }
  }

  private reapplyCoreIssueFilter() {
    if (this.completeCoreIssueRaw.length) {
      // Selected labels override threshold; show them regardless of count
      const effectiveData = this.selectedCoreIssueLabels.size
        ? this.completeCoreIssueRaw.filter((item: any) =>
            this.selectedCoreIssueLabels.has(item.CORE_ISSUE)
          )
        : this.completeCoreIssueRaw.filter(
            (item: any) => item.CORE_ISSUE_COUNT > this.coreIssueMinThreshold
          );

      this.i2cSimpleChartData = this.transformMatchStatusData(
        effectiveData,
        'CORE_ISSUE',
        'CORE_ISSUE_COUNT'
      );
      this.visibleCoreIssueTotal = this.computeStackedTotal(
        this.i2cSimpleChartData
      );
    }
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

  // Fetch data where both CATEGORY_MATCH and CORE_ISSUE_MATCH are Y
  fetchBothYMatchData() {
    this.backendMatchLoading = true;
    this.http
      .get('xxcaseiq-i2c-case-details-match-y', this.destroyManager)
      .subscribe({
        next: (data: any) => {
          console.log('bothY match data fetched', data);
          // Do not reset columns; assume same shape
          if (Array.isArray(data)) {
            if (this.i2cTable) {
              this.i2cTable.setExternalData(data, false);
            } else {
              this.i2cTableData.data = data;
              this.totalRecords = data.length;
            }
          } else {
            console.warn('Unexpected bothY response format', data);
          }
          this.backendMatchLoading = false;
        },
        error: (err) => {
          console.error('Failed to fetch both Y match data', err);
          this.backendMatchLoading = false;
        },
      });
  }

  // Handle upload dialog results (emitted from table component)
  handleUploadResult(result: any) {
    if (result?.success) {
      console.log('Refreshing I2C table after successful upload');
      this.getXxcaseiqI2cCaseDetailsV();
    } else if (result) {
      console.warn('Upload did not succeed, no refresh triggered');
    }
  }

  getXxcaseiqValidatedCasesAccuracyV() {
    this.http
      .get('xxcaseiq-validated-cases-accuracy-v', this.destroyManager)
      .subscribe((data: any) => {
        console.log('xxcaseiqValidatedCasesAccuracyV:', data);
        this.updateI2CMetrics(data);
      });
  }

  /**
   * Updates table data and columns from API response
   * Dynamically sets columns based on the first record's keys
   */
  private updateTableData(apiData: any[]): void {
    if (Array.isArray(apiData) && apiData.length > 0) {
      this.i2cTableData.data = apiData;

      // Set total records for pagination
      this.totalRecords = apiData.length;
      this.i2cTableColumns = Object.keys(apiData[0]).filter(
        (key) => key !== 'DESCRIPTION' && key !== 'SUMMARY'
      );

      // Manually trigger paginator setup after data is loaded
      setTimeout(() => {
        if (this.i2cTable) {
          this.i2cTable.initializePaginator();
        }
      }, 100);
    } else {
      // No data received, keep empty state
      this.i2cTableData.data = [];
      this.i2cTableColumns = [];
      this.totalRecords = 0;
    }
  }

  /**
   * Updates I2C metrics from API data
   * Finds the I2C team data and sets the component properties
   */
  private updateI2CMetrics(apiData: I2CAccuracyData[]): void {
    if (Array.isArray(apiData)) {
      const i2cData = apiData.find(
        (item) => item.TEAM_NAME && item.TEAM_NAME.toUpperCase() === 'I2C'
      );

      if (i2cData) {
        this.categoryAccuracy =
          Math.round(i2cData['Category Accuracy'] * 100) / 100;
        this.coreIssueAccuracy =
          Math.round(i2cData['Core Issue Accuracy'] * 100) / 100;
        this.totalCases = i2cData['Total Cases'];
      } else {
        // No I2C data found, keep defaults
        this.categoryAccuracy = '-';
        this.coreIssueAccuracy = '-';
        this.totalCases = '-';
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
    countColumn: string
  ): StackedBarChartDataPoint[] {
    if (!Array.isArray(apiData)) {
      console.log(`No ${groupColumn.toLowerCase()} match data to transform`);
      return [];
    }

    // Group data by the specified column
    const groups = apiData.reduce((acc, item) => {
      const groupKey = item[groupColumn];
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    // Transform to stacked bar chart format
    const chartData = Object.keys(groups).map((groupKey) => {
      const segments = groups[groupKey].map((item) => ({
        name: item.MATCH_STATUS,
        value: item[countColumn],
        color: this.getMatchStatusColor(item.MATCH_STATUS),
      }));

      return {
        label: groupKey,
        segments: segments,
      };
    });

    return chartData;
  }

  // Computes total of all segment values across all bars
  private computeStackedTotal(data: StackedBarChartDataPoint[]): number {
    if (!Array.isArray(data)) return 0;
    return data.reduce((sum, dp) => {
      if (!dp?.segments) return sum;
      return (
        sum +
        dp.segments.reduce(
          (s: number, seg: any) => s + (Number(seg.value) || 0),
          0
        )
      );
    }, 0);
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

  // Open dialog when expand icon clicked
  onExpandChart(type: 'CATEGORY' | 'CORE_ISSUE') {
    // Lazy inline component data passed to dialog
    this.dialog.open(CaseiqI2cExpandDialogComponent, {
      width: '90vw',
      maxWidth: '2000px',
      height: '70vh',
      data: {
        type,
        categoryAccuracy: this.categoryAccuracy,
        coreIssueAccuracy: this.coreIssueAccuracy,
        categoryData: this.completeI2cChartData,
        coreIssueData: this.completeI2cSimpleChartData,
        categoryTotal: this.computeStackedTotal(this.completeI2cChartData),
        coreIssueTotal: this.computeStackedTotal(
          this.completeI2cSimpleChartData
        ),
      },
      panelClass: 'caseiq-expand-dialog',
    });
  }
}

// Simple dialog component for expanded charts
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
@Component({
  selector: 'app-caseiq-i2c-expand-dialog',
  template: `
    <div class="expand-dialog-header" role="heading" aria-level="2">
      <span class="expand-dialog-title">
        I2C {{ data.type === 'CATEGORY' ? 'Category' : 'Core Issue' }} Details
      </span>
      <!-- <mat-icon
        class="close-icon"
        (click)="onClose()"
        tabindex="0"
        role="button"
        aria-label="Close dialog"
        (keydown.enter)="onClose()"
        (keydown.space)="onClose()"
        >close</mat-icon
      > -->
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
        <div class="expand-chart-block" *ngIf="data.type === 'CATEGORY'">
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
              <div
                class="chart-filter-panel"
                *ngIf="showCategoryFiltersInDialog"
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
                  <div
                    class="multi-select-dropdown"
                    *ngIf="showCategorySelectInDialog"
                    (click)="$event.stopPropagation()"
                  >
                    <div class="multi-select-options">
                      <div
                        class="multi-option"
                        *ngFor="let label of dialogCategoryLabels"
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
                </div>
                <div
                  class="filter-hint"
                  *ngIf="selectedCategoryLabelsInDialog.size === 0"
                >
                  Showing all categories.
                </div>
                <div
                  class="filter-hint"
                  *ngIf="selectedCategoryLabelsInDialog.size > 0"
                >
                  Showing {{ selectedCategoryLabelsInDialog.size }} selected
                  category(ies).
                </div>
              </div>
            </div>
          </div>
          <div class="chart-frame">
            <app-bar-chart
              [data]="filteredCategoryData"
              [stacked]="true"
              [isLoading]="false"
              [chartHeight]="510"
              canvasId="expandedCategoryChart"
            ></app-bar-chart>
          </div>
        </div>
        <div class="expand-chart-block" *ngIf="data.type === 'CORE_ISSUE'">
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
              <div
                class="chart-filter-panel"
                *ngIf="showCoreIssueFiltersInDialog"
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
                  <div
                    class="multi-select-dropdown"
                    *ngIf="showCoreIssueSelectInDialog"
                    (click)="$event.stopPropagation()"
                  >
                    <div class="multi-select-options">
                      <div
                        class="multi-option"
                        *ngFor="let label of dialogCoreIssueLabels"
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
                </div>
                <div
                  class="filter-hint"
                  *ngIf="selectedCoreIssueLabelsInDialog.size === 0"
                >
                  Showing all core issues.
                </div>
                <div
                  class="filter-hint"
                  *ngIf="selectedCoreIssueLabelsInDialog.size > 0"
                >
                  Showing {{ selectedCoreIssueLabelsInDialog.size }} selected
                  core issue(s).
                </div>
              </div>
            </div>
          </div>
          <div class="chart-frame">
            <app-bar-chart
              [data]="filteredCoreIssueData"
              [stacked]="true"
              [isLoading]="false"
              [chartHeight]="510"
              canvasId="expandedCoreIssueChart"
            ></app-bar-chart>
          </div>
        </div>
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
        background-color: #08ace4; /* match navbar color */
        color: #ffffff;
        font-weight: 600;
        font-size: 16px;
        margin: -24px -24px 0 -24px; /* stretch header edge-to-edge */
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
        border: 1px solid #d0d7de;
        border-radius: 6px;
        padding: 8px 12px 0; /* removed bottom padding to eliminate extra space/scroll */
        background: #ffffff;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
      }
      .chart-frame:hover {
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
      }
      /* Dialog filter styles replicate main chart filters */
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
})
export class CaseiqI2cExpandDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<CaseiqI2cExpandDialogComponent>
  ) {}

  onClose() {
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
