import { Component, HostBinding, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiHttpService } from 'src/app/providers/http.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { DataService, PeriodStatus } from 'src/app/providers/data.service';
import { ThemeService } from 'src/app/providers/theme.service';
import {
  AdminUserRow,
  ColumnConfig,
  PageChangeEvent,
  SelectOption,
  UserFormData,
} from '../ui';
import { PaginationComponent } from '../ui/atoms/pagination/pagination.component';
import { AuthenticationService } from '../providers/authentication.service';
import { FilterBarComponent } from '../ui/compounds/filter-bar/filter-bar.component';
import { ModalShellComponent } from '../ui/atoms/modal-shell/modal-shell.component';
import { ToggleSwitchComponent } from '../ui/atoms/toggle-switch/toggle-switch.component';
import { MultiSelectDropdownComponent } from '../ui/atoms/multi-select-dropdown/multi-select-dropdown.component';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorCaretDownBold,
  phosphorPlusBold,
  phosphorTrashBold,
  phosphorCheckBold,
  phosphorXBold,
} from '@ng-icons/phosphor-icons/bold';
import { AnalyticsDashboardComponent } from '../analytics-dashboard/analytics-dashboard.component';
import {
  UpdateRoleDialogComponent,
  RoleRow,
} from './update-role-dialog/update-role-dialog.component';

/** Grouped user: one row per unique userName, with all their role rows inside */
export interface GroupedUser {
  userName: string;
  userEmail: string;
  roles: AdminUserRow[]; // all role rows for this user
  allRoleNames: string[]; // e.g. ["ADMIN", "PERIOD_CLOSE", "LARGE_DEAL"]
  enabledRoleNames: string[]; // only roles with enabledFlag === 'Y'
  isAnyEnabled: boolean; // true if at least one role has enabledFlag === 'Y'
  latestDate: Date; // most recent creationDate across all roles
  isExpanded: boolean; // UI state for expand/collapse
}

/** Raw row from GET /api/user-access-list */
export interface UserAccessRow {
  USER_ID: number;
  USER_NAME: string;
  USER_EMAIL: string;
  FULL_NAME: string;
  ROLE_ID: number;
  ROLE_NAME: string;
  DASHBOARD_NAME: string;
  ENABLED_FLAG: string;
  ADMIN: string;
  READ_ONLY: string;
  CREATED_BY: string;
  CREATION_DATE: string;
  LAST_UPDATED_BY: string;
  LAST_UPDATED_DATE: string;
}

/** Grouped user for the access list table */
export interface GroupedAccessUser {
  userName: string;
  userEmail: string;
  fullName: string;
  rows: UserAccessRow[];
  allDashboardNames: string[];
  enabledDashboardNames: string[];
  isAnyEnabled: boolean;
  isAnyAdmin: boolean;
  isAnyReadOnly: boolean;
  latestDate: Date;
  isExpanded: boolean;
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  standalone: true,
  providers: [
    provideIcons({
      phosphorCaretDownBold,
      phosphorPlusBold,
      phosphorTrashBold,
      phosphorCheckBold,
      phosphorXBold,
    }),
    DatePipe,
  ],
  imports: [
    CommonModule,
    FormsModule,
    FilterBarComponent,
    ModalShellComponent,
    ToggleSwitchComponent,
    MultiSelectDropdownComponent,
    NgIcon,
    PaginationComponent,
    AnalyticsDashboardComponent,
    UpdateRoleDialogComponent,
  ],
})
export class AdminComponent implements OnInit {
  users: AdminUserRow[] = [];
  filteredUsers: AdminUserRow[] = [];
  groupedUsers: GroupedUser[] = [];
  filteredGroupedUsers: GroupedUser[] = [];
  paginatedGroupedUsers: GroupedUser[] = [];
  currentPage: number = 0;
  pageSize: number = 10;
  editableRow: any | null = null;
  showInlineRow: boolean = false;
  selectedInlineRoles: string[] = [];
  inlineSaving: boolean = false;
  isLoading: boolean = false;

  // Update Role view
  allRoles: RoleRow[] = [];
  showRoleView = false;

  // ── User Access List table state ──
  accessUsers: UserAccessRow[] = [];
  filteredAccessGrouped: GroupedAccessUser[] = [];
  paginatedAccessGrouped: GroupedAccessUser[] = [];
  accessCurrentPage = 0;
  accessPageSize = 10;
  accessSearchValue = '';
  isAccessLoading = false;
  accessRoleOptions: SelectOption[] = [];
  accessSelectedRoles: string[] = [];
  accessSelectedStatuses: string[] = [];

  // ── Access Delete Confirmation Dialog state ──
  showAccessDeleteDialog = false;
  accessDeletingRow: UserAccessRow | null = null;
  accessDeletingGroup: GroupedAccessUser | null = null;
  accessDeleteLoading = false;

  // ── Access Bulk selection & update state ──
  selectedAccessGroupUserNames: Set<string> = new Set();
  isAccessBulkModalOpen: boolean = false;
  accessBulkRolesToDelete: string[] = [];
  accessBulkRolesToAdd: string[] = [];
  accessBulkSaving: boolean = false;

  // Inline add-role for existing user (per-group)
  addRoleForGroup: string | null = null; // userName of group with active inline add-role
  selectedGroupAddRoles: string[] = [];
  groupAddRoleSaving: boolean = false;
  groupAddValidationError: string = '';

  // Inline add-role for access table (per-group)
  accessAddRoleForGroup: string | null = null;
  selectedAccessAddRoleId: number | null = null;
  accessAddRoleSaving: boolean = false;
  accessAddValidationError: string = '';

  // Inline add-user for access table
  showAccessAddUserRow: boolean = false;
  accessNewUser = { userName: '', fullName: '', userEmail: '' };
  accessNewUserSelectedRoles: string[] = []; // role IDs as strings
  accessNewUserSaving: boolean = false;
  accessNewUserValidationErrors: {
    userName?: string;
    fullName?: string;
    roles?: string;
  } = {};

  // Bulk selection & update state
  selectedGroupUserNames: Set<string> = new Set();
  isBulkModalOpen: boolean = false;
  bulkRolesToDelete: string[] = [];
  bulkRolesToAdd: string[] = [];
  bulkSaving: boolean = false;

  // Bulk add users state
  isBulkAddUsersModalOpen: boolean = false;
  bulkAddSelectedRoles: string[] = [];
  bulkAddFullNames: string = '';
  bulkAddUsernames: string = '';
  bulkAddSaving: boolean = false;
  bulkAddValidationErrors: {
    roles?: string;
    fullNames?: string;
    usernames?: string;
    mismatch?: string;
  } = {};

  // Validation state for editable row
  validationErrors: {
    userName?: string;
    userEmail?: string;
    userRole?: string;
  } = {};

  // Filters
  searchValue: string = '';
  selectedRoles: string[] = [];
  selectedStatuses: string[] = [];

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
    { key: 'userRole', label: 'Roles', isSortable: true, isFilterable: true },
    { key: 'enabledFlag', label: 'Status', isSortable: true },
    { key: 'creationDate', label: 'Created Date', isSortable: true },
    { key: 'actions', label: 'Actions', isSortable: false },
  ];

  // Role options for filters and forms
  roleOptions: SelectOption[] = [];

  /**
   * Returns role options filtered for sub-admin creation.
   *
   * FULL_ADMIN: Can create sub-admin for any role except ADMIN and existing _ADMIN roles.
   * SUB_ADMIN: Can only create sub-admin for their own managed roles.
   *   e.g., WIPS_ADMIN can create another WIPS_ADMIN (not CASE_IQ_ADMIN)
   */
  get subAdminRoleOptions(): SelectOption[] {
    if (this.isSubAdminMode) {
      // Sub-admins can only create sub-admins for their own managed roles
      return this.managedRoles.map((role) => ({
        label: role,
        value: role,
      }));
    }
    // Full admin: all roles except "All Roles", "ADMIN", and existing _ADMIN roles
    return this.roleOptions.filter(
      (option) =>
        option.value !== '' && // Exclude "All Roles"
        option.value !== 'ADMIN' && // Exclude full admin
        !option.value.endsWith('_ADMIN'), // Exclude existing sub-admin roles
    );
  }

  username: string;

  /**
   * Returns role options available for inline "Add User" row.
   * FULL_ADMIN: All roles (from roleOptions, excluding 'All Roles')
   * SUB_ADMIN: Only their managed roles (base roles, not _ADMIN variants)
   */
  get inlineRoleOptions(): SelectOption[] {
    if (this.isSubAdminMode) {
      return this.managedRoles.map((role) => ({
        label: role,
        value: role,
      }));
    }
    // Full admin: all roles except the blank "All Roles" option
    return this.roleOptions
      .filter((option) => option.value !== '')
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  // ── Bulk selection helpers ──

  /** Currently selected GroupedUser objects (from paginated view) */
  get selectedGroups(): GroupedUser[] {
    return this.filteredGroupedUsers.filter((g) =>
      this.selectedGroupUserNames.has(g.userName),
    );
  }

  /** True when all paginated rows are selected */
  get isAllSelected(): boolean {
    return (
      this.paginatedGroupedUsers.length > 0 &&
      this.paginatedGroupedUsers.every((g) =>
        this.selectedGroupUserNames.has(g.userName),
      )
    );
  }

  /** Union of all role names across selected users (for "delete" dropdown) */
  get uniqueSelectedRoles(): SelectOption[] {
    const roleSet = new Set<string>();
    for (const g of this.selectedGroups) {
      for (const r of g.allRoleNames) {
        roleSet.add(r);
      }
    }
    return Array.from(roleSet)
      .sort((a, b) => a.localeCompare(b))
      .map((r) => ({ label: r, value: r }));
  }

  /** Roles available to add (admin vs sub-admin aware, excludes roles marked for deletion) */
  get bulkAddableRoles(): SelectOption[] {
    const deleteSet = new Set(
      this.bulkRolesToDelete.map((r) => r.toUpperCase()),
    );
    let base: SelectOption[];
    if (this.isSubAdminMode) {
      base = this.managedRoles.map((role) => ({ label: role, value: role }));
    } else {
      base = this.roleOptions
        .filter((o) => o.value !== '')
        .sort((a, b) => a.label.localeCompare(b.label));
    }
    return base.filter((o) => !deleteSet.has(o.value.toUpperCase()));
  }

  toggleSelectGroup(group: GroupedUser): void {
    if (this.selectedGroupUserNames.has(group.userName)) {
      this.selectedGroupUserNames.delete(group.userName);
    } else {
      this.selectedGroupUserNames.add(group.userName);
    }
    // Force change detection for Set
    this.selectedGroupUserNames = new Set(this.selectedGroupUserNames);
  }

  toggleSelectAll(): void {
    if (this.isAllSelected) {
      // Deselect all on current page
      for (const g of this.paginatedGroupedUsers) {
        this.selectedGroupUserNames.delete(g.userName);
      }
    } else {
      // Select all on current page
      for (const g of this.paginatedGroupedUsers) {
        this.selectedGroupUserNames.add(g.userName);
      }
    }
    this.selectedGroupUserNames = new Set(this.selectedGroupUserNames);
  }

  isGroupSelected(group: GroupedUser): boolean {
    return this.selectedGroupUserNames.has(group.userName);
  }

  // ── Bulk modal ──

  onBulkUpdateClick(): void {
    this.bulkRolesToDelete = [];
    this.bulkRolesToAdd = [];
    this.bulkSaving = false;
    this.isBulkModalOpen = true;
  }

  onBulkRolesToDeleteChange(roles: string[]): void {
    this.bulkRolesToDelete = roles;
  }

  onBulkRolesToAddChange(roles: string[]): void {
    this.bulkRolesToAdd = roles;
  }

  closeBulkModal(): void {
    this.isBulkModalOpen = false;
    this.bulkRolesToDelete = [];
    this.bulkRolesToAdd = [];
    this.bulkSaving = false;
  }

  // ── Bulk Add Users ──

  onBulkAddUsersClick(): void {
    this.bulkAddSelectedRoles = [];
    this.bulkAddFullNames = '';
    this.bulkAddUsernames = '';
    this.bulkAddSaving = false;
    this.bulkAddValidationErrors = {};
    this.isBulkAddUsersModalOpen = true;
  }

  closeBulkAddUsersModal(): void {
    this.isBulkAddUsersModalOpen = false;
    this.bulkAddSelectedRoles = [];
    this.bulkAddFullNames = '';
    this.bulkAddUsernames = '';
    this.bulkAddSaving = false;
    this.bulkAddValidationErrors = {};
  }

  onBulkAddRolesChange(roles: string[]): void {
    this.bulkAddSelectedRoles = roles;
  }

  get bulkAddAutoEmails(): string {
    if (!this.bulkAddUsernames.trim()) return '';
    return this.bulkAddUsernames
      .split(',')
      .map((u) => u.trim())
      .filter((u) => u)
      .map((u) => u.toLowerCase() + '@cisco.com')
      .join(', ');
  }

  onBulkAddUsersSubmit(): void {
    if (this.bulkAddSaving) return;

    // Validate
    this.bulkAddValidationErrors = {};
    let isValid = true;

    if (this.bulkAddSelectedRoles.length === 0) {
      this.bulkAddValidationErrors.roles = 'Select at least one role';
      isValid = false;
    }

    const fullNames = this.bulkAddFullNames
      .split(',')
      .map((n) => n.trim())
      .filter((n) => n);
    if (fullNames.length === 0) {
      this.bulkAddValidationErrors.fullNames = 'Enter at least one full name';
      isValid = false;
    }

    const usernames = this.bulkAddUsernames
      .split(',')
      .map((u) => u.trim())
      .filter((u) => u);
    if (usernames.length === 0) {
      this.bulkAddValidationErrors.usernames = 'Enter at least one username';
      isValid = false;
    }

    // Check for spaces in usernames
    const invalidUsernames = usernames.filter((u) => /\s/.test(u));
    if (invalidUsernames.length > 0) {
      this.bulkAddValidationErrors.usernames =
        'Usernames must not contain spaces: ' + invalidUsernames.join(', ');
      isValid = false;
    }

    if (
      fullNames.length > 0 &&
      usernames.length > 0 &&
      fullNames.length !== usernames.length
    ) {
      this.bulkAddValidationErrors.mismatch = `Count mismatch: ${fullNames.length} full names vs ${usernames.length} usernames`;
      isValid = false;
    }

    if (!isValid) return;

    this.bulkAddSaving = true;

    const users = usernames.map((username, i) => ({
      userName: username.toUpperCase(),
      userEmail: username.toLowerCase() + '@cisco.com',
      fullName: fullNames[i] || '',
    }));

    const roleIds = this.bulkAddSelectedRoles.map((id) => Number(id));

    const payload = {
      users,
      roleIds,
      createdBy: this.username.toUpperCase(),
    };

    this.http.post<any>('bulk-create-user-access-roles', payload).subscribe(
      (res: any) => {
        this.bulkAddSaving = false;
        const msg = res?.message || 'Bulk add complete';
        if (res?.totalFailed > 0) {
          alert(msg);
        }
        this.closeBulkAddUsersModal();
        this.loadAccessUsers();
      },
      (error: any) => {
        this.bulkAddSaving = false;
        console.error('Bulk add users error:', error);
        alert(
          'Error adding users: ' +
            (error?.error?.message || error?.message || 'Unknown error'),
        );
      },
    );
  }

  // ── Access table bulk selection helpers ──

  /** Currently selected GroupedAccessUser objects */
  get selectedAccessGroups(): GroupedAccessUser[] {
    return this.filteredAccessGrouped.filter((g) =>
      this.selectedAccessGroupUserNames.has(g.userName),
    );
  }

  /** True when all paginated access rows are selected */
  get isAllAccessSelected(): boolean {
    return (
      this.paginatedAccessGrouped.length > 0 &&
      this.paginatedAccessGrouped.every((g) =>
        this.selectedAccessGroupUserNames.has(g.userName),
      )
    );
  }

  toggleSelectAccessGroup(group: GroupedAccessUser): void {
    if (this.selectedAccessGroupUserNames.has(group.userName)) {
      this.selectedAccessGroupUserNames.delete(group.userName);
    } else {
      this.selectedAccessGroupUserNames.add(group.userName);
    }
    this.selectedAccessGroupUserNames = new Set(
      this.selectedAccessGroupUserNames,
    );
  }

  toggleSelectAllAccess(): void {
    if (this.isAllAccessSelected) {
      for (const g of this.paginatedAccessGrouped) {
        this.selectedAccessGroupUserNames.delete(g.userName);
      }
    } else {
      for (const g of this.paginatedAccessGrouped) {
        this.selectedAccessGroupUserNames.add(g.userName);
      }
    }
    this.selectedAccessGroupUserNames = new Set(
      this.selectedAccessGroupUserNames,
    );
  }

  isAccessGroupSelected(group: GroupedAccessUser): boolean {
    return this.selectedAccessGroupUserNames.has(group.userName);
  }

  /**
   * Roles that ALL selected access users have (intersection).
   * These are the roles available for removal.
   */
  get accessBulkRemovableRoles(): SelectOption[] {
    const groups = this.selectedAccessGroups;
    if (groups.length === 0) return [];

    // Start with the first user's dashboard names (enabled)
    let common = new Set(groups[0].allDashboardNames);

    // Intersect with each subsequent user's dashboard names
    for (let i = 1; i < groups.length; i++) {
      const userRoles = new Set(groups[i].allDashboardNames);
      common = new Set([...common].filter((r) => userRoles.has(r)));
    }

    return Array.from(common)
      .sort((a, b) => a.localeCompare(b))
      .map((r) => ({ label: r, value: r }));
  }

  /**
   * Roles that NONE of the selected access users have (complement intersection).
   * These are the roles available for addition.
   * Excludes any roles currently marked for deletion.
   */
  get accessBulkAddableRoles(): SelectOption[] {
    const groups = this.selectedAccessGroups;
    if (groups.length === 0) return [];

    const deleteSet = new Set(
      this.accessBulkRolesToDelete.map((r) => r.toUpperCase()),
    );

    // Get all possible roles (scoped to managed roles for sub-admins)
    let filteredRoles = this.allRoles.filter((r) => r.ENABLED_FLAG === 'Y');
    if (this.isSubAdminMode && this.managedRoles.length > 0) {
      const managedUpper = this.managedRoles.map((m) => m.toUpperCase());
      filteredRoles = filteredRoles.filter((r) =>
        managedUpper.includes(r.ROLE_NAME?.toUpperCase()),
      );
    }
    const allAvailableRoles = filteredRoles.map((r) => r.DASHBOARD_NAME);

    // Find roles that NO selected user has
    const missingFromAll = allAvailableRoles.filter((roleName) =>
      groups.every(
        (g) =>
          !g.allDashboardNames
            .map((d) => d.toUpperCase())
            .includes(roleName.toUpperCase()),
      ),
    );

    return [...new Set(missingFromAll)]
      .sort((a, b) => a.localeCompare(b))
      .filter((r) => !deleteSet.has(r.toUpperCase()))
      .map((r) => ({ label: r, value: r }));
  }

  // ── Access Bulk Update modal ──

  onAccessBulkUpdateClick(): void {
    this.accessBulkRolesToDelete = [];
    this.accessBulkRolesToAdd = [];
    this.accessBulkSaving = false;
    this.isAccessBulkModalOpen = true;
  }

  onAccessBulkRolesToDeleteChange(roles: string[]): void {
    this.accessBulkRolesToDelete = roles;
  }

  onAccessBulkRolesToAddChange(roles: string[]): void {
    this.accessBulkRolesToAdd = roles;
  }

  closeAccessBulkModal(): void {
    this.isAccessBulkModalOpen = false;
    this.accessBulkRolesToDelete = [];
    this.accessBulkRolesToAdd = [];
    this.accessBulkSaving = false;
  }

  onAccessBulkSubmit(): void {
    if (this.accessBulkSaving) return;
    if (
      this.accessBulkRolesToDelete.length === 0 &&
      this.accessBulkRolesToAdd.length === 0
    ) {
      return;
    }

    this.accessBulkSaving = true;
    const targets = this.selectedAccessGroups;
    let pendingOps = 0;
    let hasError = false;

    // Count total operations
    for (const group of targets) {
      // Delete: only roles the user actually has
      pendingOps += this.accessBulkRolesToDelete.filter((roleName) =>
        group.allDashboardNames
          .map((d) => d.toUpperCase())
          .includes(roleName.toUpperCase()),
      ).length;
      // Add: only roles the user doesn't already have
      pendingOps += this.accessBulkRolesToAdd.filter(
        (roleName) =>
          !group.allDashboardNames
            .map((d) => d.toUpperCase())
            .includes(roleName.toUpperCase()),
      ).length;
    }

    if (pendingOps === 0) {
      this.accessBulkSaving = false;
      this.closeAccessBulkModal();
      return;
    }

    let completed = 0;
    const onComplete = () => {
      completed++;
      if (completed === pendingOps) {
        this.accessBulkSaving = false;
        if (hasError) {
          alert('Some operations failed. Check console for details.');
        }
        this.closeAccessBulkModal();
        this.selectedAccessGroupUserNames = new Set();
        this.loadAccessUsers();
      }
    };

    // DELETE roles
    for (const group of targets) {
      const rolesToDelete = this.accessBulkRolesToDelete.filter((roleName) =>
        group.allDashboardNames
          .map((d) => d.toUpperCase())
          .includes(roleName.toUpperCase()),
      );

      for (const roleName of rolesToDelete) {
        // Find the matching row to get the roleId
        const matchingRow = group.rows.find(
          (r) => r.DASHBOARD_NAME.toUpperCase() === roleName.toUpperCase(),
        );
        if (!matchingRow) {
          onComplete();
          continue;
        }

        this.http
          .put(
            'update-user-access-role',
            {
              userName: group.userName,
              roleId: matchingRow.ROLE_ID,
              enabledFlag: 'N',
              admin: matchingRow.ADMIN ?? 'N',
              readOnly: matchingRow.READ_ONLY ?? 'N',
              lastUpdatedBy: this.username.toUpperCase(),
            },
            this.destroyManager,
          )
          .subscribe(
            () => onComplete(),
            (error) => {
              hasError = true;
              console.error('Error bulk-disabling access role:', error);
              onComplete();
            },
          );
      }
    }

    // ADD roles
    for (const group of targets) {
      const rolesToAdd = this.accessBulkRolesToAdd.filter(
        (roleName) =>
          !group.allDashboardNames
            .map((d) => d.toUpperCase())
            .includes(roleName.toUpperCase()),
      );

      for (const roleName of rolesToAdd) {
        // Find the role ID from allRoles
        const matchingRole = this.allRoles.find(
          (r) =>
            r.DASHBOARD_NAME.toUpperCase() === roleName.toUpperCase() &&
            r.ENABLED_FLAG === 'Y',
        );
        if (!matchingRole) {
          onComplete();
          continue;
        }

        const payload = {
          userName: group.userName,
          userEmail: group.userEmail,
          fullName: group.fullName,
          roleId: matchingRole.ROLE_ID,
          admin: 'N',
          readOnly: 'N',
          createdBy: this.username.toUpperCase(),
        };

        this.http
          .post('create-user-access-role', payload, this.destroyManager)
          .subscribe(
            () => onComplete(),
            (error) => {
              hasError = true;
              console.error('Error bulk-adding access role:', error);
              onComplete();
            },
          );
      }
    }
  }

  onBulkSubmit(): void {
    if (this.bulkSaving) return;
    if (
      this.bulkRolesToDelete.length === 0 &&
      this.bulkRolesToAdd.length === 0
    ) {
      return;
    }

    this.bulkSaving = true;
    const targets = this.selectedGroups;
    let pendingOps = 0;
    let hasError = false;

    // Count total operations
    for (const group of targets) {
      pendingOps += this.bulkRolesToDelete.filter((role) =>
        group.allRoleNames
          .map((r) => r.toUpperCase())
          .includes(role.toUpperCase()),
      ).length;
      pendingOps += this.bulkRolesToAdd.filter(
        (role) =>
          !group.allRoleNames
            .map((r) => r.toUpperCase())
            .includes(role.toUpperCase()),
      ).length;
    }

    if (pendingOps === 0) {
      this.bulkSaving = false;
      this.closeBulkModal();
      return;
    }

    let completed = 0;
    const onComplete = () => {
      completed++;
      if (completed === pendingOps) {
        this.bulkSaving = false;
        this.selectedGroupUserNames = new Set();
        this.closeBulkModal();
        if (hasError) {
          alert('Some bulk operations failed. Check the console for details.');
        }
        this.loadUserRoles();
      }
    };

    // DELETE: soft-delete roles that the user actually has
    for (const group of targets) {
      const userRolesUpper = group.allRoleNames.map((r) => r.toUpperCase());
      for (const role of this.bulkRolesToDelete) {
        if (!userRolesUpper.includes(role.toUpperCase())) continue;
        // Find the matching AdminUserRow for the exact role
        const matchedRole = group.roles.find(
          (r) => r.userRole.toUpperCase() === role.toUpperCase(),
        );
        if (!matchedRole) {
          completed++;
          continue;
        }

        const payload = {
          userName: group.userName,
          userRole: matchedRole.userRole,
          creationDate:
            (matchedRole as any).creationDateRaw || matchedRole.creationDate,
          deleterUsername: this.username,
        };

        this.http
          .delete('user-role', this.destroyManager, { body: payload })
          .subscribe(
            () => onComplete(),
            (error) => {
              hasError = true;
              console.error(
                `Error bulk-deleting ${role} for ${group.userName}:`,
                error,
              );
              onComplete();
            },
          );
      }
    }

    // ADD: create roles the user doesn't already have
    for (const group of targets) {
      const userRolesUpper = group.allRoleNames.map((r) => r.toUpperCase());
      for (const role of this.bulkRolesToAdd) {
        if (userRolesUpper.includes(role.toUpperCase())) continue;

        const payload = {
          userName: group.userName,
          userEmail: group.userEmail,
          roleId: null,
          userRole: role.toUpperCase().trim(),
          enabledFlag: 'Y',
          createdBy: this.username.toUpperCase(),
        };

        this.http.post('user-role', payload, this.destroyManager).subscribe(
          () => onComplete(),
          (error) => {
            hasError = true;
            console.error(
              `Error bulk-adding ${role} for ${group.userName}:`,
              error,
            );
            onComplete();
          },
        );
      }
    }
  }

  // Sub-admin detection properties
  currentUserRoles: string[] = [];
  isFullAdmin: boolean = false;
  isSubAdminMode: boolean = false;
  managedRoles: string[] = []; // The roles this sub-admin manages (e.g., ["CASE_IQ_I2C", "CASE_IQ_SBP"])
  hasAdminAccess: boolean = false; // True if user is either full admin or sub-admin

  // Dashboard header
  periodStatus: PeriodStatus | null = null;
  roles: string[] = [];
  selectedTab: 'admin' | 'analytics' = 'admin';

  adminTabs = [
    { key: 'admin', label: 'Identity & Access Management', requiredRole: null },
    {
      key: 'analytics',
      label: 'Control Tower Analytics',
      requiredRole: 'ADMIN',
    },
  ];

  get filteredAdminTabs() {
    return this.adminTabs.filter(
      (tab) => !tab.requiredRole || this.roles.includes(tab.requiredRole),
    );
  }

  constructor(
    private http: ApiHttpService,
    private destroyManager: DestroyManager,
    private authService: AuthenticationService,
    private datePipe: DatePipe,
    private dataService: DataService,
    private route: ActivatedRoute,
    public themeService: ThemeService,
  ) {}

  @HostBinding('class.dark-theme') get darkThemeClass() {
    return this.themeService.isDarkMode;
  }

  ngOnInit(): void {
    this.detectAdminPrivileges();
    this.loadUserRoles();

    // React to query param tab selection from sidebar drawer
    this.route.queryParamMap.subscribe((params) => {
      const tab = params.get('tab');
      if (tab && (tab === 'admin' || tab === 'analytics')) {
        this.switchTab(tab);
      }
    });
    this.username = this.authService.getUserName();
    this.roles = this.authService.getUserAccessRoles();

    this.dataService.periodStatus$.subscribe((status) => {
      if (status) {
        this.periodStatus = {
          ...status,
          lastUpdated: new Date().toLocaleString(),
        };
      }
    });

    this.http.get('roles', this.destroyManager).subscribe(
      (data: any) => {
        console.log(
          'Roles loaded:',
          data.map((r: any) => {
            return {
              role_name: r.ROLE_NAME,
              dashboard_name: r.DASHBOARD_NAME,
            };
          }),
        );
        if (Array.isArray(data)) {
          this.allRoles = data;
        }
      },
      (error) => {
        console.error('Error loading roles:', error);
      },
    );

    this.loadAccessUsers();
  }

  private loadAccessUsers(): void {
    this.isAccessLoading = true;
    this.http.get('user-access-list', this.destroyManager).subscribe(
      (data: any) => {
        this.isAccessLoading = false;
        if (Array.isArray(data)) {
          // Sub-admin scoping: only show rows for managed roles
          if (this.isSubAdminMode && this.managedRoles.length > 0) {
            const managedUpper = this.managedRoles.map((r) => r.toUpperCase());
            this.accessUsers = data.filter((row: UserAccessRow) =>
              managedUpper.includes(row.ROLE_NAME?.toUpperCase()),
            );
          } else {
            this.accessUsers = data;
          }
          const uniqueRoles = [
            ...new Set(
              this.accessUsers
                .map((r: UserAccessRow) => r.DASHBOARD_NAME)
                .filter(Boolean),
            ),
          ];
          this.accessRoleOptions = uniqueRoles
            .sort()
            .map((r) => ({ label: r, value: r }));
          this.applyAccessFilters();
        }
      },
      (error) => {
        this.isAccessLoading = false;
        console.error('Error loading user access list:', error);
      },
    );
  }

  switchTab(tabKey: string): void {
    this.selectedTab = tabKey as 'admin' | 'analytics';
    if (this.periodStatus) {
      this.periodStatus = {
        ...this.periodStatus,
        lastUpdated: new Date().toLocaleString(),
      };
    }
  }

  get currentTabLabel(): string {
    return (
      this.adminTabs.find((t) => t.key === this.selectedTab)?.label || 'Admin'
    );
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
    this.currentUserRoles = this.authService.getUserAccessRoles() || [];

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
      (role) => role.endsWith('_ADMIN') && role !== 'ADMIN',
    );

    if (subAdminRoles.length > 0) {
      this.isSubAdminMode = true;
      // Extract managed roles: ["CASE_IQ_I2C_ADMIN", "CASE_IQ_SBP_ADMIN"] -> ["CASE_IQ_I2C", "CASE_IQ_SBP"]
      this.managedRoles = subAdminRoles.map((role) =>
        role.replace(/_ADMIN$/, ''),
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
      // Include both base roles AND their _ADMIN variants for self-visibility
      // e.g., managedRoles=["WIPS"] -> send WIPS,WIPS_ADMIN
      const allRoles = this.managedRoles.flatMap((r) => [r, `${r}_ADMIN`]);
      const rolesParam = allRoles.map((r) => encodeURIComponent(r)).join(',');
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

          // Extract unique roles for filter dropdown (no "All" option needed for multi-select)
          const uniqueRoles = [...new Set(this.users.map((u) => u.userRole))];
          this.roleOptions = uniqueRoles.map((role) => ({
            label: role,
            value: role,
          }));
          this.roleOptions.sort((a, b) => a.label.localeCompare(b.label));

          this.applyFilters();
        } else {
          console.error('Unexpected data format:', data);
        }
      },
      (error) => {
        this.isLoading = false;
        console.error('Error loading user roles:', error);
        // TODO: Show error notification
      },
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
          user.userRole.toLowerCase().includes(searchLower),
      );
    }

    // Apply role filter (multi-select: match any selected role)
    if (this.selectedRoles.length > 0) {
      filtered = filtered.filter((user) =>
        this.selectedRoles.includes(user.userRole),
      );
    }

    // Apply enabled filter (multi-select: match any selected status)
    if (this.selectedStatuses.length > 0) {
      filtered = filtered.filter((user) =>
        this.selectedStatuses.includes(user.enabledFlag),
      );
    }

    this.filteredUsers = filtered;
    this.filteredGroupedUsers = this.groupUsers(filtered);
    this.currentPage = 0;
    this.paginateGroups();
  }

  /**
   * Slices filteredGroupedUsers for the current page.
   */
  private paginateGroups(): void {
    const start = this.currentPage * this.pageSize;
    this.paginatedGroupedUsers = this.filteredGroupedUsers.slice(
      start,
      start + this.pageSize,
    );
  }

  /**
   * Handles page change from the pagination component.
   */
  onPageChange(event: PageChangeEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.paginateGroups();
  }

  /**
   * Groups flat user-role rows into one GroupedUser per unique userName.
   * Computes aggregate status, latest date, and role list.
   */
  private groupUsers(rows: AdminUserRow[]): GroupedUser[] {
    const map = new Map<string, AdminUserRow[]>();

    rows.forEach((row) => {
      const key = row.userName;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(row);
    });

    // Preserve expand state from previous groupedUsers
    const prevExpandState = new Map<string, boolean>();
    this.filteredGroupedUsers.forEach((g) => {
      prevExpandState.set(g.userName, g.isExpanded);
    });

    return Array.from(map.entries()).map(([userName, roles]) => ({
      userName,
      userEmail: roles[0].userEmail,
      roles,
      allRoleNames: roles.map((r) => r.userRole),
      enabledRoleNames: roles
        .filter((r) => r.enabledFlag === 'Y')
        .map((r) => r.userRole),
      isAnyEnabled: roles.some((r) => r.enabledFlag === 'Y'),
      latestDate: new Date(
        Math.max(...roles.map((r) => r.creationDate.getTime())),
      ),
      isExpanded: prevExpandState.get(userName) || false,
    }));
  }

  /**
   * Toggles expand/collapse for a grouped user row.
   */
  toggleExpand(group: GroupedUser): void {
    group.isExpanded = !group.isExpanded;
  }

  /**
   * Handles the aggregate toggle on a collapsed parent row.
   * OFF → disables all roles for this user.
   * ON  → expands the group so the user can enable roles individually.
   */
  onGroupToggleChange(group: GroupedUser, enabled: boolean): void {
    if (!enabled) {
      // Disable every currently-enabled role
      group.roles.forEach((role) => {
        if (role.enabledFlag === 'Y') {
          this.onEnabledFlagChange({ row: role, enabled: false });
        }
      });
    } else {
      // Don't bulk-enable — expand so user picks which roles to turn on
      group.isExpanded = true;
    }
  }

  /**
   * Formats a Date to "MMM dd, yyyy" (e.g., "Feb 23, 2024")
   */
  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'MMM dd, yyyy') || '';
  }

  onSearchChange(value: string): void {
    this.searchValue = value;
    this.applyFilters();
  }

  onRoleFilterChange(roles: string[]): void {
    this.selectedRoles = roles;
    this.applyFilters();
  }

  onEnabledFilterChange(statuses: string[]): void {
    this.selectedStatuses = statuses;
    this.applyFilters();
  }

  onAddUser(): void {
    this.showRoleView = true;
  }

  closeRoleView(): void {
    this.showRoleView = false;
  }

  refreshRoles(): void {
    this.http.get('roles', this.destroyManager).subscribe(
      (data: any) => {
        if (Array.isArray(data)) {
          this.allRoles = data;
        }
      },
      (error) => {
        console.error('Error refreshing roles:', error);
      },
    );
  }

  // ── User Access List table methods ──

  applyAccessFilters(): void {
    let filtered = [...this.accessUsers];
    if (this.accessSearchValue) {
      const q = this.accessSearchValue.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.USER_NAME.toLowerCase().includes(q) ||
          u.USER_EMAIL.toLowerCase().includes(q) ||
          (u.FULL_NAME && u.FULL_NAME.toLowerCase().includes(q)) ||
          u.ROLE_NAME.toLowerCase().includes(q) ||
          u.DASHBOARD_NAME.toLowerCase().includes(q),
      );
    }
    if (this.accessSelectedRoles.length > 0) {
      filtered = filtered.filter((u) =>
        this.accessSelectedRoles.includes(u.DASHBOARD_NAME),
      );
    }
    if (this.accessSelectedStatuses.length > 0) {
      filtered = filtered.filter((u) =>
        this.accessSelectedStatuses.includes(u.ENABLED_FLAG),
      );
    }
    this.filteredAccessGrouped = this.groupAccessUsers(filtered);
    this.accessCurrentPage = 0;
    this.paginateAccessGroups();
  }

  private groupAccessUsers(rows: UserAccessRow[]): GroupedAccessUser[] {
    const map = new Map<string, UserAccessRow[]>();
    rows.forEach((row) => {
      const key = row.USER_NAME;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    });

    const prevExpand = new Map<string, boolean>();
    this.filteredAccessGrouped.forEach((g) =>
      prevExpand.set(g.userName, g.isExpanded),
    );

    return Array.from(map.entries()).map(([userName, rows]) => ({
      userName,
      userEmail: rows[0].USER_EMAIL,
      fullName: rows[0].FULL_NAME || '',
      rows,
      allDashboardNames: [...new Set(rows.map((r) => r.DASHBOARD_NAME))],
      enabledDashboardNames: [
        ...new Set(
          rows
            .filter((r) => r.ENABLED_FLAG === 'Y')
            .map((r) => r.DASHBOARD_NAME),
        ),
      ],
      isAnyEnabled: rows.some((r) => r.ENABLED_FLAG === 'Y'),
      isAnyAdmin: rows.some((r) => r.ADMIN === 'Y'),
      isAnyReadOnly: rows.some((r) => r.READ_ONLY === 'Y'),
      latestDate: new Date(
        Math.max(...rows.map((r) => new Date(r.LAST_UPDATED_DATE).getTime())),
      ),
      isExpanded: prevExpand.get(userName) || false,
    }));
  }

  private paginateAccessGroups(): void {
    const start = this.accessCurrentPage * this.accessPageSize;
    this.paginatedAccessGrouped = this.filteredAccessGrouped.slice(
      start,
      start + this.accessPageSize,
    );
  }

  onAccessSearchChange(value: string): void {
    this.accessSearchValue = value;
    this.applyAccessFilters();
  }

  onAccessRoleFilterChange(roles: string[]): void {
    this.accessSelectedRoles = roles;
    this.applyAccessFilters();
  }

  onAccessStatusFilterChange(statuses: string[]): void {
    this.accessSelectedStatuses = statuses;
    this.applyAccessFilters();
  }

  onAccessAddUser(): void {
    this.showAccessAddUserRow = true;
    this.accessNewUser = { userName: '', fullName: '', userEmail: '' };
    this.accessNewUserSelectedRoles = [];
    this.accessNewUserSaving = false;
    this.accessNewUserValidationErrors = {};
  }

  onAccessNewUserNameChange(value: string): void {
    this.accessNewUser.userName = value;
    this.accessNewUser.userEmail = value.trim()
      ? value.trim().toLowerCase() + '@cisco.com'
      : '';
  }

  onAccessNewUserRolesChange(roles: string[]): void {
    this.accessNewUserSelectedRoles = roles;
  }

  onCancelAccessAddUser(): void {
    this.showAccessAddUserRow = false;
    this.accessNewUser = { userName: '', fullName: '', userEmail: '' };
    this.accessNewUserSelectedRoles = [];
    this.accessNewUserSaving = false;
    this.accessNewUserValidationErrors = {};
  }

  getAllAccessAddUserRoleOptions(): SelectOption[] {
    let roles = this.allRoles.filter((r) => r.ENABLED_FLAG === 'Y');
    if (this.isSubAdminMode && this.managedRoles.length > 0) {
      const managedUpper = this.managedRoles.map((m) => m.toUpperCase());
      roles = roles.filter((r) =>
        managedUpper.includes(r.ROLE_NAME?.toUpperCase()),
      );
    }
    return roles
      .sort((a, b) => a.DASHBOARD_NAME.localeCompare(b.DASHBOARD_NAME))
      .map((r) => ({ label: r.DASHBOARD_NAME, value: String(r.ROLE_ID) }));
  }

  onSaveAccessAddUser(): void {
    if (this.accessNewUserSaving) return;

    // Validate
    this.accessNewUserValidationErrors = {};
    let isValid = true;

    const userName = this.accessNewUser.userName.trim();
    if (!userName) {
      this.accessNewUserValidationErrors.userName = 'Username is required';
      isValid = false;
    } else if (/\s/.test(userName)) {
      this.accessNewUserValidationErrors.userName = 'Username must be one word';
      isValid = false;
    }

    if (!this.accessNewUser.fullName.trim()) {
      this.accessNewUserValidationErrors.fullName = 'Full name is required';
      isValid = false;
    }

    if (this.accessNewUserSelectedRoles.length === 0) {
      this.accessNewUserValidationErrors.roles = 'Select at least one role';
      isValid = false;
    }

    if (!isValid) return;

    this.accessNewUserSaving = true;
    let completed = 0;
    let hasError = false;
    const total = this.accessNewUserSelectedRoles.length;

    for (const roleIdStr of this.accessNewUserSelectedRoles) {
      const payload = {
        userName: userName.toUpperCase(),
        userEmail: this.accessNewUser.userEmail,
        fullName: this.accessNewUser.fullName.trim(),
        roleId: Number(roleIdStr),
        admin: 'N',
        readOnly: 'N',
        createdBy: this.username.toUpperCase(),
      };

      this.http
        .post('create-user-access-role', payload, this.destroyManager)
        .subscribe(
          () => {
            completed++;
            if (completed === total) {
              this.accessNewUserSaving = false;
              if (hasError) {
                alert('Some roles failed to save. Check console for details.');
              }
              this.onCancelAccessAddUser();
              this.loadAccessUsers();
            }
          },
          (error) => {
            completed++;
            hasError = true;
            console.error('Error adding user access role:', error);
            if (completed === total) {
              this.accessNewUserSaving = false;
              alert('Some roles failed to save. Check console for details.');
              this.onCancelAccessAddUser();
              this.loadAccessUsers();
            }
          },
        );
    }
  }

  onAccessPageChange(event: PageChangeEvent): void {
    this.accessCurrentPage = event.pageIndex;
    this.accessPageSize = event.pageSize;
    this.paginateAccessGroups();
  }

  toggleAccessExpand(group: GroupedAccessUser): void {
    group.isExpanded = !group.isExpanded;
  }

  onAddAccessRole(group: GroupedAccessUser): void {
    group.isExpanded = true;
    this.accessAddRoleForGroup = group.userName;
    this.selectedAccessAddRoleId = null;
    this.accessAddRoleSaving = false;
    this.accessAddValidationError = '';
  }

  onAccessAddRoleChange(roles: string[]): void {
    this.selectedAccessAddRoleId = roles.length > 0 ? Number(roles[0]) : null;
  }

  onCancelAccessAddRole(): void {
    this.accessAddRoleForGroup = null;
    this.selectedAccessAddRoleId = null;
    this.accessAddRoleSaving = false;
    this.accessAddValidationError = '';
  }

  getAccessAddRoleOptions(group: GroupedAccessUser): SelectOption[] {
    const existingRoleIds = new Set(group.rows.map((r) => r.ROLE_ID));
    let roles = this.allRoles.filter(
      (r) => r.ENABLED_FLAG === 'Y' && !existingRoleIds.has(r.ROLE_ID),
    );
    if (this.isSubAdminMode && this.managedRoles.length > 0) {
      const managedUpper = this.managedRoles.map((m) => m.toUpperCase());
      roles = roles.filter((r) =>
        managedUpper.includes(r.ROLE_NAME?.toUpperCase()),
      );
    }
    return roles
      .sort((a, b) => a.DASHBOARD_NAME.localeCompare(b.DASHBOARD_NAME))
      .map((r) => ({
        label: r.DASHBOARD_NAME,
        value: String(r.ROLE_ID),
      }));
  }

  onSaveAccessAddRole(group: GroupedAccessUser): void {
    if (this.accessAddRoleSaving) return;

    if (!this.selectedAccessAddRoleId) {
      this.accessAddValidationError = 'Select a role';
      return;
    }

    this.accessAddRoleSaving = true;
    this.accessAddValidationError = '';

    const payload = {
      userName: group.userName,
      userEmail: group.userEmail,
      fullName: group.fullName,
      roleId: this.selectedAccessAddRoleId,
      admin: 'N',
      readOnly: 'N',
      createdBy: this.username.toUpperCase(),
    };

    this.http
      .post('create-user-access-role', payload, this.destroyManager)
      .subscribe(
        () => {
          this.accessAddRoleSaving = false;
          this.accessAddRoleForGroup = null;
          this.selectedAccessAddRoleId = null;
          this.accessAddValidationError = '';
          this.loadAccessUsers();
        },
        (error) => {
          this.accessAddRoleSaving = false;
          console.error('Error adding access role:', error);
          this.accessAddValidationError =
            error?.error?.message || 'Failed to add role';
        },
      );
  }

  onDeleteAccessRole(row: UserAccessRow, group: GroupedAccessUser): void {
    this.accessDeletingRow = row;
    this.accessDeletingGroup = group;
    this.showAccessDeleteDialog = true;
    this.accessDeleteLoading = false;
  }

  confirmAccessDelete(): void {
    if (!this.accessDeletingRow) return;
    this.accessDeleteLoading = true;
    const row = this.accessDeletingRow;

    this.http
      .put(
        'update-user-access-role',
        {
          userName: row.USER_NAME,
          roleId: row.ROLE_ID,
          enabledFlag: 'N',
          admin: row.ADMIN ?? 'N',
          readOnly: row.READ_ONLY ?? 'N',
          lastUpdatedBy: this.authService.getUserName(),
        },
        this.destroyManager,
      )
      .subscribe(
        () => {
          this.cancelAccessDelete();
          this.loadAccessUsers();
        },
        (error) => {
          console.error('Error deleting access role:', error);
          this.accessDeleteLoading = false;
        },
      );
  }

  cancelAccessDelete(): void {
    this.showAccessDeleteDialog = false;
    this.accessDeletingRow = null;
    this.accessDeletingGroup = null;
    this.accessDeleteLoading = false;
  }

  /**
   * Handles toggle changes (Status, Admin, Read Only) on an expanded access child row.
   * Sends the full current state of all three flags to the backend,
   * then reloads the table from the server.
   */
  onAccessToggleChange(
    row: UserAccessRow,
    field: 'ENABLED_FLAG' | 'ADMIN' | 'READ_ONLY',
    value: boolean,
  ): void {
    // Sub-admin guard: only allow toggling roles within managed scope
    if (this.isSubAdminMode && this.managedRoles.length > 0) {
      const managedUpper = this.managedRoles.map((m) => m.toUpperCase());
      if (!managedUpper.includes(row.ROLE_NAME?.toUpperCase())) {
        console.warn('Sub-admin cannot modify roles outside managed scope');
        return;
      }
    }

    const newValue = value ? 'Y' : 'N';

    // Optimistically update the local value so the toggle doesn't flicker
    row[field] = newValue;

    this.http
      .put(
        'update-user-access-role',
        {
          userName: row.USER_NAME,
          roleId: row.ROLE_ID,
          enabledFlag: row.ENABLED_FLAG,
          admin: row.ADMIN ?? 'N',
          readOnly: row.READ_ONLY ?? 'N',
          lastUpdatedBy: this.authService.getUserName(),
        },
        this.destroyManager,
      )
      .subscribe(
        (res: any) => {
          if (res?.isDeleted === 'TRUE') {
            console.warn(
              `Role ${row.ROLE_ID} for user ${row.USER_NAME} was previously deleted`,
            );
          }
          this.loadAccessUsers();
        },
        (error) => {
          console.error('Error updating access role:', error);
          // Revert on failure
          row[field] = value ? 'N' : 'Y';
        },
      );
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

    // Extract roles from form data
    const roles = formData.roles?.filter((r) => r.trim().length > 0) || [];
    if (roles.length === 0) {
      return;
    }

    let newRole: string;

    if (this.isSubAdminCreationMode) {
      // Combine selected roles into a single admin role name
      // e.g., ["CASE_IQ_I2C", "CASE_IQ_SBP"] → "I2C_SBP_CASE_IQ_ADMIN"
      newRole = this.generateCombinedAdminRole(roles);
    } else {
      newRole = roles[0].toUpperCase().trim();
    }

    // Reuse the same payload structure as inline form
    const payload = {
      userName: formData.userName.toUpperCase().trim(),
      userEmail: formData.email.trim(),
      roleId: null,
      userRole: newRole,
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
      },
    );
  }

  onUserFormCancel(): void {
    this.closeModal();
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isSubAdminCreationMode = false; // Reset sub-admin mode when closing
  }

  /**
   * Generates a combined admin role name from multiple selected roles.
   * Extracts unique words (per role) and common words (shared by all roles),
   * then combines them as: UNIQUE_WORDS + COMMON_WORDS + ADMIN.
   *
   * Examples:
   *   ["CASE_IQ_I2C", "CASE_IQ_SBP"]       → "I2C_SBP_CASE_IQ_ADMIN"
   *   ["I2C_CASE_ANALYZER", "SBP_CASE_ANALYZER"] → "I2C_SBP_CASE_ANALYZER_ADMIN"
   *   ["CASE_IQ_I2C"]                       → "CASE_IQ_I2C_ADMIN"
   */
  private generateCombinedAdminRole(roles: string[]): string {
    const normalized = roles.map((r) => r.toUpperCase().trim());

    if (normalized.length === 1) {
      return normalized[0] + '_ADMIN';
    }

    const wordArrays = normalized.map((r) => r.split('_'));

    // Find words common to ALL roles
    const commonWords = wordArrays[0].filter((word) =>
      wordArrays.every((arr) => arr.includes(word)),
    );

    // Collect unique words from each role (preserving order)
    const uniqueWords: string[] = [];
    for (const words of wordArrays) {
      for (const word of words) {
        if (!commonWords.includes(word) && !uniqueWords.includes(word)) {
          uniqueWords.push(word);
        }
      }
    }

    // Combine: unique parts + common parts + ADMIN
    return [...uniqueWords, ...commonWords, 'ADMIN'].join('_');
  }

  onAddLineItem(): void {
    this.showInlineRow = true;
    this.selectedInlineRoles = [];
    this.validationErrors = {};
    this.editableRow = {
      userId: null,
      userName: '',
      roleId: null,
      userRole: '',
      enabledFlag: 'Y',
      creationDate: new Date(),
      userEmail: '',
    };
  }

  onInlineRoleChange(roles: string[]): void {
    this.selectedInlineRoles = roles;
  }

  onCancelInlineRow(): void {
    this.showInlineRow = false;
    this.editableRow = null;
    this.selectedInlineRoles = [];
    this.validationErrors = {};
  }

  // ── Inline add-role for existing user ──

  /**
   * Returns role options for adding a role to an existing group/user.
   * Filters out roles the user already has.
   * Respects admin vs sub-admin restrictions.
   */
  getGroupAddRoleOptions(group: GroupedUser): SelectOption[] {
    const existingRoles = new Set(
      group.allRoleNames.map((r) => r.toUpperCase()),
    );
    const baseOptions = this.isSubAdminMode
      ? this.managedRoles.map((role) => ({ label: role, value: role }))
      : this.roleOptions
          .filter((o) => o.value !== '')
          .sort((a, b) => a.label.localeCompare(b.label));
    return baseOptions.filter((o) => !existingRoles.has(o.value.toUpperCase()));
  }

  onAddRoleToGroup(group: GroupedUser): void {
    // Expand the group
    group.isExpanded = true;
    // Activate inline add-role row for this group
    this.addRoleForGroup = group.userName;
    this.selectedGroupAddRoles = [];
    this.groupAddRoleSaving = false;
    this.groupAddValidationError = '';
  }

  onGroupAddRoleChange(roles: string[]): void {
    this.selectedGroupAddRoles = roles;
  }

  onCancelGroupAddRole(): void {
    this.addRoleForGroup = null;
    this.selectedGroupAddRoles = [];
    this.groupAddRoleSaving = false;
    this.groupAddValidationError = '';
  }

  onSaveGroupAddRole(group: GroupedUser): void {
    if (this.groupAddRoleSaving) return;

    if (this.selectedGroupAddRoles.length === 0) {
      this.groupAddValidationError = 'Select at least one role';
      return;
    }

    this.groupAddRoleSaving = true;
    this.groupAddValidationError = '';
    let completed = 0;
    let hasError = false;
    const total = this.selectedGroupAddRoles.length;

    for (const role of this.selectedGroupAddRoles) {
      const payload = {
        userName: group.userName,
        userEmail: group.userEmail,
        roleId: null,
        userRole: role.toUpperCase().trim(),
        enabledFlag: 'Y',
        createdBy: this.username.toUpperCase(),
      };

      this.http.post('user-role', payload, this.destroyManager).subscribe(
        () => {
          completed++;
          if (completed === total) {
            this.groupAddRoleSaving = false;
            this.addRoleForGroup = null;
            this.selectedGroupAddRoles = [];
            this.groupAddValidationError = '';
            this.loadUserRoles();
          }
        },
        (error) => {
          completed++;
          hasError = true;
          console.error('Error adding role ' + role + ':', error);
          if (completed === total) {
            this.groupAddRoleSaving = false;
            if (hasError) {
              alert(
                'Some roles failed to save. Check the console for details.',
              );
            }
            this.loadUserRoles();
          }
        },
      );
    }
  }

  onSaveInlineRow(): void {
    if (this.inlineSaving) return;

    // Validate
    this.validationErrors = {};
    let isValid = true;

    const usernameValidation = this.validateUsername(this.editableRow.userName);
    if (!usernameValidation.valid) {
      this.validationErrors.userName =
        this.editableRow.userName.trim().length === 0
          ? 'Username is required'
          : 'Username must be one word (no spaces)';
      isValid = false;
    } else {
      this.editableRow.userName = usernameValidation.sanitized;
    }

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

    if (this.selectedInlineRoles.length === 0) {
      this.validationErrors.userRole = 'Select at least one role';
      isValid = false;
    }

    if (!isValid) return;

    this.inlineSaving = true;
    let completed = 0;
    let hasError = false;
    const total = this.selectedInlineRoles.length;

    for (const role of this.selectedInlineRoles) {
      const payload = {
        userName: this.editableRow.userName,
        userEmail: this.editableRow.userEmail.trim(),
        roleId: null,
        userRole: role.toUpperCase().trim(),
        enabledFlag: 'Y',
        createdBy: this.username.toUpperCase(),
      };

      this.http.post('user-role', payload, this.destroyManager).subscribe(
        () => {
          completed++;
          if (completed === total) {
            this.inlineSaving = false;
            this.showInlineRow = false;
            this.editableRow = null;
            this.selectedInlineRoles = [];
            this.validationErrors = {};
            this.loadUserRoles();
          }
        },
        (error) => {
          completed++;
          hasError = true;
          console.error('Error creating role ' + role + ':', error);
          if (completed === total) {
            this.inlineSaving = false;
            if (hasError) {
              alert(
                'Some roles failed to save. Check the console for details.',
              );
            }
            this.loadUserRoles();
          }
        },
      );
    }
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
      },
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
        payload.userRole,
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
            u.userRole === updatedRow.userRole,
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
      },
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
      payload.deleterUsername,
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
            (u) =>
              !(u.userName === row.userName && u.userRole === row.userRole),
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
        },
      );
  }
}
