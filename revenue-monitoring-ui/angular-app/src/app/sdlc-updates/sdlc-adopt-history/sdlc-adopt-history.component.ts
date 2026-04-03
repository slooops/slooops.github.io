import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorArrowLeftBold,
  phosphorCaretLeftBold,
  phosphorCaretRightBold,
} from '@ng-icons/phosphor-icons/bold';
import { DestroyManager } from '../../providers/destroy-manager.service';
import {
  SdlcAdoptDataService,
  SdlcAdoptRow,
  SdlcAdoptVersion,
  SdlcAdoptGroup,
  EntityCell,
} from '../sdlc-adopt-data.service';
import { STATUS_OPTIONS } from '../sdlc-exec-update.component';
import { ENTITY_COLUMNS } from '../sdlc-component-adoption.component';
import { ColorPair } from '../../shared/editable-table-base';
import { MarkdownPipe } from '../../shared/markdown.pipe';

@Component({
  selector: 'app-sdlc-adopt-history',
  standalone: true,
  imports: [NgClass, NgIcon, MarkdownPipe],
  providers: [
    DestroyManager,
    provideIcons({
      phosphorArrowLeftBold,
      phosphorCaretLeftBold,
      phosphorCaretRightBold,
    }),
  ],
  templateUrl: './sdlc-adopt-history.component.html',
  styleUrls: [
    '../../shared/scorecard.css',
    '../sdlc-updates.css',
    './sdlc-adopt-history.component.css',
  ],
})
export class SdlcAdoptHistoryComponent implements OnInit, OnDestroy {
  versions: SdlcAdoptVersion[] = [];
  currentIndex = 0;
  totalCount = 0;
  page = 0;
  pageSize = 200;
  sprintFilter: string | null = null;

  selectedVersion: SdlcAdoptVersion | null = null;
  groups: SdlcAdoptGroup[] = [];
  isLoading = true;
  isLoadingData = false;
  showEmptyState = false;
  statusOptions = STATUS_OPTIONS;
  entityColumns = ENTITY_COLUMNS;
  changedCells = new Set<string>();
  private previousRows: SdlcAdoptRow[] = [];
  private emptyStateTimer: any;
  private highlightTimer: any;

  workstreamColors: Record<string, ColorPair> = {
    Foundation: { bg: '#dbeafe', accent: '#60a5fa' },
    'Requirements Authoring and Validation': {
      bg: '#ccddf5',
      accent: '#4a8ac7',
    },
    'Solution Design': { bg: '#bdd0ef', accent: '#3574b3' },
    Build: { bg: '#aec3e8', accent: '#21599d' },
    Test: { bg: '#9fb6e1', accent: '#174a8f' },
    'Production Support': { bg: '#90a9da', accent: '#0e3b81' },
  };
  defaultColor: ColorPair = { bg: '#dbeafe', accent: '#3b82f6' };

  constructor(
    private dataService: SdlcAdoptDataService,
    private dm: DestroyManager,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.emptyStateTimer = setTimeout(() => (this.showEmptyState = true), 1000);
    this.sprintFilter = this.route.snapshot.queryParamMap.get('sprint');
    const versionParam = this.route.snapshot.queryParamMap.get('version');
    if (versionParam) {
      this.loadSingleVersion(+versionParam);
    } else {
      this.loadVersions();
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.emptyStateTimer);
    clearTimeout(this.highlightTimer);
  }

  private loadSingleVersion(versionId: number): void {
    this.isLoading = false;
    this.selectedVersion = {
      versionId,
      sprintName: '',
      createdBy: '',
      createdAt: '',
      notes: '',
    };
    this.loadVersionData(versionId);
    this.dataService.getVersions(this.dm, this.page, this.pageSize).subscribe({
      next: (res) => {
        let all = res.versions;
        this.totalCount = res.totalCount;
        if (this.sprintFilter) {
          all = all.filter((v) => v.sprintName === this.sprintFilter);
        }
        this.versions = all;
        const idx = this.versions.findIndex((v) => v.versionId === versionId);
        if (idx >= 0) {
          this.currentIndex = idx;
          this.selectedVersion = this.versions[idx];
        }
      },
    });
  }

  private loadVersions(): void {
    this.isLoading = true;
    this.dataService.getVersions(this.dm, this.page, this.pageSize).subscribe({
      next: (res) => {
        let all = res.versions;
        this.totalCount = res.totalCount;
        if (this.sprintFilter) {
          all = all.filter((v) => v.sprintName === this.sprintFilter);
        }
        this.versions = all;
        this.isLoading = false;
        if (this.versions.length > 0) {
          this.selectVersion(0);
        }
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  selectVersion(index: number): void {
    if (index < 0 || index >= this.versions.length) return;
    this.currentIndex = index;
    this.selectedVersion = this.versions[index];
    this.loadVersionData(this.selectedVersion.versionId);
  }

  private loadVersionData(versionId: number): void {
    this.isLoadingData = true;
    this.dataService.getVersion(this.dm, versionId).subscribe({
      next: (data) => {
        if (data.version?.versionId) {
          this.selectedVersion = data.version;
        }
        const newRows = data.rows;
        this.computeDiff(this.previousRows, newRows);
        this.previousRows = newRows;
        this.groups = this.dataService.groupByWorkstream(newRows);
        this.isLoadingData = false;
      },
      error: () => {
        this.isLoadingData = false;
      },
    });
  }

  private computeDiff(oldRows: SdlcAdoptRow[], newRows: SdlcAdoptRow[]): void {
    clearTimeout(this.highlightTimer);
    this.changedCells.clear();
    if (oldRows.length === 0) return;
    const oldMap = new Map<number, SdlcAdoptRow>();
    for (const r of oldRows) oldMap.set(r.sortOrder, r);
    const entityKeys = this.entityColumns.map((c) => c.key);
    for (const nr of newRows) {
      const or = oldMap.get(nr.sortOrder);
      if (!or || nr.component !== or.component) {
        this.changedCells.add(`${nr.sortOrder}:component`);
      }
      for (const key of entityKeys) {
        const nc = (nr as any)[key] as EntityCell;
        const oc = or ? ((or as any)[key] as EntityCell) : null;
        if (!oc || nc.status !== oc.status || nc.pct !== oc.pct) {
          this.changedCells.add(`${nr.sortOrder}:${key}`);
        }
      }
    }
    if (this.changedCells.size > 0) {
      this.highlightTimer = setTimeout(() => this.changedCells.clear(), 4000);
    }
  }

  isCellChanged(sortOrder: number, field: string): boolean {
    return this.changedCells.has(`${sortOrder}:${field}`);
  }

  prev(): void {
    if (this.currentIndex < this.versions.length - 1) {
      this.selectVersion(this.currentIndex + 1);
    }
  }

  next(): void {
    if (this.currentIndex > 0) {
      this.selectVersion(this.currentIndex - 1);
    }
  }

  get hasPrev(): boolean {
    return this.currentIndex < this.versions.length - 1;
  }

  get hasNext(): boolean {
    return this.currentIndex > 0;
  }

  goBack(): void {
    this.router.navigate(['/sdlc-adopt/archive']);
  }

  getGroupColor(ws: string): ColorPair {
    for (const [key, color] of Object.entries(this.workstreamColors)) {
      if (ws.startsWith(key)) return color;
    }
    return this.defaultColor;
  }

  getStatusIcon(status: string): string {
    const opt = this.statusOptions.find((o) => o.value === status);
    return opt?.icon || '';
  }

  getEntityCell(row: SdlcAdoptRow, key: string): EntityCell {
    return (row as any)[key];
  }

  formatTimestamp(ts: string): string {
    if (!ts) return '';
    const d = new Date(ts);
    return (
      d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) +
      ' at ' +
      d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    );
  }

  trackByGroup(_: number, group: SdlcAdoptGroup): string {
    return group.workstream;
  }
}
