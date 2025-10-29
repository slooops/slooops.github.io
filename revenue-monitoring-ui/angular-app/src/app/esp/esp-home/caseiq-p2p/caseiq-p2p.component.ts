import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ApiHttpService } from 'src/app/providers/http.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { StackedBarChartDataPoint } from 'src/app/components/bar-chart/bar-chart.component';
import { CaseiqTableComponent } from 'src/app/components/caseiq-table/caseiq-table.component';

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
    this.getXxcaseiqCategoryGraphVP2p();
    this.getXxcaseiqCoreIssueGraphVP2p();
    this.getXxcaseiqP2pCaseDetailsV();
  }

  getXxcaseiqCategoryGraphVP2p() {
    this.http
      .get('xxcaseiq-category-graph-v-p2p', this.destroyManager)
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
      });
  }

  getXxcaseiqCoreIssueGraphVP2p() {
    this.http
      .get('xxcaseiq-core-issue-graph-v-p2p', this.destroyManager)
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
}
