import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.css'],
  standalone: true,
  imports: [CommonModule, IconComponent],
})
export class CheckboxComponent {
  @Input() checked: boolean = false;
  @Input() label?: string;
  @Input() isDisabled: boolean = false;

  @Output() checkedChange = new EventEmitter<boolean>();

  onToggle(): void {
    if (!this.isDisabled) {
      this.checked = !this.checked;
      this.checkedChange.emit(this.checked);
    }
  }
}
