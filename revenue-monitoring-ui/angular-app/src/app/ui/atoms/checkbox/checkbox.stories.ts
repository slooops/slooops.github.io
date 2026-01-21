import type { Meta, StoryObj } from '@storybook/angular';
import { CheckboxComponent } from './checkbox.component';

const meta: Meta<CheckboxComponent> = {
  title: 'Atoms/Checkbox',
  component: CheckboxComponent,
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Whether the checkbox is checked',
    },
    label: {
      control: 'text',
      description: 'Label displayed next to the checkbox',
    },
    isDisabled: {
      control: 'boolean',
      description: 'Whether the checkbox is disabled',
    },
  },
};

export default meta;
type Story = StoryObj<CheckboxComponent>;

export const Unchecked: Story = {
  args: {
    checked: false,
    label: 'Accept terms and conditions',
  },
};

export const Checked: Story = {
  args: {
    checked: true,
    label: 'Accept terms and conditions',
  },
};

export const WithoutLabel: Story = {
  args: {
    checked: false,
  },
};

export const DisabledUnchecked: Story = {
  args: {
    checked: false,
    label: 'Disabled option',
    isDisabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    checked: true,
    label: 'Disabled checked option',
    isDisabled: true,
  },
};

// Real-world examples
export const SelectAllRows: Story = {
  args: {
    checked: false,
    label: 'Select all',
  },
};

export const EnableNotifications: Story = {
  args: {
    checked: true,
    label: 'Enable email notifications',
  },
};
