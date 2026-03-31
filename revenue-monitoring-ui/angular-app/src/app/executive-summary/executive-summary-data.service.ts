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

@Injectable({ providedIn: 'root' })
export class ExecSummaryDataService {
  constructor(private http: ApiHttpService) {}

  getCurrent(dm: DestroyManager): Observable<ExecSummaryCurrent> {
    return this.http
      .get('exec-summary/current', dm)
      .pipe(map((res: any) => this.mapCurrentResponse(res)));
  }

  getArchive(dm: DestroyManager): Observable<ExecSummaryVersion[]> {
    return this.http
      .get('exec-summary/archive', dm)
      .pipe(map((res: any) => (res || []).map((v: any) => this.mapVersion(v))));
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
