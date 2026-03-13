import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorClockCounterClockwiseBold,
  phosphorEnvelopeSimpleBold,
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
      phosphorEnvelopeSimpleBold,
      phosphorPencilSimpleBold,
    }),
  ],
  templateUrl: './scorecard.component.html',
  styleUrls: ['../shared/scorecard.css', './scorecard.component.css'],
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
  toastMessage = '';
  hasDraftAvailable = false;

  /* Snapshot of rows before editing — for cancel */
  private rowsSnapshot: ScorecardRow[] = [];

  private static readonly DRAFT_KEY = 'scorecard_draft';
  private draftDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  /* Workstream palette — complements liquid glass glow */
  workstreamColors: Record<string, { bg: string; accent: string }> = {
    '1. Improve Cycle time': { bg: '#e6f7fa30', accent: '#0891b2' },
    '2. Improve Productivity': { bg: '#f3eefa30', accent: '#7c3aed' },
    '3. Improve Quality': { bg: '#fef0e630', accent: '#ea580c' },
  };

  defaultColor = { bg: '#f0f4f830', accent: '#0070d2' };

  constructor(
    private dataService: ScorecardDataService,
    private authService: AuthenticationService,
    private dm: DestroyManager,
    private router: Router,
    private zone: NgZone,
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getUserName() || '';
    // this.userId = 'jasloop'; // For local testing
    this.hasDraftAvailable = this.hasDraft();
    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.draftDebounceTimer) clearTimeout(this.draftDebounceTimer);
  }

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

    /* Restore draft if one exists */
    const draft = this.loadDraft();
    if (draft) {
      this.groups = this.dataService.groupByWorkstream(draft.rows);
      this.saveNotes = draft.saveNotes || '';
      this.hasDraftAvailable = false;
      this.showToast('Draft restored — your previous edits have been loaded');
    }

    /* Auto-size textareas once Angular renders them */
    setTimeout(() => {
      document
        .querySelectorAll<HTMLTextAreaElement>('.cell-input-textarea')
        .forEach((el) => {
          el.style.height = 'auto';
          el.style.height = el.scrollHeight + 'px';
        });
    });
  }

  cancelEditing(): void {
    /* Restore from snapshot and discard draft */
    const snapshotGroups = this.dataService.groupByWorkstream(
      this.rowsSnapshot,
    );
    this.groups = snapshotGroups;
    this.isEditing = false;
    this.saveNotes = '';
    this.clearDraft();
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
          this.clearDraft();
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

  onCellInput(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
    this.saveDraftDebounced();
  }

  onFieldInput(): void {
    this.saveDraftDebounced();
  }

  autoResize(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  goToHistory(): void {
    this.router.navigate(['/scorecard/history']);
  }

  async exportToEmail(): Promise<void> {
    const html = this.buildEmailHtml();
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([this.buildPlainText()], {
            type: 'text/plain',
          }),
        }),
      ]);
    } catch {
      /* Fallback: copy plain text */
      await navigator.clipboard.writeText(this.buildPlainText());
    }
    const subject = encodeURIComponent(
      `Monthly Performance Scorecard — ${this.version?.sprintName || 'Current'}`,
    );
    window.open(`mailto:?subject=${subject}`, '_self');
    this.showToast('Table copied — paste into your email body (Cmd+V)');
  }

  private showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => (this.toastMessage = ''), 5000);
  }

  private buildEmailHtml(): string {
    const rows: string[] = [];
    for (const g of this.groups) {
      const color = this.getGroupColor(g.workstream);
      for (let i = 0; i < g.rows.length; i++) {
        const r = g.rows[i];
        let rowHtml = '<tr>';
        if (i === 0) {
          rowHtml += `<td rowspan="${g.rows.length}" style="background:${color.bg};border:1px solid #e1e4e8;padding:8px 12px;vertical-align:middle;font-weight:700;color:${color.accent};border-right:3px solid ${color.accent};font-size:13px;">${g.workstream}</td>`;
        }
        rowHtml += `<td style="border:1px solid #e1e4e8;padding:8px 12px;font-size:13px;">• ${this.esc(r.successCriteria)}</td>`;
        rowHtml += `<td style="border:1px solid #e1e4e8;padding:8px 12px;font-size:13px;">${this.esc(r.baseline)}</td>`;
        rowHtml += `<td style="border:1px solid #e1e4e8;padding:8px 12px;font-size:13px;">${this.esc(r.owners)}</td>`;
        rowHtml += `<td style="border:1px solid #e1e4e8;padding:8px 12px;font-size:13px;font-weight:700;color:#0070d2;">${this.esc(r.eocy26Target)}</td>`;
        rowHtml += `<td style="border:1px solid #e1e4e8;padding:8px 12px;font-size:13px;">${this.esc(r.howWeMeasure)}</td>`;
        rowHtml += `<td style="border:1px solid #e1e4e8;padding:8px 12px;font-size:13px;color:#6b7482;">${this.esc(r.metric || '—')}</td>`;
        rowHtml += '</tr>';
        rows.push(rowHtml);
      }
    }
    const thStyle =
      'style="background:#f7f8fa;border:1px solid #e1e4e8;padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#6b7482;font-weight:700;"';
    return `<table style="border-collapse:collapse;font-family:Inter,Arial,sans-serif;width:100%;">
<thead><tr>
<th ${thStyle}>Workstream</th>
<th ${thStyle}>Success Criteria</th>
<th ${thStyle}>Baseline</th>
<th ${thStyle}>Owner(s)</th>
<th ${thStyle}>EOCY26</th>
<th ${thStyle}>How Do We Measure</th>
<th ${thStyle}>Metric</th>
</tr></thead>
<tbody>${rows.join('')}</tbody>
</table>`;
  }

  private buildPlainText(): string {
    const lines: string[] = [];
    for (const g of this.groups) {
      lines.push(`\n${g.workstream}`);
      lines.push('—'.repeat(40));
      for (const r of g.rows) {
        lines.push(
          `  • ${r.successCriteria}  |  Baseline: ${r.baseline}  |  Owner: ${r.owners}  |  EOCY26: ${r.eocy26Target}  |  Measure: ${r.howWeMeasure}  |  Metric: ${r.metric || '—'}`,
        );
      }
    }
    return `Monthly Performance Scorecard — ${this.version?.sprintName || 'Current'}\n${lines.join('\n')}`;
  }

  private esc(s: string): string {
    return (s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  getGroupColor(workstream: string): { bg: string; accent: string } {
    return this.workstreamColors[workstream] || this.defaultColor;
  }

  getGradientSvg(workstream: string): string {
    const map: Record<string, string> = {
      '1. Improve Cycle time': '1',
      '2. Improve Productivity': '2',
      '3. Improve Quality': '3',
    };
    return map[workstream] || '1';
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

  /* ——— Draft persistence (localStorage) ——— */

  private saveDraftDebounced(): void {
    if (this.draftDebounceTimer) clearTimeout(this.draftDebounceTimer);
    this.draftDebounceTimer = setTimeout(() => this.saveDraft(), 400);
  }

  private saveDraft(): void {
    const draft = {
      rows: this.allRows(),
      saveNotes: this.saveNotes,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(ScorecardComponent.DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* Storage full or unavailable — silently ignore */
    }
  }

  private loadDraft(): { rows: ScorecardRow[]; saveNotes: string } | null {
    try {
      const raw = localStorage.getItem(ScorecardComponent.DRAFT_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private hasDraft(): boolean {
    return localStorage.getItem(ScorecardComponent.DRAFT_KEY) !== null;
  }

  private clearDraft(): void {
    localStorage.removeItem(ScorecardComponent.DRAFT_KEY);
    this.hasDraftAvailable = false;
  }

  discardDraft(): void {
    this.clearDraft();
  }

  trackByGroup(_: number, group: WorkstreamGroup): string {
    return group.workstream;
  }

  trackByRow(index: number, row: ScorecardRow): number {
    return row.dataId ?? index;
  }
}
