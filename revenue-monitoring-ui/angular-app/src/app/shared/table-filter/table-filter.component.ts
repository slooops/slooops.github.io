import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-table-filter',
  templateUrl: './table-filter.component.html',
  styleUrls: ['./table-filter.component.css'],
})
export class TableFilterComponent implements OnInit {
  @Input() columnLabel = 'USD';
  @Input() options: SimpleFilterOption[] = [];
  @Output() optionSelected = new EventEmitter<string>();

  isOpen = false;
  selectedOption: string = '';

  ngOnInit(): void {
    const defaultOption = this.options.find((opt) => opt.default);
    if (defaultOption) {
      this.selectedOption = defaultOption.value;
    }
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  selectOption(option: any) {
    this.selectedOption = option.value;
    this.optionSelected.emit(option.value);
    this.isOpen = false;
  }
}

export interface SimpleFilterOption {
  label: string;
  value: string;
  default: boolean;
}
