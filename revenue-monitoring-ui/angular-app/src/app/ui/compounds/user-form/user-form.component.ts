import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserFormData } from '../../types/common.types';
import { SelectOption } from '../../types/common.types';
import { TextInputComponent } from '../../atoms/text-input/text-input.component';
import { MultiSelectDropdownComponent } from '../../atoms/multi-select-dropdown/multi-select-dropdown.component';
import { ToggleSwitchComponent } from '../../atoms/toggle-switch/toggle-switch.component';
import { ButtonComponent } from '../../atoms/button/button.component';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    TextInputComponent,
    MultiSelectDropdownComponent,
    ToggleSwitchComponent,
    ButtonComponent,
  ],
})
export class UserFormComponent {
  @Input() value: UserFormData = {
    userName: '',
    email: '',
    roles: [],
    enabled: true,
  };
  @Input() roleOptions: SelectOption[] = [];
  @Input() isEdit: boolean = false;
  @Input() roleFieldLabel: string = 'Role'; // Customizable label for the role field
  @Input() useRoleDropdown: boolean = false; // When true, show dropdown instead of text input

  @Output() submit = new EventEmitter<UserFormData>();
  @Output() cancel = new EventEmitter<void>();

  formData: UserFormData = { ...this.value };
  private isDirty: boolean = false; // Track if user has interacted with the form

  ngOnInit(): void {
    this.formData = { ...this.value };
    this.isDirty = false;
  }

  ngOnChanges(): void {
    // Only reset formData if user hasn't started editing
    // Once dirty, never reset until component is destroyed/recreated
    if (!this.isDirty) {
      this.formData = { ...this.value };
    }
  }

  onUserNameChange(value: string): void {
    this.isDirty = true;
    this.formData.userName = value;
  }

  onEmailChange(value: string): void {
    this.isDirty = true;
    this.formData.email = value;
  }

  onRoleChange(value: string): void {
    this.isDirty = true;
    this.formData.roles = value ? [value] : [];
  }

  onMultiRoleChange(values: string[]): void {
    this.isDirty = true;
    this.formData.roles = values;
  }

  onEnabledChange(checked: boolean): void {
    this.isDirty = true;
    this.formData.enabled = checked;
  }

  onSubmit(event: Event): void {
    // CRITICAL: Prevent native form submit from bubbling up
    // This stops the double-submit bug where parent catches both:
    // 1. Our @Output() submit EventEmitter (correct)
    // 2. Native form submit event bubbling up (wrong - passes Event object)
    event.preventDefault();
    event.stopPropagation();

    // Basic validation
    if (!this.formData.userName || !this.formData.email) {
      alert('Please fill in all required fields (username and email)');
      return;
    }

    // Role validation - required when using dropdown (sub-admin mode)
    if (
      this.useRoleDropdown &&
      (!this.formData.roles ||
        this.formData.roles.length === 0 ||
        !this.formData.roles[0])
    ) {
      alert('Please select a role to manage');
      return;
    }

    this.submit.emit(this.formData);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
