import { Component, HostBinding, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css'],
  imports: [CommonModule],
  standalone: true,
})
export class CardComponent {
  @Input() container: boolean = false; // Toggle between container and card
  @Input() set darkMode(val: boolean) {
    this._darkMode = val;
  }
  @HostBinding('class.dark-theme') _darkMode = false;
}
