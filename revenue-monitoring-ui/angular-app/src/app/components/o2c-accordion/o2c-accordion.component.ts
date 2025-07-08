import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-o2c-accordion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './o2c-accordion.component.html',
  styleUrl: './o2c-accordion.component.css',
})
export class O2cAccordionComponent {
  @Input() title: string = '';
  @Input() isOpen: boolean = false;
  @Output() toggleOpen = new EventEmitter<void>();

  toggle(): void {
    this.toggleOpen.emit();
  }
}
