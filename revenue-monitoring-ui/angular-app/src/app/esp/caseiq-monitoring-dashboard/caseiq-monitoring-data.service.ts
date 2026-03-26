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
}
