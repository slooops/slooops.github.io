import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiHttpService } from '../providers/http.service';
import { DestroyManager } from '../providers/destroy-manager.service';

export interface ScorecardRow {
  dataId?: number;
  workstream: string;
  successCriteria: string;
  baseline: string;
  owners: string;
  eocy26Target: string;
  howWeMeasure: string;
  metric: string;
  sortOrder: number;
}

export interface ScorecardVersion {
  versionId: number;
  sprintName: string;
  createdBy: string;
  createdAt: string;
  notes: string;
}

export interface ScorecardCurrent {
  version: ScorecardVersion;
  rows: ScorecardRow[];
}

export interface WorkstreamGroup {
  workstream: string;
  rows: ScorecardRow[];
}

@Injectable({ providedIn: 'root' })
export class ScorecardDataService {
  constructor(private http: ApiHttpService) {}

  getCurrent(dm: DestroyManager): Observable<ScorecardCurrent> {
    return this.http
      .get('scorecard/current', dm)
      .pipe(map((res: any) => this.mapCurrentResponse(res)));
  }

  getVersions(
    dm: DestroyManager,
    page: number,
    size: number,
  ): Observable<{ versions: ScorecardVersion[]; totalCount: number }> {
    return this.http
      .get(`scorecard/versions?page=${page}&size=${size}`, dm)
      .pipe(
        map((res: any) => ({
          versions: (res.versions || []).map((v: any) => this.mapVersion(v)),
          totalCount: res.totalCount || 0,
        })),
      );
  }

  getVersion(
    dm: DestroyManager,
    versionId: number,
  ): Observable<ScorecardCurrent> {
    return this.http
      .get(`scorecard/version/${versionId}`, dm)
      .pipe(map((res: any) => this.mapCurrentResponse(res)));
  }

  save(data: {
    username: string;
    sprintName: string;
    notes: string;
    rows: ScorecardRow[];
  }): Observable<any> {
    return this.http.post('scorecard/save', data);
  }

  groupByWorkstream(rows: ScorecardRow[]): WorkstreamGroup[] {
    const groups: WorkstreamGroup[] = [];
    const seen = new Map<string, WorkstreamGroup>();
    for (const row of rows) {
      let group = seen.get(row.workstream);
      if (!group) {
        group = { workstream: row.workstream, rows: [] };
        seen.set(row.workstream, group);
        groups.push(group);
      }
      group.rows.push(row);
    }
    return groups;
  }

  private mapCurrentResponse(res: any): ScorecardCurrent {
    const version = this.mapVersion(res.version || res);
    const rows = (res.rows || []).map((r: any) => this.mapRow(r));
    return { version, rows };
  }

  private mapVersion(v: any): ScorecardVersion {
    return {
      versionId: v.versionId ?? v.VERSION_ID,
      sprintName: v.sprintName ?? v.SPRINT_NAME ?? '',
      createdBy: v.createdBy ?? v.CREATED_BY ?? '',
      createdAt: v.createdAt ?? v.CREATED_AT ?? '',
      notes: v.notes ?? v.NOTES ?? '',
    };
  }

  private mapRow(r: any): ScorecardRow {
    return {
      dataId: r.dataId ?? r.DATA_ID,
      workstream: r.workstream ?? r.WORKSTREAM ?? '',
      successCriteria: r.successCriteria ?? r.SUCCESS_CRITERIA ?? '',
      baseline: r.baseline ?? r.BASELINE ?? '',
      owners: r.owners ?? r.OWNERS ?? '',
      eocy26Target: r.eocy26Target ?? r.EOCY26_TARGET ?? '',
      howWeMeasure: r.howWeMeasure ?? r.HOW_WE_MEASURE ?? '',
      metric: r.metric ?? r.METRIC ?? '',
      sortOrder: r.sortOrder ?? r.SORT_ORDER ?? 0,
    };
  }
}
