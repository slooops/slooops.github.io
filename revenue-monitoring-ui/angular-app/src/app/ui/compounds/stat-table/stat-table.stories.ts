import type { Meta, StoryObj } from '@storybook/angular';
import { StatTableComponent } from './stat-table.component';
import { StatTableColumn } from '../../types/common.types';

const meta: Meta<StatTableComponent> = {
  title: 'Compounds/StatTable',
  component: StatTableComponent,
  tags: ['autodocs'],
  argTypes: {
    columns: {
      description:
        'Column configuration array. Each column can specify a `renderer` (chip | progressPill | numberWithSub | number | link | text) and alignment.',
    },
    rows: {
      description:
        'Row objects keyed by `column.key`. Cell value shape must match the column renderer.',
    },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Raised-shadow declarative table that composes Chip and ProgressPill atoms. Reproduces the CaseIQ Components table shape without knowing anything about CaseIQ data.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<StatTableComponent>;

// ── CaseIQ-style column set ───────────────────────────────
const caseiqColumns: StatTableColumn[] = [
  { key: 'component', label: 'Component', renderer: 'chip', align: 'left' },
  { key: 'totalCases', label: 'Total Cases', renderer: 'number' },
  { key: 'accuracy', label: 'Accuracy', renderer: 'progressPill' },
  { key: 'inProgress', label: 'In Progress', renderer: 'numberWithSub' },
  { key: 'routed', label: 'Routed Out', renderer: 'numberWithSub' },
  { key: 'canceled', label: 'Canceled', renderer: 'numberWithSub' },
  { key: 'service', label: 'Service Requests', renderer: 'numberWithSub' },
  { key: 'totalAgent', label: 'Total (Agent)', renderer: 'numberWithSub' },
  { key: 'agentVsOps', label: 'Agent vs Ops %', renderer: 'progressPill' },
  { key: 'activeAgents', label: 'Active Agents', renderer: 'link' },
  {
    key: 'serviceIncidents',
    label: 'Service Incidents',
    renderer: 'number',
  },
];

// Mock data mirroring the CaseIQ screenshot
const caseiqRows = [
  {
    component: { label: 'OM', color: 'green' },
    totalCases: '2,060',
    accuracy: { percentage: 98.7, color: 'green', label: '98.7%' },
    inProgress: { main: 119, sub: 142, pct: 84 },
    routed: { main: 62, sub: 882, pct: 7 },
    canceled: { main: 74, sub: 490, pct: 15 },
    service: { main: 275, sub: 368, pct: 75 },
    totalAgent: { main: 530, sub: '1,882' },
    agentVsOps: { percentage: 28, color: 'cyan', label: '28%' },
    activeAgents: { label: '14 / 14' },
    serviceIncidents: 178,
  },
  {
    component: { label: 'SM', color: 'green' },
    totalCases: 886,
    accuracy: { percentage: 95.6, color: 'green', label: '95.6%' },
    inProgress: { main: 65, sub: 116, pct: 56 },
    routed: { main: 27, sub: 342, pct: 8 },
    canceled: { main: 46, sub: 241, pct: 19 },
    service: { main: 89, sub: 176, pct: 50 },
    totalAgent: { main: 227, sub: 875 },
    agentVsOps: { percentage: 26, color: 'cyan', label: '26%' },
    activeAgents: { label: '11 / 11' },
    serviceIncidents: 11,
  },
  {
    component: { label: 'I2C', color: 'green' },
    totalCases: 659,
    accuracy: { percentage: 92.8, color: 'green', label: '92.8%' },
    inProgress: { main: 23, sub: 59, pct: 39 },
    routed: { main: 37, sub: 262, pct: 14 },
    canceled: { main: 36, sub: 151, pct: 24 },
    service: { main: 78, sub: 149, pct: 52 },
    totalAgent: { main: 174, sub: 621 },
    agentVsOps: { percentage: 28, color: 'cyan', label: '28%' },
    activeAgents: { label: '18 / 18' },
    serviceIncidents: 38,
  },
  {
    component: { label: 'AIT', color: 'amber' },
    totalCases: 387,
    accuracy: { percentage: 83.3, color: 'amber', label: '83.3%' },
    inProgress: { main: 35, sub: 43, pct: 81 },
    routed: { main: 18, sub: 82, pct: 22 },
    canceled: { main: 17, sub: 48, pct: 35 },
    service: { main: 9, sub: 86, pct: 10 },
    totalAgent: { main: 79, sub: 259 },
    agentVsOps: { percentage: 31, color: 'cyan', label: '31%' },
    activeAgents: { label: '11 / 11' },
    serviceIncidents: 128,
  },
  {
    component: { label: 'FPP', color: 'green' },
    totalCases: 108,
    accuracy: { percentage: 96.3, color: 'green', label: '96.3%' },
    inProgress: { main: 4, sub: 4, pct: 100 },
    routed: { main: 0, sub: 6, pct: 0 },
    canceled: { main: 0, sub: 1, pct: 0 },
    service: { main: 53, sub: 70, pct: 76 },
    totalAgent: { main: 57, sub: 81 },
    agentVsOps: { percentage: 70, color: 'cyan', label: '70%' },
    activeAgents: { label: '14 / 14' },
    serviceIncidents: 27,
  },
  {
    component: { label: 'P2P', color: 'green' },
    totalCases: 836,
    accuracy: { percentage: 88.1, color: 'green', label: '88.1%' },
    inProgress: { main: 4, sub: 4, pct: 100 },
    routed: { main: 0, sub: 26, pct: 0 },
    canceled: { main: 0, sub: 0, pct: 0 },
    service: { main: 479, sub: 683, pct: 70 },
    totalAgent: { main: 483, sub: 713 },
    agentVsOps: { percentage: 68, color: 'cyan', label: '68%' },
    activeAgents: { label: '16 / 16' },
    serviceIncidents: 123,
  },
  {
    component: { label: 'CAPITAL', color: 'green' },
    totalCases: 428,
    accuracy: { percentage: 86.8, color: 'green', label: '86.8%' },
    inProgress: { main: 7, sub: 27, pct: 26 },
    routed: { main: 6, sub: 31, pct: 19 },
    canceled: { main: 5, sub: 104, pct: 5 },
    service: { main: 14, sub: 164, pct: 9 },
    totalAgent: { main: 32, sub: 326 },
    agentVsOps: { percentage: 10, color: 'cyan', label: '10%' },
    activeAgents: { label: '38 / 38' },
    serviceIncidents: 102,
  },
];

// ── Stories ──────────────────────────────────────────────
export const CaseIQComponents: Story = {
  args: {
    columns: caseiqColumns,
    rows: caseiqRows,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Full CaseIQ Components table reproduction using chips, gradient progress pills, "main / sub (pct%)" cells, and an interactive link column.',
      },
    },
  },
};

export const Minimal: Story = {
  args: {
    columns: [
      { key: 'component', label: 'Component', renderer: 'chip', align: 'left' },
      { key: 'accuracy', label: 'Accuracy', renderer: 'progressPill' },
      { key: 'cases', label: 'Cases', renderer: 'number' },
    ],
    rows: [
      {
        component: { label: 'OM', color: 'green' },
        accuracy: { percentage: 92, color: 'green', label: '92%' },
        cases: '1,204',
      },
      {
        component: { label: 'AIT', color: 'amber' },
        accuracy: { percentage: 76, color: 'amber', label: '76%' },
        cases: 542,
      },
      {
        component: { label: 'CAPITAL', color: 'neutral' },
        accuracy: { percentage: 44, color: 'orange', label: '44%' },
        cases: 128,
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    columns: caseiqColumns,
    rows: [],
  },
};
