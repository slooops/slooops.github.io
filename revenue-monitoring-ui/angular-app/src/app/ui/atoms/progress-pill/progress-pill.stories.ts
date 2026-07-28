import type { Meta, StoryObj } from '@storybook/angular';
import { ProgressPillComponent } from './progress-pill.component';

const meta: Meta<ProgressPillComponent> = {
  title: 'Atoms/ProgressPill',
  component: ProgressPillComponent,
  tags: ['autodocs'],
  argTypes: {
    percentage: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Fill width as a 0-100 percentage.',
    },
    color: {
      control: 'select',
      options: [
        'accent',
        'cyan',
        'purple',
        'amber',
        'green',
        'grey',
        'neutral',
        'orange',
      ],
      description: 'Gradient variant applied to the fill.',
    },
    label: {
      control: 'text',
      description: 'Centered text overlay (e.g. "91.7%" or "5,364 cases").',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Height and label size.',
    },
    clickable: {
      control: 'boolean',
      description: 'Enables hover feedback and emits pillClick.',
    },
  },
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<ProgressPillComponent>;

export const Accent: Story = {
  args: {
    percentage: 65,
    color: 'accent',
    label: '65%',
    size: 'md',
  },
};

export const Cyan: Story = {
  args: {
    percentage: 33,
    color: 'cyan',
    label: '1,582 / 4,757',
    size: 'md',
  },
};

export const Green: Story = {
  args: {
    percentage: 91.7,
    color: 'green',
    label: '5,364 cases',
    size: 'md',
  },
};

export const Amber: Story = {
  args: {
    percentage: 17,
    color: 'amber',
    label: '178 / 1,035',
    size: 'md',
  },
};

export const Purple: Story = {
  args: {
    percentage: 9,
    color: 'purple',
    label: '150 / 1,631',
    size: 'md',
  },
};

export const Orange: Story = {
  args: {
    percentage: 45,
    color: 'orange',
    label: '45%',
    size: 'md',
  },
};

export const Grey: Story = {
  args: {
    percentage: 55,
    color: 'grey',
    label: '55%',
    size: 'md',
  },
};

export const Neutral: Story = {
  args: {
    percentage: 100,
    color: 'neutral',
    label: 'no data',
    size: 'md',
  },
};

// Sizes
export const SmallCompact: Story = {
  args: {
    percentage: 84,
    color: 'green',
    label: '84%',
    size: 'sm',
  },
};

export const LargeEmphasis: Story = {
  args: {
    percentage: 72,
    color: 'accent',
    label: '72% complete',
    size: 'lg',
  },
};

// Interactive
export const Clickable: Story = {
  args: {
    percentage: 88,
    color: 'green',
    label: 'view breakdown',
    size: 'md',
    clickable: true,
  },
};

// Edge cases
export const Empty: Story = {
  args: {
    percentage: 0,
    color: 'accent',
    label: '0%',
    size: 'md',
  },
};

export const Full: Story = {
  args: {
    percentage: 100,
    color: 'green',
    label: '100%',
    size: 'md',
  },
};
