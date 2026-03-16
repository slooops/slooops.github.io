import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiHttpService } from '../providers/http.service';
import { DestroyManager } from '../providers/destroy-manager.service';

export interface SdlcExecRow {
  dataId?: number;
  workstream: string;
  component: string;
  scope: string;
  sprintUpdate: string;
  status: string;
  sortOrder: number;
}

export interface SdlcExecVersion {
  versionId: number;
  sprintName: string;
  createdBy: string;
  createdAt: string;
  notes: string;
}

export interface SdlcExecCurrent {
  version: SdlcExecVersion;
  rows: SdlcExecRow[];
}

export interface SdlcExecGroup {
  workstream: string;
  rows: SdlcExecRow[];
}

@Injectable({ providedIn: 'root' })
export class SdlcExecDataService {
  constructor(private http: ApiHttpService) {}

  getCurrent(dm: DestroyManager): Observable<SdlcExecCurrent> {
    return this.http
      .get('sdlc/exec/current', dm)
      .pipe(map((res: any) => this.mapCurrentResponse(res)));
  }

  getVersions(
    dm: DestroyManager,
    page: number,
    size: number,
  ): Observable<{ versions: SdlcExecVersion[]; totalCount: number }> {
    return this.http
      .get(`sdlc/exec/versions?page=${page}&size=${size}`, dm)
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
  ): Observable<SdlcExecCurrent> {
    return this.http
      .get(`sdlc/exec/version/${versionId}`, dm)
      .pipe(map((res: any) => this.mapCurrentResponse(res)));
  }

  save(data: {
    username: string;
    sprintName: string;
    notes: string;
    rows: SdlcExecRow[];
  }): Observable<any> {
    return this.http.post('sdlc/exec/save', data);
  }

  groupByWorkstream(rows: SdlcExecRow[]): SdlcExecGroup[] {
    const groups: SdlcExecGroup[] = [];
    const seen = new Map<string, SdlcExecGroup>();
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

  private mapCurrentResponse(res: any): SdlcExecCurrent {
    const version = this.mapVersion(res.version || res);
    const rows = (res.rows || []).map((r: any) => this.mapRow(r));
    return { version, rows };
  }

  private mapVersion(v: any): SdlcExecVersion {
    return {
      versionId: v.versionId ?? v.VERSION_ID,
      sprintName: v.sprintName ?? v.SPRINT_NAME ?? '',
      createdBy: v.createdBy ?? v.CREATED_BY ?? '',
      createdAt: v.createdAt ?? v.CREATED_AT ?? '',
      notes: v.notes ?? v.NOTES ?? '',
    };
  }

  private mapRow(r: any): SdlcExecRow {
    return {
      dataId: r.dataId ?? r.DATA_ID,
      workstream: r.workstream ?? r.WORKSTREAM ?? '',
      component: r.component ?? r.COMPONENT ?? '',
      scope: r.scope ?? r.SCOPE ?? '',
      sprintUpdate: r.sprintUpdate ?? r.SPRINT_UPDATE ?? '',
      status: r.status ?? r.STATUS ?? 'YET_TO_START',
      sortOrder: r.sortOrder ?? r.SORT_ORDER ?? 0,
    };
  }
}
