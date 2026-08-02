// Common types for UI components

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger';
export type IconPosition = 'left' | 'right';

// Gradient progress-pill colors (used by ProgressPill / KpiTile / StatTable)
export type PillColor =
  | 'accent'
  | 'cyan'
  | 'purple'
  | 'amber'
  | 'green'
  | 'grey'
  | 'neutral'
  | 'orange';

export type PillSize = 'sm' | 'md' | 'lg';

// Chip (pill-shaped label) colors
export type ChipColor = 'neutral' | 'green' | 'grey' | 'amber' | 'orange';

// Stat-table renderer types
export type StatTableRenderer =
  | 'text'
  | 'number'
  | 'chip'
  | 'progressPill'
  | 'numberWithSub'
  | 'link';

export interface StatTableColumn {
  key: string;
  label: string;
  renderer?: StatTableRenderer;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

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
  creationDateRaw: string; // Raw DB format for exact matching in WHERE clause
  userEmail: string;
}

export interface UserFormData {
  userId?: number;
  userName: string;
  email: string;
  roles: string[];
  enabled: boolean;
}
