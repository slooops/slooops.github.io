import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgClass } from '@angular/common';
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
import {
  SdlcExecDataService,
  SdlcExecRow,
  SdlcExecGroup,
} from './sdlc-exec-data.service';

export const STATUS_OPTIONS = [
  { value: 'COMPLETED', label: 'Completed', icon: 'completed-icon' },
  { value: 'ON_TRACK', label: 'On Track', icon: 'in-progress-icon' },
  { value: 'ON_WATCH', label: 'On Watch', icon: 'delayed-icon' },
  { value: 'DELAYED', label: 'Delayed', icon: 'warning-icon' },
  { value: 'YET_TO_START', label: 'Yet to Start', icon: 'yet-to-start-icon' },
  { value: 'NA', label: 'N/A', icon: '' },
];

@Component({
  selector: 'app-sdlc-exec-update',
  standalone: true,
  imports: [FormsModule, NgClass, NgIcon],
  providers: [
    DestroyManager,
    provideIcons({
      phosphorArchiveBold,
      phosphorEnvelopeSimpleBold,
      phosphorPencilSimpleBold,
    }),
  ],
  templateUrl: './sdlc-exec-update.component.html',
  styleUrls: ['../shared/scorecard.css', './sdlc-updates.css'],
})
export class SdlcExecUpdateComponent
  extends EditableTableBase<SdlcExecRow>
  implements OnInit, OnDestroy
{
  groups: SdlcExecGroup[] = [];
  statusOptions = STATUS_OPTIONS;

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
  defaultColor: ColorPair = { bg: '#f0f4f8', accent: '#555' };

  constructor(
    private dataService: SdlcExecDataService,
    authService: AuthenticationService,
    private dm: DestroyManager,
    router: Router,
  ) {
    super(authService, router, {
      editRoles: ['ADMIN', 'SCORECARD_ADMIN', 'SCORECARD'],
      adminRoles: ['ADMIN', 'SCORECARD_ADMIN'],
      draftKey: 'sdlc_exec_draft',
      historyRoute: '/sdlc-exec/history',
      archiveRoute: '/sdlc-exec/archive',
      emailSubjectPrefix: 'SDLC Execution Update',
    });
  }

  getAllRows(): SdlcExecRow[] {
    const rows: SdlcExecRow[] = [];
    for (const g of this.groups) {
      for (const r of g.rows) rows.push(r);
    }
    return rows;
  }

  restoreRows(rows: SdlcExecRow[]): void {
    this.groups = this.dataService.groupByWorkstream(rows);
  }

  loadRemoteData(): Observable<{
    version: TableVersion;
    rows: SdlcExecRow[];
  }> {
    return this.dataService.getCurrent(this.dm);
  }

  saveRemoteData(payload: {
    username: string;
    sprintName: string;
    notes: string;
    rows: SdlcExecRow[];
  }): Observable<any> {
    return this.dataService.save(payload);
  }

  canEditCell(column: string): boolean {
    if (!this.isEditing || !this.canEdit) return false;
    if (this.isAdmin) return true;
    return column !== 'workstream' && column !== 'component';
  }

  addRow(group: SdlcExecGroup): void {
    const maxSort = Math.max(...this.getAllRows().map((r) => r.sortOrder), 0);
    group.rows.push({
      workstream: group.workstream,
      component: '',
      scope: '',
      sprintUpdate: '',
      status: 'YET_TO_START',
      sortOrder: maxSort + 1,
    });
  }

  removeRow(group: SdlcExecGroup, index: number): void {
    group.rows.splice(index, 1);
  }

  getGroupColor(workstream: string): ColorPair {
    for (const [key, color] of Object.entries(this.workstreamColors)) {
      if (workstream.startsWith(key)) return color;
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

  trackByGroup(_: number, group: SdlcExecGroup): string {
    return group.workstream;
  }

  trackByRow(index: number): number {
    return index;
  }

  buildEmailHtml(): string {
    const rows: string[] = [];
    for (const g of this.groups) {
      const color = this.getGroupColor(g.workstream);
      rows.push(
        `<tr><td colspan="3" style="background:${color.bg};border:1px solid #e1e4e8;padding:8px 12px;font-weight:700;color:${color.accent};font-size:13px;border-left:3px solid ${color.accent};">${this.esc(g.workstream)}</td></tr>`,
      );
      for (const r of g.rows) {
        rows.push(
          `<tr><td style="border:1px solid #e1e4e8;padding:8px 12px;font-size:13px;">${this.esc(r.scope)}</td><td style="border:1px solid #e1e4e8;padding:8px 12px;font-size:13px;">${this.esc(r.sprintUpdate)}</td><td style="border:1px solid #e1e4e8;padding:8px 12px;font-size:13px;text-align:center;">${this.getStatusLabel(r.status)}</td></tr>`,
        );
      }
    }
    const thStyle =
      'style="background:#f7f8fa;border:1px solid #e1e4e8;padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#6b7482;font-weight:700;"';
    return `<div style="border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.10),0 1.5px 6px rgba(0,0,0,0.06);overflow:hidden;display:block;width:100%;background:#fff;">
<table style="border-collapse:collapse;font-family:Inter,Arial,sans-serif;width:100%;">
<thead><tr>
<th ${thStyle}>Scope &amp; Deliverables</th>
<th ${thStyle}>Current Sprint Update</th>
<th ${thStyle}>Status</th>
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
          `  • ${r.scope}  |  Update: ${r.sprintUpdate}  |  Status: ${this.getStatusLabel(r.status)}`,
        );
      }
    }
    return `SDLC Execution Update — ${this.version?.sprintName || 'Current'}\n${lines.join('\n')}`;
  }
}
