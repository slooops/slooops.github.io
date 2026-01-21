import type { Meta, StoryObj } from '@storybook/angular';
import { ToggleSwitchComponent } from './toggle-switch.component';

const meta: Meta<ToggleSwitchComponent> = {
  title: 'Atoms/ToggleSwitch',
  component: ToggleSwitchComponent,
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Whether the toggle is on',
    },
    label: {
      control: 'text',
      description: 'Label displayed next to the toggle',
    },
    isDisabled: {
      control: 'boolean',
      description: 'Whether the toggle is disabled',
    },
  },
};

export default meta;
type Story = StoryObj<ToggleSwitchComponent>;

export const Off: Story = {
  args: {
    checked: false,
    label: 'Dark Mode',
  },
};

export const On: Story = {
  args: {
    checked: true,
    label: 'Dark Mode',
  },
};

export const WithoutLabel: Story = {
  args: {
    checked: true,
  },
};

export const DisabledOff: Story = {
  args: {
    checked: false,
    label: 'Locked setting',
    isDisabled: true,
  },
};

export const DisabledOn: Story = {
  args: {
    checked: true,
    label: 'Locked setting',
    isDisabled: true,
  },
};

// Real-world examples
export const AutoRefresh: Story = {
  args: {
    checked: true,
    label: 'Auto-refresh data',
  },
};

export const ShowAdvancedOptions: Story = {
  args: {
    checked: false,
    label: 'Show advanced options',
  },
};

export const EnableFeature: Story = {
  args: {
    checked: true,
    label: 'Enable beta features',
  },
};
