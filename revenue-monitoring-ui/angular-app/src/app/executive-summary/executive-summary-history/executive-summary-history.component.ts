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
  ExecSummaryDataService,
  ExecSummaryRow,
  ExecSummaryVersion,
} from '../executive-summary-data.service';

@Component({
  selector: 'app-executive-summary-history',
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
  templateUrl: './executive-summary-history.component.html',
  styleUrls: ['./executive-summary-history.component.css'],
})
export class ExecutiveSummaryHistoryComponent implements OnInit {
  versions: ExecSummaryVersion[] = [];
  currentIndex = 0;
  totalCount = 0;
  page = 0;
  pageSize = 20;

  selectedVersion: ExecSummaryVersion | null = null;
  rows: ExecSummaryRow[] = [];
  isLoading = true;
  isLoadingData = false;

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
        this.rows = data.rows;
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
    this.router.navigate(['/scorecard'], {
      queryParams: { tab: 'exec-summary' },
    });
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
