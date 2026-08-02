import type { Meta, StoryObj } from '@storybook/angular';
import { BadgeComponent } from './badge.component';

const meta: Meta<BadgeComponent> = {
  title: 'Atoms/Badge',
  component: BadgeComponent,
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Text to display in the badge',
    },
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'danger'],
      description: 'Visual style of the badge',
    },
  },
};

export default meta;
type Story = StoryObj<BadgeComponent>;

export const Default: Story = {
  args: {
    label: 'Default',
    variant: 'default',
  },
};

export const Success: Story = {
  args: {
    label: 'Completed',
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    label: 'Pending',
    variant: 'warning',
  },
};

export const Danger: Story = {
  args: {
    label: 'Error',
    variant: 'danger',
  },
};

// Real-world examples
export const StatusActive: Story = {
  args: {
    label: 'Active',
    variant: 'success',
  },
};

export const StatusInactive: Story = {
  args: {
    label: 'Inactive',
    variant: 'default',
  },
};

export const CountBadge: Story = {
  args: {
    label: '42',
    variant: 'default',
  },
};
