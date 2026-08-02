import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectOption } from '../../types/common.types';

@Component({
  selector: 'app-multi-select-dropdown',
  templateUrl: './multi-select-dropdown.component.html',
  styleUrls: ['./multi-select-dropdown.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class MultiSelectDropdownComponent {
  @Input() options: SelectOption[] = [];
  @Input() selected: string[] = [];
  @Input() placeholder: string = 'Select...';
  @Input() label?: string;
  @Input() isDisabled: boolean = false;
  @Input() showSearch: boolean = true;
  @Input() singleSelect: boolean = false;

  @Output() selectionChange = new EventEmitter<string[]>();

  isOpen: boolean = false;
  searchTerm: string = '';

  constructor(private elRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
      this.searchTerm = '';
    }
  }

  get filteredOptions(): SelectOption[] {
    if (!this.searchTerm) return this.options;
    const term = this.searchTerm.toLowerCase();
    return this.options.filter((opt) => opt.label.toLowerCase().includes(term));
  }

  get displayText(): string {
    if (this.selected.length === 0) return this.placeholder;
    if (this.selected.length === 1) {
      const match = this.options.find((o) => o.value === this.selected[0]);
      return match ? match.label : this.selected[0];
    }
    return `${this.selected.length} selected`;
  }

  toggleDropdown(): void {
    if (this.isDisabled) return;
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      this.searchTerm = '';
    }
  }

  isSelected(value: string): boolean {
    return this.selected.includes(value);
  }

  toggleOption(value: string): void {
    const updated = this.isSelected(value)
      ? this.selected.filter((v) => v !== value)
      : this.singleSelect
        ? [value]
        : [...this.selected, value];
    this.selected = updated;
    this.selectionChange.emit(updated);

    if (this.singleSelect) {
      this.isOpen = false;
      this.searchTerm = '';
    }
  }

  clearAll(): void {
    this.selected = [];
    this.selectionChange.emit([]);
  }

  onSearchInput(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
  }
}
