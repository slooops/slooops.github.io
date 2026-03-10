import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorArrowLeftBold,
  phosphorCaretLeftBold,
  phosphorCaretRightBold,
} from '@ng-icons/phosphor-icons/bold';
import { DestroyManager } from '../../providers/destroy-manager.service';
import {
  ScorecardDataService,
  ScorecardRow,
  ScorecardVersion,
  WorkstreamGroup,
} from '../scorecard-data.service';

@Component({
  selector: 'app-scorecard-history',
  standalone: true,
  imports: [NgIcon],
  providers: [
    DestroyManager,
    provideIcons({
      phosphorArrowLeftBold,
      phosphorCaretLeftBold,
      phosphorCaretRightBold,
    }),
  ],
  templateUrl: './scorecard-history.component.html',
  styleUrls: ['./scorecard-history.component.css'],
})
export class ScorecardHistoryComponent implements OnInit {
  versions: ScorecardVersion[] = [];
  currentIndex = 0;
  totalCount = 0;
  page = 0;
  pageSize = 20;

  selectedVersion: ScorecardVersion | null = null;
  groups: WorkstreamGroup[] = [];
  isLoading = true;
  isLoadingData = false;

  workstreamColors: Record<string, { bg: string; accent: string }> = {
    '1. Improve Cycle time': { bg: '#e5f2ff', accent: '#0070d2' },
    '2. Improve Productivity': { bg: '#e5f7ee', accent: '#1c8c4c' },
    '3. Improve Quality': { bg: '#fff6e5', accent: '#d97706' },
  };
  defaultColor = { bg: '#f4f5f6', accent: '#555' };

  constructor(
    private dataService: ScorecardDataService,
    private dm: DestroyManager,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadVersions();
  }

  private loadVersions(): void {
    this.isLoading = true;
    this.dataService.getVersions(this.dm, this.page, this.pageSize).subscribe({
      next: (res) => {
        this.versions = res.versions;
        this.totalCount = res.totalCount;
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
        this.groups = this.dataService.groupByWorkstream(data.rows);
        this.isLoadingData = false;
      },
      error: () => {
        this.isLoadingData = false;
      },
    });
  }

  prev(): void {
    if (this.currentIndex < this.versions.length - 1) {
      this.selectVersion(this.currentIndex + 1);
    } else if (this.hasMorePages) {
      this.page++;
      this.dataService
        .getVersions(this.dm, this.page, this.pageSize)
        .subscribe({
          next: (res) => {
            this.versions = [...this.versions, ...res.versions];
            this.selectVersion(this.currentIndex + 1);
          },
        });
    }
  }

  next(): void {
    if (this.currentIndex > 0) {
      this.selectVersion(this.currentIndex - 1);
    }
  }

  get hasPrev(): boolean {
    return this.currentIndex < this.versions.length - 1 || this.hasMorePages;
  }

  get hasNext(): boolean {
    return this.currentIndex > 0;
  }

  get hasMorePages(): boolean {
    return this.versions.length < this.totalCount;
  }

  goBack(): void {
    this.router.navigate(['/scorecard']);
  }

  getGroupColor(ws: string): { bg: string; accent: string } {
    return this.workstreamColors[ws] || this.defaultColor;
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

  trackByGroup(_: number, group: WorkstreamGroup): string {
    return group.workstream;
  }

  trackByRow(index: number, row: ScorecardRow): number {
    return row.dataId ?? index;
  }
}
