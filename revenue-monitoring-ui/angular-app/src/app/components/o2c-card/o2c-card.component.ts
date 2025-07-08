import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-o2c-card',
  templateUrl: './o2c-card.component.html',
  styleUrl: './o2c-card.component.css',
})
export class O2cCardComponent {
  @Input() title: string = 'Title';
  @Input() count: number = 0;
  @Input() value: string = '0';
  @Input() footer: string = 'Footer Text';

  @Input() countDoubleWide?: number;
  @Input() valueDoubleWide?: string;
  @Input() footerDoubleWide?: string;
}
