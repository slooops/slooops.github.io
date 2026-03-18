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
  selector: 'app-single-select-dropdown',
  templateUrl: './single-select-dropdown.component.html',
  styleUrls: ['./single-select-dropdown.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class SingleSelectDropdownComponent {
  @Input() options: SelectOption[] = [];
  @Input() selected: string = '';
  @Input() placeholder: string = 'Select...';
  @Input() label?: string;
  @Input() isDisabled: boolean = false;
  @Input() showSearch: boolean = true;

  @Output() selectionChange = new EventEmitter<string>();

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
    if (!this.selected) return this.placeholder;
    const match = this.options.find((o) => o.value === this.selected);
    return match ? match.label : this.selected;
  }

  toggleDropdown(): void {
    if (this.isDisabled) return;
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      this.searchTerm = '';
    }
  }

  selectOption(value: string): void {
    this.selected = value;
    this.selectionChange.emit(value);
    this.isOpen = false;
    this.searchTerm = '';
  }

  onSearchInput(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
  }
}
