import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.css'],
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
