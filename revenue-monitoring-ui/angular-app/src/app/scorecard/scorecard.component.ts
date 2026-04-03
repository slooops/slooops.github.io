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
  ScorecardDataService,
  ScorecardRow,
  WorkstreamGroup,
} from './scorecard-data.service';

@Component({
  selector: 'app-scorecard',
  standalone: true,
  imports: [FormsModule, NgIcon, MarkdownPipe],
  providers: [
    DestroyManager,
    provideIcons({
      phosphorArchiveBold,
      phosphorEnvelopeSimpleBold,
      phosphorPencilSimpleBold,
    }),
  ],
  templateUrl: './scorecard.component.html',
  styleUrls: ['../shared/scorecard.css', './scorecard.component.css'],
})
export class ScorecardComponent
  extends EditableTableBase<ScorecardRow>
  implements OnInit, OnDestroy
{
  groups: WorkstreamGroup[] = [];

  /* Blue gradient workstream palette */
  workstreamColors: Record<string, ColorPair> = {
    '1. Improve Cycle time': { bg: '#f0f7ff', accent: '#3b82f6' },
    '2. Improve Productivity': { bg: '#dbeafe', accent: '#1d4ed8' },
    '3. Improve Quality': { bg: '#bfdbfe', accent: '#1e3a8a' },
  };

  defaultColor: ColorPair = { bg: '#eff6ff', accent: '#2563eb' };

  constructor(
    private dataService: ScorecardDataService,
    authService: AuthenticationService,
    private dm: DestroyManager,
    router: Router,
  ) {
    super(authService, router, {
      editRoles: ['ADMIN', 'SCORECARD_ADMIN', 'SCORECARD'],
      adminRoles: ['ADMIN', 'SCORECARD_ADMIN'],
      draftKey: 'scorecard_draft',
      historyRoute: '/scorecard/history',
      archiveRoute: '/scorecard/archive',
      emailSubjectPrefix: 'Monthly Performance Scorecard',
    });
  }

  /* ====== Abstract implementations ====================================== */

  getAllRows(): ScorecardRow[] {
    const rows: ScorecardRow[] = [];
    for (const g of this.groups) {
      for (const r of g.rows) rows.push(r);
    }
    return rows;
  }

  restoreRows(rows: ScorecardRow[]): void {
    this.groups = this.dataService.groupByWorkstream(rows);
  }

  loadRemoteData(): Observable<{
    version: TableVersion;
    rows: ScorecardRow[];
  }> {
    return this.dataService.getCurrent(this.dm);
  }

  saveRemoteData(payload: {
    username: string;
    sprintName: string;
    notes: string;
    rows: ScorecardRow[];
  }): Observable<any> {
    return this.dataService.save(payload);
  }

  /* ====== Scorecard-specific methods ==================================== */

  canEditCell(row: ScorecardRow, column: string): boolean {
    if (!this.isEditing || !this.canEdit) return false;
    if (this.isAdmin) return true;
    /* Owners can only edit their own rows */
    if (!this.isOwnerOfRow(row)) return false;
    /* Owners cannot edit workstream or owners columns */
    return column !== 'workstream' && column !== 'owners';
  }

  isOwnerOfRow(row: ScorecardRow): boolean {
    if (!this.canEdit) return false;
    const cec = this.userId.toLowerCase();
    const ownerCell = (row.owners || '').toLowerCase();
    return ownerCell.includes(cec);
  }

  canEditRow(row: ScorecardRow): boolean {
    if (!this.isEditing || !this.canEdit) return false;
    if (this.isAdmin) return true;
    return this.isOwnerOfRow(row);
  }

  addRow(group: WorkstreamGroup): void {
    const maxSort = Math.max(...this.getAllRows().map((r) => r.sortOrder), 0);
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

  buildEmailHtml(): string {
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
      'style="background:#f7f8fa;border:1px solid #e1e4e8;padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#6b7482;font-weight:700;"';
    return `<div style="box-shadow:0 4px 24px rgba(0,0,0,0.10),0 1.5px 6px rgba(0,0,0,0.06);overflow:hidden;display:block;width:100%;background:#fff;">
<table style="border-collapse:collapse;font-family:Inter,Arial,sans-serif;width:100%;">
<thead><tr>
<th ${thStyle}>Workstream</th>
<th ${thStyle}>Success Criteria</th>
<th ${thStyle}>Baseline</th>
<th ${thStyle}>Owner(s)</th>
<th ${thStyle}>Target by EOCY26</th>
<th ${thStyle}>How Do We Measure</th>
<th ${thStyle}>Metric</th>
</tr></thead>
<tbody>${rows.join('')}</tbody>
</table>
</div>`;
  }

  buildPlainText(): string {
    const lines: string[] = [];
    for (const g of this.groups) {
      lines.push(`\n${g.workstream}`);
      lines.push('—'.repeat(40));
      for (const r of g.rows) {
        lines.push(
          `  • ${r.successCriteria}  |  Baseline: ${r.baseline}  |  Owner: ${r.owners}  |  Target by EOCY26: ${r.eocy26Target}  |  Measure: ${r.howWeMeasure}  |  Metric: ${r.metric || '—'}`,
        );
      }
    }
    return `Monthly Performance Scorecard — ${this.version?.sprintName || 'Current'}\n${lines.join('\n')}`;
  }

  getGroupColor(workstream: string): ColorPair {
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

  trackByGroup(_: number, group: WorkstreamGroup): string {
    return group.workstream;
  }

  trackByRow(index: number, row: ScorecardRow): number {
    return row.dataId ?? index;
  }
}
