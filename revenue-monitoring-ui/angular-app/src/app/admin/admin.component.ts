import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiHttpService } from 'src/app/providers/http.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { AdminUserRow, ColumnConfig, SelectOption, UserFormData } from '../ui';
import { AuthenticationService } from '../providers/authentication.service';
import { FilterBarComponent } from '../ui/compounds/filter-bar/filter-bar.component';
import { DataTableComponent } from '../ui/compounds/data-table/data-table.component';
import { ModalShellComponent } from '../ui/atoms/modal-shell/modal-shell.component';
import { UserFormComponent } from '../ui/compounds/user-form/user-form.component';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FilterBarComponent,
    DataTableComponent,
    ModalShellComponent,
    UserFormComponent,
  ],
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
  isSubAdminCreationMode: boolean = false; // True when creating a sub-admin
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
    { key: 'actions', label: 'Actions', isSortable: false },
  ];

  // Role options for filters and forms
  roleOptions: SelectOption[] = [];

  /**
   * Returns role options filtered for sub-admin creation.
   * Excludes:
   * - "All Roles" (empty value) - can't create admin for "all"
   * - "ADMIN" - can't create sub-admin of full admin
   * - Any role ending in "_ADMIN" - can't create admin of admin
   */
  get subAdminRoleOptions(): SelectOption[] {
    return this.roleOptions.filter(
      (option) =>
        option.value !== '' && // Exclude "All Roles"
        option.value !== 'ADMIN' && // Exclude full admin
        !option.value.endsWith('_ADMIN') // Exclude existing sub-admin roles
    );
  }

  // username: string = this.authService.getUserName();
  username: string = 'jasloop'; // For testing purposes

  // Sub-admin detection properties
  currentUserRoles: string[] = [];
  isFullAdmin: boolean = false;
  isSubAdminMode: boolean = false;
  managedRoles: string[] = []; // The roles this sub-admin manages (e.g., ["CASE_IQ_I2C", "CASE_IQ_SBP"])
  hasAdminAccess: boolean = false; // True if user is either full admin or sub-admin

  constructor(
    private http: ApiHttpService,
    private destroyManager: DestroyManager,
    private authService: AuthenticationService
  ) {}

  ngOnInit(): void {
    this.detectAdminPrivileges();
    this.loadUserRoles();
    console.log('Current User Roles:', this.currentUserRoles);
    console.log('Is Full Admin:', this.isFullAdmin);
    console.log('Is Sub-Admin Mode:', this.isSubAdminMode);
    console.log('Managed Roles:', this.managedRoles);
    console.log('username:', this.username);
  }

  /**
   * Detects admin privileges based on current user's roles.
   *
   * FULL_ADMIN: Has the "ADMIN" role - sees all users, can create sub-admins
   * SUB_ADMIN: Has a role ending in "_ADMIN" (e.g., "CASE_IQ_I2C_ADMIN")
   *            - Only sees users with their managed role (e.g., "CASE_IQ_I2C")
   *            - Can add/remove users for their managed role only
   *
   * Priority: FULL_ADMIN > SUB_ADMIN (if user has both, they get full access)
   */
  private detectAdminPrivileges(): void {
    this.currentUserRoles = this.authService.getRoles() || [];

    // Check for full admin first (highest privilege)
    this.isFullAdmin = this.currentUserRoles.includes('ADMIN');

    if (this.isFullAdmin) {
      // Full admin sees everything
      this.isSubAdminMode = false;
      this.managedRoles = [];
      this.hasAdminAccess = true; // Don't forget to set this before returning!
      return;
    }

    // Find ALL sub-admin roles (pattern: {ROLE}_ADMIN)
    const subAdminRoles = this.currentUserRoles.filter(
      (role) => role.endsWith('_ADMIN') && role !== 'ADMIN'
    );

    if (subAdminRoles.length > 0) {
      this.isSubAdminMode = true;
      // Extract managed roles: ["CASE_IQ_I2C_ADMIN", "CASE_IQ_SBP_ADMIN"] -> ["CASE_IQ_I2C", "CASE_IQ_SBP"]
      this.managedRoles = subAdminRoles.map((role) =>
        role.replace(/_ADMIN$/, '')
      );
    }

    // Set hasAdminAccess flag - true if user is full admin OR sub-admin
    this.hasAdminAccess = this.isFullAdmin || this.isSubAdminMode;
  }

  loadUserRoles(): void {
    // Guard: Don't load data if user has no admin access
    if (!this.hasAdminAccess) {
      this.users = [];
      this.filteredUsers = [];
      this.isLoading = false;
      return;
    }

    this.isLoading = true;

    // Build endpoint URL with optional managedRoles parameter for sub-admins
    let endpoint = 'admin-table';
    if (this.isSubAdminMode && this.managedRoles.length > 0) {
      // Pass comma-separated list of managed roles
      const rolesParam = this.managedRoles
        .map((r) => encodeURIComponent(r))
        .join(',');
      endpoint = `admin-table?managedRoles=${rolesParam}`;
    }

    this.http.get(endpoint, this.destroyManager).subscribe(
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
            creationDateRaw: user.CREATION_DATE, // Store raw DB value for exact matching
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
    this.isSubAdminCreationMode = false;
    this.currentUserData = {
      userName: '',
      email: '',
      roles: [],
      enabled: true,
    };
    this.isModalOpen = true;
  }

  /**
   * Opens modal in sub-admin creation mode.
   * The role entered will have "_ADMIN" appended automatically.
   */
  onCreateSubAdmin(): void {
    this.isEditMode = false;
    this.isSubAdminCreationMode = true;
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
  }

  onUserFormSubmit(formData: UserFormData): void {
    if (this.isEditMode) {
      this.closeModal();
      return;
    }

    // Extract the first role from the roles array (modal form sends array)
    let newRole =
      formData.roles && formData.roles.length > 0 ? formData.roles[0] : '';

    if (!newRole || newRole.trim().length === 0) {
      // This shouldn't happen if form validation works, but guard anyway
      return;
    }

    // If creating a sub-admin, append "_ADMIN" to the role
    // e.g., "CASE_IQ_I2C" becomes "CASE_IQ_OM_ADMIN"
    if (this.isSubAdminCreationMode) {
      newRole = newRole.toUpperCase().trim() + '_ADMIN';
    }

    // Reuse the same payload structure as inline form
    const payload = {
      userName: formData.userName.toUpperCase().trim(),
      userEmail: formData.email.trim(),
      roleId: null,
      userRole: this.isSubAdminCreationMode
        ? newRole
        : newRole.toUpperCase().trim(),
      enabledFlag: formData.enabled ? 'Y' : 'N',
      createdBy: this.username.toUpperCase(),
    };

    // DRY: Reuse the same POST endpoint
    this.http.post('user-role', payload, this.destroyManager).subscribe(
      (response: any) => {
        this.closeModal();
        this.loadUserRoles();
        // Success - could add a toast notification here
      },
      (error) => {
        console.error('Error creating new role:', error);

        // Extract error message from server response
        let errorMessage = 'Failed to create user role. Please try again.';

        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        // Show user-friendly error alert
        alert(`Error: ${errorMessage}`);

        // Keep modal open so user can correct the issue
      }
    );
  }

  onUserFormCancel(): void {
    this.closeModal();
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isSubAdminCreationMode = false; // Reset sub-admin mode when closing
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
      createdBy: this.username.toUpperCase(), // Current user creating this record (uppercase to match DB convention)
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

    // Prepare the payload with COMPOSITE KEY
    // userName + userRole uniquely identify which row to update
    const payload = {
      userName: updatedRow.userName,
      userRole: updatedRow.userRole,
      userEmail: updatedRow.userEmail,
      roleId: updatedRow.roleId,
      enabledFlag: updatedRow.enabledFlag,
    };

    console.log('PUT with composite key:', payload);
    console.log(
      'Will update WHERE userName=' +
        payload.userName +
        ' AND userRole=' +
        payload.userRole
    );

    // Send PUT request with composite key in body (no userId in URL)
    this.http.put('user-role', payload, this.destroyManager).subscribe(
      (response: any) => {
        console.log('✅ User updated successfully:', response);
        // Update the local state to reflect the change immediately
        // Find by userName + userRole combo (not userId)
        const userIndex = this.users.findIndex(
          (u) =>
            u.userName === updatedRow.userName &&
            u.userRole === updatedRow.userRole
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

  /**
   * Soft deletes a user role with forensic tracking.
   *
   * SOFT DELETE MECHANISM:
   * - Does NOT remove row from database
   * - Sets USER_EMAIL to "deleted by: {current user's username}"
   * - Sets ENABLED_FLAG to NULL
   * - GET query filters WHERE ENABLED_FLAG IS NOT NULL, so deleted rows won't appear
   *
   * This maintains a forensic audit trail while keeping the UI clean.
   */
  onDeleteRow(row: any): void {
    // Confirm deletion
    const confirmMessage = `Are you sure you want to delete ${row.userRole} role for ${row.userName}?`;
    if (!confirm(confirmMessage)) {
      return; // User cancelled
    }

    console.log('Soft deleting user role:', row);

    // Prepare payload with composite key, creation date, and deleter username
    const payload = {
      userName: row.userName,
      userRole: row.userRole,
      creationDate: row.creationDateRaw, // Use raw DB value for exact match
      deleterUsername: this.username, // Current logged-in user
    };

    console.log(
      '🗑️ Deleting:',
      payload.userName,
      '/',
      payload.userRole,
      'created:',
      payload.creationDate,
      'by',
      payload.deleterUsername
    );

    // Send DELETE request with composite key and deleter username
    // ApiHttpService.delete signature: delete(url, destroyManager, options)
    this.http
      .delete('user-role', this.destroyManager, { body: payload })
      .subscribe(
        (response: any) => {
          console.log('✅ User role soft deleted successfully:', response);
          console.log('Forensic note:', response.forensicNote);

          // Remove from local state immediately
          this.users = this.users.filter(
            (u) => !(u.userName === row.userName && u.userRole === row.userRole)
          );

          // Reapply filters to update the filtered view
          this.applyFilters();

          // TODO: Show success notification with forensic note
        },
        (error) => {
          console.error('❌ Error soft deleting user role:', error);
          // TODO: Show error notification
          // Reload data to ensure UI matches database state
          this.loadUserRoles();
        }
      );
  }
}
