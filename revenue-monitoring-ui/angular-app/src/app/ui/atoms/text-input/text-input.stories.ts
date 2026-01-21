import type { Meta, StoryObj } from '@storybook/angular';
import { TextInputComponent } from './text-input.component';

const meta: Meta<TextInputComponent> = {
  title: 'Atoms/TextInput',
  component: TextInputComponent,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'Current value of the input',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when input is empty',
    },
    label: {
      control: 'text',
      description: 'Label displayed above the input',
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'search'],
      description: 'HTML input type',
    },
    iconName: {
      control: 'text',
      description: 'Name of the icon to display',
    },
    iconPosition: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Position of the icon',
    },
    debounceMs: {
      control: 'number',
      description: 'Debounce delay in milliseconds',
    },
    isDisabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    noBorder: {
      control: 'boolean',
      description: 'Remove border styling',
    },
  },
};

export default meta;
type Story = StoryObj<TextInputComponent>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter your username',
  },
};

export const WithValue: Story = {
  args: {
    label: 'Email',
    value: 'user@example.com',
    type: 'email',
  },
};

export const SearchInput: Story = {
  args: {
    placeholder: 'Search...',
    type: 'search',
    iconName: 'search',
    iconPosition: 'left',
  },
};

export const WithIconRight: Story = {
  args: {
    placeholder: 'Enter value',
    iconName: 'info',
    iconPosition: 'right',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Field',
    value: 'Cannot edit this',
    isDisabled: true,
  },
};

export const NoBorder: Story = {
  args: {
    placeholder: 'Borderless input',
    noBorder: true,
  },
};

export const CustomDebounce: Story = {
  args: {
    label: 'Fast Input (100ms debounce)',
    placeholder: 'Type quickly...',
    debounceMs: 100,
  },
};
