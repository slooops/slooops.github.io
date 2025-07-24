import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-table-filter',
  templateUrl: './table-filter.component.html',
  styleUrls: ['./table-filter.component.css'],
})
export class TableFilterComponent {
  @Input() columnLabel = 'USD';
  @Input() options: SimpleFilterOption[] = [];
  @Output() optionSelected = new EventEmitter<string>();

  isOpen = false;

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  selectOption(value: string) {
    this.optionSelected.emit(value);
    this.isOpen = false;
  }
}

export interface SimpleFilterOption {
  label: string;
  value: string;
}
