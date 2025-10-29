import {
  Component,
  OnInit,
  ViewChild,
  HostListener,
  Inject,
} from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { ApiHttpService } from 'src/app/providers/http.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { StackedBarChartDataPoint } from 'src/app/components/bar-chart/bar-chart.component';
import { CaseiqTableComponent } from 'src/app/components/caseiq-table/caseiq-table.component';

interface CapitalAccuracyData {
  TEAM_NAME: string;
  CATEGORY: number;
  CORE_ISSUE: number;
  TOTAL_ACCURACY: number;
  TOTAL_VALIDATED_CASES: number;
}

@Component({
  selector: 'app-caseiq-cap',
  templateUrl: './caseiq-cap.component.html',
  styleUrl: './caseiq-cap.component.css',
})
export class CaseiqCapComponent implements OnInit {
  @ViewChild('capTable') capTable!: CaseiqTableComponent;

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
  backendMatchLoading: boolean = false; // Loading state for backend match data fetch
  refreshingData: boolean = false; // Full-screen overlay during post-upload refresh

  ngOnInit(): void {
    this.getXxcaseiqValidatedCasesAccuracyV();
    this.getXxcaseiqCategoryGraphVCapital();
    this.getXxcaseiqCoreIssueGraphVCapital();
    this.getXxcaseiqCapitalCaseDetailsV();
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
    countKey: string
  ): any[] {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    const grouped = new Map<string, any>();

    data.forEach((item) => {
      const key = item[groupKey];
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

  getXxcaseiqCategoryGraphVCapital() {
    this.http
      .get('xxcaseiq-category-graph-v-capital', this.destroyManager)
      .subscribe((data: any) => {
        console.log('xxcaseiqCategoryGraphVCapital: new query', data);

        // Merge objects with same CATEGORY into single objects
        const mergedData = this.mergeByCategoryOrIssue(
          data,
          'CATEGORY',
          'CATEGORY_COUNT'
        );
        this.completeCategoryRaw = mergedData; // cache merged data for re-filtering

        // Populate distinct category labels
        this.allCategoryLabels = Array.from(
          new Set<string>(
            mergedData.map((item: any) =>
              (item.CATEGORY || '').toString().trim()
            )
          )
        )
          .map((v) => v)
          .sort((a: string, b: string) => a.localeCompare(b));

        // Apply dynamic filter (strictly greater than threshold like original >10 logic)
        const filteredData = mergedData.filter(
          (item: any) => item.CATEGORY_COUNT > this.categoryMinThreshold
        );

        this.i2cChartData = this.transformMatchStatusData(
          filteredData,
          'CATEGORY',
          'CATEGORY_COUNT'
        );
        this.visibleCategoryTotal = this.computeStackedTotal(this.i2cChartData);

        this.completeI2cChartData = this.transformMatchStatusData(
          mergedData,
          'CATEGORY',
          'CATEGORY_COUNT'
        );
      });
  }

  getXxcaseiqCoreIssueGraphVCapital() {
    this.http
      .get('xxcaseiq-core-issue-graph-v-capital', this.destroyManager)
      .subscribe((data: any) => {
        console.log('xxcaseiqCoreIssueGraphVCapital:', data);

        // Merge objects with same CORE_ISSUE into single objects
        const mergedData = this.mergeByCategoryOrIssue(
          data,
          'CORE_ISSUE',
          'CORE_ISSUE_COUNT'
        );
        this.completeCoreIssueRaw = mergedData; // cache merged data

        // Populate distinct core issue labels
        this.allCoreIssueLabels = Array.from(
          new Set<string>(
            mergedData.map((item: any) =>
              (item.CORE_ISSUE || '').toString().trim()
            )
          )
        )
          .map((v) => v)
          .sort((a: string, b: string) => a.localeCompare(b));

        // Apply dynamic filter (strictly greater than threshold like original >10 logic)
        const filteredData = mergedData.filter(
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
          mergedData,
          'CORE_ISSUE',
          'CORE_ISSUE_COUNT'
        );
      });
  }

  getXxcaseiqCapitalCaseDetailsV() {
    this.http
      .get('xxcaseiq-capital-case-details-v', this.destroyManager)
      .subscribe((data: any) => {
        this.updateTableData(data);
      });
  }

  getXxcaseiqValidatedCasesAccuracyV() {
    this.http
      .get('xxcaseiq-validated-cases-accuracy-v', this.destroyManager)
      .subscribe((data: any) => {
        this.updateCapitalMetrics(data);
      });
  }

  // Handle upload dialog results (emitted from table component)
  handleUploadResult(result: any) {
    if (result?.success) {
      console.log(
        'Upload succeeded, refreshing all Capital data (table + charts)'
      );

      // Show full-screen overlay
      this.refreshingData = true;

      // Refresh all data sources
      Promise.all([this.refreshAllData()])
        .then(() => {
          console.log('All Capital data refreshed successfully');
          // Hide overlay after a brief delay to show completion
          setTimeout(() => {
            this.refreshingData = false;
          }, 500);
        })
        .catch((error) => {
          console.error('Error refreshing Capital data:', error);
          // Hide overlay even if error
          setTimeout(() => {
            this.refreshingData = false;
          }, 500);
        });
    }
  }

  /**
   * Refresh all data sources in parallel
   * Returns a promise that resolves when all API calls complete
   */
  private refreshAllData(): Promise<void> {
    return new Promise((resolve, reject) => {
      let completedCalls = 0;
      const totalCalls = 4; // accuracy, category chart, core issue chart, table
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
            console.log('Refreshed accuracy data');
            this.updateCapitalMetrics(data);
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
        .get('xxcaseiq-category-graph-v-capital', this.destroyManager)
        .subscribe({
          next: (data: any) => {
            console.log('Refreshed category chart data');
            const mergedData = this.mergeByCategoryOrIssue(
              data,
              'CATEGORY',
              'CATEGORY_COUNT'
            );
            this.completeCategoryRaw = mergedData;
            this.allCategoryLabels = Array.from(
              new Set<string>(
                mergedData.map((item: any) =>
                  (item.CATEGORY || '').toString().trim()
                )
              )
            ).sort((a: string, b: string) => a.localeCompare(b));

            const filteredData = mergedData.filter(
              (item: any) => item.CATEGORY_COUNT > this.categoryMinThreshold
            );
            this.i2cChartData = this.transformMatchStatusData(
              filteredData,
              'CATEGORY',
              'CATEGORY_COUNT'
            );
            this.visibleCategoryTotal = this.computeStackedTotal(
              this.i2cChartData
            );
            this.completeI2cChartData = this.transformMatchStatusData(
              mergedData,
              'CATEGORY',
              'CATEGORY_COUNT'
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
        .get('xxcaseiq-core-issue-graph-v-capital', this.destroyManager)
        .subscribe({
          next: (data: any) => {
            console.log('Refreshed core issue chart data');
            const mergedData = this.mergeByCategoryOrIssue(
              data,
              'CORE_ISSUE',
              'CORE_ISSUE_COUNT'
            );
            this.completeCoreIssueRaw = mergedData;
            this.allCoreIssueLabels = Array.from(
              new Set<string>(
                mergedData.map((item: any) =>
                  (item.CORE_ISSUE || '').toString().trim()
                )
              )
            ).sort((a: string, b: string) => a.localeCompare(b));

            const filteredData = mergedData.filter(
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
              mergedData,
              'CORE_ISSUE',
              'CORE_ISSUE_COUNT'
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
        .get('xxcaseiq-capital-case-details-v', this.destroyManager)
        .subscribe({
          next: (data: any) => {
            console.log('Refreshed table data');
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

  private updateTableData(apiData: any[]): void {
    if (Array.isArray(apiData) && apiData.length > 0) {
      this.totalRecords = apiData.length;
      this.i2cTableData = new MatTableDataSource(apiData);
      this.i2cTableColumns = Object.keys(apiData[0]).filter(
        (key) => key !== 'DESCRIPTION' && key !== 'SUMMARY'
      );
    } else {
      this.totalRecords = 0;
      this.i2cTableData = new MatTableDataSource([]);
      this.i2cTableColumns = [];
    }
  }

  private updateCapitalMetrics(apiData: CapitalAccuracyData[]): void {
    if (Array.isArray(apiData)) {
      const capitalData = apiData.find(
        (item) => item.TEAM_NAME && item.TEAM_NAME.toLowerCase() === 'capital'
      );

      if (capitalData) {
        this.categoryAccuracy = capitalData['Category Accuracy'] ?? '-';
        this.coreIssueAccuracy = capitalData['Core Issue Accuracy'] ?? '-';
        this.totalCases = capitalData['Total Cases'] ?? '-';
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
    countColumn: string
  ): StackedBarChartDataPoint[] {
    if (!Array.isArray(apiData)) {
      console.log(`No ${groupColumn.toLowerCase()} match data to transform`);
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
        label: item[groupColumn],
        segments: segments,
      };
    });

    return chartData;
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

  // Open dialog when expand icon clicked
  onExpandChart(type: 'CATEGORY' | 'CORE_ISSUE') {
    this.dialog.open(CaseiqCapExpandDialogComponent, {
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

// Simple dialog component for expanded charts
@Component({
  selector: 'app-caseiq-cap-expand-dialog',
  template: `
    <div class="expand-dialog-container">
      <div class="dialog-header">
        <h2 *ngIf="data.type === 'CATEGORY'">
          Category Chart - Accuracy: {{ data.categoryAccuracy }}%
        </h2>
        <h2 *ngIf="data.type === 'CORE_ISSUE'">
          Core Issue Chart - Accuracy: {{ data.coreIssueAccuracy }}%
        </h2>
        <button mat-icon-button (click)="closeDialog()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <div class="dialog-metrics">
        <p *ngIf="data.type === 'CATEGORY'">
          Total Cases: {{ data.categoryTotal }}
        </p>
        <p *ngIf="data.type === 'CORE_ISSUE'">
          Total Cases: {{ data.coreIssueTotal }}
        </p>
      </div>
      <div class="dialog-chart-container">
        <app-bar-chart
          *ngIf="data.type === 'CATEGORY'"
          [data]="data.categoryData"
          [stacked]="true"
          [isLoading]="false"
          canvasId="capExpandedCategoryChart"
        ></app-bar-chart>
        <app-bar-chart
          *ngIf="data.type === 'CORE_ISSUE'"
          [data]="data.coreIssueData"
          [stacked]="true"
          [isLoading]="false"
          canvasId="capExpandedCoreIssueChart"
        ></app-bar-chart>
      </div>
    </div>
  `,
  styles: [
    `
      .expand-dialog-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 20px;
      }
      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }
      .dialog-header h2 {
        margin: 0;
        font-size: 20px;
      }
      .dialog-metrics {
        margin-bottom: 15px;
      }
      .dialog-metrics p {
        margin: 5px 0;
        font-size: 14px;
        color: #666;
      }
      .dialog-chart-container {
        flex: 1;
        overflow: auto;
      }
    `,
  ],
})
export class CaseiqCapExpandDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<CaseiqCapExpandDialogComponent>
  ) {}

  closeDialog() {
    this.dialogRef.close();
  }
}
