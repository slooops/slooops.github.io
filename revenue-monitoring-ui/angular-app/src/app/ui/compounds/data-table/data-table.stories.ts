import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { DataTableComponent } from './data-table.component';
import { ColumnConfig } from '../../types/common.types';

// Mock data for stories
const mockUsers = [
  {
    id: 1,
    userName: 'jsmith',
    email: 'jsmith@cisco.com',
    role: 'Admin',
    enabled: true,
  },
  {
    id: 2,
    userName: 'mwilson',
    email: 'mwilson@cisco.com',
    role: 'Viewer',
    enabled: true,
  },
  {
    id: 3,
    userName: 'agarcia',
    email: 'agarcia@cisco.com',
    role: 'Editor',
    enabled: false,
  },
  {
    id: 4,
    userName: 'lchen',
    email: 'lchen@cisco.com',
    role: 'Admin',
    enabled: true,
  },
  {
    id: 5,
    userName: 'kpatel',
    email: 'kpatel@cisco.com',
    role: 'Viewer',
    enabled: true,
  },
  {
    id: 6,
    userName: 'rjohnson',
    email: 'rjohnson@cisco.com',
    role: 'Editor',
    enabled: true,
  },
  {
    id: 7,
    userName: 'tbrown',
    email: 'tbrown@cisco.com',
    role: 'Viewer',
    enabled: false,
  },
  {
    id: 8,
    userName: 'nlee',
    email: 'nlee@cisco.com',
    role: 'Admin',
    enabled: true,
  },
];

const mockColumns: ColumnConfig[] = [
  { key: 'userName', label: 'Username', isSortable: true },
  { key: 'email', label: 'Email', isSortable: true },
  { key: 'role', label: 'Role', isSortable: true },
  { key: 'enabled', label: 'Status', isSortable: false },
];

const mockColumnsWithActions: ColumnConfig[] = [
  { key: 'userName', label: 'Username', isSortable: true },
  { key: 'email', label: 'Email', isSortable: true },
  { key: 'role', label: 'Role', isSortable: true },
  { key: 'enabled', label: 'Status', isSortable: false },
  { key: 'actions', label: 'Actions', isSortable: false },
];

const meta: Meta<DataTableComponent> = {
  title: 'Compounds/DataTable',
  component: DataTableComponent,
  tags: ['autodocs'],
  argTypes: {
    columns: {
      description:
        'Column configuration array defining headers and data mapping',
    },
    rows: {
      description: 'Array of data objects to display in the table',
    },
    enableGlobalSearch: {
      control: 'boolean',
      description: 'Whether to show the search input above the table',
    },
    pageSizeOptions: {
      description: 'Available page size options for pagination',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the table is in loading state',
    },
  },
};

export default meta;
type Story = StoryObj<DataTableComponent>;

// Default table with data
export const Default: Story = {
  args: {
    columns: mockColumns,
    rows: mockUsers,
    enableGlobalSearch: false,
    pageSizeOptions: [5, 10, 25],
  },
};

// Table with search enabled
export const WithSearch: Story = {
  args: {
    columns: mockColumns,
    rows: mockUsers,
    enableGlobalSearch: true,
    pageSizeOptions: [5, 10, 25],
  },
};

// Table with actions column
export const WithActions: Story = {
  args: {
    columns: mockColumnsWithActions,
    rows: mockUsers,
    enableGlobalSearch: true,
    pageSizeOptions: [5, 10, 25],
  },
};

// Empty table
export const Empty: Story = {
  args: {
    columns: mockColumns,
    rows: [],
    enableGlobalSearch: true,
  },
};

// Loading state
export const Loading: Story = {
  args: {
    columns: mockColumns,
    rows: [],
    isLoading: true,
  },
};

// Large dataset for pagination demo
const largeDataset = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  userName: `user${i + 1}`,
  email: `user${i + 1}@cisco.com`,
  role: ['Admin', 'Editor', 'Viewer'][i % 3],
  enabled: i % 4 !== 0,
}));

export const LargeDataset: Story = {
  args: {
    columns: mockColumns,
    rows: largeDataset,
    enableGlobalSearch: true,
    pageSizeOptions: [10, 25, 50],
  },
};
