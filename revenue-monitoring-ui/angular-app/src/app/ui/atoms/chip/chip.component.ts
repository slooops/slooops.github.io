import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChipColor } from '../../types/common.types';

@Component({
  selector: 'app-chip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chip.component.html',
  styleUrls: ['./chip.component.css'],
})
export class ChipComponent {
  /** Text shown inside the chip (usually short: e.g. "OM", "CAPITAL"). */
  @Input() label = '';

  /** Semantic color variant. */
  @Input() color: ChipColor = 'neutral';

  /** When true, chip is styled as interactive and emits chipClick. */
  @Input() clickable = false;

  @Output() chipClick = new EventEmitter<MouseEvent>();

  onClick(event: MouseEvent): void {
    if (this.clickable) {
      this.chipClick.emit(event);
    }
  }
}
