import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostBinding,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToggleSwitchComponent } from '../../ui/atoms/toggle-switch/toggle-switch.component';
import { PaginationComponent } from '../../ui/atoms/pagination/pagination.component';
import { PageChangeEvent } from '../../ui/types/common.types';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorPencilSimpleBold,
  phosphorArrowLeftBold,
  phosphorTrashBold,
} from '@ng-icons/phosphor-icons/bold';
import { AuthenticationService } from 'src/app/providers/authentication.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { ApiHttpService } from 'src/app/providers/http.service';

export interface RoleRow {
  ROLE_ID: number;
  ROLE_NAME: string;
  ROLE_VALUE: string;
  DESCRIPTION: string;
  DASHBOARD_NAME: string;
  ENABLED_FLAG: string;
  LAST_UPDATED_DATE: string;
}

export interface RoleFormData {
  ROLE_NAME: string;
  ROLE_VALUE: string;
  DASHBOARD_NAME: string;
  DESCRIPTION: string;
}

@Component({
  selector: 'app-update-role-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToggleSwitchComponent,
    PaginationComponent,
    NgIcon,
  ],
  viewProviders: [
    provideIcons({
      phosphorPencilSimpleBold,
      phosphorArrowLeftBold,
      phosphorTrashBold,
    }),
  ],
  templateUrl: './update-role-dialog.component.html',
  styleUrls: ['./update-role-dialog.component.css'],
})
export class UpdateRoleDialogComponent {
  @Input() roles: RoleRow[] = [];
  @Output() back = new EventEmitter<void>();
  @Output() rolesChanged = new EventEmitter<void>();

  @HostBinding('class.dark-theme') _darkMode = false;
  @Input() set darkMode(val: boolean) {
    this._darkMode = !!val;
  }

  constructor(
    private http: ApiHttpService,
    private destroyManager: DestroyManager,
    private authService: AuthenticationService,
  ) {}

  searchQuery = '';
  username: string;

  // ── Pagination state ──
  currentPage = 0;
  pageSize = 15;

  // ── Edit/Add Dialog state ──
  showEditDialog = false;
  editDialogMode: 'add' | 'edit' = 'add';
  editingRole: RoleRow | null = null;
  formData: RoleFormData = {
    ROLE_NAME: '',
    ROLE_VALUE: '',
    DASHBOARD_NAME: '',
    DESCRIPTION: '',
  };
  formValidation: Partial<Record<keyof RoleFormData, string>> = {};
  formSaving = false;

  // ── Delete Confirmation Dialog state ──
  showDeleteDialog = false;
  deletingRole: RoleRow | null = null;
  deleteLoading = false;

  get filteredRoles(): RoleRow[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.roles;
    return this.roles.filter(
      (r) =>
        r.ROLE_NAME.toLowerCase().includes(q) ||
        r.ROLE_VALUE.toLowerCase().includes(q) ||
        r.DESCRIPTION.toLowerCase().includes(q) ||
        r.DASHBOARD_NAME.toLowerCase().includes(q),
    );
  }

  get paginatedRoles(): RoleRow[] {
    const start = this.currentPage * this.pageSize;
    return this.filteredRoles.slice(start, start + this.pageSize);
  }

  onPageChange(event: PageChangeEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  onSearchChange(): void {
    this.currentPage = 0;
  }

  // ── Table actions ──

  onToggle(role: RoleRow, enabled: boolean): void {
    const previousFlag = role.ENABLED_FLAG;
    role.ENABLED_FLAG = enabled ? 'Y' : 'N';

    const body = {
      roleId: role.ROLE_ID,
      roleName: role.ROLE_NAME,
      roleValue: role.ROLE_VALUE,
      description: role.DESCRIPTION,
      enabledFlag: enabled ? 'Y' : 'N',
      dashboardName: role.DASHBOARD_NAME,
      username: this.authService.getUserName(),
    };

    this.http.put('update-role', body, this.destroyManager).subscribe({
      next: (res: any) => {
        this.rolesChanged.emit();
      },
      error: (err) => {
        console.error('Error toggling role status:', err);
        // Revert on failure
        role.ENABLED_FLAG = previousFlag;
      },
    });
  }

  onBack(): void {
    this.back.emit();
  }

  // ── Edit/Add Dialog methods ──

  openAddDialog(): void {
    this.editDialogMode = 'add';
    this.editingRole = null;
    this.formData = {
      ROLE_NAME: '',
      ROLE_VALUE: '',
      DASHBOARD_NAME: '',
      DESCRIPTION: '',
    };
    this.formValidation = {};
    this.showEditDialog = true;
  }

  openEditDialog(role: RoleRow): void {
    this.editDialogMode = 'edit';
    this.editingRole = role;
    this.formData = {
      ROLE_NAME: role.ROLE_NAME,
      ROLE_VALUE: role.ROLE_VALUE,
      DASHBOARD_NAME: role.DASHBOARD_NAME,
      DESCRIPTION: role.DESCRIPTION,
    };
    this.formValidation = {};
    this.showEditDialog = true;
  }

  closeEditDialog(): void {
    this.showEditDialog = false;
    this.editingRole = null;
    this.formValidation = {};
    this.formSaving = false;
  }

  onDeleteRole(role: RoleRow): void {
    this.deletingRole = role;
    this.showDeleteDialog = true;
    this.deleteLoading = false;
  }

  confirmDelete(): void {
    if (!this.deletingRole) return;
    this.deleteLoading = true;

    const body = {
      roleId: this.deletingRole.ROLE_ID,
      username: this.authService.getUserName(),
    };

    this.http.delete('delete-role', this.destroyManager, { body }).subscribe({
      next: () => {
        this.cancelDelete();
        this.rolesChanged.emit();
      },
      error: (err: any) => {
        console.error('Error deleting role:', err);
        this.deleteLoading = false;
      },
    });
  }

  cancelDelete(): void {
    this.showDeleteDialog = false;
    this.deletingRole = null;
    this.deleteLoading = false;
  }

  onEditDialogBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeEditDialog();
    }
  }

  onSaveForm(): void {
    this.formValidation = {};
    const { ROLE_NAME, ROLE_VALUE, DASHBOARD_NAME, DESCRIPTION } =
      this.formData;

    if (!ROLE_NAME.trim())
      this.formValidation.ROLE_NAME = 'Role name is required';
    if (!ROLE_VALUE.trim())
      this.formValidation.ROLE_VALUE = 'Role value is required';
    if (!DASHBOARD_NAME.trim())
      this.formValidation.DASHBOARD_NAME = 'Dashboard name is required';
    if (!DESCRIPTION.trim())
      this.formValidation.DESCRIPTION = 'Description is required';

    if (Object.keys(this.formValidation).length) return;

    this.formSaving = true;

    if (this.editDialogMode === 'add') {
      // ── POST /api/insert-role ──
      const body = {
        roleName: ROLE_NAME.trim(),
        roleValue: ROLE_VALUE.trim(),
        description: DESCRIPTION.trim(),
        dashboardName: DASHBOARD_NAME.trim(),
        username: this.authService.getUserName(),
      };

      this.http.post<any>('insert-role', body).subscribe({
        next: (res) => {
          this.closeEditDialog();
          this.rolesChanged.emit();
        },
        error: (err) => {
          console.error('Error creating role:', err);
          this.formSaving = false;
          this.formValidation.ROLE_NAME =
            err?.error?.message || 'Failed to create role';
        },
      });
    } else {
      // ── PUT /api/update-role ──
      const body = {
        roleId: this.editingRole!.ROLE_ID,
        roleName: ROLE_NAME.trim(),
        roleValue: ROLE_VALUE.trim(),
        description: DESCRIPTION.trim(),
        enabledFlag: this.editingRole!.ENABLED_FLAG,
        dashboardName: DASHBOARD_NAME.trim(),
        username: this.authService.getUserName(),
      };

      this.http.put('update-role', body, this.destroyManager).subscribe({
        next: (res: any) => {
          console.log('Role updated:', res);
          this.closeEditDialog();
          this.rolesChanged.emit();
        },
        error: (err) => {
          console.error('Error updating role:', err);
          this.formSaving = false;
          this.formValidation.ROLE_NAME =
            err?.error?.message || 'Failed to update role';
        },
      });
    }
  }
}
