import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ButtonVariant,
  ButtonSize,
  IconPosition,
} from '../../types/common.types';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css'],
  standalone: true,
  imports: [CommonModule, IconComponent],
})
export class ButtonComponent {
  @Input() label: string = '';
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() isDisabled: boolean = false;
  @Input() isLoading: boolean = false;
  @Input() iconName?: string;
  @Input() iconPosition: IconPosition = 'left';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  @Output() clicked = new EventEmitter<MouseEvent>();

  get buttonClasses(): string {
    const classes = ['fit-btn'];

    if (this.variant !== 'primary') {
      classes.push(`fit-btn--${this.variant}`);
    }

    if (this.isLoading) {
      classes.push('fit-btn--loading');
    }

    if (this.iconName && this.iconPosition === 'left') {
      classes.push('fit-btn--icon-left');
    }

    if (this.iconName && this.iconPosition === 'right') {
      classes.push('fit-btn--icon-right');
    }

    return classes.join(' ');
  }

  handleClick(event: MouseEvent): void {
    if (!this.isDisabled && !this.isLoading) {
      this.clicked.emit(event);
    }
  }
}
