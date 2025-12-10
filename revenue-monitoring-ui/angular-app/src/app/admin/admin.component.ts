import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from 'src/app/providers/http.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { AdminUserRow, ColumnConfig, SelectOption, UserFormData } from '../ui';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  users: AdminUserRow[] = [];
  filteredUsers: AdminUserRow[] = [];
  editableRow: any | null = null;
  isLoading: boolean = false;

  // Validation state for editable row
  validationErrors: {
    userName?: string;
    userEmail?: string;
    userRole?: string;
  } = {};

  // Filters
  searchValue: string = '';
  selectedRole: string = '';
  enabledFilter: string = '';

  // Modal state
  isModalOpen: boolean = false;
  isEditMode: boolean = false;
  currentUserData: UserFormData = {
    userName: '',
    email: '',
    roles: [],
    enabled: true,
  };

  // Table columns
  columns: ColumnConfig[] = [
    { key: 'userName', label: 'Username', isSortable: true },
    { key: 'userEmail', label: 'Email', isSortable: true },
    { key: 'userRole', label: 'Role', isSortable: true, isFilterable: true },
    { key: 'enabledFlag', label: 'Status', isSortable: true },
    { key: 'creationDate', label: 'Created Date', isSortable: true },
  ];

  // Role options for filters and forms
  roleOptions: SelectOption[] = [];

  constructor(
    private http: ApiHttpService,
    private destroyManager: DestroyManager
  ) {}

  ngOnInit(): void {
    this.loadUserRoles();
  }

  loadUserRoles(): void {
    this.isLoading = true;
    this.http.get('admin-table', this.destroyManager).subscribe(
      (data: any) => {
        this.isLoading = false;
        if (Array.isArray(data)) {
          this.users = data.map((user) => ({
            userId: user.USER_ID,
            userName: user.USER_NAME,
            roleId: user.ROLE_ID,
            userRole: user.USER_ROLE,
            enabledFlag: user.ENABLED_FLAG,
            creationDate: new Date(user.CREATION_DATE),
            userEmail: user.USER_EMAIL,
          }));

          // Extract unique roles for filter dropdown
          const uniqueRoles = [...new Set(this.users.map((u) => u.userRole))];
          this.roleOptions = [
            { label: 'All Roles', value: '' },
            ...uniqueRoles.map((role) => ({ label: role, value: role })),
          ];

          this.applyFilters();
        } else {
          console.error('Unexpected data format:', data);
        }
      },
      (error) => {
        this.isLoading = false;
        console.error('Error loading user roles:', error);
        // TODO: Show error notification
      }
    );
  }

  applyFilters(): void {
    let filtered = [...this.users];

    // Apply search filter
    if (this.searchValue) {
      const searchLower = this.searchValue.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.userName.toLowerCase().includes(searchLower) ||
          user.userEmail.toLowerCase().includes(searchLower) ||
          user.userRole.toLowerCase().includes(searchLower)
      );
    }

    // Apply role filter
    if (this.selectedRole) {
      filtered = filtered.filter((user) => user.userRole === this.selectedRole);
    }

    // Apply enabled filter
    if (this.enabledFilter) {
      filtered = filtered.filter(
        (user) => user.enabledFlag === this.enabledFilter
      );
    }

    this.filteredUsers = filtered;
  }

  onSearchChange(value: string): void {
    this.searchValue = value;
    this.applyFilters();
  }

  onRoleFilterChange(role: string): void {
    this.selectedRole = role;
    this.applyFilters();
  }

  onEnabledFilterChange(enabled: string): void {
    this.enabledFilter = enabled;
    this.applyFilters();
  }

  onAddUser(): void {
    this.isEditMode = false;
    this.currentUserData = {
      userName: '',
      email: '',
      roles: [],
      enabled: true,
    };
    this.isModalOpen = true;
  }

  onRowClick(row: AdminUserRow): void {
    // TODO: Implement row click behavior (e.g., edit user)
    // console.log('Row clicked:', row);
  }

  onUserFormSubmit(formData: UserFormData): void {
    if (this.isEditMode) {
      // TODO: Implement update user API call
      console.log('Update user:', formData);
      // this.http.put(`user-role/${formData.userId}`, formData, this.destroyManager).subscribe(...)
    } else {
      // TODO: Implement create user API call
      console.log('Create user:', formData);
      // this.http.post('user-role', formData, this.destroyManager).subscribe(...)
    }

    this.closeModal();
    // After successful save, reload the data
    // this.loadUserRoles();
  }

  onUserFormCancel(): void {
    this.closeModal();
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  onAddLineItem(): void {
    // Initialize a new editable row with empty values
    this.editableRow = {
      userId: null,
      userName: '',
      roleId: null,
      userRole: '',
      enabledFlag: 'Y',
      creationDate: new Date(),
      userEmail: '',
    };
    // Reset validation errors
    this.validationErrors = {};
  }

  /**
   * Validates email format using regex
   * Returns true if valid, false if invalid
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * Validates username:
   * - Must be one word (no spaces)
   * - Must not be empty
   * - Automatically trims whitespace
   */
  private validateUsername(username: string): {
    valid: boolean;
    sanitized: string;
  } {
    const uppercase = username.toUpperCase();
    const trimmed = uppercase.trim();
    const hasSpaces = /\s/.test(trimmed);
    const valid = trimmed.length > 0 && !hasSpaces;
    return { valid, sanitized: trimmed };
  }

  /**
   * Validates and sanitizes role:
   * - Must not be empty
   * - Automatically converts to uppercase
   */
  private validateRole(role: string): { valid: boolean; sanitized: string } {
    const sanitized = role.trim().toUpperCase();
    const valid = sanitized.length > 0;
    return { valid, sanitized };
  }

  /**
   * Validates entire editable row before saving
   * Updates validationErrors object with specific error messages
   * Returns true if all fields are valid
   */
  private validateEditableRow(): boolean {
    this.validationErrors = {};
    let isValid = true;

    // Validate username
    const usernameValidation = this.validateUsername(this.editableRow.userName);
    if (!usernameValidation.valid) {
      this.validationErrors.userName =
        this.editableRow.userName.trim().length === 0
          ? 'Username is required'
          : 'Username must be one word (no spaces)';
      isValid = false;
    } else {
      // Update with sanitized value
      this.editableRow.userName = usernameValidation.sanitized;
    }

    // Validate email
    if (
      !this.editableRow.userEmail ||
      this.editableRow.userEmail.trim().length === 0
    ) {
      this.validationErrors.userEmail = 'Email is required';
      isValid = false;
    } else if (!this.validateEmail(this.editableRow.userEmail)) {
      this.validationErrors.userEmail = 'Invalid email format';
      isValid = false;
    }

    // Validate role
    const roleValidation = this.validateRole(this.editableRow.userRole);
    if (!roleValidation.valid) {
      this.validationErrors.userRole = 'Role is required';
      isValid = false;
    } else {
      // Update with sanitized value (uppercase)
      this.editableRow.userRole = roleValidation.sanitized;
    }

    return isValid;
  }

  onSaveRow(row: any): void {
    console.log('Attempting to save new user row:', row);

    // Validate the row before sending to backend
    if (!this.validateEditableRow()) {
      console.warn('Validation failed:', this.validationErrors);
      return; // Don't proceed if validation fails
    }

    console.log('Validation passed, sending POST request...');

    // Prepare the payload to match backend expectations
    const payload = {
      userName: this.editableRow.userName, // Already trimmed and sanitized
      userEmail: this.editableRow.userEmail.trim(),
      roleId: this.editableRow.roleId || null,
      userRole: this.editableRow.userRole, // Already uppercase and sanitized
      enabledFlag: this.editableRow.enabledFlag || 'Y',
    };

    console.log('POST payload:', payload);

    this.http.post('user-role', payload, this.destroyManager).subscribe(
      (response: any) => {
        console.log('✅ User created successfully:', response);
        // Reload the table to show the new user
        this.loadUserRoles();
        // Clear the editable row and validation errors
        this.editableRow = null;
        this.validationErrors = {};
        // TODO: Show success notification to user
      },
      (error) => {
        console.error('❌ Error creating user:', error);
        // TODO: Show error notification to user
        // Keep the editable row open so user can correct errors
      }
    );
  }

  onCancelEdit(): void {
    console.log('Cancelled edit');
    this.editableRow = null;
  }

  onEnabledFlagChange(event: { row: any; enabled: boolean }): void {
    const updatedRow = {
      ...event.row,
      enabledFlag: event.enabled ? 'Y' : 'N',
    };
    console.log('Enabled flag changed, sending PUT request:', updatedRow);

    // Prepare the payload for the PUT request
    const payload = {
      userName: updatedRow.userName,
      userEmail: updatedRow.userEmail,
      roleId: updatedRow.roleId,
      userRole: updatedRow.userRole,
      enabledFlag: updatedRow.enabledFlag,
    };

    // Send PUT request to update the user's enabled flag
    this.http
      .put(`user-role/${updatedRow.userId}`, payload, this.destroyManager)
      .subscribe(
        (response: any) => {
          console.log('✅ User updated successfully:', response);
          // Update the local state to reflect the change immediately
          const userIndex = this.users.findIndex(
            (u) => u.userId === updatedRow.userId
          );
          if (userIndex !== -1) {
            this.users[userIndex].enabledFlag = updatedRow.enabledFlag;
          }
          // Reapply filters to update the filtered view
          this.applyFilters();
          // TODO: Show success notification
        },
        (error) => {
          console.error('❌ Error updating user:', error);
          // TODO: Show error notification and revert toggle
          // Reload data to ensure UI matches database state
          this.loadUserRoles();
        }
      );
  }
}
