import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressPillComponent } from '../../atoms/progress-pill/progress-pill.component';
import { PillColor } from '../../types/common.types';

export type KpiTileMode = 'pill' | 'plain';

@Component({
  selector: 'app-kpi-tile',
  standalone: true,
  imports: [CommonModule, ProgressPillComponent],
  templateUrl: './kpi-tile.component.html',
  styleUrls: ['./kpi-tile.component.css'],
})
export class KpiTileComponent {
  /** Small label at the top of the tile (e.g. "Case Analyzer Accuracy"). */
  @Input() title = '';

  /** `pill` renders a gradient progress-pill; `plain` renders a large numeric value. */
  @Input() mode: KpiTileMode = 'pill';

  /** Pill mode: fill percentage 0-100. */
  @Input() percentage = 0;

  /** Pill mode: gradient color variant. */
  @Input() color: PillColor = 'accent';

  /** Pill mode: text overlay on the pill (e.g. "1,582 / 4,757"). */
  @Input() pillText = '';

  /** Pill mode: percentage caption shown to the right of the pill. */
  @Input() pctText = '';

  /** Plain mode: single large value (e.g. "607"). */
  @Input() plainValue: string | number = '';
}
