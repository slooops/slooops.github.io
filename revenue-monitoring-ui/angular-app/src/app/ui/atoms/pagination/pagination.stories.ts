import type { Meta, StoryObj } from '@storybook/angular';
import { PaginationComponent } from './pagination.component';

const meta: Meta<PaginationComponent> = {
  title: 'Atoms/Pagination',
  component: PaginationComponent,
  tags: ['autodocs'],
  argTypes: {
    pageIndex: {
      control: 'number',
      description: 'Current page index (0-based)',
    },
    pageSize: {
      control: 'number',
      description: 'Number of items per page',
    },
    totalItems: {
      control: 'number',
      description: 'Total number of items',
    },
    pageSizeOptions: {
      control: 'object',
      description: 'Available page size options',
    },
  },
};

export default meta;
type Story = StoryObj<PaginationComponent>;

export const Default: Story = {
  args: {
    pageIndex: 0,
    pageSize: 25,
    totalItems: 100,
    pageSizeOptions: [10, 25, 50, 100],
  },
};

export const MiddlePage: Story = {
  args: {
    pageIndex: 2,
    pageSize: 25,
    totalItems: 250,
    pageSizeOptions: [10, 25, 50, 100],
  },
};

export const LastPage: Story = {
  args: {
    pageIndex: 9,
    pageSize: 10,
    totalItems: 100,
    pageSizeOptions: [10, 25, 50, 100],
  },
};

export const SmallDataset: Story = {
  args: {
    pageIndex: 0,
    pageSize: 25,
    totalItems: 15,
    pageSizeOptions: [10, 25, 50, 100],
  },
};

export const LargeDataset: Story = {
  args: {
    pageIndex: 0,
    pageSize: 50,
    totalItems: 5000,
    pageSizeOptions: [25, 50, 100, 250],
  },
};

export const EmptyDataset: Story = {
  args: {
    pageIndex: 0,
    pageSize: 25,
    totalItems: 0,
    pageSizeOptions: [10, 25, 50, 100],
  },
};

export const CustomPageSizes: Story = {
  args: {
    pageIndex: 0,
    pageSize: 20,
    totalItems: 200,
    pageSizeOptions: [20, 40, 60, 80],
  },
};
