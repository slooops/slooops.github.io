import { Component, OnInit, OnDestroy } from '@angular/core';
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
  ExecSummaryDataService,
  ExecSummaryRow,
  ExecSummaryVersion,
} from './executive-summary-data.service';

@Component({
  selector: 'app-executive-summary',
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
  templateUrl: './executive-summary.component.html',
  styleUrls: ['../shared/scorecard.css', './executive-summary.component.css'],
})
export class ExecutiveSummaryComponent implements OnInit, OnDestroy {
  rows: ExecSummaryRow[] = [];
  version: ExecSummaryVersion | null = null;
  userId = '';
  userRoles: string[] = [];
  isEditing = false;
  isSaving = false;
  isLoading = true;
  saveNotes = '';
  toastMessage = '';
  hasDraftAvailable = false;

  private rowsSnapshot: ExecSummaryRow[] = [];

  private static readonly DRAFT_KEY = 'exec_summary_draft';
  private draftDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  /* Alternating color palette for SDLC tracks */
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
    private authService: AuthenticationService,
    private dm: DestroyManager,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getUserID() || '';
    this.userRoles = this.authService.getRoles() || [];
    console.log('User ID:', this.userId);
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
        this.rows = data.rows;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  get canEdit(): boolean {
    return this.userRoles.some((r) =>
      ['ADMIN', 'EXEC_SUMMARY_ADMIN', 'EXEC_SUMMARY'].includes(r),
    );
  }

  get isAdmin(): boolean {
    return this.userRoles.some((r) =>
      ['ADMIN', 'EXEC_SUMMARY_ADMIN'].includes(r),
    );
  }

  canEditCell(column: string): boolean {
    if (!this.isEditing || !this.canEdit) return false;
    if (this.isAdmin) return true;
    return column === 'highlights' || column === 'watchAreas';
  }

  startEditing(): void {
    this.rowsSnapshot = this.rows.map((r) => ({ ...r }));
    this.isEditing = true;
    this.saveNotes = '';

    const draft = this.loadDraft();
    if (draft) {
      this.rows = draft.rows;
      this.saveNotes = draft.saveNotes || '';
      this.hasDraftAvailable = false;
      this.showToast('Draft restored — your previous edits have been loaded');
    }

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
    this.rows = this.rowsSnapshot.map((r) => ({ ...r }));
    this.isEditing = false;
    this.saveNotes = '';
    this.clearDraft();
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

  saveChanges(): void {
    if (!this.canEdit || this.isSaving) return;
    this.isSaving = true;
    const sprintName = this.version?.sprintName || 'Sprint 1';
    this.dataService
      .save({
        username: this.userId,
        sprintName,
        notes: this.saveNotes,
        rows: this.rows,
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

  addRow(): void {
    const maxSort = Math.max(...this.rows.map((r) => r.sortOrder), 0);
    this.rows.push({
      sdlcTrack: '',
      highlights: '',
      watchAreas: '',
      sortOrder: maxSort + 1,
    });
  }

  removeRow(index: number): void {
    this.rows.splice(index, 1);
  }

  goToHistory(): void {
    this.router.navigate(['/executive-summary/history']);
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
      await navigator.clipboard.writeText(this.buildPlainText());
    }
    const subject = encodeURIComponent(
      `SDLC Executive Summary — ${this.version?.sprintName || 'Current'}`,
    );
    window.open(`mailto:?subject=${subject}`, '_self');
    this.showToast('Table copied — paste into your email body (Cmd+V)');
  }

  private showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => (this.toastMessage = ''), 5000);
  }

  private buildEmailHtml(): string {
    const thStyle =
      'style="background:#f7f8fa;border:1px solid #e1e4e8;padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#6b7482;font-weight:700;"';
    const rows: string[] = [];
    for (let i = 0; i < this.rows.length; i++) {
      const r = this.rows[i];
      const color = this.getTrackColor(i);
      const highlights = this.getBullets(r.highlights)
        .map((b) => `• ${this.esc(b.replace(/^[•\-]\s*/, ''))}`)
        .join('<br>');
      const watchAreas = this.getBullets(r.watchAreas)
        .map((b) => `• ${this.esc(b.replace(/^[•\-]\s*/, ''))}`)
        .join('<br>');
      rows.push(
        `<tr>` +
          `<td style="background:${color.bg};border:1px solid #e1e4e8;padding:8px 12px;vertical-align:top;font-weight:700;color:${color.accent};border-right:3px solid ${color.accent};font-size:13px;">${this.esc(r.sdlcTrack)}</td>` +
          `<td style="border:1px solid #e1e4e8;padding:8px 12px;font-size:13px;vertical-align:top;">${highlights || '—'}</td>` +
          `<td style="border:1px solid #e1e4e8;padding:8px 12px;font-size:13px;vertical-align:top;">${watchAreas || '—'}</td>` +
          `</tr>`,
      );
    }
    return `<div style="border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.10),0 1.5px 6px rgba(0,0,0,0.06);overflow:hidden;display:inline-block;background:#fff;">
<table style="border-collapse:collapse;font-family:Inter,Arial,sans-serif;width:100%;">
<thead><tr>
<th ${thStyle}>SDLC Track</th>
<th ${thStyle}>Highlights</th>
<th ${thStyle}>Watch Areas / Action Items</th>
</tr></thead>
<tbody>${rows.join('')}</tbody>
</table>
</div>`;
  }

  private buildPlainText(): string {
    const lines: string[] = [
      `SDLC Executive Summary — ${this.version?.sprintName || 'Current'}`,
    ];
    for (const r of this.rows) {
      lines.push(`\n${r.sdlcTrack}`);
      lines.push('—'.repeat(40));
      const highlights = this.getBullets(r.highlights)
        .map((b) => `  • ${b.replace(/^[•\-]\s*/, '')}`)
        .join('\n');
      const watchAreas = this.getBullets(r.watchAreas)
        .map((b) => `  • ${b.replace(/^[•\-]\s*/, '')}`)
        .join('\n');
      if (highlights) lines.push(`  Highlights:\n${highlights}`);
      if (watchAreas) lines.push(`  Watch Areas:\n${watchAreas}`);
    }
    return lines.join('\n');
  }

  private esc(s: string): string {
    return (s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* ——— Draft persistence (localStorage) ——— */

  private saveDraftDebounced(): void {
    if (this.draftDebounceTimer) clearTimeout(this.draftDebounceTimer);
    this.draftDebounceTimer = setTimeout(() => this.saveDraft(), 400);
  }

  private saveDraft(): void {
    const draft = {
      rows: this.rows,
      saveNotes: this.saveNotes,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(
        ExecutiveSummaryComponent.DRAFT_KEY,
        JSON.stringify(draft),
      );
    } catch {
      /* Storage full or unavailable — silently ignore */
    }
  }

  private loadDraft(): {
    rows: ExecSummaryRow[];
    saveNotes: string;
  } | null {
    try {
      const raw = localStorage.getItem(
        ExecutiveSummaryComponent.DRAFT_KEY,
      );
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private hasDraft(): boolean {
    return (
      localStorage.getItem(ExecutiveSummaryComponent.DRAFT_KEY) !== null
    );
  }

  private clearDraft(): void {
    localStorage.removeItem(ExecutiveSummaryComponent.DRAFT_KEY);
    this.hasDraftAvailable = false;
  }

  discardDraft(): void {
    this.clearDraft();
  }
}
