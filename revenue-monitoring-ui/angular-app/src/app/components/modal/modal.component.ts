import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css'],
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
