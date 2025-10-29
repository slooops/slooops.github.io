import {
  Component,
  OnInit,
  ViewChild,
  HostListener,
  Inject,
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
} from '@angular/material/dialog';

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
})
export class CaseiqSmComponent implements OnInit {
  @ViewChild('smTable') smTable!: CaseiqTableComponent;

  constructor(
    private readonly http: ApiHttpService,
    private readonly destroyManager: DestroyManager,
    private dialog: MatDialog
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
  categoryMinThreshold = 10;
  coreIssueMinThreshold = 10;

  // Multi-select state
  allCategoryLabels: string[] = [];
  allCoreIssueLabels: string[] = [];
  selectedCategoryLabels: Set<string> = new Set();
  selectedCoreIssueLabels: Set<string> = new Set();

  // Cached data for reapplying filters
  cachedCategoryData: any[] = [];
  cachedCoreIssueData: any[] = [];

  // Visibility totals
  visibleCategoryTotal = 0;
  visibleCoreIssueTotal = 0;

  // Loading state for refresh
  refreshingData = false;

  ngOnInit(): void {
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
    countColumn: string
  ): any[] {
    const groupMap = new Map<string, any>();

    data.forEach((item) => {
      const key = item[groupColumn];
      // Skip items with null or undefined groupColumn values
      if (key == null || key === '') {
        return;
      }

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
        console.log('xxcaseiqCategoryGraphVSm: new query', data);

        // Merge data by category
        const mergedData = this.mergeByCategoryOrIssue(
          data,
          'CATEGORY',
          'CATEGORY_COUNT'
        );

        // Cache for reapplying filters
        this.cachedCategoryData = mergedData;

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
        console.log('xxcaseiqCoreIssueGraphVSm: new query', data);

        // Merge data by core issue
        const mergedData = this.mergeByCategoryOrIssue(
          data,
          'CORE_ISSUE',
          'CORE_ISSUE_COUNT'
        );

        // Cache for reapplying filters
        this.cachedCoreIssueData = mergedData;

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
        console.log('xxcaseiqI2cCaseDetailsV: new query', data);
        this.updateTableData(data);
      });
  }

  getXxcaseiqValidatedCasesAccuracyV() {
    this.http
      .get('xxcaseiq-validated-cases-accuracy-v', this.destroyManager)
      .subscribe((data: any) => {
        console.log('xxcaseiqValidatedCasesAccuracyV:', data);
        this.updateSmMetrics(data);
      });
  }

  /**
   * Callback for upload success
   */
  handleUploadResult(success: boolean): void {
    if (success) {
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
          console.log('Refreshed xxcaseiqValidatedCasesAccuracyV:', data);
          this.updateSmMetrics(data);
        }),
      this.http
        .get('xxcaseiq-category-graph-v-sm', this.destroyManager)
        .toPromise()
        .then((data: any) => {
          console.log('Refreshed xxcaseiqCategoryGraphVSm:', data);
          const mergedData = this.mergeByCategoryOrIssue(
            data,
            'CATEGORY',
            'CATEGORY_COUNT'
          );
          this.cachedCategoryData = mergedData;
          this.allCategoryLabels = mergedData.map((item) => item.CATEGORY);
          this.reapplyCategoryFilters();
        }),
      this.http
        .get('xxcaseiq-core-issue-graph-v-sm', this.destroyManager)
        .toPromise()
        .then((data: any) => {
          console.log('Refreshed xxcaseiqCoreIssueGraphVSm:', data);
          const mergedData = this.mergeByCategoryOrIssue(
            data,
            'CORE_ISSUE',
            'CORE_ISSUE_COUNT'
          );
          this.cachedCoreIssueData = mergedData;
          this.allCoreIssueLabels = mergedData.map((item) => item.CORE_ISSUE);
          this.reapplyCoreIssueFilters();
        }),
      this.http
        .get('xxcaseiq-sm-case-details-v', this.destroyManager)
        .toPromise()
        .then((data: any) => {
          console.log('Refreshed xxcaseiqSmCaseDetailsV:', data);
          this.updateTableData(data);
        }),
    ])
      .then(() => {
        this.refreshingData = false;
        console.log('All data sources refreshed successfully');
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
      this.categoryMinThreshold + direction * 5
    );
    this.reapplyCategoryFilters();
  }

  adjustCoreIssueThreshold(direction: number): void {
    this.coreIssueMinThreshold = Math.max(
      10,
      this.coreIssueMinThreshold + direction * 5
    );
    this.reapplyCoreIssueFilters();
  }

  /**
   * Reapply category filters with threshold and selection
   */
  reapplyCategoryFilters(): void {
    let filtered = this.cachedCategoryData.filter(
      (item) => item.CATEGORY_COUNT > this.categoryMinThreshold
    );

    if (this.selectedCategoryLabels.size > 0) {
      filtered = filtered.filter((item) =>
        this.selectedCategoryLabels.has(item.CATEGORY)
      );
    }

    this.visibleCategoryTotal = this.computeStackedTotal(filtered, 'data');
    this.i2cChartData = this.transformMatchStatusData(
      filtered,
      'CATEGORY',
      'CATEGORY_COUNT'
    );
  }

  /**
   * Reapply core issue filters with threshold and selection
   */
  reapplyCoreIssueFilters(): void {
    let filtered = this.cachedCoreIssueData.filter(
      (item) => item.CORE_ISSUE_COUNT > this.coreIssueMinThreshold
    );

    if (this.selectedCoreIssueLabels.size > 0) {
      filtered = filtered.filter((item) =>
        this.selectedCoreIssueLabels.has(item.CORE_ISSUE)
      );
    }

    this.visibleCoreIssueTotal = this.computeStackedTotal(filtered, 'data');
    this.i2cSimpleChartData = this.transformMatchStatusData(
      filtered,
      'CORE_ISSUE',
      'CORE_ISSUE_COUNT'
    );
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
    this.reapplyCategoryFilters();
  }

  clearCategorySelection(event: Event): void {
    event.stopPropagation();
    this.selectedCategoryLabels.clear();
    this.reapplyCategoryFilters();
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
    this.reapplyCoreIssueFilters();
  }

  clearCoreIssueSelection(event: Event): void {
    event.stopPropagation();
    this.selectedCoreIssueLabels.clear();
    this.reapplyCoreIssueFilters();
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
          0
        );
        return sum + itemSum;
      }
      return sum;
    }, 0);
  }

  /**
   * Expand chart in dialog
   */
  onExpandChart(chartType: 'CATEGORY' | 'CORE_ISSUE'): void {
    const dialogData =
      chartType === 'CATEGORY'
        ? {
            chartType,
            categoryAccuracy: this.categoryAccuracy,
            categoryData: this.i2cChartData,
            totalCases: this.totalCases,
            visibleCategoryTotal: this.visibleCategoryTotal,
          }
        : {
            chartType,
            coreIssueAccuracy: this.coreIssueAccuracy,
            coreIssueData: this.i2cSimpleChartData,
            totalCases: this.totalCases,
            visibleCoreIssueTotal: this.visibleCoreIssueTotal,
          };

    this.dialog.open(CaseiqSmExpandDialogComponent, {
      width: '90vw',
      height: '70vh',
      data: dialogData,
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

  /**
   * Updates SM metrics from API data
   * Finds the SM team data and sets the component properties
   */
  private updateSmMetrics(apiData: SmAccuracyData[]): void {
    if (Array.isArray(apiData)) {
      const smData = apiData.find(
        (item) => item.TEAM_NAME && item.TEAM_NAME.toUpperCase() === 'SM'
      );

      if (smData) {
        this.categoryAccuracy =
          Math.round(smData['Category Accuracy'] * 100) / 100;
        this.coreIssueAccuracy =
          Math.round(smData['Core Issue Accuracy'] * 100) / 100;
        this.totalCases = smData['Total Cases'];
      } else {
        // No SM data found, keep defaults
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

    // Handle merged data structure with nested data array
    const chartData = apiData
      .filter((item) => item[groupColumn] != null && item[groupColumn] !== '') // Filter out null/undefined/empty labels
      .map((item) => {
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
          label: item[groupColumn],
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

// Expand Dialog Component
@Component({
  selector: 'app-caseiq-sm-expand-dialog',
  template: `
    <div class="expand-dialog-container">
      <div class="expand-header">
        <h2 mat-dialog-title>
          {{
            chartType === 'CATEGORY'
              ? 'Category Analysis'
              : 'Core Issue Analysis'
          }}
          - SM Team
        </h2>
        <button mat-icon-button (click)="onClose()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="expand-content">
        <div class="expand-chart-section" *ngIf="chartType === 'CATEGORY'">
          <div class="expand-chart-header">
            <div class="chart-title-block">
              <h4>Category Accuracy - {{ data.categoryAccuracy }}%</h4>
            </div>
            <div class="flex-row header-metrics">
              <h4>
                No. of cases visible: {{ data.visibleCategoryTotal }}/
                {{ data.totalCases }}
              </h4>
              &nbsp;
              <mat-icon
                style="font-size: 15px; padding-top: 5px"
                matTooltip="Full view of category distribution across all match statuses."
                >info_outline</mat-icon
              >
            </div>
          </div>
          <div class="expand-chart-container">
            <app-bar-chart
              [data]="data.categoryData"
              [stacked]="true"
              [isLoading]="false"
              canvasId="smExpandCategoryChart"
            >
            </app-bar-chart>
          </div>
        </div>

        <div class="expand-chart-section" *ngIf="chartType === 'CORE_ISSUE'">
          <div class="expand-chart-header">
            <div class="chart-title-block">
              <h4>Core Issue Accuracy - {{ data.coreIssueAccuracy }}%</h4>
            </div>
            <div class="flex-row header-metrics">
              <h4>
                No. of core issues visible: {{ data.visibleCoreIssueTotal }}/
                {{ data.totalCases }}
              </h4>
              &nbsp;
              <mat-icon
                style="font-size: 15px; padding-top: 5px"
                matTooltip="Full view of core issue distribution across all match statuses."
                >info_outline</mat-icon
              >
            </div>
          </div>
          <div class="expand-chart-container">
            <app-bar-chart
              [data]="data.coreIssueData"
              [stacked]="true"
              [isLoading]="false"
              canvasId="smExpandCoreIssueChart"
            >
            </app-bar-chart>
          </div>
        </div>
      </mat-dialog-content>
    </div>
  `,
  styles: [
    `
      .expand-dialog-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }

      .expand-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        border-bottom: 1px solid #e0e0e0;
        background: #f8f9fa;
      }

      .expand-header h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #333;
      }

      .close-btn {
        color: #666;
      }

      .close-btn:hover {
        background: rgba(0, 0, 0, 0.05);
      }

      .expand-content {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
      }

      .expand-chart-section {
        background: white;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }

      .expand-chart-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
        gap: 16px;
      }

      .chart-title-block h4 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }

      .flex-row {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .header-metrics h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 500;
        color: #555;
      }

      .expand-chart-container {
        height: 500px;
        position: relative;
      }

      @media (max-width: 768px) {
        .expand-header {
          padding: 12px 16px;
        }

        .expand-header h2 {
          font-size: 18px;
        }

        .expand-content {
          padding: 16px;
        }

        .expand-chart-container {
          height: 400px;
        }
      }
    `,
  ],
})
export class CaseiqSmExpandDialogComponent {
  chartType: 'CATEGORY' | 'CORE_ISSUE';

  constructor(
    public dialogRef: MatDialogRef<CaseiqSmExpandDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.chartType = data.chartType;
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
