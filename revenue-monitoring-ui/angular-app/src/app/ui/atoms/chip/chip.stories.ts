import type { Meta, StoryObj } from '@storybook/angular';
import { ChipComponent } from './chip.component';

const meta: Meta<ChipComponent> = {
  title: 'Atoms/Chip',
  component: ChipComponent,
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Short label, typically uppercase (e.g. "OM", "CAPITAL").',
    },
    color: {
      control: 'select',
      options: ['neutral', 'green', 'grey', 'amber', 'orange'],
      description: 'Semantic color variant.',
    },
    clickable: {
      control: 'boolean',
      description: 'Enables interactive hover state and emits chipClick.',
    },
  },
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<ChipComponent>;

export const Neutral: Story = {
  args: {
    label: 'CAPITAL',
    color: 'neutral',
  },
};

export const Green: Story = {
  args: {
    label: 'OM',
    color: 'green',
  },
};

export const Grey: Story = {
  args: {
    label: 'SM',
    color: 'grey',
  },
};

export const Amber: Story = {
  args: {
    label: 'AIT',
    color: 'amber',
  },
};

export const Orange: Story = {
  args: {
    label: 'P2P',
    color: 'orange',
  },
};

export const Clickable: Story = {
  args: {
    label: 'I2C',
    color: 'green',
    clickable: true,
  },
};
