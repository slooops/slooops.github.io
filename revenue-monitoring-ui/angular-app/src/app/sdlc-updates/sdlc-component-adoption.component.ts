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
  SdlcAdoptDataService,
  SdlcAdoptRow,
  SdlcAdoptGroup,
  EntityCell,
} from './sdlc-adopt-data.service';
import { STATUS_OPTIONS } from './sdlc-exec-update.component';

export const ENTITY_COLUMNS: {
  key: keyof Pick<
    SdlcAdoptRow,
    'pm' | 'om' | 'sm' | 'i2c' | 'p2p' | 'fpp' | 'ait' | 'capital'
  >;
  label: string;
}[] = [
  { key: 'pm', label: 'Product Management' },
  { key: 'om', label: 'OM' },
  { key: 'sm', label: 'SM' },
  { key: 'i2c', label: 'I2C, Tax & Revenue' },
  { key: 'p2p', label: 'P2P' },
  { key: 'fpp', label: 'FPP' },
  { key: 'ait', label: 'Accounting, Investments and Treasury' },
  { key: 'capital', label: 'Capital' },
];

@Component({
  selector: 'app-sdlc-component-adoption',
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
  templateUrl: './sdlc-component-adoption.component.html',
  styleUrls: ['../shared/scorecard.css', './sdlc-updates.css'],
})
export class SdlcComponentAdoptionComponent
  extends EditableTableBase<SdlcAdoptRow>
  implements OnInit, OnDestroy
{
  groups: SdlcAdoptGroup[] = [];
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
  defaultColor: ColorPair = { bg: '#f0f4f8', accent: '#555' };

  constructor(
    private dataService: SdlcAdoptDataService,
    authService: AuthenticationService,
    private dm: DestroyManager,
    router: Router,
  ) {
    super(authService, router, {
      editRoles: ['ADMIN', 'SCORECARD_ADMIN', 'SCORECARD'],
      adminRoles: ['ADMIN', 'SCORECARD_ADMIN'],
      draftKey: 'sdlc_adopt_draft',
      historyRoute: '/sdlc-adopt/history',
      archiveRoute: '/sdlc-adopt/archive',
      emailSubjectPrefix: 'SDLC Component Adoption',
    });
  }

  getAllRows(): SdlcAdoptRow[] {
    const rows: SdlcAdoptRow[] = [];
    for (const g of this.groups) {
      for (const r of g.rows) rows.push(r);
    }
    return rows;
  }

  restoreRows(rows: SdlcAdoptRow[]): void {
    this.groups = this.dataService.groupByWorkstream(rows);
  }

  loadRemoteData(): Observable<{
    version: TableVersion;
    rows: SdlcAdoptRow[];
  }> {
    return this.dataService.getCurrent(this.dm);
  }

  saveRemoteData(payload: {
    username: string;
    sprintName: string;
    notes: string;
    rows: SdlcAdoptRow[];
  }): Observable<any> {
    return this.dataService.save(payload);
  }

  canEditCell(): boolean {
    return this.isEditing && this.canEdit;
  }

  addRow(group: SdlcAdoptGroup): void {
    const maxSort = Math.max(...this.getAllRows().map((r) => r.sortOrder), 0);
    const emptyCell = (): EntityCell => ({ status: 'NA', pct: '' });
    group.rows.push({
      workstream: group.workstream,
      component: '',
      pm: emptyCell(),
      om: emptyCell(),
      sm: emptyCell(),
      i2c: emptyCell(),
      p2p: emptyCell(),
      fpp: emptyCell(),
      ait: emptyCell(),
      capital: emptyCell(),
      sortOrder: maxSort + 1,
    });
  }

  removeRow(group: SdlcAdoptGroup, index: number): void {
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

  getEntityCell(row: SdlcAdoptRow, key: string): EntityCell {
    return (row as any)[key];
  }

  trackByGroup(_: number, group: SdlcAdoptGroup): string {
    return group.workstream;
  }

  trackByRow(index: number): number {
    return index;
  }

  buildEmailHtml(): string {
    const rows: string[] = [];
    const colCount = this.entityColumns.length + 1;
    for (const g of this.groups) {
      const color = this.getGroupColor(g.workstream);
      rows.push(
        `<tr><td colspan="${colCount}" style="background:${color.bg};border:1px solid #e1e4e8;padding:8px 12px;font-weight:700;color:${color.accent};font-size:13px;border-left:3px solid ${color.accent};">${this.esc(g.workstream)}</td></tr>`,
      );
      for (const r of g.rows) {
        let rowHtml = `<tr><td style="border:1px solid #e1e4e8;padding:8px 12px;font-size:13px;">${this.esc(r.component)}</td>`;
        for (const col of this.entityColumns) {
          const cell = this.getEntityCell(r, col.key);
          const label = this.getStatusLabel(cell.status);
          const pct = cell.pct ? ` (${this.esc(cell.pct)})` : '';
          rowHtml += `<td style="border:1px solid #e1e4e8;padding:8px 12px;font-size:12px;text-align:center;">${label}${pct}</td>`;
        }
        rowHtml += '</tr>';
        rows.push(rowHtml);
      }
    }
    const thStyle =
      'style="background:#f7f8fa;border:1px solid #e1e4e8;padding:10px 14px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:#6b7482;font-weight:700;"';
    const entityHeaders = this.entityColumns
      .map((c) => `<th ${thStyle}>${this.esc(c.label)}</th>`)
      .join('');
    return `<div style="border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.10),0 1.5px 6px rgba(0,0,0,0.06);overflow:hidden;display:block;width:100%;background:#fff;">
<table style="border-collapse:collapse;font-family:Inter,Arial,sans-serif;width:100%;">
<thead><tr>
<th ${thStyle}>Component</th>
${entityHeaders}
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
        const cells = this.entityColumns
          .map((c) => {
            const cell = this.getEntityCell(r, c.key);
            const pct = cell.pct ? ` (${cell.pct})` : '';
            return `${c.label}: ${this.getStatusLabel(cell.status)}${pct}`;
          })
          .join('  |  ');
        lines.push(`  • ${r.component}  |  ${cells}`);
      }
    }
    return `SDLC Component Adoption — ${this.version?.sprintName || 'Current'}\n${lines.join('\n')}`;
  }
}
