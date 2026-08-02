import type { Meta, StoryObj } from '@storybook/angular';
import { TableCellComponent } from './table-cell.component';

const meta: Meta<TableCellComponent> = {
  title: 'Atoms/TableCell',
  component: TableCellComponent,
  tags: ['autodocs'],
  argTypes: {
    align: {
      control: 'select',
      options: ['left', 'center', 'right'],
      description: 'Text alignment within the cell',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <app-table-cell [align]="align">
            <span>Cell Content</span>
          </app-table-cell>
        </tr>
      </table>
    `,
  }),
};

export default meta;
type Story = StoryObj<TableCellComponent>;

export const AlignLeft: Story = {
  args: {
    align: 'left',
  },
  render: (args) => ({
    props: args,
    template: `
      <table style="border-collapse: collapse; width: 300px; border: 1px solid #e0e0e0;">
        <tr>
          <app-table-cell [align]="align">
            <span>Left aligned text</span>
          </app-table-cell>
        </tr>
      </table>
    `,
  }),
};

export const AlignCenter: Story = {
  args: {
    align: 'center',
  },
  render: (args) => ({
    props: args,
    template: `
      <table style="border-collapse: collapse; width: 300px; border: 1px solid #e0e0e0;">
        <tr>
          <app-table-cell [align]="align">
            <span>Center aligned text</span>
          </app-table-cell>
        </tr>
      </table>
    `,
  }),
};

export const AlignRight: Story = {
  args: {
    align: 'right',
  },
  render: (args) => ({
    props: args,
    template: `
      <table style="border-collapse: collapse; width: 300px; border: 1px solid #e0e0e0;">
        <tr>
          <app-table-cell [align]="align">
            <span>$1,234.56</span>
          </app-table-cell>
        </tr>
      </table>
    `,
  }),
};

export const WithComplexContent: Story = {
  args: {
    align: 'left',
  },
  render: (args) => ({
    props: args,
    template: `
      <table style="border-collapse: collapse; width: 400px; border: 1px solid #e0e0e0;">
        <tr>
          <app-table-cell [align]="align">
            <div style="display: flex; flex-direction: column;">
              <strong>Primary Text</strong>
              <small style="color: #666;">Secondary description</small>
            </div>
          </app-table-cell>
        </tr>
      </table>
    `,
  }),
};
