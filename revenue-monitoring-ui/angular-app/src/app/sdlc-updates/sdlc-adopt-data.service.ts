import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiHttpService } from '../providers/http.service';
import { DestroyManager } from '../providers/destroy-manager.service';

export interface EntityCell {
  status: string;
  pct: string;
}

export interface SdlcAdoptRow {
  dataId?: number;
  workstream: string;
  component: string;
  pm: EntityCell;
  om: EntityCell;
  sm: EntityCell;
  i2c: EntityCell;
  p2p: EntityCell;
  fpp: EntityCell;
  ait: EntityCell;
  capital: EntityCell;
  sortOrder: number;
}

export interface SdlcAdoptVersion {
  versionId: number;
  sprintName: string;
  createdBy: string;
  createdAt: string;
  notes: string;
}

export interface SdlcAdoptCurrent {
  version: SdlcAdoptVersion;
  rows: SdlcAdoptRow[];
}

export interface SdlcAdoptGroup {
  workstream: string;
  rows: SdlcAdoptRow[];
}

@Injectable({ providedIn: 'root' })
export class SdlcAdoptDataService {
  constructor(private http: ApiHttpService) {}

  getCurrent(dm: DestroyManager): Observable<SdlcAdoptCurrent> {
    return this.http
      .get('sdlc/adopt/current', dm)
      .pipe(map((res: any) => this.mapCurrentResponse(res)));
  }

  getArchive(dm: DestroyManager): Observable<SdlcAdoptVersion[]> {
    return this.http
      .get('sdlc/adopt/archive', dm)
      .pipe(map((res: any) => (res || []).map((v: any) => this.mapVersion(v))));
  }

  getVersions(
    dm: DestroyManager,
    page: number,
    size: number,
  ): Observable<{ versions: SdlcAdoptVersion[]; totalCount: number }> {
    return this.http
      .get(`sdlc/adopt/versions?page=${page}&size=${size}`, dm)
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
  ): Observable<SdlcAdoptCurrent> {
    return this.http
      .get(`sdlc/adopt/version/${versionId}`, dm)
      .pipe(map((res: any) => this.mapCurrentResponse(res)));
  }

  save(data: {
    username: string;
    sprintName: string;
    notes: string;
    rows: SdlcAdoptRow[];
  }): Observable<any> {
    const payload = {
      username: data.username,
      sprintName: data.sprintName,
      notes: data.notes,
      rows: data.rows.map((r) => ({
        workstream: r.workstream,
        component: r.component,
        pmStatus: r.pm.status,
        pmPct: r.pm.pct,
        omStatus: r.om.status,
        omPct: r.om.pct,
        smStatus: r.sm.status,
        smPct: r.sm.pct,
        i2cStatus: r.i2c.status,
        i2cPct: r.i2c.pct,
        p2pStatus: r.p2p.status,
        p2pPct: r.p2p.pct,
        fppStatus: r.fpp.status,
        fppPct: r.fpp.pct,
        aitStatus: r.ait.status,
        aitPct: r.ait.pct,
        capitalStatus: r.capital.status,
        capitalPct: r.capital.pct,
        sortOrder: r.sortOrder,
      })),
    };
    return this.http.post('sdlc/adopt/save', payload);
  }

  groupByWorkstream(rows: SdlcAdoptRow[]): SdlcAdoptGroup[] {
    const groups: SdlcAdoptGroup[] = [];
    const seen = new Map<string, SdlcAdoptGroup>();
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

  private mapCurrentResponse(res: any): SdlcAdoptCurrent {
    const version = this.mapVersion(res.version || res);
    const rows = (res.rows || []).map((r: any) => this.mapRow(r));
    return { version, rows };
  }

  private mapVersion(v: any): SdlcAdoptVersion {
    return {
      versionId: v.versionId ?? v.VERSION_ID,
      sprintName: v.sprintName ?? v.SPRINT_NAME ?? '',
      createdBy: v.createdBy ?? v.CREATED_BY ?? '',
      createdAt: v.createdAt ?? v.CREATED_AT ?? '',
      notes: v.notes ?? v.NOTES ?? '',
    };
  }

  private mapRow(r: any): SdlcAdoptRow {
    return {
      dataId: r.dataId ?? r.DATA_ID,
      workstream: r.workstream ?? r.WORKSTREAM ?? '',
      component: r.component ?? r.COMPONENT ?? '',
      pm: {
        status: r.pmStatus ?? r.PM_STATUS ?? 'NA',
        pct: r.pmPct ?? r.PM_PCT ?? '',
      },
      om: {
        status: r.omStatus ?? r.OM_STATUS ?? 'NA',
        pct: r.omPct ?? r.OM_PCT ?? '',
      },
      sm: {
        status: r.smStatus ?? r.SM_STATUS ?? 'NA',
        pct: r.smPct ?? r.SM_PCT ?? '',
      },
      i2c: {
        status: r.i2cStatus ?? r.I2C_STATUS ?? 'NA',
        pct: r.i2cPct ?? r.I2C_PCT ?? '',
      },
      p2p: {
        status: r.p2pStatus ?? r.P2P_STATUS ?? 'NA',
        pct: r.p2pPct ?? r.P2P_PCT ?? '',
      },
      fpp: {
        status: r.fppStatus ?? r.FPP_STATUS ?? 'NA',
        pct: r.fppPct ?? r.FPP_PCT ?? '',
      },
      ait: {
        status: r.aitStatus ?? r.AIT_STATUS ?? 'NA',
        pct: r.aitPct ?? r.AIT_PCT ?? '',
      },
      capital: {
        status: r.capitalStatus ?? r.CAPITAL_STATUS ?? 'NA',
        pct: r.capitalPct ?? r.CAPITAL_PCT ?? '',
      },
      sortOrder: r.sortOrder ?? r.SORT_ORDER ?? 0,
    };
  }
}
