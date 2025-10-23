import { Component, OnInit, ViewChild } from '@angular/core';
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
    this.getXxcaseiqCategoryGraphVCapital();
    this.getXxcaseiqCoreIssueGraphVCapital();
    this.getXxcaseiqCapitalCaseDetailsV();
  }

  getXxcaseiqCategoryGraphVCapital() {
    this.http
      .get('xxcaseiq-category-graph-v-capital', this.destroyManager)
      .subscribe((data: any) => {
        console.log('xxcaseiqCategoryGraphVCapital:', data);

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

  getXxcaseiqCoreIssueGraphVCapital() {
    this.http
      .get('xxcaseiq-core-issue-graph-v-capital', this.destroyManager)
      .subscribe((data: any) => {
        console.log('xxcaseiqCoreIssueGraphVCapital:', data);

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

  private updateTableData(apiData: any[]): void {
    if (Array.isArray(apiData) && apiData.length > 0) {
      this.totalRecords = apiData.length;
      this.i2cTableData = new MatTableDataSource(apiData);
      this.i2cTableColumns = Object.keys(apiData[0]);
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

  private transformMatchStatusData(
    apiData: any[],
    groupColumn: string,
    countColumn: string
  ): StackedBarChartDataPoint[] {
    if (!Array.isArray(apiData)) {
      return [];
    }

    const groups = apiData.reduce((acc, item) => {
      const key = item[groupColumn];
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, any[]>);

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
