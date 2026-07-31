import {
  Component,
  EventEmitter,
  HostBinding,
  OnInit,
  OnChanges,
  Output,
  Input,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorArrowClockwiseBold } from '@ng-icons/phosphor-icons/bold';
import { ThemeService } from 'src/app/providers/theme.service';
import { AuthenticationService } from 'src/app/providers/authentication.service';
import {
  FilterButtonBarComponent,
  DateRangeChangeEvent,
  FilterConfig,
  FilterValues,
} from 'src/app/components/filter-button-bar/filter-button-bar.component';
import { PaginationComponent } from 'src/app/ui/atoms/pagination/pagination.component';
import { PageChangeEvent } from 'src/app/ui/types/common.types';

export interface SupervisorIncident {
  incidentNumber: string;
  team: string;
  category: string;
  coreIssue: string;
  outcome: string;
  resolutionPath: string;
  processedAt: string;
  processedEpoch: number;
  pipelineStages: number;
  fiscalQuarter: string;
  runs: number;
  history: SupervisorExecution[];
}

interface SupervisorExecution {
  sharedStateId: string;
  outcome: string;
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
  outcome: string;
  durationMs: number;
  resolvedBy: string;
}

interface PipelineGroup {
  label: string;
  hops: PipelineHop[];
}

interface PipelineDetail {
  sharedStateId: string;
  incidentNumber: string;
  outcome: string;
  totalHops: number;
  groups: PipelineGroup[];
}

interface DynamicKpi {
  label: string;
  key: string;
}

interface SupervisorMetricsSummary {
  unique_incidents: number;
  outcomes?: Record<string, number>;
}

interface CaseReopenMetric {
  TEAM_NAME: string;
  INCIDENT_NUMBER: string;
}

@Component({
  selector: 'app-caseiq-incidents',
  templateUrl: './caseiq-incidents.component.html',
  styleUrl: './caseiq-incidents.component.css',
  providers: [
    provideIcons({
      phosphorArrowClockwiseBold,
    }),
  ],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIcon,
    FilterButtonBarComponent,
    PaginationComponent,
  ],
})
export class CaseiqIncidentsComponent implements OnInit, OnChanges {
  @Output() sharedStateOpen = new EventEmitter<SharedStateOpenEvent>();
  @Input() caseReopenMetrics: CaseReopenMetric[] = [];
  @Input() selectedQuarter: any;
  private static readonly CUSTOM_DATE_RANGE_VALUE = 'Date range';

  private readonly metricsSummaryUrl =
    '/api/caseiq-supervisor/api/v2/metrics/summary';
  private readonly metricsIncidentsUrl =
    '/api/caseiq-supervisor/api/v1/incidents';
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
  pipelineDetailsBySharedStateId: Record<string, PipelineDetail> = {};
  pipelineDetailLoadingBySharedStateId: Record<string, boolean> = {};
  pipelineDetailErrorBySharedStateId: Record<string, string> = {};
  inlineDetailIncidentNumber: string | null = null;
  inlineDetailSharedStateId: string | null = null;
  inlineDetailLoading = false;
  inlineDetailError: string | null = null;
  searchTerm = '';
  selectedSearchField: 'incidentNumber' | 'category' | 'coreIssue' =
    'incidentNumber';
  selectedRange = '';
  customDateRangeStart = '';
  customDateRangeEnd = '';

  // Pagination
  currentPage = 0;
  pageSize = 10;

  // Role-based team filtering
  private readonly teamMappings: Record<string, string> = {
    CASE_IQ_I2C: 'I2C',
    CASE_IQ_OM: 'OM',
    CASE_IQ_SBP: 'SM',
    CASE_IQ_CAPITAL: 'CAPITAL',
    CASE_IQ_AIT: 'AIT',
    CASE_IQ_FPP: 'FPP',
    CASE_IQ_P2P: 'P2P',
  };

  readonly searchFieldOptions: Array<{
    label: string;
    value: 'incidentNumber' | 'category' | 'coreIssue';
  }> = [
    { label: 'Incident #', value: 'incidentNumber' },
    { label: 'Category', value: 'category' },
    { label: 'Core Issue', value: 'coreIssue' },
  ];

  readonly timeRanges = [
    'Last 24 hours',
    'Last 3 days',
    'Last 7 days',
    'Last 30 days',
    CaseiqIncidentsComponent.CUSTOM_DATE_RANGE_VALUE,
  ];

  readonly topFilterConfigs: FilterConfig[] = [
    {
      id: 'outcome',
      label: 'Outcome',
      type: 'multi-select',
      placeholder: 'All outcomes',
      options: [],
    },
    {
      id: 'team',
      label: 'Team',
      type: 'multi-select',
      placeholder: 'All teams',
      options: [],
    },
    {
      id: 'date',
      label: 'Date',
      type: 'multi-select',
      placeholder: 'All time',
      singleSelect: true,
      options: this.timeRanges.map((range) => ({
        label: range,
        value: range,
      })),
    },
    {
      id: 'coreIssue',
      label: 'Core Issue',
      type: 'multi-select',
      placeholder: 'All core issues',
      options: [],
    },
  ];

  readonly topFilterConfigsWithoutTeam: FilterConfig[] =
    this.topFilterConfigs.filter((config) => config.id !== 'team');

  topFilterValues: FilterValues = {};

  metricsSummary: Record<string, number> = {};
  kpiConfig: DynamicKpi[] = [];
  private allIncidents: SupervisorIncident[] = [];
  private userTeamFilters: string[] = [];
  private isAdminOrManager = false;
  showTeamFilter = true;
  private readonly reopenedIncidentTeamKeys = new Set<string>();

  constructor(
    public themeService: ThemeService,
    private readonly httpClient: HttpClient,
    private authService: AuthenticationService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['caseReopenMetrics']) {
      this.syncReopenedIncidentTeamKeys();
    }
    if (changes['selectedQuarter'] && !changes['selectedQuarter'].firstChange) {
      this.applyFilter();
    }
  }

  /**
   * Determines user's access level and team restrictions
   * - Admin/Manager/Orchestrator roles: view all teams (no filtering)
   * - Single CASE_IQ role: view only that team
   * - Multiple CASE_IQ roles: view all those teams (client-side filtering)
   * @returns object with admin flag and team filters
   */
  private getUserAccessLevel(): { isAdmin: boolean; teams: string[] } {
    const userRoles = this.authService.getUserAccessRoles();

    // Check for admin/manager roles that view all data
    if (
      userRoles.includes('ADMIN') ||
      userRoles.includes('CASE_IQ_MANAGER') ||
      userRoles.includes('CASE_IQ_ORCHESTRATOR')
    ) {
      return { isAdmin: true, teams: [] };
    }

    // Extract all CASE_IQ team roles
    const teamRoles = userRoles.filter((role) =>
      this.teamMappings.hasOwnProperty(role),
    );

    if (teamRoles.length === 0) {
      return { isAdmin: false, teams: [] };
    }

    // Map roles to team names
    const teams = teamRoles.map((role) => this.teamMappings[role]);

    return { isAdmin: false, teams };
  }

  /**
   * Builds metrics summary URL
   * - If user has single team: append ?team=${team} for backend filtering
   * - If user has multiple teams or is admin: use base URL (no filtering)
   * @returns URL with optional team query parameter
   */
  private getMetricsSummaryUrl(): string {
    const accessLevel = this.getUserAccessLevel();
    this.isAdminOrManager = accessLevel.isAdmin;
    this.userTeamFilters = accessLevel.teams;

    // Single team: use backend filtering
    if (accessLevel.teams.length === 1) {
      return `${this.metricsSummaryUrl}?team=${accessLevel.teams[0]}`;
    }

    // Admin, multiple teams, or no teams: use base URL
    return this.metricsSummaryUrl;
  }

  /**
   * Builds metrics incidents URL
   * - If user has single team: append ?team=${team} for backend filtering
   * - If user has multiple teams or is admin: use base URL (client-side filtering)
   * @returns URL with optional team query parameter
   */
  private getMetricsIncidentsUrl(): string {
    const accessLevel = this.getUserAccessLevel();
    this.isAdminOrManager = accessLevel.isAdmin;
    this.userTeamFilters = accessLevel.teams;

    // Single team: use backend filtering
    if (accessLevel.teams.length === 1) {
      return `${this.metricsIncidentsUrl}?team=${accessLevel.teams[0]}`;
    }

    // Admin, multiple teams, or no teams: use base URL
    return this.metricsIncidentsUrl;
  }

  /**
   * Filters raw incident data based on user's team access
   * Called when user has multiple teams (client-side filtering)
   * @param incidents raw incident objects from API
   * @returns filtered incidents matching user's allowed teams
   */
  private filterIncidentsByTeam(
    incidents: Record<string, unknown>[],
  ): Record<string, unknown>[] {
    // No filtering for admin/manager or single team (backend already filtered)
    if (this.isAdminOrManager || this.userTeamFilters.length <= 1) {
      return incidents;
    }

    // Filter by allowed teams using team_name property
    return incidents.filter((incident) => {
      const teamName = incident['team_name'] as string | undefined;
      return teamName && this.userTeamFilters.includes(teamName);
    });
  }

  ngOnInit(): void {
    const accessLevel = this.getUserAccessLevel();
    this.isAdminOrManager = accessLevel.isAdmin;
    this.userTeamFilters = accessLevel.teams;
    this.showTeamFilter = accessLevel.isAdmin || accessLevel.teams.length !== 1;

    this.applyFilter();
    this.loadMetricsSummary();
    this.loadIncidents();
  }

  private loadIncidents(): void {
    this.httpClient.get(this.getMetricsIncidentsUrl()).subscribe({
      next: (response) => {
        const apiIncidents = this.extractIncidentRows(response);
        // Apply client-side filtering for multiple team access
        const filteredIncidents = this.filterIncidentsByTeam(apiIncidents);
        this.incidents = this.groupIncidents(filteredIncidents);
        this.allIncidents = [...this.incidents];
        this.syncReopenedIncidentTeamKeys();
        this.updateDynamicFilterOptionsFromIncidents();
        this.applyFilter();
      },
      error: () => {
        this.incidents = [];
        this.allIncidents = [];
        this.syncReopenedIncidentTeamKeys();
        this.updateDynamicFilterOptionsFromIncidents();
        this.applyFilter();
      },
    });
  }

  isReopenedIncident(row: SupervisorIncident): boolean {
    const key = this.buildIncidentTeamKey(row.incidentNumber, row.team);
    return this.reopenedIncidentTeamKeys.has(key);
  }

  private syncReopenedIncidentTeamKeys(): void {
    this.reopenedIncidentTeamKeys.clear();

    const visibleTeams = new Set(
      (this.allIncidents || []).map((item) => this.normalizeKeyPart(item.team)),
    );

    for (const metric of this.caseReopenMetrics || []) {
      const team = this.normalizeKeyPart(metric?.TEAM_NAME);
      const incident = this.normalizeKeyPart(metric?.INCIDENT_NUMBER);
      if (!team || !incident) {
        continue;
      }

      if (visibleTeams.size > 0 && !visibleTeams.has(team)) {
        continue;
      }

      this.reopenedIncidentTeamKeys.add(
        this.buildIncidentTeamKey(incident, team),
      );
    }
  }

  private buildIncidentTeamKey(
    incidentNumber: string,
    teamName: string,
  ): string {
    return `${this.normalizeKeyPart(teamName)}::${this.normalizeKeyPart(incidentNumber)}`;
  }

  private normalizeKeyPart(value: unknown): string {
    return String(value ?? '')
      .trim()
      .toUpperCase();
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
      ]) || '';

    const team = this.pickString(item, ['team', 'team_name', 'owner_team']);

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
      rawEpoch ?? (rawDate ? new Date(rawDate).getTime() : 0);

    const processedAt = this.formatProcessedDate(processedEpoch, rawDate);

    return {
      incidentNumber,
      team: team || '--',
      category: this.pickString(item, ['category']) || '--',
      coreIssue:
        this.pickString(item, [
          'core_issue',
          'coreIssue',
          'issue',
          'issue_type',
        ]) || '--',
      outcome,
      resolutionPath:
        this.pickString(item, [
          'resolution_path',
          'resolutionPath',
          'route',
          'agent_path',
        ]) || '--',
      processedAt,
      processedEpoch,
      pipelineStages:
        this.pickNumber(item, [
          'hop_sequence',
          'pipeline_stages',
          'pipelineStages',
          'stage_count',
        ]) ?? 0,
      fiscalQuarter:
        this.pickString(item, ['fiscal_quarter', 'fiscalQuarter']) || '',
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
      rawEpoch ?? (rawDate ? new Date(rawDate).getTime() : 0);

    return {
      sharedStateId:
        this.pickString(item, ['shared_state_id', 'sharedStateId']) || '',
      outcome,
      category: this.pickString(item, ['category']) || '--',
      coreIssue:
        this.pickString(item, [
          'core_issue',
          'coreIssue',
          'issue',
          'issue_type',
        ]) || '--',
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
        ]) ?? 0,
      executionMs: this.pickNumber(item, ['execution_ms', 'executionMs']) || 0,
    };
  }

  private groupIncidents(
    rows: Record<string, unknown>[],
  ): SupervisorIncident[] {
    const grouped = new Map<string, SupervisorIncident>();

    rows.forEach((item, index) => {
      const mapped = this.mapApiIncident(item, index);
      if (!mapped.incidentNumber) {
        return;
      }
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
    if (!value) {
      return '--';
    }
    return value.trim();
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
    this.reloadKpis([]);
  }

  private reloadKpis(selectedTeams: string[]): void {
    const requests =
      selectedTeams.length === 0
        ? [this.httpClient.get(this.getMetricsSummaryUrl())]
        : selectedTeams.map((team) =>
            this.httpClient.get(
              `${this.metricsSummaryUrl}?team=${encodeURIComponent(team)}`,
            ),
          );

    forkJoin(requests).subscribe({
      next: (responses) => {
        const aggregated = this.aggregateMetricsSummaries(responses as any);
        this.metricsSummary = this.buildMetricsSummary(aggregated);
        this.kpiConfig = this.buildKpiConfig(this.metricsSummary);
      },
      error: () => {
        this.metricsSummary = {};
        this.kpiConfig = [];
      },
    });
  }

  private aggregateMetricsSummaries(
    responses: SupervisorMetricsSummary[],
  ): SupervisorMetricsSummary {
    const result: SupervisorMetricsSummary = {
      unique_incidents: 0,
      outcomes: {},
    };
    for (const response of responses) {
      if (typeof response?.unique_incidents === 'number') {
        result.unique_incidents += response.unique_incidents;
      }
      if (response?.outcomes && typeof response.outcomes === 'object') {
        for (const [key, value] of Object.entries(response.outcomes)) {
          if (typeof value === 'number') {
            result.outcomes![key] = (result.outcomes![key] ?? 0) + value;
          }
        }
      }
    }
    return result;
  }

  private buildMetricsSummary(
    response: SupervisorMetricsSummary,
  ): Record<string, number> {
    const result: Record<string, number> = {};

    if (typeof response?.unique_incidents === 'number') {
      result['unique_incidents'] = response.unique_incidents;
    }

    if (response?.outcomes && typeof response.outcomes === 'object') {
      for (const [key, value] of Object.entries(response.outcomes)) {
        if (typeof value === 'number') {
          result[`outcome_${key}`] = value;
        }
      }
    }

    return result;
  }

  private buildKpiConfig(summary: Record<string, number>): DynamicKpi[] {
    return Object.keys(summary).map((key) => ({
      key,
      label: this.toKpiLabel(key),
    }));
  }

  private toKpiLabel(value: string): string {
    return value
      .replace(/^outcome_/, '')
      .replace(/[_-]+/g, ' ')
      .trim()
      .toUpperCase();
  }

  applyFilter(): void {
    // Reset pagination when filter changes
    this.currentPage = 0;

    let result = [...this.incidents];

    const selectedQuarter = this.normalizeQuarter(this.selectedQuarter);
    if (selectedQuarter) {
      result = result.filter(
        (row) => this.normalizeQuarter(row.fiscalQuarter) === selectedQuarter,
      );
    }

    const selectedOutcomes = this.getSelectedFilterValues('outcome');
    if (selectedOutcomes.length > 0) {
      result = result.filter((row) => selectedOutcomes.includes(row.outcome));
    }

    const selectedTeams = this.getSelectedFilterValues('team');
    if (selectedTeams.length > 0) {
      result = result.filter((row) => selectedTeams.includes(row.team));
    }

    const selectedDateRange = this.getSelectedDateRange(this.topFilterValues);
    if (selectedDateRange) {
      result = result.filter((row) =>
        this.isInSelectedTimeRange(row.processedEpoch, selectedDateRange),
      );
    }

    const selectedCoreIssues = this.getSelectedFilterValues('coreIssue');
    if (selectedCoreIssues.length > 0) {
      result = result.filter((row) =>
        selectedCoreIssues.includes(row.coreIssue),
      );
    }

    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter((row) => this.matchesSearch(row, term));
    }

    this.filteredIncidents = result;

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

  private normalizeQuarter(value: unknown): string {
    return String(value ?? '')
      .replace(/[\s_-]+/g, '')
      .trim()
      .toUpperCase();
  }

  private compareIncidentsForDisplay(
    a: SupervisorIncident,
    b: SupervisorIncident,
  ): number {
    const aFailed = this.isFailedOutcome(a.outcome);
    const bFailed = this.isFailedOutcome(b.outcome);

    if (aFailed !== bFailed) {
      return aFailed ? -1 : 1;
    }

    return b.processedEpoch - a.processedEpoch;
  }

  private isFailedOutcome(outcome: string): boolean {
    return outcome.trim().toUpperCase() === 'FAILED';
  }

  get totalProcessed(): number {
    return this.filteredIncidents.length;
  }

  countByOutcome(outcome: string): number {
    return this.filteredIncidents.filter((item) => item.outcome === outcome)
      .length;
  }

  getKpiValue(key: string): number {
    return this.metricsSummary[key] ?? 0;
  }

  getOutcomeClass(outcome: string): string {
    const normalized = outcome.trim().toUpperCase().replace(/\s+/g, '_');
    switch (normalized) {
      case 'RESOLVED':
        return 'outcome--resolved';
      case 'ROUTED':
      case 'ROUTED_OUT':
        return 'outcome--routed';
      case 'CANCELLED':
      case 'CANCELED':
        return 'outcome--cancelled';
      case 'FAILED':
        return 'outcome--failed';
      case 'BOT_HANDOFF':
      case 'HANDOFF':
        return 'outcome--bot-handoff';
      case 'IN_PROGRESS':
      case 'PENDING':
      case 'NEED_INFO':
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
      this.loadAllExecutionPipelines(incident);
    }
  }

  private loadAllExecutionPipelines(incident: SupervisorIncident): void {
    this.pipelineDetailIncident = incident;
    this.pipelineDetailsBySharedStateId = {};
    this.pipelineDetailLoadingBySharedStateId = {};
    this.pipelineDetailErrorBySharedStateId = {};

    if (!incident.history.length) {
      this.openPipelineSharedStateId = null;
      this.pipelineDetail = null;
      this.pipelineDetailLoading = false;
      this.pipelineDetailError = 'No execution history available.';
      return;
    }

    this.pipelineDetail = null;
    this.pipelineDetailError = null;
    this.pipelineDetailLoading = true;
    this.openPipelineSharedStateId = incident.history[0].sharedStateId;

    incident.history.forEach((execution) => {
      const id = execution.sharedStateId;
      this.pipelineDetailLoadingBySharedStateId[id] = true;
      this.pipelineDetailErrorBySharedStateId[id] = '';

      const url = `/api/caseiq-supervisor/metrics/executions/${encodeURIComponent(id)}`;
      this.httpClient.get(url).subscribe({
        next: (response) => {
          this.pipelineDetailsBySharedStateId[id] =
            this.normalizePipelineDetail(response, id, incident);
          this.pipelineDetailLoadingBySharedStateId[id] = false;
          this.pipelineDetailErrorBySharedStateId[id] = '';
          this.updateAggregatePipelineLoadState();
        },
        error: () => {
          this.pipelineDetailLoadingBySharedStateId[id] = false;
          this.pipelineDetailErrorBySharedStateId[id] =
            'Failed to load pipeline detail.';
          this.updateAggregatePipelineLoadState();
        },
      });
    });
  }

  private updateAggregatePipelineLoadState(): void {
    const loadingValues = Object.values(
      this.pipelineDetailLoadingBySharedStateId,
    );
    const isAnyLoading = loadingValues.some((value) => value);
    this.pipelineDetailLoading = isAnyLoading;

    const detailValues = Object.values(this.pipelineDetailsBySharedStateId);
    this.pipelineDetail = detailValues.length > 0 ? detailValues[0] : null;

    const errorValues = Object.values(
      this.pipelineDetailErrorBySharedStateId,
    ).filter((value) => !!value);
    this.pipelineDetailError =
      !detailValues.length && errorValues.length ? errorValues[0] : null;
  }

  getPipelineDetail(sharedStateId: string): PipelineDetail | null {
    return this.pipelineDetailsBySharedStateId[sharedStateId] ?? null;
  }

  isPipelineDetailLoading(sharedStateId: string): boolean {
    return !!this.pipelineDetailLoadingBySharedStateId[sharedStateId];
  }

  getPipelineDetailError(sharedStateId: string): string {
    return this.pipelineDetailErrorBySharedStateId[sharedStateId] || '';
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

  openSharedStateDetails(
    incident: SupervisorIncident,
    preferredSharedStateId?: string,
  ): void {
    const sharedStateId =
      preferredSharedStateId ||
      this.openPipelineSharedStateId ||
      incident.history[0]?.sharedStateId;
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
    this.httpClient.get(url).subscribe({
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
    this.pipelineDetailsBySharedStateId = {};
    this.pipelineDetailLoadingBySharedStateId = {};
    this.pipelineDetailErrorBySharedStateId = {};
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
    this.httpClient.get(url).subscribe({
      next: (response) => {
        const detailData =
          typeof response === 'object' && response !== null
            ? (response as any)
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
      resolvedBy: this.formatResolvedBy(
        this.pickString(h, ['resolved_by', 'resolvedBy']),
      ),
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
    if (
      this.selectedRange !== CaseiqIncidentsComponent.CUSTOM_DATE_RANGE_VALUE
    ) {
      this.customDateRangeStart = '';
      this.customDateRangeEnd = '';
    }
    this.applyFilter();
    this.reloadKpis(this.getSelectedFilterValues('team'));
  }

  onTopFilterClear(): void {
    this.topFilterValues = { outcome: [], team: [], date: [], coreIssue: [] };
    this.selectedRange = '';
    this.customDateRangeStart = '';
    this.customDateRangeEnd = '';
    this.applyFilter();
    this.reloadKpis([]);
  }

  onCustomDateRangeSelection(event: DateRangeChangeEvent): void {
    this.customDateRangeStart = event.start;
    this.customDateRangeEnd = event.end;
    if (
      this.selectedRange === CaseiqIncidentsComponent.CUSTOM_DATE_RANGE_VALUE
    ) {
      this.applyFilter();
    }
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
    const coreIssueValues = Array.isArray(values['coreIssue'])
      ? values['coreIssue']
      : [];

    return {
      outcome: outcomeValues,
      team: teamValues,
      date: dateValues.length > 0 ? [dateValues[dateValues.length - 1]] : [],
      coreIssue: coreIssueValues,
    };
  }

  private getSelectedDateRange(values: FilterValues): string {
    const dateValues = values['date'];
    return Array.isArray(dateValues) && dateValues.length > 0
      ? dateValues[0]
      : '';
  }

  private getSelectedFilterValues(filterId: string): string[] {
    const value = this.topFilterValues[filterId];
    return Array.isArray(value) ? value : [];
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

  private updateDynamicFilterOptionsFromIncidents(): void {
    const uniqueOutcomes = Array.from(
      new Set(
        this.incidents
          .map((incident) => incident.outcome)
          .filter((outcome) => !!outcome && outcome !== '--'),
      ),
    ).sort((a, b) => a.localeCompare(b));

    const uniqueTeams = Array.from(
      new Set(
        this.incidents
          .map((incident) => incident.team)
          .filter((team) => !!team && team !== '--'),
      ),
    ).sort((a, b) => a.localeCompare(b));

    const uniqueCoreIssues = Array.from(
      new Set(
        this.incidents
          .map((incident) => incident.coreIssue)
          .filter((coreIssue) => !!coreIssue && coreIssue !== '--'),
      ),
    ).sort((a, b) => a.localeCompare(b));

    this.patchFilterOptions(
      'outcome',
      uniqueOutcomes.map((value) => ({
        value,
        label: this.formatFilterLabel(value),
      })),
    );

    this.patchFilterOptions(
      'team',
      uniqueTeams.map((value) => ({
        value,
        label: value,
      })),
    );

    this.patchFilterOptions(
      'coreIssue',
      uniqueCoreIssues.map((value) => ({
        value,
        label: value,
      })),
    );
  }

  private patchFilterOptions(
    filterId: string,
    options: FilterConfig['options'],
  ): void {
    const target = this.topFilterConfigs.find(
      (config) => config.id === filterId,
    );
    if (!target) {
      return;
    }
    target.options = options;
  }

  private isInSelectedTimeRange(epoch: number, selectedRange: string): boolean {
    if (!Number.isFinite(epoch) || epoch <= 0) {
      return false;
    }

    if (selectedRange === CaseiqIncidentsComponent.CUSTOM_DATE_RANGE_VALUE) {
      if (!this.customDateRangeStart || !this.customDateRangeEnd) {
        return true;
      }

      const start = this.parseDateInputToLocalEpoch(this.customDateRangeStart);
      const end = this.parseDateInputToLocalEpoch(this.customDateRangeEnd);

      if (start === null || end === null || end < start) {
        return true;
      }

      const endOfDay = end + (24 * 60 * 60 * 1000 - 1);
      return epoch >= start && epoch <= endOfDay;
    }

    const normalized = selectedRange.trim().toLowerCase();
    const dayMatch = normalized.match(/(\d+)\s*day/);
    const hourMatch = normalized.match(/(\d+)\s*hour/);

    let durationMs = 0;
    if (dayMatch) {
      durationMs = Number(dayMatch[1]) * 24 * 60 * 60 * 1000;
    } else if (hourMatch) {
      durationMs = Number(hourMatch[1]) * 60 * 60 * 1000;
    } else {
      return true;
    }

    const now = Date.now();
    return epoch >= now - durationMs;
  }

  private parseDateInputToLocalEpoch(value: string): number | null {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    if (
      !Number.isFinite(year) ||
      !Number.isFinite(month) ||
      !Number.isFinite(day)
    ) {
      return null;
    }

    const dt = new Date(year, month - 1, day);
    return Number.isFinite(dt.getTime()) ? dt.getTime() : null;
  }

  private formatFilterLabel(value: string): string {
    return value
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
