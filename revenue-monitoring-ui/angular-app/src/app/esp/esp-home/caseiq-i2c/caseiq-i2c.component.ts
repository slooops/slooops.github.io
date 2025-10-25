import { Component, OnInit, ViewChild } from '@angular/core';
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

  categoryAccuracy: number | string = '-';
  coreIssueAccuracy: number | string = '-';
  totalCases: number | string = '-';

  i2cTableData = new MatTableDataSource<any>([]);
  i2cTableColumns: string[] = [];
  totalRecords: number = 0;

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

        // Filter out data points with count <= 10
        const filteredData = data.filter(
          (item: any) => item.CATEGORY_COUNT > 10
        );

        this.i2cChartData = this.transformMatchStatusData(
          filteredData,
          'CATEGORY',
          'CATEGORY_COUNT'
        );

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

        // Filter out data points with count <= 10
        const filteredData = data.filter(
          (item: any) => item.CORE_ISSUE_COUNT > 10
        );

        this.i2cSimpleChartData = this.transformMatchStatusData(
          filteredData,
          'CORE_ISSUE',
          'CORE_ISSUE_COUNT'
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
          <h3 class="subheading">Category – {{ data.categoryAccuracy }}%</h3>
          <div class="chart-frame">
            <app-bar-chart
              [data]="data.categoryData"
              [stacked]="true"
              [isLoading]="false"
              [chartHeight]="510"
              canvasId="expandedCategoryChart"
            ></app-bar-chart>
          </div>
        </div>
        <div class="expand-chart-block" *ngIf="data.type === 'CORE_ISSUE'">
          <h3 class="subheading">Core Issue – {{ data.coreIssueAccuracy }}%</h3>
          <div class="chart-frame">
            <app-bar-chart
              [data]="data.coreIssueData"
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
}
