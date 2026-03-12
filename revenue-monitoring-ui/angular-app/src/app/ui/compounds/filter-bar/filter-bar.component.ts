import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectOption } from '../../types/common.types';
import { TextInputComponent } from '../../atoms/text-input/text-input.component';
import { MultiSelectDropdownComponent } from '../../atoms/multi-select-dropdown/multi-select-dropdown.component';
import { ButtonComponent } from '../../atoms/button/button.component';

@Component({
  selector: 'app-filter-bar',
  templateUrl: './filter-bar.component.html',
  styleUrls: ['./filter-bar.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    TextInputComponent,
    MultiSelectDropdownComponent,
    ButtonComponent,
  ],
})
export class FilterBarComponent {
  @Input() searchValue: string = '';
  @Input() roleOptions: SelectOption[] = [];
  @Input() selectedRoles: string[] = [];
  @Input() selectedStatuses: string[] = [];
  @Input() isFullAdmin: boolean = false;
  @Input() canCreateSubAdmin: boolean = false;
  @Input() totalCount: number = 0;
  @Input() selectedCount: number = 0;

  @Output() searchChange = new EventEmitter<string>();
  @Output() roleFilterChange = new EventEmitter<string[]>();
  @Output() enabledFilterChange = new EventEmitter<string[]>();
  @Output() addUserClick = new EventEmitter<void>();
  @Output() addLineItemClick = new EventEmitter<void>();
  @Output() createSubAdminClick = new EventEmitter<void>();
  @Output() bulkUpdateClick = new EventEmitter<void>();

  statusOptions: SelectOption[] = [
    { label: 'Enabled', value: 'Y' },
    { label: 'Disabled', value: 'N' },
  ];

  onSearchChange(value: string): void {
    this.searchChange.emit(value);
  }

  onRoleChange(values: string[]): void {
    this.roleFilterChange.emit(values);
  }

  onStatusChange(values: string[]): void {
    this.enabledFilterChange.emit(values);
  }

  onAddUser(): void {
    this.addUserClick.emit();
  }

  onAddLineItem(): void {
    this.addLineItemClick.emit();
  }

  onCreateSubAdmin(): void {
    this.createSubAdminClick.emit();
  }

  onBulkUpdate(): void {
    this.bulkUpdateClick.emit();
  }
}
