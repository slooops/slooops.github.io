import { Component, Input, Output, EventEmitter } from '@angular/core';
import { UserFormData } from '../../types/common.types';
import { SelectOption } from '../../types/common.types';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css'],
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

  @Output() submit = new EventEmitter<UserFormData>();
  @Output() cancel = new EventEmitter<void>();

  formData: UserFormData = { ...this.value };

  ngOnInit(): void {
    this.formData = { ...this.value };
  }

  ngOnChanges(): void {
    this.formData = { ...this.value };
  }

  onUserNameChange(value: string): void {
    this.formData.userName = value;
  }

  onEmailChange(value: string): void {
    this.formData.email = value;
  }

  onRoleChange(value: string): void {
    // TODO: Implement multi-select when ready
    // For now, single role selection
    this.formData.roles = value ? [value] : [];
  }

  onEnabledChange(checked: boolean): void {
    this.formData.enabled = checked;
  }

  onSubmit(): void {
    // Basic validation
    if (!this.formData.userName || !this.formData.email) {
      alert('Please fill in all required fields');
      return;
    }

    this.submit.emit(this.formData);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
