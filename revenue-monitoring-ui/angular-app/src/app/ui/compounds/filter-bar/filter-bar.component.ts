import { Component, Input, Output, EventEmitter } from '@angular/core';
import { SelectOption } from '../../types/common.types';

@Component({
  selector: 'app-filter-bar',
  templateUrl: './filter-bar.component.html',
  styleUrls: ['./filter-bar.component.css'],
})
export class FilterBarComponent {
  @Input() searchValue: string = '';
  @Input() roleOptions: SelectOption[] = [];
  @Input() selectedRole: string = '';
  @Input() enabledFilter: string = '';

  @Output() searchChange = new EventEmitter<string>();
  @Output() roleFilterChange = new EventEmitter<string>();
  @Output() enabledFilterChange = new EventEmitter<string>();
  @Output() addUserClick = new EventEmitter<void>();

  enabledOptions: SelectOption[] = [
    { label: 'All', value: '' },
    { label: 'Enabled', value: 'Y' },
    { label: 'Disabled', value: 'N' },
  ];

  onSearchChange(value: string): void {
    this.searchChange.emit(value);
  }

  onRoleChange(value: string): void {
    this.roleFilterChange.emit(value);
  }

  onEnabledChange(value: string): void {
    this.enabledFilterChange.emit(value);
  }

  onAddUser(): void {
    this.addUserClick.emit();
  }
}
