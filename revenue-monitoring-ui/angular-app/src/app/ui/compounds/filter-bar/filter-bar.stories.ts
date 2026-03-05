import type { Meta, StoryObj } from '@storybook/angular';
import { FilterBarComponent } from './filter-bar.component';
import { SelectOption } from '../../types/common.types';

// Mock role options
const mockRoleOptions: SelectOption[] = [
  { label: 'All Roles', value: '' },
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer' },
  { label: 'Sub-Admin', value: 'sub-admin' },
];

const meta: Meta<FilterBarComponent> = {
  title: 'Compounds/FilterBar',
  component: FilterBarComponent,
  tags: ['autodocs'],
  argTypes: {
    searchValue: {
      control: 'text',
      description: 'Current value of the search input',
    },
    roleOptions: {
      description: 'Options for the role filter dropdown',
    },
    selectedRole: {
      control: 'text',
      description: 'Currently selected role filter value',
    },
    enabledFilter: {
      control: 'select',
      options: ['', 'Y', 'N'],
      description: 'Filter by enabled/disabled status',
    },
    isFullAdmin: {
      control: 'boolean',
      description: 'Whether to show the "Create Sub-Admin" button',
    },
  },
};

export default meta;
type Story = StoryObj<FilterBarComponent>;

// Default state
export const Default: Story = {
  args: {
    searchValue: '',
    roleOptions: mockRoleOptions,
    selectedRole: '',
    enabledFilter: '',
    isFullAdmin: false,
  },
};

// With search value
export const WithSearch: Story = {
  args: {
    searchValue: 'john',
    roleOptions: mockRoleOptions,
    selectedRole: '',
    enabledFilter: '',
    isFullAdmin: false,
  },
};

// With filters applied
export const WithFilters: Story = {
  args: {
    searchValue: '',
    roleOptions: mockRoleOptions,
    selectedRole: 'admin',
    enabledFilter: 'Y',
    isFullAdmin: false,
  },
};

// Full admin view (shows Create Sub-Admin button)
export const FullAdminView: Story = {
  args: {
    searchValue: '',
    roleOptions: mockRoleOptions,
    selectedRole: '',
    enabledFilter: '',
    isFullAdmin: true,
  },
};

// All filters active
export const AllFiltersActive: Story = {
  args: {
    searchValue: 'cisco',
    roleOptions: mockRoleOptions,
    selectedRole: 'editor',
    enabledFilter: 'N',
    isFullAdmin: true,
  },
};
