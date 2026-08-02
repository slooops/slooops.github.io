import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PillColor, PillSize } from '../../types/common.types';

@Component({
  selector: 'app-progress-pill',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-pill.component.html',
  styleUrls: ['./progress-pill.component.css'],
})
export class ProgressPillComponent {
  /** Fill percentage (0-100). Values outside this range are clamped. */
  @Input() percentage = 0;

  /** Gradient color variant of the fill. */
  @Input() color: PillColor = 'accent';

  /** Text overlay centered on the pill. */
  @Input() label = '';

  /** Height / typography size of the pill. */
  @Input() size: PillSize = 'md';

  /** When true, the pill responds to hover and emits pillClick. */
  @Input() clickable = false;

  @Output() pillClick = new EventEmitter<MouseEvent>();

  get fillWidth(): number {
    return Math.max(0, Math.min(100, this.percentage));
  }

  onClick(event: MouseEvent): void {
    if (this.clickable) {
      this.pillClick.emit(event);
    }
  }
}
