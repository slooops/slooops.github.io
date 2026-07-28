import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { KpiTileComponent } from './kpi-tile.component';

const meta: Meta<KpiTileComponent> = {
  title: 'Compounds/KpiTile',
  component: KpiTileComponent,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    mode: {
      control: 'radio',
      options: ['pill', 'plain'],
      description:
        '`pill` shows progress-pill + percent; `plain` shows a large single value.',
    },
    percentage: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
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
    },
    pillText: { control: 'text' },
    pctText: { control: 'text' },
    plainValue: { control: 'text' },
  },
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (story) => ({
      ...story(),
      template: `<div style="max-width: 220px;">${story().template}</div>`,
    }),
  ],
};

export default meta;
type Story = StoryObj<KpiTileComponent>;

// ── Individual tiles ─────────────────────────────────────
export const AccuracyGreen: Story = {
  args: {
    title: 'Case Analyzer Accuracy',
    mode: 'pill',
    percentage: 91.7,
    color: 'green',
    pillText: '5,364 cases',
    pctText: '91.7%',
  },
};

export const InProgressCyan: Story = {
  args: {
    title: 'In Progress',
    mode: 'pill',
    percentage: 65,
    color: 'cyan',
    pillText: '257 / 395',
    pctText: '65%',
  },
};

export const RoutedPurple: Story = {
  args: {
    title: 'Routed Out',
    mode: 'pill',
    percentage: 9,
    color: 'purple',
    pillText: '150 / 1,631',
    pctText: '9%',
  },
};

export const CanceledAmber: Story = {
  args: {
    title: 'Canceled',
    mode: 'pill',
    percentage: 17,
    color: 'amber',
    pillText: '178 / 1,035',
    pctText: '17%',
  },
};

export const ServiceRequestsGreen: Story = {
  args: {
    title: 'Service Requests',
    mode: 'pill',
    percentage: 59,
    color: 'green',
    pillText: '997 / 1,696',
    pctText: '59%',
  },
};

export const AgentVsOpsCyan: Story = {
  args: {
    title: 'Agent Vs Ops %',
    mode: 'pill',
    percentage: 33.3,
    color: 'cyan',
    pillText: '1,582 / 4,757',
    pctText: '33.3%',
  },
};

export const PlainValue: Story = {
  args: {
    title: 'Service Incidents',
    mode: 'plain',
    plainValue: 607,
  },
};

// ── Full CaseIQ-style strip composition ───────────────────
export const Strip: Story = {
  decorators: [
    moduleMetadata({ imports: [KpiTileComponent] }),
    (story) => ({
      ...story(),
      template: `
        <div style="
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1rem;
          padding: 0.5rem;
          background: #f0f4f8;
        ">
          <app-kpi-tile
            title="Case Analyzer Accuracy"
            mode="pill"
            [percentage]="91.7"
            color="green"
            pillText="5,364 cases"
            pctText="91.7%"
          ></app-kpi-tile>
          <app-kpi-tile
            title="In Progress"
            mode="pill"
            [percentage]="65"
            color="cyan"
            pillText="257 / 395"
            pctText="65%"
          ></app-kpi-tile>
          <app-kpi-tile
            title="Routed Out"
            mode="pill"
            [percentage]="9"
            color="purple"
            pillText="150 / 1,631"
            pctText="9%"
          ></app-kpi-tile>
          <app-kpi-tile
            title="Canceled"
            mode="pill"
            [percentage]="17"
            color="amber"
            pillText="178 / 1,035"
            pctText="17%"
          ></app-kpi-tile>
          <app-kpi-tile
            title="Service Requests"
            mode="pill"
            [percentage]="59"
            color="green"
            pillText="997 / 1,696"
            pctText="59%"
          ></app-kpi-tile>
          <app-kpi-tile
            title="Agent Vs Ops %"
            mode="pill"
            [percentage]="33.3"
            color="cyan"
            pillText="1,582 / 4,757"
            pctText="33.3%"
          ></app-kpi-tile>
          <app-kpi-tile
            title="Service Incidents"
            mode="plain"
            plainValue="607"
          ></app-kpi-tile>
        </div>
      `,
      props: {},
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'Composition example that mirrors the CaseIQ Ops KPI strip: six pill tiles + one plain tile in a 7-column grid.',
      },
    },
  },
};
