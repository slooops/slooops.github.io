import { Component, Input } from '@angular/core';
import { BadgeVariant } from '../../types/common.types';

@Component({
  selector: 'app-badge',
  templateUrl: './badge.component.html',
  styleUrls: ['./badge.component.css'],
  standalone: true,
})
export class BadgeComponent {
  @Input() label: string = '';
  @Input() variant: BadgeVariant = 'default';

  get badgeClasses(): string {
    return `fit-badge fit-badge--${this.variant}`;
  }
}
