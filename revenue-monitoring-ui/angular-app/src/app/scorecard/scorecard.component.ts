import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorClockCounterClockwiseBold,
  phosphorPencilSimpleBold,
} from '@ng-icons/phosphor-icons/bold';
import { DestroyManager } from '../providers/destroy-manager.service';
import { AuthenticationService } from '../providers/authentication.service';
import {
  ScorecardDataService,
  ScorecardRow,
  ScorecardVersion,
  EditorInfo,
  WorkstreamGroup,
} from './scorecard-data.service';

@Component({
  selector: 'app-scorecard',
  standalone: true,
  imports: [FormsModule, NgIcon],
  providers: [
    DestroyManager,
    provideIcons({
      phosphorClockCounterClockwiseBold,
      phosphorPencilSimpleBold,
    }),
  ],
  templateUrl: './scorecard.component.html',
  styleUrls: ['./scorecard.component.css'],
})
export class ScorecardComponent implements OnInit, OnDestroy {
  groups: WorkstreamGroup[] = [];
  version: ScorecardVersion | null = null;
  editorInfo: EditorInfo | null = null;
  userId = '';
  isEditing = false;
  isSaving = false;
  isLoading = true;
  saveNotes = '';

  /* Snapshot of rows before editing — for cancel */
  private rowsSnapshot: ScorecardRow[] = [];

  /* Workstream palette */
  workstreamColors: Record<string, { bg: string; accent: string }> = {
    '1. Improve Cycle time': { bg: '#e5f2ff', accent: '#0070d2' },
    '2. Improve Productivity': { bg: '#e5f7ee', accent: '#1c8c4c' },
    '3. Improve Quality': { bg: '#fff6e5', accent: '#d97706' },
  };

  defaultColor = { bg: '#f4f5f6', accent: '#555' };

  constructor(
    private dataService: ScorecardDataService,
    private authService: AuthenticationService,
    private dm: DestroyManager,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // this.userId = this.authService.getUserID() || '';
    this.userId = 'jasloop'; // For local testing
    this.loadData();
  }

  ngOnDestroy(): void {}

  private loadData(): void {
    this.isLoading = true;
    this.dataService.getCurrent(this.dm).subscribe({
      next: (data) => {
        this.version = data.version;
        this.groups = this.dataService.groupByWorkstream(data.rows);
        this.isLoading = false;
        this.loadEditorInfo();
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  private loadEditorInfo(): void {
    if (!this.userId) return;
    this.dataService.getEditorInfo(this.dm, this.userId).subscribe({
      next: (info) => {
        this.editorInfo = info;
      },
    });
  }

  get canEdit(): boolean {
    return !!this.editorInfo;
  }

  get isAdmin(): boolean {
    return this.editorInfo?.roleLevel === 'ADMIN';
  }

  canEditCell(row: ScorecardRow, column: string): boolean {
    if (!this.isEditing || !this.editorInfo) return false;
    if (this.isAdmin) return true;
    /* Owners can only edit their own rows */
    if (!this.isOwnerOfRow(row)) return false;
    /* Owners cannot edit workstream or owners columns */
    return column !== 'workstream' && column !== 'owners';
  }

  isOwnerOfRow(row: ScorecardRow): boolean {
    if (!this.editorInfo) return false;
    /* Match display name against the Owners cell (case-insensitive partial match) */
    const displayName = this.editorInfo.displayName.toLowerCase();
    const ownerCell = (row.owners || '').toLowerCase();
    /* Also check CEC username */
    const cec = this.editorInfo.cecUsername.toLowerCase();
    return (
      ownerCell.includes(displayName.split(' ')[0]) || ownerCell.includes(cec)
    );
  }

  canEditRow(row: ScorecardRow): boolean {
    if (!this.isEditing || !this.editorInfo) return false;
    if (this.isAdmin) return true;
    return this.isOwnerOfRow(row);
  }

  startEditing(): void {
    /* Deep clone the current rows as snapshot */
    this.rowsSnapshot = this.allRows().map((r) => ({ ...r }));
    this.isEditing = true;
    this.saveNotes = '';
  }

  cancelEditing(): void {
    /* Restore from snapshot */
    const snapshotGroups = this.dataService.groupByWorkstream(
      this.rowsSnapshot,
    );
    this.groups = snapshotGroups;
    this.isEditing = false;
    this.saveNotes = '';
  }

  saveChanges(): void {
    if (!this.editorInfo || this.isSaving) return;
    this.isSaving = true;
    const rows = this.allRows();
    const sprintName = this.version?.sprintName || 'Sprint 1';
    this.dataService
      .save({
        username: this.userId,
        sprintName,
        notes: this.saveNotes,
        rows,
      })
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.isEditing = false;
          this.saveNotes = '';
          this.loadData();
        },
        error: () => {
          this.isSaving = false;
        },
      });
  }

  addRow(group: WorkstreamGroup): void {
    const maxSort = Math.max(...this.allRows().map((r) => r.sortOrder), 0);
    group.rows.push({
      workstream: group.workstream,
      successCriteria: '',
      baseline: '',
      owners: '',
      eocy26Target: '',
      howWeMeasure: '',
      metric: '',
      sortOrder: maxSort + 1,
    });
  }

  removeRow(group: WorkstreamGroup, index: number): void {
    group.rows.splice(index, 1);
  }

  goToHistory(): void {
    this.router.navigate(['/scorecard/history']);
  }

  getGroupColor(workstream: string): { bg: string; accent: string } {
    return this.workstreamColors[workstream] || this.defaultColor;
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

  private allRows(): ScorecardRow[] {
    const rows: ScorecardRow[] = [];
    for (const g of this.groups) {
      for (const r of g.rows) {
        rows.push(r);
      }
    }
    return rows;
  }

  trackByGroup(_: number, group: WorkstreamGroup): string {
    return group.workstream;
  }

  trackByRow(index: number, row: ScorecardRow): number {
    return row.dataId ?? index;
  }
}
