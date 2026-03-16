import { Component, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
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

@Component({
  selector: 'app-sdlc-adopt-history',
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
  templateUrl: './sdlc-adopt-history.component.html',
  styleUrls: [
    '../../shared/scorecard.css',
    '../sdlc-updates.css',
    './sdlc-adopt-history.component.css',
  ],
})
export class SdlcAdoptHistoryComponent implements OnInit {
  versions: SdlcAdoptVersion[] = [];
  currentIndex = 0;
  totalCount = 0;
  page = 0;
  pageSize = 20;

  selectedVersion: SdlcAdoptVersion | null = null;
  groups: SdlcAdoptGroup[] = [];
  isLoading = true;
  isLoadingData = false;
  statusOptions = STATUS_OPTIONS;
  entityColumns = ENTITY_COLUMNS;

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
    private dataService: SdlcAdoptDataService,
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
