import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ApiHttpService } from 'src/app/providers/http.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { StackedBarChartDataPoint } from 'src/app/components/bar-chart/bar-chart.component';
import { CaseiqTableComponent } from 'src/app/components/caseiq-table/caseiq-table.component';

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
})
export class CaseiqAitComponent implements OnInit {
  @ViewChild('aitTable') aitTable!: CaseiqTableComponent;

  constructor(
    private readonly http: ApiHttpService,
    private readonly destroyManager: DestroyManager
  ) {}

  i2cChartData: StackedBarChartDataPoint[] = [];
  i2cSimpleChartData: StackedBarChartDataPoint[] = [];

  categoryAccuracy: number | string = '-';
  coreIssueAccuracy: number | string = '-';
  totalCases: number | string = '-';

  i2cTableData = new MatTableDataSource<any>([]);
  i2cTableColumns: string[] = [];
  totalRecords: number = 0;

  ngOnInit(): void {
    this.getXxcaseiqValidatedCasesAccuracyV();
    this.getXxcaseiqCategoryGraphVAit();
    this.getXxcaseiqCoreIssueGraphVAit();
    this.getXxcaseiqAitCaseDetailsV();
  }

  getXxcaseiqCategoryGraphVAit() {
    this.http
      .get('xxcaseiq-category-graph-v-ait', this.destroyManager)
      .subscribe((data: any) => {
        console.log('xxcaseiqCategoryGraphVAit:', data);

        // Filter out data points with count <= 10
        const filteredData = data.filter(
          (item: any) => item.CATEGORY_COUNT > 10
        );

        this.i2cChartData = this.transformMatchStatusData(
          filteredData,
          'CATEGORY',
          'CATEGORY_COUNT'
        );
      });
  }

  getXxcaseiqCoreIssueGraphVAit() {
    this.http
      .get('xxcaseiq-core-issue-graph-v-ait', this.destroyManager)
      .subscribe((data: any) => {
        console.log('xxcaseiqCoreIssueGraphVAit:', data);

        // Filter out data points with count <= 10
        const filteredData = data.filter(
          (item: any) => item.CORE_ISSUE_COUNT > 10
        );

        this.i2cSimpleChartData = this.transformMatchStatusData(
          filteredData,
          'CORE_ISSUE',
          'CORE_ISSUE_COUNT'
        );
      });
  }

  getXxcaseiqAitCaseDetailsV() {
    this.http
      .get('xxcaseiq-ait-case-details-v', this.destroyManager)
      .subscribe((data: any) => {
        this.updateTableData(data);
      });
  }

  getXxcaseiqValidatedCasesAccuracyV() {
    this.http
      .get('xxcaseiq-validated-cases-accuracy-v', this.destroyManager)
      .subscribe((data: any) => {
        this.updateAitMetrics(data);
      });
  }

  /**
   * Updates table data and columns from API response
   * Dynamically sets columns based on the first record's keys
   */
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

  /**
   * Updates AIT metrics from API data
   * Finds the AIT team data and sets the component properties
   */
  private updateAitMetrics(apiData: AitAccuracyData[]): void {
    if (Array.isArray(apiData)) {
      const aitData = apiData.find(
        (item) => item.TEAM_NAME && item.TEAM_NAME.toLowerCase() === 'ait'
      );

      if (aitData) {
        this.categoryAccuracy = aitData['Category Accuracy'] ?? '-';
        this.coreIssueAccuracy = aitData['Core Issue Accuracy'] ?? '-';
        this.totalCases = aitData['Total Cases'] ?? '-';
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
      return [];
    }

    // Group data by the specified column
    const groups = apiData.reduce((acc, item) => {
      const key = item[groupColumn];
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    // Transform to stacked bar chart format
    const chartData = Object.keys(groups).map((groupKey) => {
      const segments = groups[groupKey].map((item) => ({
        name: item.MATCH_STATUS,
        value: item[countColumn],
        color: this.getMatchStatusColor(item.MATCH_STATUS),
      }));

      return { label: groupKey, segments };
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
