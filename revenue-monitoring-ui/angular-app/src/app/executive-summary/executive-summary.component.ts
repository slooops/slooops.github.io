import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorArchiveBold,
  phosphorEnvelopeSimpleBold,
  phosphorPencilSimpleBold,
} from '@ng-icons/phosphor-icons/bold';
import { DestroyManager } from '../providers/destroy-manager.service';
import { AuthenticationService } from '../providers/authentication.service';
import {
  EditableTableBase,
  TableVersion,
  ColorPair,
} from '../shared/editable-table-base';
import { MarkdownPipe } from '../shared/markdown.pipe';
import {
  ExecSummaryDataService,
  ExecSummaryRow,
} from './executive-summary-data.service';
import { ScorecardComponent } from '../scorecard/scorecard.component';

@Component({
  selector: 'app-executive-summary',
  standalone: true,
  imports: [FormsModule, NgIcon, ScorecardComponent, MarkdownPipe],
  providers: [
    DestroyManager,
    provideIcons({
      phosphorArchiveBold,
      phosphorEnvelopeSimpleBold,
      phosphorPencilSimpleBold,
    }),
  ],
  templateUrl: './executive-summary.component.html',
  styleUrls: ['../shared/scorecard.css', './executive-summary.component.css'],
})
export class ExecutiveSummaryComponent
  extends EditableTableBase<ExecSummaryRow>
  implements OnInit, OnDestroy
{
  rows: ExecSummaryRow[] = [];
  activeTab = 0;

  /* Blue gradient palette — lightest at top, progressively deeper */
  trackColors: ColorPair[] = [
    { bg: '#f0f7ff', accent: '#93c5fd' },
    { bg: '#e0eefb', accent: '#6ba8e5' },
    { bg: '#d0e4f7', accent: '#4a8ac7' },
    { bg: '#c0daf3', accent: '#3574b3' },
    { bg: '#aecfee', accent: '#21599d' },
    { bg: '#9bc3e8', accent: '#134785' },
    { bg: '#88b7e2', accent: '#0a306d' },
  ];

  constructor(
    private dataService: ExecSummaryDataService,
    authService: AuthenticationService,
    private dm: DestroyManager,
    router: Router,
  ) {
    super(authService, router, {
      editRoles: ['ADMIN', 'SCORECARD_ADMIN', 'SCORECARD'],
      adminRoles: ['ADMIN', 'SCORECARD_ADMIN'],
      draftKey: 'exec_summary_draft',
      historyRoute: '/executive-summary/history',
      archiveRoute: '/executive-summary/archive',
      emailSubjectPrefix: 'SDLC Executive Summary',
    });
  }

  /* ====== Abstract implementations ====================================== */

  getAllRows(): ExecSummaryRow[] {
    return this.rows;
  }

  restoreRows(rows: ExecSummaryRow[]): void {
    this.rows = rows;
  }

  loadRemoteData(): Observable<{
    version: TableVersion;
    rows: ExecSummaryRow[];
  }> {
    return this.dataService.getCurrent(this.dm);
  }

  saveRemoteData(payload: {
    username: string;
    sprintName: string;
    notes: string;
    rows: ExecSummaryRow[];
  }): Observable<any> {
    return this.dataService.save(payload);
  }

  /* ====== Exec-summary-specific methods ================================= */

  canEditCell(column: string): boolean {
    if (!this.isEditing || !this.canEdit) return false;
    if (this.isAdmin) return true;
    return column === 'highlights' || column === 'watchAreas';
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

  getBullets(text: string): string[] {
    return this.dataService.splitBullets(text);
  }

  getTrackColor(index: number): ColorPair {
    return this.trackColors[index % this.trackColors.length];
  }

  trackByRow(index: number, row: ExecSummaryRow): number {
    return row.dataId ?? index;
  }

  buildEmailHtml(): string {
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
    return `<div style="box-shadow:0 4px 24px rgba(0,0,0,0.10),0 1.5px 6px rgba(0,0,0,0.06);overflow:hidden;display:block;width:100%;background:#fff;">
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

  buildPlainText(): string {
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
}
