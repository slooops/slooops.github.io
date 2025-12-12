import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-atmf-card',
    templateUrl: './atmf-card.component.html',
    styleUrls: ['./atmf-card.component.css'],
    imports: [
    CommonModule
  ],
  standalone: true
})
export class AtmfCardComponent {
  @Input() container: boolean = false; // Toggle between container and card
}
