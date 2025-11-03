import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-atmf-card',
  templateUrl: './atmf-card.component.html',
  styleUrls: ['./atmf-card.component.css'],
})
export class AtmfCardComponent {
  @Input() container: boolean = false; // Toggle between container and card
}
