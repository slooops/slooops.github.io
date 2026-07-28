import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChipComponent } from '../../atoms/chip/chip.component';
import { ProgressPillComponent } from '../../atoms/progress-pill/progress-pill.component';
import {
  ChipColor,
  PillColor,
  StatTableColumn,
} from '../../types/common.types';

export interface StatTableCellChip {
  label: string;
  color: ChipColor;
  clickable?: boolean;
}

export interface StatTableCellProgressPill {
  percentage: number;
  color: PillColor;
  label: string;
  clickable?: boolean;
}

export interface StatTableCellNumberWithSub {
  main: string | number;
  sub?: string | number;
  pct?: number | null;
}

export interface StatTableCellLink {
  label: string;
}

export interface StatTableEvent {
  row: Record<string, unknown>;
  column: string;
}

@Component({
  selector: 'app-stat-table',
  standalone: true,
  imports: [CommonModule, ChipComponent, ProgressPillComponent],
  templateUrl: './stat-table.component.html',
  styleUrls: ['./stat-table.component.css'],
})
export class StatTableComponent {
  /** Column definitions including per-column renderer type and alignment. */
  @Input() columns: StatTableColumn[] = [];

  /** Row data keyed by column.key. Cell values follow the shape required by the renderer. */
  @Input() rows: Record<string, unknown>[] = [];

  @Output() chipClick = new EventEmitter<StatTableEvent>();
  @Output() pillClick = new EventEmitter<StatTableEvent>();
  @Output() linkClick = new EventEmitter<StatTableEvent>();

  asChip(value: unknown): StatTableCellChip | null {
    return value && typeof value === 'object'
      ? (value as StatTableCellChip)
      : null;
  }

  asPill(value: unknown): StatTableCellProgressPill | null {
    return value && typeof value === 'object'
      ? (value as StatTableCellProgressPill)
      : null;
  }

  asNumberWithSub(value: unknown): StatTableCellNumberWithSub | null {
    return value && typeof value === 'object'
      ? (value as StatTableCellNumberWithSub)
      : null;
  }

  asLink(value: unknown): StatTableCellLink | null {
    return value && typeof value === 'object'
      ? (value as StatTableCellLink)
      : null;
  }

  asPrimitive(value: unknown): string | number | null {
    if (value == null) return null;
    if (typeof value === 'string' || typeof value === 'number') return value;
    return null;
  }
}
