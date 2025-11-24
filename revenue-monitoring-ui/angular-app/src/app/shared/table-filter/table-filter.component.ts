import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  OnChanges,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-table-filter',
  templateUrl: './table-filter.component.html',
  styleUrls: ['./table-filter.component.css'],
})
export class TableFilterComponent implements OnInit, OnChanges {
  @Input() columnLabel = 'USD';
  @Input() options: SimpleFilterOption[] = [];
  @Input() isOpen = false; // Add this input to control visibility from parent
  @Input() currentValue = ''; // Add this to receive current filter value
  @Output() optionSelected = new EventEmitter<string>();
  @Output() clickOutside = new EventEmitter<void>();

  selectedOption: string = '';

  ngOnInit(): void {
    // Use currentValue if provided, otherwise fall back to default
    if (this.currentValue) {
      this.selectedOption = this.currentValue;
    } else {
      const defaultOption = this.options.find((opt) => opt.default);
      if (defaultOption) {
        this.selectedOption = defaultOption.value;
      }
    }
  }

  ngOnChanges(): void {
    // Update selectedOption when currentValue changes
    if (this.currentValue) {
      this.selectedOption = this.currentValue;
    }
  }

  // Remove toggleDropdown() method since parent controls visibility now

  selectOption(option: any) {
    this.selectedOption = option.value;
    this.optionSelected.emit(option.value);
    // Don't set isOpen = false here, let parent handle it
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (
      !target.closest('app-table-filter') &&
      !target.closest('.filter-trigger-btn')
    ) {
      this.clickOutside.emit();
    }
  }
}

export interface SimpleFilterOption {
  label: string;
  value: string;
  default: boolean;
}
