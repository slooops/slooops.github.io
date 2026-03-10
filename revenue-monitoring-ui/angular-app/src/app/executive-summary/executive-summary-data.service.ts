import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiHttpService } from '../providers/http.service';
import { DestroyManager } from '../providers/destroy-manager.service';

export interface ExecSummaryRow {
  dataId?: number;
  sdlcTrack: string;
  highlights: string;
  watchAreas: string;
  sortOrder: number;
}

export interface ExecSummaryVersion {
  versionId: number;
  sprintName: string;
  createdBy: string;
  createdAt: string;
  notes: string;
}

export interface ExecSummaryCurrent {
  version: ExecSummaryVersion;
  rows: ExecSummaryRow[];
}

export interface ExecEditorInfo {
  cecUsername: string;
  displayName: string;
  roleLevel: 'ADMIN' | 'OWNER';
  tableScope: string;
}

@Injectable({ providedIn: 'root' })
export class ExecSummaryDataService {
  constructor(private http: ApiHttpService) {}

  getCurrent(dm: DestroyManager): Observable<ExecSummaryCurrent> {
    return this.http
      .get('exec-summary/current', dm)
      .pipe(map((res: any) => this.mapCurrentResponse(res)));
  }

  getVersions(
    dm: DestroyManager,
    page: number,
    size: number,
  ): Observable<{ versions: ExecSummaryVersion[]; totalCount: number }> {
    return this.http
      .get(`exec-summary/versions?page=${page}&size=${size}`, dm)
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
  ): Observable<ExecSummaryCurrent> {
    return this.http
      .get(`exec-summary/version/${versionId}`, dm)
      .pipe(map((res: any) => this.mapCurrentResponse(res)));
  }

  getEditorInfo(
    dm: DestroyManager,
    username: string,
  ): Observable<ExecEditorInfo | null> {
    return this.http
      .get(
        `scorecard/editors?username=${encodeURIComponent(username)}&scope=EXEC_SUMMARY`,
        dm,
      )
      .pipe(
        map((res: any) => {
          if (!res || !res.cecUsername) return null;
          return {
            cecUsername: res.cecUsername || res.CEC_USERNAME,
            displayName: res.displayName || res.DISPLAY_NAME,
            roleLevel: res.roleLevel || res.ROLE_LEVEL,
            tableScope: res.tableScope || res.TABLE_SCOPE,
          } as ExecEditorInfo;
        }),
      );
  }

  save(data: {
    username: string;
    sprintName: string;
    notes: string;
    rows: ExecSummaryRow[];
  }): Observable<any> {
    return this.http.post('exec-summary/save', data);
  }

  /** Split bullet text into lines for display */
  splitBullets(text: string): string[] {
    if (!text) return [];
    return text.split('\n').filter((l) => l.trim().length > 0);
  }

  private mapCurrentResponse(res: any): ExecSummaryCurrent {
    const version = this.mapVersion(res.version || res);
    const rows = (res.rows || []).map((r: any) => this.mapRow(r));
    return { version, rows };
  }

  private mapVersion(v: any): ExecSummaryVersion {
    return {
      versionId: v.versionId ?? v.VERSION_ID,
      sprintName: v.sprintName ?? v.SPRINT_NAME ?? '',
      createdBy: v.createdBy ?? v.CREATED_BY ?? '',
      createdAt: v.createdAt ?? v.CREATED_AT ?? '',
      notes: v.notes ?? v.NOTES ?? '',
    };
  }

  private mapRow(r: any): ExecSummaryRow {
    return {
      dataId: r.dataId ?? r.DATA_ID,
      sdlcTrack: r.sdlcTrack ?? r.SDLC_TRACK ?? '',
      highlights: r.highlights ?? r.HIGHLIGHTS ?? '',
      watchAreas: r.watchAreas ?? r.WATCH_AREAS ?? '',
      sortOrder: r.sortOrder ?? r.SORT_ORDER ?? 0,
    };
  }
}
