# Finance IT Component Library

## Overview

This is a reusable, atomic component library built for the Finance IT Revenue Operations Dashboard. The library follows atomic design principles with components that use a shared design system (`ui.css`) and are ready for Storybook documentation.

## Architecture

```
src/app/
├── ui/
│   ├── atoms/              # Basic building blocks
│   ├── compounds/          # Composed from atoms
│   └── types/              # Shared TypeScript types
└── features/               # Feature-specific screens
    └── admin/              # Admin dashboard feature
```

## Design System

All components use the `ui.css` design system located at `src/assets/ui.css`.

### Key Principles:

1. **Every component CSS file must start with:** `@import "src/assets/ui.css";`
2. **Use existing `.fit-*` classes** from ui.css instead of creating custom styles
3. **Module-based components only** (no `standalone: true`)
4. **No Angular Material** - all UI built with atoms + ui.css

## Atom Components

### ButtonComponent

**Selector:** `<app-button>`

**Inputs:**

- `label: string` - Button text
- `variant: 'primary' | 'secondary' | 'ghost' | 'danger'` - Style variant
- `size: 'sm' | 'md' | 'lg'` - Button size
- `isDisabled: boolean` - Disabled state
- `isLoading: boolean` - Loading state
- `iconName?: string` - Optional icon
- `iconPosition: 'left' | 'right'` - Icon position
- `type: 'button' | 'submit' | 'reset'` - Button type

**Outputs:**

- `clicked: EventEmitter<MouseEvent>` - Click event

**Example:**

```html
<app-button label="Save" variant="primary" iconName="check" iconPosition="left" (clicked)="onSave()"> </app-button>
```

---

### IconComponent

**Selector:** `<app-icon>`

**Inputs:**

- `name: string` - Icon name (e.g., 'search', 'info', 'check')
- `size: string` - Icon size (default: '1rem')
- `ariaLabel?: string` - Accessibility label

**Example:**

```html
<app-icon name="search" size="1.2rem" ariaLabel="Search"></app-icon>
```

---

### TextInputComponent

**Selector:** `<app-text-input>`

**Inputs:**

- `value: string` - Input value
- `placeholder: string` - Placeholder text
- `label?: string` - Input label
- `type: 'text' | 'email' | 'search'` - Input type
- `iconPosition?: 'left' | 'right'` - Icon position
- `iconName?: string` - Icon name
- `debounceMs: number` - Debounce delay (default: 300)
- `isDisabled: boolean` - Disabled state

**Outputs:**

- `valueChange: EventEmitter<string>` - Debounced value change
- `submitted: EventEmitter<string>` - Enter key pressed

**Example:**

```html
<app-text-input [value]="searchTerm" placeholder="Search..." type="search" iconName="search" iconPosition="left" (valueChange)="onSearch($event)"> </app-text-input>
```

---

### CheckboxComponent

**Selector:** `<app-checkbox>`

**Inputs:**

- `checked: boolean` - Checked state
- `label?: string` - Checkbox label
- `isDisabled: boolean` - Disabled state

**Outputs:**

- `checkedChange: EventEmitter<boolean>` - Check state change

**Example:**

```html
<app-checkbox [checked]="isSelected" label="Select item" (checkedChange)="onSelect($event)"> </app-checkbox>
```

---

### ToggleSwitchComponent

**Selector:** `<app-toggle-switch>`

**Inputs:**

- `checked: boolean` - Toggle state
- `label?: string` - Toggle label
- `isDisabled: boolean` - Disabled state

**Outputs:**

- `checkedChange: EventEmitter<boolean>` - Toggle state change

**Example:**

```html
<app-toggle-switch [checked]="user.enabled" label="Enabled" (checkedChange)="onToggleEnabled($event)"> </app-toggle-switch>
```

---

### SelectDropdownComponent

**Selector:** `<app-select-dropdown>`

**Inputs:**

- `options: SelectOption[]` - Array of `{ label: string; value: string }`
- `placeholder: string` - Placeholder text
- `value: string` - Selected value
- `label?: string` - Dropdown label
- `isDisabled: boolean` - Disabled state

**Outputs:**

- `valueChange: EventEmitter<string>` - Selection change

**Example:**

```html
<app-select-dropdown [options]="roleOptions" [value]="selectedRole" placeholder="Select a role" label="Role" (valueChange)="onRoleChange($event)"> </app-select-dropdown>
```

---

### PaginationComponent

**Selector:** `<app-pagination>`

**Inputs:**

- `pageIndex: number` - Current page (0-indexed)
- `pageSize: number` - Items per page
- `totalItems: number` - Total number of items
- `pageSizeOptions: number[]` - Page size options

**Outputs:**

- `pageChange: EventEmitter<PageChangeEvent>` - Page change event

**Example:**

```html
<app-pagination [pageIndex]="currentPage" [pageSize]="pageSize" [totalItems]="totalCount" [pageSizeOptions]="[25, 50, 100]" (pageChange)="onPageChange($event)"> </app-pagination>
```

---

### BadgeComponent

**Selector:** `<app-badge>`

**Inputs:**

- `label: string` - Badge text
- `variant: 'default' | 'success' | 'warning' | 'danger'` - Style variant

**Example:**

```html
<app-badge label="Active" variant="success"></app-badge>
```

---

### TableCellComponent & TableHeaderCellComponent

**Selectors:** `<app-table-cell>`, `<app-table-header-cell>`

**TableHeaderCellComponent Inputs:**

- `isSortable: boolean` - Enable sorting
- `sortDirection?: 'asc' | 'desc'` - Current sort direction
- `align: 'left' | 'center' | 'right'` - Text alignment

**TableHeaderCellComponent Outputs:**

- `sort: EventEmitter<void>` - Sort click event

**Example:**

```html
<table class="fit-table">
  <thead>
    <tr>
      <app-table-header-cell [isSortable]="true" (sort)="onSort()"> Username </app-table-header-cell>
    </tr>
  </thead>
  <tbody>
    <tr>
      <app-table-cell>john.doe</app-table-cell>
    </tr>
  </tbody>
</table>
```

---

### ModalShellComponent

**Selector:** `<app-modal-shell>`

**Inputs:**

- `title: string` - Modal title
- `isOpen: boolean` - Open state

**Outputs:**

- `close: EventEmitter<void>` - Close event (ESC, backdrop, X button)

**Example:**

```html
<app-modal-shell title="Add User" [isOpen]="isModalOpen" (close)="onCloseModal()">
  <p>Modal content goes here</p>
  <div slot="footer">
    <app-button label="Cancel" variant="secondary" (clicked)="onCancel()"></app-button>
    <app-button label="Save" variant="primary" (clicked)="onSave()"></app-button>
  </div>
</app-modal-shell>
```

---

## Compound Components

### DataTableComponent

**Selector:** `<app-data-table>`

**Inputs:**

- `columns: ColumnConfig[]` - Column definitions
- `rows: any[]` - Data rows
- `enableGlobalSearch: boolean` - Enable search
- `pageSizeOptions: number[]` - Page size options
- `enableSelection: boolean` - Enable row selection

**Outputs:**

- `rowClick: EventEmitter<any>` - Row click event
- `filterChange: EventEmitter<{ column: string; value: string }>` - Filter change
- `selectionChange: EventEmitter<any[]>` - Selection change

**Example:**

```typescript
columns: ColumnConfig[] = [
  { key: 'userName', label: 'Username', isSortable: true },
  { key: 'email', label: 'Email', isSortable: true }
];
```

```html
<app-data-table [columns]="columns" [rows]="users" [enableGlobalSearch]="true" (rowClick)="onRowClick($event)"> </app-data-table>
```

---

### FilterBarComponent

**Selector:** `<app-filter-bar>`

**Inputs:**

- `searchValue: string` - Search input value
- `roleOptions: SelectOption[]` - Role filter options
- `selectedRole: string` - Selected role
- `enabledFilter: string` - Enabled/disabled filter

**Outputs:**

- `searchChange: EventEmitter<string>` - Search change
- `roleFilterChange: EventEmitter<string>` - Role filter change
- `enabledFilterChange: EventEmitter<string>` - Status filter change
- `addUserClick: EventEmitter<void>` - Add user button click

---

### UserFormComponent

**Selector:** `<app-user-form>`

**Inputs:**

- `value: UserFormData` - Form data
- `roleOptions: SelectOption[]` - Available roles
- `isEdit: boolean` - Edit vs create mode

**Outputs:**

- `submit: EventEmitter<UserFormData>` - Form submission
- `cancel: EventEmitter<void>` - Form cancellation

---

## Feature Components

### AdminUserTableComponent

**Selector:** `<app-admin-user-table>`

Complete admin dashboard that composes:

- FilterBarComponent
- DataTableComponent
- ModalShellComponent + UserFormComponent

Handles:

- Loading user data from `/api/user-roles`
- Filtering by role and enabled status
- Global search
- Pagination
- User selection
- Add/edit user modal

---

## TypeScript Types

Located in `src/app/ui/types/common.types.ts`:

```typescript
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";
export type BadgeVariant = "default" | "success" | "warning" | "danger";
export type IconPosition = "left" | "right";

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
```

---

## Module Configuration

All components are declared and exported in `AppModule`:

```typescript
@NgModule({
  declarations: [
    // ... existing components
    // UI Atoms
    ButtonComponent,
    IconComponent,
    TextInputComponent,
    CheckboxComponent,
    ToggleSwitchComponent,
    SelectDropdownComponent,
    PaginationComponent,
    BadgeComponent,
    TableCellComponent,
    TableHeaderCellComponent,
    ModalShellComponent,
    // UI Compounds
    DataTableComponent,
    FilterBarComponent,
    UserFormComponent,
    // Features
    AdminUserTableComponent,
  ],
  exports: [
    // Export reusable UI components
    ButtonComponent,
    IconComponent,
    TextInputComponent,
    // ... all UI atoms and compounds
  ],
})
export class AppModule {}
```

---

## Development Guidelines

### Creating New Atoms

1. Create component in `src/app/ui/atoms/[component-name]/`
2. Component CSS **must** start with: `@import "src/assets/ui.css";`
3. Use `.fit-*` classes from ui.css
4. Define clear `@Input()` and `@Output()` APIs
5. **No `standalone: true`** - module-based only
6. Add to `AppModule` declarations and exports

### Creating New Compounds

1. Create component in `src/app/ui/compounds/[component-name]/`
2. Compose from existing atoms
3. Follow same CSS/styling guidelines
4. Add to `AppModule` declarations

### Storybook Preparation

Components are designed with Storybook in mind:

- Clear input/output APIs
- Self-contained with minimal dependencies
- Uses shared design tokens from ui.css
- Module-based for easy integration

---

## TODO / Future Enhancements

### Backend Endpoints Needed:

- `POST /api/user-role` - Create new user
- `PUT /api/user-role/:id` - Update user
- `PATCH /api/user-role/:id/enabled` - Toggle enabled flag

### Component Enhancements:

- Multi-select support for roles in UserFormComponent
- Column filtering UI in DataTableComponent
- Advanced sorting (multi-column)
- Export table data feature
- Icon sprite system to replace CSS icon classes

### Storybook:

- Set up Storybook configuration
- Create stories for all atoms
- Create stories for compound components
- Document design token usage

---

## Usage Example: Admin Dashboard

```typescript
// admin.component.ts
import { Component } from "@angular/core";

@Component({
  selector: "app-admin",
  template: "<app-admin-user-table></app-admin-user-table>",
})
export class AdminComponent {}
```

That's it! The AdminUserTableComponent handles everything:

- Data fetching
- Filtering
- Searching
- Pagination
- Add/Edit modals
- All composed from reusable atoms
