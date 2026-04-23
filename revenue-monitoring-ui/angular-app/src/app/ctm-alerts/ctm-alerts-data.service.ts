import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiHttpService } from '../providers/http.service';
import { DestroyManager } from '../providers/destroy-manager.service';

export interface CtmAlertRow {
  ID: number;
  CTM_JOB_ID: string;
  JOB_NAME: string;
  APPLICATION: string;
  SUB_APPLICATION: string;
  RETURN_CODE: number | null;
  ALERT_TIME: string;
  ALERT_TYPE: string;
  STATUS: string;
  PRIORITY: string;
  CATEGORY: string | null;
  ACTIVITY_PHASE: string | null;
  SERVER: string;
  ORDER_DATE: string;
  START_TIME: string;
  END_TIME: string | null;
  RUN_TIME_SEC: number | null;
  DOWNSTREAM_BLOCKED_COUNT: number | null;
  DOWNSTREAM_BLOCKED_JOBS: string | null;
  JOB_COMMAND: string | null;
  JOB_LOG: string | null;
  JOB_OUTPUT: string | null;
}

export interface CtmSummary {
  TOTAL: number;
  PENDING: number;
  RESOLVED: number;
  FAILED: number;
  DELAYED: number;
  LATE_START: number;
  P1: number;
  P2: number;
  P3: number;
  P4: number;
}

export interface CtmDistribution {
  ALERT_TYPE?: string;
  PRIORITY_LEVEL?: string;
  CNT: number;
  PCT: number;
}

export interface CtmDownstreamBlocked {
  JOB_NAME: string;
  APPLICATION: string;
  DOWNSTREAM_BLOCKED_COUNT: number;
  ALERT_TYPE: string;
  STATUS: string;
}

export interface CtmApplicationBreakdown {
  APPLICATION: string;
  TOTAL: number;
  PENDING: number;
  RESOLVED: number;
  FAILED: number;
  DELAYED: number;
  LATE_START: number;
}

export interface CtmHourlyTrend {
  ALERT_HOUR: string;
  TOTAL_ALERTS: number;
  FAILED_COUNT: number;
  DELAYED_COUNT: number;
  LATE_START_COUNT: number;
}

@Injectable({ providedIn: 'root' })
export class CtmAlertsDataService {
  private readonly base = 'ctm-alerts';

  constructor(private readonly http: ApiHttpService) {}

  getAllAlerts(dm: DestroyManager): Observable<CtmAlertRow[]> {
    return this.http
      .get(`${this.base}/all`, dm)
      .pipe(map((res: any) => res as CtmAlertRow[]));
  }

  getSummary(dm: DestroyManager): Observable<CtmSummary> {
    return this.http
      .get(`${this.base}/summary`, dm)
      .pipe(map((res: any) => (res as CtmSummary[])[0]));
  }

  getAlertTypeDistribution(dm: DestroyManager): Observable<CtmDistribution[]> {
    return this.http
      .get(`${this.base}/by-type`, dm)
      .pipe(map((res: any) => res as CtmDistribution[]));
  }

  getPriorityDistribution(dm: DestroyManager): Observable<CtmDistribution[]> {
    return this.http
      .get(`${this.base}/by-priority`, dm)
      .pipe(map((res: any) => res as CtmDistribution[]));
  }

  getTopDownstreamBlocked(
    dm: DestroyManager,
  ): Observable<CtmDownstreamBlocked[]> {
    return this.http
      .get(`${this.base}/top-downstream`, dm)
      .pipe(map((res: any) => res as CtmDownstreamBlocked[]));
  }

  getApplicationBreakdown(
    dm: DestroyManager,
  ): Observable<CtmApplicationBreakdown[]> {
    return this.http
      .get(`${this.base}/by-application`, dm)
      .pipe(map((res: any) => res as CtmApplicationBreakdown[]));
  }

  getHourlyTrend(dm: DestroyManager): Observable<CtmHourlyTrend[]> {
    return this.http
      .get(`${this.base}/hourly-trend`, dm)
      .pipe(map((res: any) => res as CtmHourlyTrend[]));
  }
}
