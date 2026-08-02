import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiHttpService } from '../../providers/http.service';
import { DestroyManager } from '../../providers/destroy-manager.service';
import {
  HealthOverview,
  AnomalyItem,
  StatusDistribution,
  TeamSummary,
  ThroughputEntry,
  ErrorCategory,
  TeamIssueMatrixEntry,
  IssueTrendEntry,
  P90ProcessingTime,
  ErrorIncidentsPage,
} from './caseiq-monitoring.models';

@Injectable({ providedIn: 'root' })
export class CaseiqMonitoringDataService {
  private base = 'caseiq';

  constructor(private http: ApiHttpService) {}

  private qp(lookbackHours: number, fiscQtr?: string): string {
    let q = `lookbackHours=${lookbackHours}`;
    if (fiscQtr) q += `&fiscQtr=${fiscQtr}`;
    return q;
  }

  getHealth(
    dm: DestroyManager,
    lookbackHours: number,
    fiscQtr?: string,
  ): Observable<HealthOverview> {
    return this.http
      .get(`${this.base}/health?${this.qp(lookbackHours, fiscQtr)}`, dm)
      .pipe(map((res: any) => res as HealthOverview));
  }

  getGhostSuccess(
    dm: DestroyManager,
    lookbackHours: number,
    fiscQtr?: string,
  ): Observable<AnomalyItem[]> {
    return this.http
      .get(
        `${this.base}/anomalies/ghost-success?${this.qp(lookbackHours, fiscQtr)}`,
        dm,
      )
      .pipe(map((res: any) => res as AnomalyItem[]));
  }

  getNullStatus(
    dm: DestroyManager,
    lookbackHours: number,
    fiscQtr?: string,
  ): Observable<AnomalyItem[]> {
    return this.http
      .get(
        `${this.base}/anomalies/null-status?${this.qp(lookbackHours, fiscQtr)}`,
        dm,
      )
      .pipe(map((res: any) => res as AnomalyItem[]));
  }

  getNotDefined(
    dm: DestroyManager,
    lookbackHours: number,
    fiscQtr?: string,
  ): Observable<AnomalyItem[]> {
    return this.http
      .get(
        `${this.base}/anomalies/not-defined?${this.qp(lookbackHours, fiscQtr)}`,
        dm,
      )
      .pipe(map((res: any) => res as AnomalyItem[]));
  }

  getExceptions(
    dm: DestroyManager,
    lookbackHours: number,
    fiscQtr?: string,
  ): Observable<AnomalyItem[]> {
    return this.http
      .get(
        `${this.base}/anomalies/exceptions?${this.qp(lookbackHours, fiscQtr)}`,
        dm,
      )
      .pipe(map((res: any) => res as AnomalyItem[]));
  }

  getNullClassification(
    dm: DestroyManager,
    lookbackHours: number,
    fiscQtr?: string,
  ): Observable<AnomalyItem[]> {
    return this.http
      .get(
        `${this.base}/anomalies/null-classification?${this.qp(lookbackHours, fiscQtr)}`,
        dm,
      )
      .pipe(map((res: any) => res as AnomalyItem[]));
  }

  getUnknownTeam(
    dm: DestroyManager,
    lookbackHours: number,
    fiscQtr?: string,
  ): Observable<AnomalyItem[]> {
    return this.http
      .get(
        `${this.base}/anomalies/unknown-team?${this.qp(lookbackHours, fiscQtr)}`,
        dm,
      )
      .pipe(map((res: any) => res as AnomalyItem[]));
  }

  getResolutionErrors(
    dm: DestroyManager,
    lookbackHours: number,
    fiscQtr?: string,
  ): Observable<AnomalyItem[]> {
    return this.http
      .get(
        `${this.base}/anomalies/resolution-errors?${this.qp(lookbackHours, fiscQtr)}`,
        dm,
      )
      .pipe(map((res: any) => res as AnomalyItem[]));
  }

  getResolutionDistribution(
    dm: DestroyManager,
    lookbackHours: number,
    fiscQtr?: string,
  ): Observable<StatusDistribution[]> {
    return this.http
      .get(
        `${this.base}/status/resolution?${this.qp(lookbackHours, fiscQtr)}`,
        dm,
      )
      .pipe(map((res: any) => res as StatusDistribution[]));
  }

  getTeamSummary(
    dm: DestroyManager,
    lookbackHours: number,
    fiscQtr?: string,
  ): Observable<TeamSummary[]> {
    return this.http
      .get(
        `${this.base}/volume/team-summary?${this.qp(lookbackHours, fiscQtr)}`,
        dm,
      )
      .pipe(map((res: any) => res as TeamSummary[]));
  }

  getThroughput(
    dm: DestroyManager,
    lookbackHours: number,
    fiscQtr?: string,
  ): Observable<ThroughputEntry[]> {
    return this.http
      .get(
        `${this.base}/performance/throughput?${this.qp(lookbackHours, fiscQtr)}`,
        dm,
      )
      .pipe(map((res: any) => res as ThroughputEntry[]));
  }

  getTopErrors(
    dm: DestroyManager,
    lookbackHours: number,
    fiscQtr?: string,
  ): Observable<ErrorCategory[]> {
    return this.http
      .get(
        `${this.base}/volume/top-errors?${this.qp(lookbackHours, fiscQtr)}`,
        dm,
      )
      .pipe(map((res: any) => res as ErrorCategory[]));
  }

  getTeamIssueMatrix(
    dm: DestroyManager,
    lookbackHours: number,
    fiscQtr?: string,
  ): Observable<TeamIssueMatrixEntry[]> {
    return this.http
      .get(
        `${this.base}/anomalies/team-issue-matrix?${this.qp(lookbackHours, fiscQtr)}`,
        dm,
      )
      .pipe(map((res: any) => res as TeamIssueMatrixEntry[]));
  }

  getIssueTrend(
    dm: DestroyManager,
    team: string,
    issueType: string,
    fiscQtr?: string,
  ): Observable<IssueTrendEntry[]> {
    let q = `team=${encodeURIComponent(team)}&issueType=${encodeURIComponent(issueType)}`;
    if (fiscQtr) q += `&fiscQtr=${fiscQtr}`;
    return this.http
      .get(`${this.base}/anomalies/issue-trend?${q}`, dm)
      .pipe(map((res: any) => res as IssueTrendEntry[]));
  }

  getP90Time(
    dm: DestroyManager,
    lookbackHours: number,
    fiscQtr?: string,
  ): Observable<P90ProcessingTime> {
    return this.http
      .get(
        `${this.base}/performance/p90-time?${this.qp(lookbackHours, fiscQtr)}`,
        dm,
      )
      .pipe(map((res: any) => res as P90ProcessingTime));
  }

  getErrorIncidentsPaged(
    dm: DestroyManager,
    lookbackHours: number,
    page: number,
    pageSize: number,
    fiscQtr?: string,
    team?: string,
    issueType?: string,
  ): Observable<ErrorIncidentsPage> {
    let q = this.qp(lookbackHours, fiscQtr);
    q += `&page=${page}&pageSize=${pageSize}`;
    if (team) q += `&team=${encodeURIComponent(team)}`;
    if (issueType) q += `&issueType=${encodeURIComponent(issueType)}`;
    return this.http
      .get(`${this.base}/anomalies/incidents-paged?${q}`, dm)
      .pipe(map((res: any) => res as ErrorIncidentsPage));
  }

  getQuarters(dm: DestroyManager): Observable<string[]> {
    return this.http
      .get(`${this.base}/quarters`, dm)
      .pipe(map((res: any) => res as string[]));
  }
}
