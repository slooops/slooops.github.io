import {
  Component,
  EventEmitter,
  HostBinding,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from 'src/app/providers/theme.service';

export interface SupervisorIncident {
  incidentNumber: string;
  team: 'BRIM/BRM' | 'I2C';
  category: string;
  coreIssue: string;
  outcome:
    | 'Resolved'
    | 'Routed Out'
    | 'Cancelled'
    | 'Failed'
    | 'Bot Handoff'
    | 'In Progress';
  resolutionPath: string;
  processedAt: string;
  processedEpoch: number;
  pipelineStages: number;
}

@Component({
  selector: 'app-caseiq-incidents',
  templateUrl: './caseiq-incidents.component.html',
  styleUrl: './caseiq-incidents.component.css',
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class CaseiqIncidentsComponent implements OnInit {
  @Output() sharedStateOpen = new EventEmitter<SupervisorIncident>();

  @HostBinding('class.dark-theme') get darkThemeClass() {
    return this.themeService.isDarkMode;
  }

  readonly incidents: SupervisorIncident[] = [
    {
      incidentNumber: 'INC10858538',
      team: 'BRIM/BRM',
      category: 'NA',
      coreIssue: 'NA',
      outcome: 'Resolved',
      resolutionPath: 'A2A: I2C Agent',
      processedAt: 'Jun 12, 04:36 PM',
      processedEpoch: new Date('2026-06-12T16:36:00').getTime(),
      pipelineStages: 4,
    },
    {
      incidentNumber: 'INC10858529',
      team: 'I2C',
      category: 'INVOICING',
      coreIssue: 'Invoice Generation',
      outcome: 'Routed Out',
      resolutionPath: 'A2A: I2C Agent',
      processedAt: 'Jun 11, 12:21 PM',
      processedEpoch: new Date('2026-06-11T12:21:00').getTime(),
      pipelineStages: 4,
    },
    {
      incidentNumber: 'INC10858538',
      team: 'I2C',
      category: 'INVOICING',
      coreIssue: 'Invoice Generation',
      outcome: 'Routed Out',
      resolutionPath: 'A2A: I2C Agent',
      processedAt: 'Jun 11, 12:13 PM',
      processedEpoch: new Date('2026-06-11T12:13:00').getTime(),
      pipelineStages: 4,
    },
    {
      incidentNumber: 'INC10858538',
      team: 'I2C',
      category: 'INVOICING',
      coreIssue: 'Invoice Generation',
      outcome: 'Routed Out',
      resolutionPath: 'A2A: I2C Agent',
      processedAt: 'Jun 11, 02:04 AM',
      processedEpoch: new Date('2026-06-11T02:04:00').getTime(),
      pipelineStages: 4,
    },
    {
      incidentNumber: 'INC10855501',
      team: 'BRIM/BRM',
      category: 'NA',
      coreIssue: 'NA',
      outcome: 'Resolved',
      resolutionPath: 'A2A: I2C Agent',
      processedAt: 'Jun 9, 06:14 PM',
      processedEpoch: new Date('2026-06-09T18:14:00').getTime(),
      pipelineStages: 4,
    },
    {
      incidentNumber: 'INC10858529',
      team: 'BRIM/BRM',
      category: 'NA',
      coreIssue: 'NA',
      outcome: 'Resolved',
      resolutionPath: 'A2A: I2C Agent',
      processedAt: 'Jun 9, 06:04 PM',
      processedEpoch: new Date('2026-06-09T18:04:00').getTime(),
      pipelineStages: 4,
    },
    {
      incidentNumber: 'INC10858529',
      team: 'I2C',
      category: 'INVOICING',
      coreIssue: 'Invoice Generation',
      outcome: 'Routed Out',
      resolutionPath: 'A2A: I2C Agent',
      processedAt: 'Jun 9, 05:37 PM',
      processedEpoch: new Date('2026-06-09T17:37:00').getTime(),
      pipelineStages: 4,
    },
  ];

  filteredIncidents: SupervisorIncident[] = [];
  expandedIncidentKey: string | null = null;
  searchTerm = '';
  selectedOutcome = 'All Outcomes';
  selectedTeam = 'All Teams';
  selectedRange = 'Last 7 days';

  readonly outcomes = [
    'All Outcomes',
    'Resolved',
    'Routed Out',
    'Cancelled',
    'Failed',
    'Bot Handoff',
    'In Progress',
  ];

  readonly teams = ['All Teams', 'BRIM/BRM', 'I2C'];

  readonly timeRanges = ['Last 7 days', 'Last 14 days', 'Last 30 days'];

  readonly kpiConfig: Array<{
    label: string;
    key: SupervisorIncident['outcome'] | 'TOTAL';
  }> = [
    { label: 'TOTAL PROCESSED', key: 'TOTAL' },
    { label: 'RESOLVED', key: 'Resolved' },
    { label: 'ROUTED OUT', key: 'Routed Out' },
    { label: 'CANCELLED', key: 'Cancelled' },
    { label: 'FAILED', key: 'Failed' },
    { label: 'BOT HANDOFF', key: 'Bot Handoff' },
    { label: 'IN PROGRESS', key: 'In Progress' },
  ];

  constructor(public themeService: ThemeService) {}

  ngOnInit(): void {
    this.applyFilter();
  }

  applyFilter(): void {
    let result = [...this.incidents];

    if (this.selectedTeam !== 'All Teams') {
      result = result.filter((row) => row.team === this.selectedTeam);
    }

    if (this.selectedOutcome !== 'All Outcomes') {
      result = result.filter((row) => row.outcome === this.selectedOutcome);
    }

    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter((row) =>
        [
          row.incidentNumber,
          row.team,
          row.category,
          row.coreIssue,
          row.outcome,
        ].some((value) => value.toLowerCase().includes(term)),
      );
    }

    this.filteredIncidents = result.sort(
      (a, b) => b.processedEpoch - a.processedEpoch,
    );

    if (
      this.expandedIncidentKey &&
      !this.filteredIncidents.some(
        (item, index) =>
          this.getIncidentKey(item, index) === this.expandedIncidentKey,
      )
    ) {
      this.expandedIncidentKey = null;
    }
  }

  get totalProcessed(): number {
    return this.filteredIncidents.length;
  }

  countByOutcome(outcome: SupervisorIncident['outcome']): number {
    return this.filteredIncidents.filter((item) => item.outcome === outcome)
      .length;
  }

  getKpiValue(key: SupervisorIncident['outcome'] | 'TOTAL'): number {
    if (key === 'TOTAL') {
      return this.totalProcessed;
    }
    return this.countByOutcome(key);
  }

  getOutcomeClass(outcome: SupervisorIncident['outcome']): string {
    switch (outcome) {
      case 'Resolved':
        return 'outcome--resolved';
      case 'Routed Out':
        return 'outcome--routed';
      case 'Cancelled':
        return 'outcome--cancelled';
      case 'Failed':
        return 'outcome--failed';
      case 'Bot Handoff':
        return 'outcome--bot-handoff';
      case 'In Progress':
        return 'outcome--in-progress';
      default:
        return '';
    }
  }

  toggleIncidentTimeline(incident: SupervisorIncident, index: number): void {
    const key = this.getIncidentKey(incident, index);
    this.expandedIncidentKey = this.expandedIncidentKey === key ? null : key;
  }

  isTimelineExpanded(incident: SupervisorIncident, index: number): boolean {
    return this.expandedIncidentKey === this.getIncidentKey(incident, index);
  }

  getIncidentKey(incident: SupervisorIncident, index: number): string {
    return `${incident.incidentNumber}_${incident.processedEpoch}_${index}`;
  }

  getSharedStateId(incident: SupervisorIncident, index: number): string {
    return `ss-${incident.processedEpoch}-${index.toString().padStart(2, '0')}`;
  }

  getDuration(_incident: SupervisorIncident): string {
    return '3.6m';
  }

  openSharedStateDetails(incident: SupervisorIncident): void {
    this.sharedStateOpen.emit(incident);
  }

  getPipelineSlots(count: number): number[] {
    return Array.from({ length: count }, (_, index) => index);
  }
}
