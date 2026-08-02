import type { Meta, StoryObj } from '@storybook/angular';
import { SelectDropdownComponent } from './select-dropdown.component';

const meta: Meta<SelectDropdownComponent> = {
  title: 'Atoms/SelectDropdown',
  component: SelectDropdownComponent,
  tags: ['autodocs'],
  argTypes: {
    options: {
      control: 'object',
      description: 'Array of options with label and value',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when no option is selected',
    },
    value: {
      control: 'text',
      description: 'Currently selected value',
    },
    label: {
      control: 'text',
      description: 'Label displayed above the dropdown',
    },
    isDisabled: {
      control: 'boolean',
      description: 'Whether the dropdown is disabled',
    },
  },
};

export default meta;
type Story = StoryObj<SelectDropdownComponent>;

const sampleOptions = [
  { label: 'Option 1', value: '1' },
  { label: 'Option 2', value: '2' },
  { label: 'Option 3', value: '3' },
];

export const Default: Story = {
  args: {
    options: sampleOptions,
    placeholder: 'Select an option',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Choose an option',
    options: sampleOptions,
    placeholder: 'Select...',
  },
};

export const WithPreselectedValue: Story = {
  args: {
    label: 'Status',
    options: sampleOptions,
    value: '2',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Dropdown',
    options: sampleOptions,
    value: '1',
    isDisabled: true,
  },
};

// Real-world examples
export const StatusFilter: Story = {
  args: {
    label: 'Status',
    options: [
      { label: 'All', value: 'all' },
      { label: 'Active', value: 'active' },
      { label: 'Pending', value: 'pending' },
      { label: 'Completed', value: 'completed' },
      { label: 'Failed', value: 'failed' },
    ],
    placeholder: 'Filter by status',
  },
};

export const PeriodSelector: Story = {
  args: {
    label: 'Period',
    options: [
      { label: 'Q1 FY2024', value: 'q1-2024' },
      { label: 'Q2 FY2024', value: 'q2-2024' },
      { label: 'Q3 FY2024', value: 'q3-2024' },
      { label: 'Q4 FY2024', value: 'q4-2024' },
    ],
    placeholder: 'Select period',
  },
};

export const RegionSelector: Story = {
  args: {
    label: 'Operating Unit',
    options: [
      { label: 'United States', value: 'US' },
      { label: 'United Kingdom', value: 'GB' },
      { label: 'Germany', value: 'DE' },
      { label: 'Japan', value: 'JP' },
      { label: 'Australia', value: 'AU' },
    ],
    placeholder: 'Select region',
  },
};
