import type { Meta, StoryObj } from '@storybook/angular';
import { TableHeaderCellComponent } from './table-header-cell.component';

const meta: Meta<TableHeaderCellComponent> = {
  title: 'Atoms/TableHeaderCell',
  component: TableHeaderCellComponent,
  tags: ['autodocs'],
  argTypes: {
    isSortable: {
      control: 'boolean',
      description: 'Whether the column is sortable',
    },
    sortDirection: {
      control: 'select',
      options: [undefined, 'asc', 'desc'],
      description: 'Current sort direction',
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right'],
      description: 'Text alignment within the header cell',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <table style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr>
            <app-table-header-cell 
              [isSortable]="isSortable" 
              [sortDirection]="sortDirection"
              [align]="align">
              Column Header
            </app-table-header-cell>
          </tr>
        </thead>
      </table>
    `,
  }),
};

export default meta;
type Story = StoryObj<TableHeaderCellComponent>;

export const NonSortable: Story = {
  args: {
    isSortable: false,
    align: 'left',
  },
  render: (args) => ({
    props: args,
    template: `
      <table style="border-collapse: collapse; width: 300px; border: 1px solid #e0e0e0;">
        <thead>
          <tr>
            <app-table-header-cell [isSortable]="isSortable" [align]="align">
              Status
            </app-table-header-cell>
          </tr>
        </thead>
      </table>
    `,
  }),
};

export const SortableUnsorted: Story = {
  args: {
    isSortable: true,
    sortDirection: undefined,
    align: 'left',
  },
  render: (args) => ({
    props: args,
    template: `
      <table style="border-collapse: collapse; width: 300px; border: 1px solid #e0e0e0;">
        <thead>
          <tr>
            <app-table-header-cell 
              [isSortable]="isSortable" 
              [sortDirection]="sortDirection"
              [align]="align">
              Date Created
            </app-table-header-cell>
          </tr>
        </thead>
      </table>
    `,
  }),
};

export const SortedAscending: Story = {
  args: {
    isSortable: true,
    sortDirection: 'asc',
    align: 'left',
  },
  render: (args) => ({
    props: args,
    template: `
      <table style="border-collapse: collapse; width: 300px; border: 1px solid #e0e0e0;">
        <thead>
          <tr>
            <app-table-header-cell 
              [isSortable]="isSortable" 
              [sortDirection]="sortDirection"
              [align]="align">
              Amount
            </app-table-header-cell>
          </tr>
        </thead>
      </table>
    `,
  }),
};

export const SortedDescending: Story = {
  args: {
    isSortable: true,
    sortDirection: 'desc',
    align: 'left',
  },
  render: (args) => ({
    props: args,
    template: `
      <table style="border-collapse: collapse; width: 300px; border: 1px solid #e0e0e0;">
        <thead>
          <tr>
            <app-table-header-cell 
              [isSortable]="isSortable" 
              [sortDirection]="sortDirection"
              [align]="align">
              Amount
            </app-table-header-cell>
          </tr>
        </thead>
      </table>
    `,
  }),
};

export const RightAligned: Story = {
  args: {
    isSortable: true,
    sortDirection: undefined,
    align: 'right',
  },
  render: (args) => ({
    props: args,
    template: `
      <table style="border-collapse: collapse; width: 300px; border: 1px solid #e0e0e0;">
        <thead>
          <tr>
            <app-table-header-cell 
              [isSortable]="isSortable" 
              [sortDirection]="sortDirection"
              [align]="align">
              Total USD
            </app-table-header-cell>
          </tr>
        </thead>
      </table>
    `,
  }),
};
