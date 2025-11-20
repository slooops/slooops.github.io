import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from 'src/app/providers/http.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import {
  AdminUserRow,
  ColumnConfig,
  SelectOption,
  UserFormData,
} from '../../../ui/types/common.types';

@Component({
  selector: 'app-admin-user-table',
  templateUrl: './admin-user-table.component.html',
  styleUrls: ['./admin-user-table.component.css'],
})
export class AdminUserTableComponent implements OnInit {
  users: AdminUserRow[] = [];
  filteredUsers: AdminUserRow[] = [];
  selectedRows: any[] = [];

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
    this.http.get('user-roles', this.destroyManager).subscribe(
      (data: any) => {
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
    console.log('Row clicked:', row);
  }

  onSelectionChange(selectedRows: any[]): void {
    this.selectedRows = selectedRows;
    console.log('Selected rows:', this.selectedRows);
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
}
