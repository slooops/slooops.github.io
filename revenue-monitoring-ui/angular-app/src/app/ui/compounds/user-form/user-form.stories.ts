import type { Meta, StoryObj } from '@storybook/angular';
import { UserFormComponent } from './user-form.component';
import { SelectOption, UserFormData } from '../../types/common.types';

// Mock role options for dropdown
const mockRoleOptions: SelectOption[] = [
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer' },
  { label: 'Sub-Admin', value: 'sub-admin' },
];

const emptyFormData: UserFormData = {
  userName: '',
  email: '',
  roles: [],
  enabled: true,
};

const filledFormData: UserFormData = {
  userName: 'jsmith',
  email: 'jsmith@cisco.com',
  roles: ['admin'],
  enabled: true,
};

const disabledUserData: UserFormData = {
  userName: 'olduser',
  email: 'olduser@cisco.com',
  roles: ['viewer'],
  enabled: false,
};

const meta: Meta<UserFormComponent> = {
  title: 'Compounds/UserForm',
  component: UserFormComponent,
  tags: ['autodocs'],
  argTypes: {
    value: {
      description: 'Form data object containing user details',
    },
    roleOptions: {
      description:
        'Options for the role dropdown (when useRoleDropdown is true)',
    },
    isEdit: {
      control: 'boolean',
      description:
        'Whether the form is in edit mode (username becomes read-only)',
    },
    roleFieldLabel: {
      control: 'text',
      description: 'Custom label for the role field',
    },
    useRoleDropdown: {
      control: 'boolean',
      description: 'Whether to show a dropdown or text input for role',
    },
  },
};

export default meta;
type Story = StoryObj<UserFormComponent>;

// Empty form for adding new user
export const NewUser: Story = {
  args: {
    value: emptyFormData,
    roleOptions: mockRoleOptions,
    isEdit: false,
    roleFieldLabel: 'Role',
    useRoleDropdown: true,
  },
};

// Form with role as text input
export const NewUserTextInput: Story = {
  args: {
    value: emptyFormData,
    roleOptions: [],
    isEdit: false,
    roleFieldLabel: 'Role',
    useRoleDropdown: false,
  },
};

// Pre-filled form for editing
export const EditUser: Story = {
  args: {
    value: filledFormData,
    roleOptions: mockRoleOptions,
    isEdit: true,
    roleFieldLabel: 'Role',
    useRoleDropdown: true,
  },
};

// Editing a disabled user
export const EditDisabledUser: Story = {
  args: {
    value: disabledUserData,
    roleOptions: mockRoleOptions,
    isEdit: true,
    roleFieldLabel: 'Access Level',
    useRoleDropdown: true,
  },
};

// Custom role label
export const CustomRoleLabel: Story = {
  args: {
    value: emptyFormData,
    roleOptions: mockRoleOptions,
    isEdit: false,
    roleFieldLabel: 'Permission Group',
    useRoleDropdown: true,
  },
};
