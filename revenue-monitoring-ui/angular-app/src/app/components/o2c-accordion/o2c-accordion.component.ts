import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';


@Component({
    selector: 'app-o2c-accordion',
    templateUrl: './o2c-accordion.component.html',
    styleUrl: './o2c-accordion.component.css',
    imports: [
    CommonModule
  ],
  standalone: true
})
export class O2cAccordionComponent {
  @Input() title: string = '';
  @Input() isOpen: boolean = false;
  @Input() linkHref: string = '';
  @Input() linkText: string = 'View Details';
  @Output() toggleOpen = new EventEmitter<void>();
  @Output() linkClick = new EventEmitter<void>(); // Add this

  toggle(): void {
    this.toggleOpen.emit();
  }

  onLinkClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.linkClick.emit();
  }

  get hasLink(): boolean {
    return !!this.linkHref;
  }
}
