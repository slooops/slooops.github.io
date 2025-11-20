// Common types for UI components

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger';
export type IconPosition = 'left' | 'right';

export interface SelectOption {
  label: string;
  value: string;
}

export interface ColumnConfig {
  key: string;
  label: string;
  isFilterable?: boolean;
  isSortable?: boolean;
  width?: string;
}

export interface PageChangeEvent {
  pageIndex: number;
  pageSize: number;
}

export interface AdminUserRow {
  userId: number;
  userName: string;
  roleId: number;
  userRole: string;
  enabledFlag: string;
  creationDate: Date;
  userEmail: string;
}

export interface UserFormData {
  userId?: number;
  userName: string;
  email: string;
  roles: string[];
  enabled: boolean;
}
