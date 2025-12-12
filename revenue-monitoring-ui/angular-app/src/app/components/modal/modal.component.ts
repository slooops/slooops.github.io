import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.css'],
    imports: [
    CommonModule
  ],
  standalone: true
})
export class ModalComponent {
  @Input() title?: string;
  @Input() headerBgColor?: string; // e.g. "#def7ff" or "var(--blue-100)"
  @Input() borderRadius?: string; // e.g. "12px", "0px"

  @Output() close = new EventEmitter<void>();

  stopPropagation(event: MouseEvent) {
    event.stopPropagation();
  }

  emitClose() {
    this.close.emit();
  }
}
