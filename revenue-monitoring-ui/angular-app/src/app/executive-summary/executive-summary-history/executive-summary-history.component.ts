import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorArrowLeftBold,
  phosphorCaretLeftBold,
  phosphorCaretRightBold,
} from '@ng-icons/phosphor-icons/bold';
import { DestroyManager } from '../../providers/destroy-manager.service';
import {
  ExecSummaryDataService,
  ExecSummaryRow,
  ExecSummaryVersion,
} from '../executive-summary-data.service';
import { MarkdownPipe } from '../../shared/markdown.pipe';

@Component({
  selector: 'app-executive-summary-history',
  standalone: true,
  imports: [NgIcon, MarkdownPipe],
  providers: [
    DestroyManager,
    provideIcons({
      phosphorArrowLeftBold,
      phosphorCaretLeftBold,
      phosphorCaretRightBold,
    }),
  ],
  templateUrl: './executive-summary-history.component.html',
  styleUrls: [
    '../../shared/scorecard.css',
    './executive-summary-history.component.css',
  ],
})
export class ExecutiveSummaryHistoryComponent implements OnInit, OnDestroy {
  versions: ExecSummaryVersion[] = [];
  currentIndex = 0;
  totalCount = 0;
  page = 0;
  pageSize = 200;
  sprintFilter: string | null = null;

  selectedVersion: ExecSummaryVersion | null = null;
  rows: ExecSummaryRow[] = [];
  isLoading = true;
  isLoadingData = false;
  showEmptyState = false;
  changedCells = new Set<string>();
  private previousRows: ExecSummaryRow[] = [];
  private emptyStateTimer: any;
  private highlightTimer: any;

  trackColors = [
    { bg: '#e5f2ff', accent: '#0070d2' },
    { bg: '#e5f7ee', accent: '#1c8c4c' },
    { bg: '#fff6e5', accent: '#d97706' },
    { bg: '#f3e8ff', accent: '#7c3aed' },
    { bg: '#fce8ec', accent: '#c0392b' },
    { bg: '#e8f5e9', accent: '#2e7d32' },
    { bg: '#e3f2fd', accent: '#1565c0' },
  ];

  constructor(
    private dataService: ExecSummaryDataService,
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
        this.rows = newRows;
        this.isLoadingData = false;
      },
      error: () => {
        this.isLoadingData = false;
      },
    });
  }

  private computeDiff(
    oldRows: ExecSummaryRow[],
    newRows: ExecSummaryRow[],
  ): void {
    clearTimeout(this.highlightTimer);
    this.changedCells.clear();
    if (oldRows.length === 0) return;
    const oldMap = new Map<number, ExecSummaryRow>();
    for (const r of oldRows) oldMap.set(r.sortOrder, r);
    const fields: (keyof ExecSummaryRow)[] = [
      'sdlcTrack',
      'highlights',
      'watchAreas',
    ];
    for (const nr of newRows) {
      const or = oldMap.get(nr.sortOrder);
      for (const f of fields) {
        if (!or || nr[f] !== or[f]) {
          this.changedCells.add(`${nr.sortOrder}:${f}`);
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
    this.router.navigate(['/executive-summary/archive']);
  }

  getBullets(text: string): string[] {
    return this.dataService.splitBullets(text);
  }

  getTrackColor(index: number): { bg: string; accent: string } {
    return this.trackColors[index % this.trackColors.length];
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

  trackByRow(index: number, row: ExecSummaryRow): number {
    return row.dataId ?? index;
  }
}
