import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { MatTab } from '@angular/material/tabs';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-esp-case-analyzer',
  templateUrl: './esp-case-analyzer.component.html',
  styleUrl: './esp-case-analyzer.component.css',
})
export class EspCaseAnalyzerComponent implements OnInit {
  constructor(http: ApiHttpService) {
    this.http = http;
  }
  protected http: ApiHttpService;
  displayedColumnsForCaseSummary: string[] = [];
  caseMetricsSummary: CaseMetricsSummary[] = [];
  dataSourceforCaseSummary: any;

  ngOnInit(): void {
    this.getCaseMetricsSummary();
  }

  getCaseMetricsSummary() {
    this.http.get('case-service-metrics-summary').subscribe((data: any) => {
      if (data.length > 0) {
        this.displayedColumnsForCaseSummary = Object.keys(data[0]);
        this.removeColumns([
          'IS_ACTIVE',
          'CREATED_BY',
          'LAST_UPDATED_BY',
          'CREATED_TIME',
          'LAST_UPDATED_TIME',
        ]);
      }
      this.caseMetricsSummary = data;
      console.log(this.caseMetricsSummary);
      this.dataSourceforCaseSummary =
        new MatTableDataSource<CaseMetricsSummary>(this.caseMetricsSummary);
    });
  }

  removeColumns(columnsToRemove: string[]) {
    this.displayedColumnsForCaseSummary =
      this.displayedColumnsForCaseSummary.filter(
        (column) => !columnsToRemove.includes(column)
      );
  }

  removeUnderscores(key: string): string {
    return key.replace(/_/g, ' ');
  }
}

interface CaseMetricsSummary {
  BACKLOG: string;
  CANCELLED: string;
  CREATED_BY: string;
  CREATED_TIME: string;
  ESCALATED: string;
  IS_ACTIVE: string;
  LAST_UPDATED_BY: string;
  LAST_UPDATED_TIME: string;
  MTTR: string;
  RESOLVED: string;
  ROUTED_OUT: string;
  SERVICE_INCIDENT: string;
  SERVICE_OFFERING: string;
  SERVICE_REQUEST: string;
}
