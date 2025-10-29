import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ApiHttpService } from 'src/app/providers/http.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { StackedBarChartDataPoint } from 'src/app/components/bar-chart/bar-chart.component';
import { CaseiqTableComponent } from 'src/app/components/caseiq-table/caseiq-table.component';

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
})
export class CaseiqFppComponent implements OnInit {
  @ViewChild('fppTable') fppTable!: CaseiqTableComponent;

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
    this.getXxcaseiqCategoryGraphVFpp();
    this.getXxcaseiqCoreIssueGraphVFpp();
    this.getXxcaseiqFppCaseDetailsV();
  }

  getXxcaseiqCategoryGraphVFpp() {
    this.http
      .get('xxcaseiq-category-graph-v-fpp', this.destroyManager)
      .subscribe((data: any) => {
        console.log('xxcaseiqCategoryGraphVFpp:', data);

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

  getXxcaseiqCoreIssueGraphVFpp() {
    this.http
      .get('xxcaseiq-core-issue-graph-v-fpp', this.destroyManager)
      .subscribe((data: any) => {
        console.log('xxcaseiqCoreIssueGraphVFpp:', data);

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

  getXxcaseiqFppCaseDetailsV() {
    this.http
      .get('xxcaseiq-fpp-case-details-v', this.destroyManager)
      .subscribe((data: any) => {
        this.updateTableData(data);
      });
  }

  getXxcaseiqValidatedCasesAccuracyV() {
    this.http
      .get('xxcaseiq-validated-cases-accuracy-v', this.destroyManager)
      .subscribe((data: any) => {
        console.log(data);
        this.updateFppMetrics(data);
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
