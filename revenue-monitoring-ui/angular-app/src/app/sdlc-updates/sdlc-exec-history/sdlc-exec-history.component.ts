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
  SdlcExecDataService,
  SdlcExecRow,
  SdlcExecVersion,
  SdlcExecGroup,
} from '../sdlc-exec-data.service';
import { STATUS_OPTIONS } from '../sdlc-exec-update.component';
import { ColorPair } from '../../shared/editable-table-base';

@Component({
  selector: 'app-sdlc-exec-history',
  standalone: true,
  imports: [NgClass, NgIcon],
  providers: [
    DestroyManager,
    provideIcons({
      phosphorArrowLeftBold,
      phosphorCaretLeftBold,
      phosphorCaretRightBold,
    }),
  ],
  templateUrl: './sdlc-exec-history.component.html',
  styleUrls: [
    '../../shared/scorecard.css',
    '../sdlc-updates.css',
    './sdlc-exec-history.component.css',
  ],
})
export class SdlcExecHistoryComponent implements OnInit, OnDestroy {
  versions: SdlcExecVersion[] = [];
  currentIndex = 0;
  totalCount = 0;
  page = 0;
  pageSize = 200;
  sprintFilter: string | null = null;

  selectedVersion: SdlcExecVersion | null = null;
  groups: SdlcExecGroup[] = [];
  isLoading = true;
  isLoadingData = false;
  showEmptyState = false;
  statusOptions = STATUS_OPTIONS;
  changedCells = new Set<string>();
  private previousRows: SdlcExecRow[] = [];
  private emptyStateTimer: any;
  private highlightTimer: any;

  workstreamColors: Record<string, ColorPair> = {
    Foundation: { bg: '#e6f7fa', accent: '#0891b2' },
    'Requirements Authoring and Validation': {
      bg: '#f3eefa',
      accent: '#7c3aed',
    },
    'Solution Design': { bg: '#fef0e6', accent: '#ea580c' },
    Build: { bg: '#e5f2ff', accent: '#0070d2' },
    Test: { bg: '#e5f7ee', accent: '#1c8c4c' },
    'Production Support': { bg: '#fff6e5', accent: '#d97706' },
  };
  defaultColor: ColorPair = { bg: '#f4f5f6', accent: '#555' };

  constructor(
    private dataService: SdlcExecDataService,
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
        // Filter by sprint name if coming from archive
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

  private computeDiff(oldRows: SdlcExecRow[], newRows: SdlcExecRow[]): void {
    clearTimeout(this.highlightTimer);
    this.changedCells.clear();
    if (oldRows.length === 0) return; // First load — no diff
    const oldMap = new Map<number, SdlcExecRow>();
    for (const r of oldRows) oldMap.set(r.sortOrder, r);
    const fields: (keyof SdlcExecRow)[] = ['scope', 'sprintUpdate', 'status'];
    for (const nr of newRows) {
      const or = oldMap.get(nr.sortOrder);
      for (const f of fields) {
        if (!or || nr[f] !== or[f]) {
          this.changedCells.add(`${nr.sortOrder}:${f}`);
        }
      }
    }
    // Auto-clear highlights after 4s
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
    this.router.navigate(['/sdlc-exec/archive']);
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

  getStatusLabel(status: string): string {
    const opt = this.statusOptions.find((o) => o.value === status);
    return opt?.label || status;
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

  trackByGroup(_: number, group: SdlcExecGroup): string {
    return group.workstream;
  }
}
