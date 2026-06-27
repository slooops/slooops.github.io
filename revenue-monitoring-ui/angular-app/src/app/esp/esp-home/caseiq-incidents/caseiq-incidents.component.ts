import {
  Component,
  EventEmitter,
  HostBinding,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ThemeService } from 'src/app/providers/theme.service';
import {
  FilterButtonBarComponent,
  FilterConfig,
  FilterValues,
} from 'src/app/components/filter-button-bar/filter-button-bar.component';
import { PaginationComponent } from 'src/app/ui/atoms/pagination/pagination.component';
import { PageChangeEvent } from 'src/app/ui/types/common.types';

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
  runs: number;
  history: SupervisorExecution[];
}

interface SupervisorExecution {
  sharedStateId: string;
  outcome: SupervisorIncident['outcome'];
  category: string;
  coreIssue: string;
  resolvedBy: string;
  processedAt: string;
  processedEpoch: number;
  pipelineStages: number;
  executionMs: number;
}

export interface SharedStateOpenEvent {
  incident: SupervisorIncident;
  sharedStateId: string;
  incidentDetailData: Record<string, unknown>;
}

interface PipelineHop {
  hopNumber: number;
  team: string;
  agent: string;
  category: string;
  coreIssue: string;
  outcome: SupervisorIncident['outcome'];
  durationMs: number;
}

interface PipelineGroup {
  label: string;
  hops: PipelineHop[];
}

interface PipelineDetail {
  sharedStateId: string;
  incidentNumber: string;
  outcome: SupervisorIncident['outcome'];
  totalHops: number;
  groups: PipelineGroup[];
}

interface SupervisorMetricsSummary {
  total_involvements: number;
  unique_incidents: number;
  outcomes?: Record<string, number>;
}

type KpiKey =
  | 'TOTAL_RUNS'
  | 'INCIDENTS'
  | 'RESOLVED'
  | 'ROUTED_OUT'
  | 'CANCELLED'
  | 'FAILED'
  | 'BOT_HANDOFF'
  | 'IN_PROGRESS';

@Component({
  selector: 'app-caseiq-incidents',
  templateUrl: './caseiq-incidents.component.html',
  styleUrl: './caseiq-incidents.component.css',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FilterButtonBarComponent,
    PaginationComponent,
  ],
})
export class CaseiqIncidentsComponent implements OnInit {
  @Output() sharedStateOpen = new EventEmitter<SharedStateOpenEvent>();

  private readonly metricsSummaryUrl = '/api/caseiq-supervisor/metrics/summary';
  private readonly metricsIncidentsUrl =
    '/api/caseiq-supervisor/metrics/incidents';
  private readonly dashboardIncidentDetailUrl =
    '/api/caseiq-supervisor/api/v1/incidents';

  @HostBinding('class.dark-theme') get darkThemeClass() {
    return this.themeService.isDarkMode;
  }

  incidents: SupervisorIncident[] = [];

  filteredIncidents: SupervisorIncident[] = [];
  expandedIncidentKey: string | null = null;
  openPipelineSharedStateId: string | null = null;
  pipelineDetail: PipelineDetail | null = null;
  pipelineDetailLoading = false;
  pipelineDetailError: string | null = null;
  pipelineDetailIncident: SupervisorIncident | null = null;
  inlineDetailIncidentNumber: string | null = null;
  inlineDetailSharedStateId: string | null = null;
  inlineDetailLoading = false;
  inlineDetailError: string | null = null;
  searchTerm = '';
  selectedSearchField: 'incidentNumber' | 'category' | 'coreIssue' =
    'incidentNumber';
  selectedRange = 'All time';

  // Pagination
  currentPage = 0;
  pageSize = 10;

  readonly outcomes = [
    'Resolved',
    'Routed Out',
    'Cancelled',
    'Failed',
    'Bot Handoff',
    'In Progress',
  ];

  readonly teams = ['BRIM/BRM', 'I2C'];

  readonly timeRanges = [
    'Last 24 hours',
    'Last 3 days',
    'Last 7 days',
    'Last 30 days',
    'All time',
  ];

  readonly searchFieldOptions: Array<{
    label: string;
    value: 'incidentNumber' | 'category' | 'coreIssue';
  }> = [
    { label: 'Incident #', value: 'incidentNumber' },
    { label: 'Category', value: 'category' },
    { label: 'Core Issue', value: 'coreIssue' },
  ];

  readonly topFilterConfigs: FilterConfig[] = [
    {
      id: 'outcome',
      label: 'Outcome',
      type: 'multi-select',
      placeholder: 'All outcomes',
      options: [
        { label: 'Resolved', value: 'Resolved' },
        { label: 'Routed Out', value: 'Routed Out' },
        { label: 'Cancelled', value: 'Cancelled' },
        { label: 'Failed', value: 'Failed' },
        { label: 'Bot Handoff', value: 'Bot Handoff' },
        { label: 'In Progress', value: 'In Progress' },
      ],
    },
    {
      id: 'team',
      label: 'Team',
      type: 'multi-select',
      placeholder: 'All teams',
      options: [
        { label: 'BRIM/BRM', value: 'BRIM/BRM' },
        { label: 'I2C', value: 'I2C' },
      ],
    },
    {
      id: 'date',
      label: 'Date',
      type: 'multi-select',
      placeholder: 'All time',
      singleSelect: true,
      options: [
        { label: 'Last 24 hours', value: 'Last 24 hours' },
        { label: 'Last 3 days', value: 'Last 3 days' },
        { label: 'Last 7 days', value: 'Last 7 days' },
        { label: 'Last 30 days', value: 'Last 30 days' },
      ],
    },
  ];

  topFilterValues: FilterValues = {};

  metricsSummary: Record<KpiKey, number> = {
    TOTAL_RUNS: 0,
    INCIDENTS: 0,
    RESOLVED: 0,
    ROUTED_OUT: 0,
    CANCELLED: 0,
    FAILED: 0,
    BOT_HANDOFF: 0,
    IN_PROGRESS: 0,
  };

  readonly kpiConfig: Array<{
    label: string;
    key: KpiKey;
  }> = [
    { label: 'TOTAL RUNS', key: 'TOTAL_RUNS' },
    { label: 'INCIDENTS', key: 'INCIDENTS' },
    { label: 'RESOLVED', key: 'RESOLVED' },
    { label: 'ROUTED OUT', key: 'ROUTED_OUT' },
    { label: 'CANCELLED', key: 'CANCELLED' },
    { label: 'FAILED', key: 'FAILED' },
    { label: 'BOT HANDOFF', key: 'BOT_HANDOFF' },
    { label: 'IN PROGRESS', key: 'IN_PROGRESS' },
  ];

  constructor(
    public themeService: ThemeService,
    private readonly http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.applyFilter();
    this.loadMetricsSummary();
    this.loadIncidents();
  }

  private loadIncidents(): void {
    const params = this.buildIncidentQueryParams();

    this.http.get<unknown>(this.metricsIncidentsUrl, { params }).subscribe({
      next: (response) => {
        const apiIncidents = this.extractIncidentRows(response);
        this.incidents = this.groupIncidents(apiIncidents);
        this.applyFilter();
      },
      error: () => {
        this.incidents = [];
        this.applyFilter();
      },
    });
  }

  private extractIncidentRows(response: unknown): Record<string, unknown>[] {
    if (Array.isArray(response)) {
      return response.filter(
        (item): item is Record<string, unknown> =>
          typeof item === 'object' && item !== null,
      );
    }

    if (typeof response !== 'object' || response === null) {
      return [];
    }

    const container = response as Record<string, unknown>;
    const candidates = ['incidents', 'items', 'results', 'data']
      .map((key) => container[key])
      .find((value) => Array.isArray(value));

    if (!Array.isArray(candidates)) {
      return [];
    }

    return candidates.filter(
      (item): item is Record<string, unknown> =>
        typeof item === 'object' && item !== null,
    );
  }

  private mapApiIncident(
    item: Record<string, unknown>,
    index: number,
  ): SupervisorIncident {
    const incidentNumber =
      this.pickString(item, [
        'incident_number',
        'incidentNumber',
        'incident',
        'id',
      ]) || `INC-${index + 1}`;

    const teamRaw = this.pickString(item, ['team', 'team_name', 'owner_team']);
    const team: SupervisorIncident['team'] =
      teamRaw?.toUpperCase().includes('BRIM') ||
      teamRaw?.toUpperCase().includes('BRM')
        ? 'BRIM/BRM'
        : 'I2C';

    const outcome = this.normalizeOutcome(
      this.pickString(item, ['outcome', 'status', 'final_outcome']),
    );

    const rawEpoch = this.pickNumber(item, [
      'processed_epoch',
      'processedEpoch',
      'processed_at_epoch',
      'timestamp',
      'created_at_epoch',
    ]);
    const rawDate = this.pickString(item, [
      'processed_at',
      'processedAt',
      'created_at',
      'updated_at',
      'run_at',
    ]);

    const processedEpoch =
      rawEpoch ?? (rawDate ? new Date(rawDate).getTime() : Date.now() - index);

    const processedAt = this.formatProcessedDate(processedEpoch, rawDate);

    return {
      incidentNumber,
      team,
      category: this.pickString(item, ['category']) || 'NA',
      coreIssue:
        this.pickString(item, [
          'core_issue',
          'coreIssue',
          'issue',
          'issue_type',
        ]) || 'NA',
      outcome,
      resolutionPath:
        this.pickString(item, [
          'resolution_path',
          'resolutionPath',
          'route',
          'agent_path',
        ]) || 'A2A: I2C Agent',
      processedAt,
      processedEpoch,
      pipelineStages:
        this.pickNumber(item, [
          'pipeline_stages',
          'pipelineStages',
          'stage_count',
        ]) || 4,
      runs: 1,
      history: [],
    };
  }

  private toExecution(
    item: Record<string, unknown>,
    index: number,
  ): SupervisorExecution {
    const outcome = this.normalizeOutcome(
      this.pickString(item, ['outcome', 'status', 'final_outcome']),
    );

    const rawEpoch = this.pickNumber(item, [
      'processed_epoch',
      'processedEpoch',
      'processed_at_epoch',
      'timestamp',
      'created_at_epoch',
    ]);

    const rawDate = this.pickString(item, [
      'processed_at',
      'processedAt',
      'created_at',
      'updated_at',
      'run_at',
    ]);

    const processedEpoch =
      rawEpoch ?? (rawDate ? new Date(rawDate).getTime() : Date.now() - index);

    return {
      sharedStateId:
        this.pickString(item, ['shared_state_id', 'sharedStateId']) ||
        `ss-${processedEpoch}-${index}`,
      outcome,
      category: this.pickString(item, ['category']) || 'NA',
      coreIssue:
        this.pickString(item, [
          'core_issue',
          'coreIssue',
          'issue',
          'issue_type',
        ]) || 'NA',
      resolvedBy: this.formatResolvedBy(
        this.pickString(item, ['resolved_by', 'resolvedBy']),
      ),
      processedAt: this.formatProcessedDate(processedEpoch, rawDate),
      processedEpoch,
      pipelineStages:
        this.pickNumber(item, [
          'pipeline_stages',
          'pipelineStages',
          'hop_sequence',
          'stage_count',
        ]) || 4,
      executionMs: this.pickNumber(item, ['execution_ms', 'executionMs']) || 0,
    };
  }

  private groupIncidents(
    rows: Record<string, unknown>[],
  ): SupervisorIncident[] {
    const grouped = new Map<string, SupervisorIncident>();

    rows.forEach((item, index) => {
      const mapped = this.mapApiIncident(item, index);
      const execution = this.toExecution(item, index);

      const existing = grouped.get(mapped.incidentNumber);
      if (!existing) {
        grouped.set(mapped.incidentNumber, {
          ...mapped,
          runs: 1,
          history: [execution],
        });
        return;
      }

      existing.runs += 1;
      existing.history.push(execution);

      if (execution.processedEpoch > existing.processedEpoch) {
        existing.team = mapped.team;
        existing.category = mapped.category;
        existing.coreIssue = mapped.coreIssue;
        existing.outcome = execution.outcome;
        existing.processedAt = execution.processedAt;
        existing.processedEpoch = execution.processedEpoch;
      }
    });

    return Array.from(grouped.values())
      .map((incident) => ({
        ...incident,
        history: incident.history.sort(
          (a, b) => b.processedEpoch - a.processedEpoch,
        ),
      }))
      .sort((a, b) => b.processedEpoch - a.processedEpoch);
  }

  private pickString(
    source: Record<string, unknown>,
    keys: string[],
  ): string | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return null;
  }

  private pickNumber(
    source: Record<string, unknown>,
    keys: string[],
  ): number | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }
    return null;
  }

  private normalizeOutcome(
    value: string | null,
  ): SupervisorIncident['outcome'] {
    const normalized = (value || '').trim().toUpperCase().replace(/\s+/g, '_');
    switch (normalized) {
      case 'RESOLVED':
        return 'Resolved';
      case 'ROUTED_OUT':
      case 'ROUTED':
        return 'Routed Out';
      case 'CANCELLED':
      case 'CANCELED':
        return 'Cancelled';
      case 'FAILED':
        return 'Failed';
      case 'BOT_HANDOFF':
      case 'HANDOFF':
        return 'Bot Handoff';
      case 'IN_PROGRESS':
      case 'NEED_INFO':
      case 'PENDING':
        return 'In Progress';
      default:
        return 'In Progress';
    }
  }

  private formatResolvedBy(value: string | null): string {
    if (!value) {
      return '--';
    }
    return value
      .split('_')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  private formatProcessedDate(epoch: number, fallback: string | null): string {
    if (Number.isFinite(epoch)) {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(epoch);
    }
    return fallback || '--';
  }

  private loadMetricsSummary(): void {
    this.http.get<SupervisorMetricsSummary>(this.metricsSummaryUrl).subscribe({
      next: (response) => {
        this.metricsSummary = {
          TOTAL_RUNS: response?.total_involvements ?? 0,
          INCIDENTS: response?.unique_incidents ?? 0,
          RESOLVED: response?.outcomes?.['RESOLVED'] ?? 0,
          ROUTED_OUT: 0,
          CANCELLED: 0,
          FAILED: 0,
          BOT_HANDOFF: 0,
          IN_PROGRESS: response?.outcomes?.['NEED_INFO'] ?? 0,
        };
      },
      error: () => {
        this.metricsSummary = {
          TOTAL_RUNS: 0,
          INCIDENTS: 0,
          RESOLVED: 0,
          ROUTED_OUT: 0,
          CANCELLED: 0,
          FAILED: 0,
          BOT_HANDOFF: 0,
          IN_PROGRESS: 0,
        };
      },
    });
  }

  applyFilter(): void {
    // Reset pagination when filter changes
    this.currentPage = 0;

    let result = [...this.incidents];

    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter((row) => this.matchesSearch(row, term));
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

  getKpiValue(key: KpiKey): number {
    return this.metricsSummary[key] ?? 0;
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
    if (this.expandedIncidentKey === key) {
      this.expandedIncidentKey = null;
      this.closePipelineDetail();
    } else {
      this.expandedIncidentKey = key;
    }
  }

  isTimelineExpanded(incident: SupervisorIncident, index: number): boolean {
    return this.expandedIncidentKey === this.getIncidentKey(incident, index);
  }

  getIncidentKey(incident: SupervisorIncident, index: number): string {
    return incident.incidentNumber || `${index}`;
  }

  getTruncatedRunId(sharedStateId: string): string {
    if (!sharedStateId) {
      return '--';
    }
    if (sharedStateId.length <= 14) {
      return sharedStateId;
    }
    return `${sharedStateId.slice(0, 10)}...${sharedStateId.slice(-4)}`;
  }

  openExecutionSharedState(
    incident: SupervisorIncident,
    execution: SupervisorExecution,
  ): void {
    this.sharedStateOpen.emit({
      incident: {
        ...incident,
        category: execution.category,
        coreIssue: execution.coreIssue,
        outcome: execution.outcome,
        processedAt: execution.processedAt,
        processedEpoch: execution.processedEpoch,
      },
      sharedStateId: execution.sharedStateId,
      incidentDetailData: {},
    });
  }

  getSharedStateId(incident: SupervisorIncident, index: number): string {
    return `ss-${incident.processedEpoch}-${index.toString().padStart(2, '0')}`;
  }

  getDuration(_incident: SupervisorIncident): string {
    return '3.6m';
  }

  openSharedStateDetails(incident: SupervisorIncident): void {
    const sharedStateId =
      this.openPipelineSharedStateId || incident.history[0]?.sharedStateId;
    if (!sharedStateId) {
      return;
    }
    this.openFullPipelineDetail(incident, sharedStateId);
  }

  getPipelineSlots(count: number): number[] {
    return Array.from({ length: count }, (_, index) => index);
  }

  openExecutionPipeline(
    incident: SupervisorIncident,
    execution: SupervisorExecution,
  ): void {
    if (this.openPipelineSharedStateId === execution.sharedStateId) {
      this.closePipelineDetail();
      return;
    }
    this.openPipelineSharedStateId = execution.sharedStateId;
    this.pipelineDetailIncident = incident;
    this.pipelineDetail = null;
    this.pipelineDetailLoading = true;
    this.pipelineDetailError = null;
    this.closeInlineIncidentDetail();

    const url = `/api/caseiq-supervisor/metrics/executions/${encodeURIComponent(execution.sharedStateId)}`;
    this.http.get<unknown>(url).subscribe({
      next: (response) => {
        this.pipelineDetail = this.normalizePipelineDetail(
          response,
          execution.sharedStateId,
          incident,
        );
        this.pipelineDetailLoading = false;
      },
      error: () => {
        this.pipelineDetailError = 'Failed to load pipeline detail.';
        this.pipelineDetailLoading = false;
      },
    });
  }

  closePipelineDetail(): void {
    this.openPipelineSharedStateId = null;
    this.pipelineDetail = null;
    this.pipelineDetailLoading = false;
    this.pipelineDetailError = null;
    this.pipelineDetailIncident = null;
    this.closeInlineIncidentDetail();
  }

  closeInlineIncidentDetail(): void {
    this.inlineDetailIncidentNumber = null;
    this.inlineDetailSharedStateId = null;
    this.inlineDetailLoading = false;
    this.inlineDetailError = null;
  }

  private openFullPipelineDetail(
    incident: SupervisorIncident,
    sharedStateId: string,
  ): void {
    this.inlineDetailIncidentNumber = incident.incidentNumber;
    this.inlineDetailSharedStateId = sharedStateId;
    this.inlineDetailLoading = true;
    this.inlineDetailError = null;

    const url = `${this.dashboardIncidentDetailUrl}/${encodeURIComponent(incident.incidentNumber)}?ssid=${encodeURIComponent(sharedStateId)}`;
    this.http.get<unknown>(url).subscribe({
      next: (response) => {
        const detailData =
          typeof response === 'object' && response !== null
            ? (response as Record<string, unknown>)
            : {};
        this.sharedStateOpen.emit({
          incident,
          sharedStateId,
          incidentDetailData: detailData,
        });
        this.inlineDetailLoading = false;
        this.inlineDetailError = null;
      },
      error: () => {
        this.inlineDetailError = 'Failed to load full incident detail.';
        this.inlineDetailLoading = false;
      },
    });
  }

  formatDuration(ms: number): string {
    if (!ms || ms <= 0) return '--';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }

  private normalizePipelineDetail(
    response: unknown,
    sharedStateId: string,
    incident: SupervisorIncident,
  ): PipelineDetail {
    const data =
      typeof response === 'object' && response !== null
        ? (response as Record<string, unknown>)
        : {};

    const outcome = this.normalizeOutcome(
      this.pickString(data, ['outcome', 'final_outcome', 'status']),
    );

    let groups: PipelineGroup[] = [];

    if (Array.isArray(data['pipeline'])) {
      groups = (data['pipeline'] as Record<string, unknown>[]).map((g, gi) => {
        const rawLabel = this.pickString(g, ['group_label', 'label', 'team']);
        const grpOutcome = this.normalizeOutcome(
          this.pickString(g, ['outcome', 'status']),
        );
        const label = rawLabel
          ? `${gi + 1}. ${rawLabel} (${grpOutcome})`
          : `Group ${gi + 1}`;
        return { label, hops: this.normalizeHops(g['hops']) };
      });
    } else if (Array.isArray(data['hops'])) {
      const flat = this.normalizeHops(data['hops']);
      const teamGroups: Array<{ team: string; hops: PipelineHop[] }> = [];
      flat.forEach((h) => {
        const last = teamGroups[teamGroups.length - 1];
        if (last && last.team === h.team) {
          last.hops.push(h);
        } else {
          teamGroups.push({ team: h.team, hops: [h] });
        }
      });
      groups = teamGroups.map((g, i) => {
        const lastOutcome = g.hops[g.hops.length - 1]?.outcome ?? '';
        return { label: `${i + 1}. ${g.team} (${lastOutcome})`, hops: g.hops };
      });
    }

    if (groups.length === 0) {
      groups = [
        { label: `1. ${incident.team} (${incident.outcome})`, hops: [] },
      ];
    }

    return {
      sharedStateId,
      incidentNumber:
        (data['incident_number'] as string) || incident.incidentNumber,
      outcome,
      totalHops: groups.reduce((sum, g) => sum + g.hops.length, 0),
      groups,
    };
  }

  private normalizeHops(raw: unknown): PipelineHop[] {
    if (!Array.isArray(raw)) return [];
    return (raw as Record<string, unknown>[]).map((h, i) => ({
      hopNumber: this.pickNumber(h, ['hop_number', 'hop', 'sequence']) ?? i + 1,
      team: this.pickString(h, ['team', 'team_name']) ?? '--',
      agent: this.pickString(h, ['agent', 'agent_name', 'handler']) ?? '--',
      category: this.pickString(h, ['category']) ?? '--',
      coreIssue:
        this.pickString(h, ['core_issue', 'coreIssue', 'issue']) ?? '--',
      outcome: this.normalizeOutcome(this.pickString(h, ['outcome', 'status'])),
      durationMs:
        this.pickNumber(h, [
          'duration_ms',
          'durationMs',
          'elapsed_ms',
          'execution_ms',
        ]) ?? 0,
    }));
  }

  onTopFilterChange(values: FilterValues): void {
    const normalizedValues = this.normalizeTopFilterValues(values);
    this.topFilterValues = normalizedValues;
    this.selectedRange = this.getSelectedDateRange(normalizedValues);
    this.loadIncidents();
  }

  onTopFilterClear(): void {
    this.topFilterValues = { outcome: [], team: [], date: [] };
    this.selectedRange = 'All time';
    this.loadIncidents();
  }

  onSearchFieldChange(): void {
    this.applyFilter();
  }

  onSearchTermChange(): void {
    this.applyFilter();
  }

  /**
   * Get paginated incidents for table display
   */
  get paginatedIncidents(): SupervisorIncident[] {
    const start = this.currentPage * this.pageSize;
    return this.filteredIncidents.slice(start, start + this.pageSize);
  }

  /**
   * Handle page change from app-pagination
   */
  onPageChange(event: PageChangeEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  private normalizeTopFilterValues(values: FilterValues): FilterValues {
    const outcomeValues = Array.isArray(values['outcome'])
      ? values['outcome']
      : [];
    const teamValues = Array.isArray(values['team']) ? values['team'] : [];
    const dateValues = Array.isArray(values['date']) ? values['date'] : [];

    return {
      outcome: outcomeValues,
      team: teamValues,
      date: dateValues.length > 0 ? [dateValues[dateValues.length - 1]] : [],
    };
  }

  private getSelectedDateRange(values: FilterValues): string {
    const dateValues = values['date'];
    return Array.isArray(dateValues) && dateValues.length > 0
      ? dateValues[0]
      : 'All time';
  }

  private buildIncidentQueryParams(): HttpParams {
    let params = new HttpParams();

    const teamValues = this.getSelectedFilterValues('team');
    for (const team of teamValues) {
      params = params.append('team', team);
    }

    const outcomeValues = this.getSelectedFilterValues('outcome');
    for (const outcome of outcomeValues) {
      params = params.append('outcome', this.mapOutcomeToApiValue(outcome));
    }

    const dateRange = this.getDateRangeQueryValues(this.selectedRange);
    if (dateRange) {
      params = params.set('from_date', dateRange.fromDate);
      params = params.set('to_date', dateRange.toDate);
    }

    return params;
  }

  private getSelectedFilterValues(filterId: string): string[] {
    const value = this.topFilterValues[filterId];
    return Array.isArray(value) ? value : [];
  }

  private mapOutcomeToApiValue(outcome: string): string {
    switch (outcome) {
      case 'Resolved':
        return 'RESOLVED';
      case 'Routed Out':
        return 'ROUTED_OUT';
      case 'Cancelled':
        return 'CANCELLED';
      case 'Failed':
        return 'FAILED';
      case 'Bot Handoff':
        return 'BOT_HANDOFF';
      case 'In Progress':
        return 'IN_PROGRESS';
      default:
        return outcome.toUpperCase().replace(/\s+/g, '_');
    }
  }

  private getDateRangeQueryValues(
    selectedRange: string,
  ): { fromDate: string; toDate: string } | null {
    if (selectedRange === 'All time') {
      return null;
    }

    const today = new Date();
    const startDate = new Date(today);

    switch (selectedRange) {
      case 'Last 24 hours':
        startDate.setDate(today.getDate() - 1);
        break;
      case 'Last 3 days':
        startDate.setDate(today.getDate() - 3);
        break;
      case 'Last 7 days':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'Last 30 days':
        startDate.setDate(today.getDate() - 30);
        break;
      default:
        return null;
    }

    return {
      fromDate: this.formatDateForApi(startDate),
      toDate: this.formatDateForApi(today),
    };
  }

  private formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private matchesSearch(row: SupervisorIncident, term: string): boolean {
    return this.getSearchFieldValue(row).toLowerCase().includes(term);
  }

  private getSearchFieldValue(row: SupervisorIncident): string {
    switch (this.selectedSearchField) {
      case 'incidentNumber':
        return row.incidentNumber || '';
      case 'category':
        return row.category || '';
      case 'coreIssue':
        return row.coreIssue || '';
      default:
        return '';
    }
  }
}
