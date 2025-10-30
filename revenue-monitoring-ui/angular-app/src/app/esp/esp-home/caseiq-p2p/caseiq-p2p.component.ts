import {
  Component,
  OnInit,
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
} from '@angular/material/dialog';

interface P2pAccuracyData {
  TEAM_NAME: string;
  CATEGORY: number;
  CORE_ISSUE: number;
  TOTAL_ACCURACY: number;
  TOTAL_VALIDATED_CASES: number;
}

@Component({
  selector: 'app-caseiq-p2p',
  templateUrl: './caseiq-p2p.component.html',
  styleUrl: './caseiq-p2p.component.css',
})
export class CaseiqP2pComponent implements OnInit {
  @ViewChild('p2pTable') p2pTable!: CaseiqTableComponent;
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
    this.getXxcaseiqValidatedCasesAccuracyV();
    this.getXxcaseiqCategoryGraphVP2p();
    this.getXxcaseiqCoreIssueGraphVP2p();
    this.getXxcaseiqP2pCaseDetailsV();
  }

  // Merge objects by CATEGORY or CORE_ISSUE
  private mergeByCategoryOrIssue(
    data: any[],
    groupKey: string,
    countKey: string
  ): any[] {
    const grouped = new Map<string, any>();

    data.forEach((item) => {
      const key = item[groupKey];
      // Skip items with null or undefined groupKey values
      if (key == null || key === '') {
        return;
      }

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

  getXxcaseiqCategoryGraphVP2p() {
    this.http
      .get('xxcaseiq-category-graph-v-p2p', this.destroyManager)
      .subscribe((data: any) => {
        console.log('xxcaseiqCategoryGraphVI2c: new query', data);

        // Merge by category
        const mergedData = this.mergeByCategoryOrIssue(
          data,
          'CATEGORY',
          'CATEGORY_COUNT'
        );
        this.cachedCategoryData = mergedData;
        this.allCategoryLabels = mergedData.map((item) => item.CATEGORY);
        this.reapplyCategoryFilters();
      });
  }

  getXxcaseiqCoreIssueGraphVP2p() {
    this.http
      .get('xxcaseiq-core-issue-graph-v-p2p', this.destroyManager)
      .subscribe((data: any) => {
        console.log('xxcaseiqCoreIssueGraphVI2c: new query', data);

        // Merge by core issue
        const mergedData = this.mergeByCategoryOrIssue(
          data,
          'CORE_ISSUE',
          'CORE_ISSUE_COUNT'
        );
        this.cachedCoreIssueData = mergedData;
        this.allCoreIssueLabels = mergedData.map((item) => item.CORE_ISSUE);
        this.reapplyCoreIssueFilters();
      });
  }

  getXxcaseiqP2pCaseDetailsV() {
    this.http
      .get('xxcaseiq-p2p-case-details-v', this.destroyManager)
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
        this.updateP2pMetrics(data);
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
                this.updateP2pMetrics(data);
                resolve();
              },
              error: () => resolve(),
            });
        }),
        new Promise<void>((resolve) => {
          this.http
            .get('xxcaseiq-category-graph-v-p2p', this.destroyManager)
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
            .get('xxcaseiq-core-issue-graph-v-p2p', this.destroyManager)
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
            .get('xxcaseiq-p2p-case-details-v', this.destroyManager)
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
    this.dialog.open(CaseiqP2pExpandDialogComponent, {
      width: '90vw',
      height: '70vh',
      data: {
        chartType,
        categoryData: this.i2cChartData,
        coreIssueData: this.i2cSimpleChartData,
        categoryAccuracy: this.categoryAccuracy,
        coreIssueAccuracy: this.coreIssueAccuracy,
        totalCases: this.totalCases,
        visibleCategoryTotal: this.visibleCategoryTotal,
        visibleCoreIssueTotal: this.visibleCoreIssueTotal,
      },
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
        if (this.p2pTable) {
          this.p2pTable.initializePaginator();
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
   * Updates P2P metrics from API data
   * Finds the P2P team data and sets the component properties
   */
  private updateP2pMetrics(apiData: P2pAccuracyData[]): void {
    if (Array.isArray(apiData)) {
      const p2pData = apiData.find(
        (item) => item.TEAM_NAME && item.TEAM_NAME.toUpperCase() === 'P2P'
      );

      if (p2pData) {
        this.categoryAccuracy =
          Math.round(p2pData['Category Accuracy'] * 100) / 100;
        this.coreIssueAccuracy =
          Math.round(p2pData['Core Issue Accuracy'] * 100) / 100;
        this.totalCases = p2pData['Total Cases'];
      } else {
        // No P2P data found, keep defaults
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

    const chartData = apiData
      .filter((item) => item[groupColumn] != null && item[groupColumn] !== '') // Filter out null/undefined/empty labels
      .map((item) => {
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

        return { label: item[groupColumn], segments };
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
  selector: 'app-caseiq-p2p-expand-dialog',
  template: `
    <div class="expand-dialog-container">
      <div class="expand-header">
        <h2 mat-dialog-title>
          {{
            chartType === 'CATEGORY'
              ? 'Category Analysis'
              : 'Core Issue Analysis'
          }}
          - P2P Team
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
                No. of cases shown below: {{ data.visibleCategoryTotal }}/
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
              canvasId="p2pExpandCategoryChart"
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
                No. of cases shown below: {{ data.visibleCoreIssueTotal }}/
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
              canvasId="p2pExpandCoreIssueChart"
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
export class CaseiqP2pExpandDialogComponent {
  chartType: 'CATEGORY' | 'CORE_ISSUE';

  constructor(
    public dialogRef: MatDialogRef<CaseiqP2pExpandDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.chartType = data.chartType;
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
