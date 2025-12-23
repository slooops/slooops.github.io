import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-toggle-switch',
  templateUrl: './toggle-switch.component.html',
  styleUrls: ['./toggle-switch.component.css'],
})
export class ToggleSwitchComponent {
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
