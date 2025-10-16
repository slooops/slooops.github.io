import { Component, OnInit, ViewChild } from '@angular/core';
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
    this.getVwI2cCategoryMatchStatus();
    this.getVwI2cCoreIssueMatchStatus();
    this.getXxcaseiqValidatedCasesAccuracyV();
    this.getVwI2cCaseDetails();
  }

  getVwI2cCategoryMatchStatus() {
    this.http
      .get('vw-i2c-category-match-status', this.destroyManager)
      .subscribe((data: any) => {
        console.log('vwI2cCategoryMatchStatus:', data);
        this.transformCategoryMatchData(data);
      });
  }

  getVwI2cCoreIssueMatchStatus() {
    this.http
      .get('vw-i2c-core-issue-match-status', this.destroyManager)
      .subscribe((data: any) => {
        console.log('vwI2cCoreIssueMatchStatus:', data);
        this.transformCoreIssueMatchData(data);
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

  getVwI2cCaseDetails() {
    this.http
      .get('vw-i2c-case-details', this.destroyManager)
      .subscribe((data: any) => {
        console.log('vwI2cCaseDetails:', data);
        this.updateTableData(data);
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
      this.i2cTableColumns = Object.keys(apiData[0]);

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
        this.categoryAccuracy = Math.round(i2cData.CATEGORY * 100) / 100;
        this.coreIssueAccuracy = Math.round(i2cData.CORE_ISSUE * 100) / 100;
        this.totalCases = i2cData.TOTAL_VALIDATED_CASES;
      } else {
        // No I2C data found, keep defaults
        this.categoryAccuracy = '-';
        this.coreIssueAccuracy = '-';
        this.totalCases = '-';
      }
    }
  }

  /**
   * Transforms category match status API data into stacked bar chart format
   * Groups by CATEGORY and creates segments for each MATCH_STATUS
   */
  private transformCategoryMatchData(apiData: any[]): void {
    if (!Array.isArray(apiData)) {
      console.log('No category match data to transform');
      return;
    }

    // Group data by CATEGORY
    const categoryGroups = apiData.reduce((groups, item) => {
      const category = item.CATEGORY;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    }, {} as Record<string, any[]>);

    // Transform to stacked bar chart format
    this.i2cChartData = Object.keys(categoryGroups).map((category) => {
      const segments = categoryGroups[category].map((item) => ({
        name: item.MATCH_STATUS,
        value: item.CATEGORY_COUNT,
        color: this.getMatchStatusColor(item.MATCH_STATUS),
      }));

      return {
        label: category,
        segments: segments,
      };
    });

    console.log('Transformed category match data:', this.i2cChartData);
  }

  /**
   * Returns color based on match status
   */
  private getMatchStatusColor(matchStatus: string): string {
    switch (matchStatus.toUpperCase()) {
      case 'MATCHED':
        return '#36A2EB'; // Blue for matched
      case 'NOT MATCHED':
        return '#FF6384'; // Red for not matched
      case 'ANALYZED':
        return '#FFCE56'; // Yellow for analyzed
      default:
        return '#E5E5E5'; // Gray for unknown
    }
  }

  /**
   * Transforms core issue match status API data into stacked bar chart format
   * Groups by CORE_ISSUE and creates segments for each MATCH_STATUS
   */
  private transformCoreIssueMatchData(apiData: any[]): void {
    if (!Array.isArray(apiData)) {
      console.log('No core issue match data to transform');
      return;
    }

    // Group data by CORE_ISSUE
    const coreIssueGroups = apiData.reduce((groups, item) => {
      const coreIssue = item.CORE_ISSUE;
      if (!groups[coreIssue]) {
        groups[coreIssue] = [];
      }
      groups[coreIssue].push(item);
      return groups;
    }, {} as Record<string, any[]>);

    // Transform to stacked bar chart format
    this.i2cSimpleChartData = Object.keys(coreIssueGroups).map((coreIssue) => {
      const segments = coreIssueGroups[coreIssue].map((item) => ({
        name: item.MATCH_STATUS,
        value: item.CORE_ISSUE_COUNT,
        color: this.getMatchStatusColor(item.MATCH_STATUS),
      }));

      return {
        label: coreIssue,
        segments: segments,
      };
    });

    console.log('Transformed core issue match data:', this.i2cSimpleChartData);
  }
}
