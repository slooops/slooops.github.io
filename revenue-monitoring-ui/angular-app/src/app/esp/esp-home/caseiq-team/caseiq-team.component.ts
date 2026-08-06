import {
  Component,
  OnInit,
  OnChanges,
  SimpleChanges,
  Input,
  ViewChild,
  HostListener,
  HostBinding,
  Output,
  EventEmitter,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ApiHttpService } from 'src/app/providers/http.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { StackedBarChartDataPoint } from 'src/app/components/bar-chart/bar-chart.component';
import { CaseiqTableComponent } from 'src/app/components/caseiq-table/caseiq-table.component';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorInfoBold,
  phosphorFunnelSimpleBold,
} from '@ng-icons/phosphor-icons/bold';
import { coolExpand } from '@ng-icons/coolicons';
import { CaseiqIncidentDetailComponent } from '../caseiq-incident-detail/caseiq-incident-detail.component';
import { BarChartComponent } from '../../../components/bar-chart/bar-chart.component';
import { ThemeService } from '../../../providers/theme.service';
import { HttpClient } from '@angular/common/http';
import { SupervisorIncident } from '../caseiq-incidents/caseiq-incidents.component';
import { LoadingSymbolComponent } from 'src/app/loading-symbol/loading-symbol.component';

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

export interface TeamConfig {
  /** Display name: 'OM', 'SM', 'Capital', etc. */
  displayName: string;
  /** Lowercase API suffix: 'om', 'sm', 'capital', 'fpp', 'p2p', 'i2c', 'ait' */
  apiSuffix: string;
  /** TEAM_NAME value used in accuracy API filter (uppercase): 'OM', 'SM', 'CAPITAL', etc. */
  teamFilterName: string;
  /** Source string for upload dialog: 'om', 'sm', 'cap', 'fpp', 'p2p', 'i2c', 'ait' */
  tableSource: string;
  /** Export filename prefix: 'OM_Validation_Summary', etc. */
  exportFileName: string;
}

interface AccuracyData {
  TEAM_NAME: string;
  CATEGORY: number;
  CORE_ISSUE: number;
  TOTAL_ACCURACY: number;
  TOTAL_VALIDATED_CASES: number;
}

@Component({
  selector: 'app-caseiq-team',
  templateUrl: './caseiq-team.component.html',
  styleUrl: './caseiq-team.component.css',
  imports: [
    CommonModule,
    MatTooltipModule,
    NgIcon,
    BarChartComponent,
    CaseiqTableComponent,
    CaseiqIncidentDetailComponent,
    LoadingSymbolComponent,
  ],
  providers: [
    provideIcons({
      phosphorInfoBold,
      phosphorFunnelSimpleBold,
      coolExpand,
    }),
  ],
  standalone: true,
})
export class CaseiqTeamComponent implements OnInit, OnChanges {
  @HostBinding('class.dark-theme') get darkThemeClass() {
    return this.themeService.isDarkMode;
  }

  @Input() teamConfig!: TeamConfig;
  @Input() selectedQuarter!: string;
  @Input() caseIqMetrics: any;
  @Input() caseReopenMetrics: any;
  @Output() uploadSuccess = new EventEmitter<void>();
  reopenedIncidentNumbers: string[] = [];

  /* ── View switching (0 = Classification Summary, 1 = Incidents) ── */
  activeViewIndex = 0;
  viewLabels = ['Classification Summary'];
  selectedIncidentNumber: string | null = null;
  selectedReopenMetric: any | null = null;
  selectedTimelineIncident: SupervisorIncident | null = null;

  incidentSharedStateIds: string[] = [];
  sharedStateIdsLoading = false;
  sharedStateIdsError: string | null = null;
  pipelineDetailsBySharedStateId: Record<string, PipelineDetail> = {};
  pipelineDetailLoadingBySharedStateId: Record<string, boolean> = {};
  pipelineDetailErrorBySharedStateId: Record<string, string> = {};

  showFullIncidentDetail = false;
  fullDetailSharedStateId: string | null = null;
  fullDetailData: Record<string, unknown> | null = null;
  fullDetailLoading = false;
  fullDetailError: string | null = null;

  private readonly sharedStateIdsSearchUrl =
    '/api/caseiq-supervisor/api/v1/shared-state-ids/search/incident_number';
  private readonly pipelineDetailUrl =
    '/api/caseiq-supervisor/metrics/executions';
  private readonly incidentDetailUrl =
    '/api/caseiq-supervisor/api/v1/incidents';

  onIncidentCellClick(event: { column: string; value: any; row: any }): void {
    if (
      event.column === 'incident_number' ||
      event.column === 'INCIDENT_NUMBER'
    ) {
      this.selectedIncidentNumber = event.value;

      // Look up a matching reopen metric for this incident
      const normalized = String(event.value ?? '')
        .trim()
        .toUpperCase();
      this.selectedReopenMetric = Array.isArray(this.caseReopenMetrics)
        ? (this.caseReopenMetrics.find(
            (m: any) =>
              String(m?.INCIDENT_NUMBER ?? '')
                .trim()
                .toUpperCase() === normalized,
          ) ?? null)
        : null;

      this.loadPipelinesForIncident(event.value);
    }
  }

  private loadPipelinesForIncident(incidentNumber: string): void {
    this.sharedStateIdsLoading = true;
    this.sharedStateIdsError = null;
    this.incidentSharedStateIds = [];
    this.pipelineDetailsBySharedStateId = {};
    this.pipelineDetailLoadingBySharedStateId = {};
    this.pipelineDetailErrorBySharedStateId = {};

    const url = `${this.sharedStateIdsSearchUrl}/${encodeURIComponent(incidentNumber)}`;
    this.httpClient.get<unknown>(url).subscribe({
      next: (response) => {
        const ids = this.extractSharedStateIds(response);
        this.sharedStateIdsLoading = false;
        this.incidentSharedStateIds = ids;

        if (ids.length === 0) {
          this.sharedStateIdsError =
            'No pipeline executions found for this incident.';
          return;
        }

        ids.forEach((id) => {
          this.pipelineDetailLoadingBySharedStateId[id] = true;
          this.pipelineDetailErrorBySharedStateId[id] = '';

          const detailUrl = `${this.pipelineDetailUrl}/${encodeURIComponent(id)}`;
          this.httpClient.get<unknown>(detailUrl).subscribe({
            next: (detailResponse) => {
              this.pipelineDetailsBySharedStateId[id] =
                this.normalizePipelineDetail(
                  detailResponse,
                  id,
                  incidentNumber,
                );
              this.pipelineDetailLoadingBySharedStateId[id] = false;
            },
            error: () => {
              this.pipelineDetailLoadingBySharedStateId[id] = false;
              this.pipelineDetailErrorBySharedStateId[id] =
                'Failed to load pipeline detail.';
            },
          });
        });
      },
      error: () => {
        this.sharedStateIdsLoading = false;
        this.sharedStateIdsError =
          'Failed to retrieve pipeline executions for this incident.';
      },
    });
  }

  private extractSharedStateIds(response: unknown): string[] {
    if (Array.isArray(response)) {
      return response
        .map((item) => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item !== null) {
            const obj = item as Record<string, unknown>;
            return (
              (obj['shared_state_id'] as string) ||
              (obj['sharedStateId'] as string) ||
              (obj['id'] as string) ||
              null
            );
          }
          return null;
        })
        .filter((id): id is string => !!id);
    }
    if (typeof response === 'object' && response !== null) {
      const obj = response as Record<string, unknown>;
      const candidates = [
        'shared_state_ids',
        'sharedStateIds',
        'ids',
        'data',
        'results',
      ];
      for (const key of candidates) {
        if (Array.isArray(obj[key])) {
          return this.extractSharedStateIds(obj[key]);
        }
      }
    }
    return [];
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

  getOutcomeClass(outcome: string): string {
    const normalized = (outcome || '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');
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

  formatDuration(ms: number): string {
    if (!ms || ms <= 0) return '--';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }

  private normalizePipelineDetail(
    response: unknown,
    sharedStateId: string,
    incidentNumber: string,
  ): PipelineDetail {
    const data =
      typeof response === 'object' && response !== null
        ? (response as Record<string, unknown>)
        : {};

    const outcome = this.normalizeOutcome(
      this.pickStr(data, ['outcome', 'final_outcome', 'status']),
    );

    let groups: PipelineGroup[] = [];

    if (Array.isArray(data['pipeline'])) {
      groups = (data['pipeline'] as Record<string, unknown>[]).map((g, gi) => {
        const rawLabel = this.pickStr(g, ['group_label', 'label', 'team']);
        const grpOutcome = this.normalizeOutcome(
          this.pickStr(g, ['outcome', 'status']),
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
        return {
          label: `${i + 1}. ${g.team} (${lastOutcome})`,
          hops: g.hops,
        };
      });
    }

    if (groups.length === 0) {
      groups = [{ label: `1. (${outcome})`, hops: [] }];
    }

    return {
      sharedStateId,
      incidentNumber: (data['incident_number'] as string) || incidentNumber,
      outcome,
      totalHops: groups.reduce((sum, g) => sum + g.hops.length, 0),
      groups,
    };
  }

  private normalizeHops(raw: unknown): PipelineHop[] {
    if (!Array.isArray(raw)) return [];
    return (raw as Record<string, unknown>[]).map((h, i) => ({
      hopNumber:
        this.pickNum(h, ['hop_number', 'hop_sequence', 'hop', 'sequence']) ??
        i + 1,
      team: this.pickStr(h, ['team', 'team_name']) ?? '--',
      agent: this.pickStr(h, ['agent', 'agent_name', 'handler']) ?? '--',
      category: this.pickStr(h, ['category']) ?? '--',
      coreIssue: this.pickStr(h, ['core_issue', 'coreIssue', 'issue']) ?? '--',
      outcome: this.normalizeOutcome(
        this.pickStr(h, ['outcome', 'status', 'resolution_status']),
      ),
      resolvedBy: this.formatResolvedBy(
        this.pickStr(h, ['resolved_by', 'resolvedBy']),
      ),
      durationMs:
        this.pickNum(h, [
          'duration_ms',
          'durationMs',
          'elapsed_ms',
          'execution_ms',
        ]) ?? 0,
    }));
  }

  private normalizeOutcome(value: string | null): string {
    if (!value) return '--';
    return value.trim();
  }

  private formatResolvedBy(value: string | null): string {
    if (!value) return '--';
    return value
      .split('_')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  private pickStr(
    source: Record<string, unknown>,
    keys: string[],
  ): string | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return null;
  }

  private pickNum(
    source: Record<string, unknown>,
    keys: string[],
  ): number | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
      }
    }
    return null;
  }

  openFullPipelineDetail(sharedStateId: string): void {
    this.fullDetailSharedStateId = sharedStateId;
    this.showFullIncidentDetail = true;
    this.fullDetailData = null;
    this.fullDetailError = null;
    this.fullDetailLoading = true;

    const incidentNumber =
      this.getPipelineDetail(sharedStateId)?.incidentNumber ||
      this.selectedIncidentNumber ||
      '';
    const url = `${this.incidentDetailUrl}/${encodeURIComponent(
      incidentNumber,
    )}?ssid=${encodeURIComponent(sharedStateId)}`;
    this.httpClient.get<unknown>(url).subscribe({
      next: (response) => {
        this.fullDetailData =
          typeof response === 'object' && response !== null
            ? (response as Record<string, unknown>)
            : {};
        this.fullDetailLoading = false;
      },
      error: () => {
        this.fullDetailError = 'Failed to load full incident detail.';
        this.fullDetailLoading = false;
      },
    });
  }

  closeFullPipelineDetail(): void {
    this.showFullIncidentDetail = false;
    this.fullDetailSharedStateId = null;
    this.fullDetailData = null;
    this.fullDetailError = null;
    this.fullDetailLoading = false;
    this.restoreFullTableData();
  }

  closePipelineSection(): void {
    this.selectedIncidentNumber = null;
    this.selectedReopenMetric = null;
    this.incidentSharedStateIds = [];
    this.sharedStateIdsLoading = false;
    this.sharedStateIdsError = null;
    this.pipelineDetailsBySharedStateId = {};
    this.pipelineDetailLoadingBySharedStateId = {};
    this.pipelineDetailErrorBySharedStateId = {};
    this.showFullIncidentDetail = false;
    this.fullDetailSharedStateId = null;
    this.restoreFullTableData();
  }

  closeIncidentDetail(): void {
    this.closePipelineSection();
  }

  onTimelineDetailOpen(incident: SupervisorIncident): void {
    this.selectedTimelineIncident = incident;
  }

  closeTimelineDetail(): void {
    this.selectedTimelineIncident = null;
    this.restoreFullTableData();
  }

  private restoreFullTableData(): void {
    if (!Array.isArray(this.fullTableData) || this.fullTableData.length === 0) {
      return;
    }

    this.tableData.data = [...this.fullTableData];
    this.totalRecords = this.fullTableData.length;
    this.tableData._updateChangeSubscription();

    setTimeout(() => {
      this.teamTable?.setExternalData([...this.fullTableData], true);
    }, 0);
  }

  nextView(): void {
    this.activeViewIndex = (this.activeViewIndex + 1) % this.viewLabels.length;
    if (this.activeViewIndex === 1 && !this.incidentsLoaded) {
      this.loadIncidents();
    }
  }

  prevView(): void {
    this.activeViewIndex =
      (this.activeViewIndex - 1 + this.viewLabels.length) %
      this.viewLabels.length;
  }

  /* ── Incidents data ── */
  incidentsTableData = new MatTableDataSource<any>([]);
  incidentsTableColumns: string[] = [];
  incidentsLoaded = false;

  private loadIncidents(): void {
    this.httpClient.get<any[]>('/api/caseiq-supervisor/incidents').subscribe({
      next: (data) => {
        const allRows = Array.isArray(data) ? data : [];
        const filtered = allRows.filter(
          (row) =>
            String(row['team_name'] ?? '').toLowerCase() ===
            this.teamConfig.teamFilterName.toLowerCase(),
        );
        if (filtered.length > 0) {
          this.incidentsTableColumns = Object.keys(filtered[0]);
        }
        this.incidentsTableData = new MatTableDataSource(filtered);
        this.incidentsLoaded = true;
      },
      error: () => {
        this.incidentsTableData = new MatTableDataSource([]);
        this.incidentsLoaded = true;
      },
    });
  }
  @ViewChild('teamTable') teamTable!: CaseiqTableComponent;

  totalAccuracy: any;

  constructor(
    private readonly http: ApiHttpService,
    private readonly destroyManager: DestroyManager,
    public themeService: ThemeService,
    private httpClient: HttpClient,
  ) {}

  // Chart data
  categoryChartData: StackedBarChartDataPoint[] = [];
  coreIssueChartData: StackedBarChartDataPoint[] = [];

  // KPI values
  categoryAccuracy: number | string = '-';
  coreIssueAccuracy: number | string = '-';
  totalCases: number | string = '-';

  // Table state
  tableData = new MatTableDataSource<any>([]);
  tableColumns: string[] = [];
  totalRecords: number = 0;
  fullTableData: any[] = [];

  // Filter and threshold state
  showCategoryFilters = false;
  showCoreIssueFilters = false;
  showCategorySelect = false;
  showCoreIssueSelect = false;

  allCategoryLabels: string[] = [];
  allCoreIssueLabels: string[] = [];
  selectedCategoryLabels: Set<string> = new Set();
  selectedCoreIssueLabels: Set<string> = new Set();

  categoryMinThreshold = 0;
  coreIssueMinThreshold = 0;

  // Cached full data
  cachedCategoryData: any[] = [];
  cachedCoreIssueData: any[] = [];

  // Cached transformed chart data for expand modal (stable references)
  expandedCategoryData: StackedBarChartDataPoint[] = [];
  expandedCoreIssueData: StackedBarChartDataPoint[] = [];
  expandedCategoryTotal = 0;
  expandedCoreIssueTotal = 0;

  // Visible totals
  visibleCategoryTotal = 0;
  visibleCoreIssueTotal = 0;

  // Loading state
  refreshingData = true;

  // Expand chart modal state
  expandedChart: { type: 'CATEGORY' | 'CORE_ISSUE' } | null = null;

  // Dynamic IDs derived from config
  get stackedCanvasId(): string {
    return `${this.teamConfig.tableSource}StackedChart`;
  }
  get simpleCanvasId(): string {
    return `${this.teamConfig.tableSource}SimpleChart`;
  }
  get expandCanvasPrefix(): string {
    return `expanded${this.teamConfig.displayName.replace(/\s/g, '')}`;
  }
  get tableTitle(): string {
    return `${this.teamConfig.displayName} Classification Summary`;
  }

  ngOnInit(): void {
    this.syncReopenedIncidentNumbers();
    this.loadAllData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['caseReopenMetrics'] || changes['teamConfig']) {
      this.syncReopenedIncidentNumbers();
    }

    if (
      (changes['selectedQuarter'] && changes['selectedQuarter'].currentValue) ||
      (changes['caseIqMetrics'] && !changes['caseIqMetrics'].firstChange)
    ) {
      this.refreshingData = true;
      this.loadAllData();
    }
  }

  private syncReopenedIncidentNumbers(): void {
    if (!Array.isArray(this.caseReopenMetrics)) {
      this.reopenedIncidentNumbers = [];
      return;
    }

    const unique = new Set<string>();
    for (const metric of this.caseReopenMetrics) {
      const incidentRaw = metric?.INCIDENT_NUMBER;
      if (incidentRaw === null || incidentRaw === undefined) {
        continue;
      }
      const normalized = String(incidentRaw).trim().toUpperCase();
      if (normalized) {
        unique.add(normalized);
      }
    }

    this.reopenedIncidentNumbers = Array.from(unique);
  }

  /**
   * CaseIQ metrics filtered by selectedQuarter for this team.
   */
  get filteredCaseIqMetrics(): any {
    if (!this.caseIqMetrics) return null;
    if (!this.selectedQuarter) return this.caseIqMetrics;

    if (Array.isArray(this.caseIqMetrics)) {
      const row = this.caseIqMetrics.find(
        (m: any) =>
          m &&
          m.FISCAL_QTR === this.selectedQuarter &&
          m.TEAM_NAME &&
          m.TEAM_NAME.toString().toUpperCase() ===
            this.teamConfig.teamFilterName,
      );
      return row || null;
    }

    if (
      (this.caseIqMetrics as any).FISCAL_QTR &&
      (this.caseIqMetrics as any).FISCAL_QTR !== this.selectedQuarter
    ) {
      return null;
    }

    return this.caseIqMetrics;
  }

  getAgentRatio(): number {
    const m = this.filteredCaseIqMetrics;
    if (!m) return 0;
    const total = m.TOTAL_CASES - m.SERVICE_INCIDENTS;
    if (!total) return 0;
    const agentTotal =
      (m.RESOLVED_AGENT ?? 0) +
      (m.IN_PROGRESS_AGENT ?? 0) +
      (m.RECOMMENDED_ROUTED_OUT ?? 0) +
      (m.RECOMMENDED_CANCELLED ?? 0);
    return Math.round((agentTotal / total) * 100);
  }

  // ── Data loading ──────────────────────────────────────────────

  private loadAllData(): void {
    this.fetchAccuracy();
    this.fetchCategoryGraph();
    this.fetchCoreIssueGraph();
    this.fetchCaseDetails();
  }

  private fetchAccuracy(): void {
    this.http
      .get('xxcaseiq-validated-cases-accuracy-v', this.destroyManager)
      .subscribe((data: any) => {
        const filtered = this.selectedQuarter
          ? data.filter(
              (item: any) =>
                item.Quarter === this.selectedQuarter &&
                item.TEAM_NAME?.toUpperCase() ===
                  this.teamConfig.teamFilterName,
            )
          : data.filter(
              (item: any) =>
                item.TEAM_NAME?.toUpperCase() ===
                this.teamConfig.teamFilterName,
            );
        this.updateAccuracyMetrics(filtered);
      });
  }

  private fetchCategoryGraph(): void {
    this.http
      .get(
        `xxcaseiq-category-graph-v-${this.teamConfig.apiSuffix}`,
        this.destroyManager,
      )
      .subscribe((data: any) => {
        const filteredByQuarter = this.selectedQuarter
          ? data.filter((item: any) => item.Quarter === this.selectedQuarter)
          : data;

        const mergedData = this.mergeByCategoryOrIssue(
          filteredByQuarter,
          'CATEGORY',
          'CATEGORY_COUNT',
        );
        this.cachedCategoryData = mergedData;
        this.updateExpandedCategoryData();
        this.allCategoryLabels = mergedData.map((item: any) => item.CATEGORY);
        this.reapplyCategoryFilters();
      });
  }

  private fetchCoreIssueGraph(): void {
    this.http
      .get(
        `xxcaseiq-core-issue-graph-v-${this.teamConfig.apiSuffix}`,
        this.destroyManager,
      )
      .subscribe((data: any) => {
        const filteredByQuarter = this.selectedQuarter
          ? data.filter((item: any) => item.Quarter === this.selectedQuarter)
          : data;

        const mergedData = this.mergeByCategoryOrIssue(
          filteredByQuarter,
          'CORE_ISSUE',
          'CORE_ISSUE_COUNT',
        );
        this.cachedCoreIssueData = mergedData;
        this.updateExpandedCoreIssueData();
        this.allCoreIssueLabels = mergedData.map(
          (item: any) => item.CORE_ISSUE,
        );
        this.reapplyCoreIssueFilters();
      });
  }

  private fetchCaseDetails(): void {
    this.http
      .get(
        `xxcaseiq-${this.teamConfig.apiSuffix}-case-details-v`,
        this.destroyManager,
      )
      .subscribe((data: any) => {
        const filteredByQuarter = this.selectedQuarter
          ? data.filter((item: any) => item.Quarter === this.selectedQuarter)
          : data;

        this.updateTableData(filteredByQuarter);
        this.refreshingData = false;
      });
  }

  // ── Upload / Refresh ──────────────────────────────────────────

  handleUploadResult(event: { success: boolean; message: string }): void {
    if (event.success) {
      this.uploadSuccess.emit();
      this.refreshAllData();
    }
  }

  async refreshAllData(): Promise<void> {
    this.refreshingData = true;

    try {
      await Promise.all([
        new Promise<void>((resolve) => {
          this.http
            .get('xxcaseiq-validated-cases-accuracy-v', this.destroyManager)
            .subscribe({
              next: (data: any) => {
                this.updateAccuracyMetrics(data);
                resolve();
              },
              error: () => resolve(),
            });
        }),
        new Promise<void>((resolve) => {
          this.http
            .get(
              `xxcaseiq-category-graph-v-${this.teamConfig.apiSuffix}`,
              this.destroyManager,
            )
            .subscribe({
              next: (data: any) => {
                const mergedData = this.mergeByCategoryOrIssue(
                  data,
                  'CATEGORY',
                  'CATEGORY_COUNT',
                );
                this.cachedCategoryData = mergedData;
                this.updateExpandedCategoryData();
                this.allCategoryLabels = mergedData.map(
                  (item: any) => item.CATEGORY,
                );
                this.reapplyCategoryFilters();
                resolve();
              },
              error: () => resolve(),
            });
        }),
        new Promise<void>((resolve) => {
          this.http
            .get(
              `xxcaseiq-core-issue-graph-v-${this.teamConfig.apiSuffix}`,
              this.destroyManager,
            )
            .subscribe({
              next: (data: any) => {
                const mergedData = this.mergeByCategoryOrIssue(
                  data,
                  'CORE_ISSUE',
                  'CORE_ISSUE_COUNT',
                );
                this.cachedCoreIssueData = mergedData;
                this.updateExpandedCoreIssueData();
                this.allCoreIssueLabels = mergedData.map(
                  (item: any) => item.CORE_ISSUE,
                );
                this.reapplyCoreIssueFilters();
                resolve();
              },
              error: () => resolve(),
            });
        }),
        new Promise<void>((resolve) => {
          this.http
            .get(
              `xxcaseiq-${this.teamConfig.apiSuffix}-case-details-v`,
              this.destroyManager,
            )
            .subscribe({
              next: (data: any) => {
                this.updateTableData(data);
                resolve();
              },
              error: () => resolve(),
            });
        }),
      ]);
    } finally {
      this.refreshingData = false;
    }
  }

  // ── Merge helper ──────────────────────────────────────────────

  private mergeByCategoryOrIssue(
    data: any[],
    groupKey: string,
    countKey: string,
  ): any[] {
    if (!Array.isArray(data) || data.length === 0) return [];

    const grouped = new Map<string, any>();

    data.forEach((item) => {
      const key = item[groupKey] ?? '';

      if (!grouped.has(key)) {
        grouped.set(key, {
          [groupKey]: key,
          [countKey]: item[countKey],
          data: [{ MATCH_STATUS: item.MATCH_STATUS, COUNT: item[countKey] }],
        });
      } else {
        const existing = grouped.get(key)!;
        existing[countKey] += item[countKey];
        existing.data.push({
          MATCH_STATUS: item.MATCH_STATUS,
          COUNT: item[countKey],
        });
      }
    });

    return Array.from(grouped.values());
  }

  // ── Filter toggles ───────────────────────────────────────────

  toggleCategoryFilters(): void {
    this.showCategoryFilters = !this.showCategoryFilters;
    if (!this.showCategoryFilters) this.showCategorySelect = false;
  }

  toggleCoreIssueFilters(): void {
    this.showCoreIssueFilters = !this.showCoreIssueFilters;
    if (!this.showCoreIssueFilters) this.showCoreIssueSelect = false;
  }

  toggleCategorySelect(): void {
    this.showCategorySelect = !this.showCategorySelect;
  }

  toggleCoreIssueSelect(): void {
    this.showCoreIssueSelect = !this.showCoreIssueSelect;
  }

  // ── Threshold adjustment ──────────────────────────────────────

  adjustCategoryThreshold(direction: number): void {
    this.categoryMinThreshold = Math.max(
      0,
      this.categoryMinThreshold + direction * 5,
    );
    this.reapplyCategoryFilters();
  }

  adjustCoreIssueThreshold(direction: number): void {
    this.coreIssueMinThreshold = Math.max(
      0,
      this.coreIssueMinThreshold + direction * 5,
    );
    this.reapplyCoreIssueFilters();
  }

  // ── Reapply filters ───────────────────────────────────────────

  reapplyCategoryFilters(): void {
    let filteredData = this.cachedCategoryData;

    if (this.selectedCategoryLabels.size > 0) {
      filteredData = filteredData.filter((item) =>
        this.selectedCategoryLabels.has(item.CATEGORY),
      );
    } else {
      filteredData = filteredData.filter(
        (item) => item.CATEGORY_COUNT > this.categoryMinThreshold,
      );
      if (filteredData.length === 0 && this.cachedCategoryData.length > 0) {
        filteredData = this.cachedCategoryData;
      }
    }

    this.categoryChartData = this.transformMatchStatusData(
      filteredData,
      'CATEGORY',
      'CATEGORY_COUNT',
    );
    this.visibleCategoryTotal = this.computeStackedTotal(
      this.categoryChartData,
    );
    this.syncTableFilters();
  }

  reapplyCoreIssueFilters(): void {
    let filteredData = this.cachedCoreIssueData;

    if (this.selectedCoreIssueLabels.size > 0) {
      filteredData = filteredData.filter((item) =>
        this.selectedCoreIssueLabels.has(item.CORE_ISSUE),
      );
    } else {
      filteredData = filteredData.filter(
        (item) => item.CORE_ISSUE_COUNT > this.coreIssueMinThreshold,
      );
      if (filteredData.length === 0 && this.cachedCoreIssueData.length > 0) {
        filteredData = this.cachedCoreIssueData;
      }
    }

    this.coreIssueChartData = this.transformMatchStatusData(
      filteredData,
      'CORE_ISSUE',
      'CORE_ISSUE_COUNT',
    );
    this.visibleCoreIssueTotal = this.computeStackedTotal(
      this.coreIssueChartData,
    );
    this.syncTableFilters();
  }

  // ── Selection handlers ────────────────────────────────────────

  toggleCategorySelection(label: string): void {
    if (this.selectedCategoryLabels.has(label)) {
      this.selectedCategoryLabels.delete(label);
    } else {
      this.selectedCategoryLabels.add(label);
    }
    this.reapplyCategoryFilters();
  }

  toggleCoreIssueSelection(label: string): void {
    if (this.selectedCoreIssueLabels.has(label)) {
      this.selectedCoreIssueLabels.delete(label);
    } else {
      this.selectedCoreIssueLabels.add(label);
    }
    this.reapplyCoreIssueFilters();
  }

  clearCategorySelection(event: Event): void {
    event.stopPropagation();
    this.selectedCategoryLabels.clear();
    this.reapplyCategoryFilters();
  }

  clearCoreIssueSelection(event: Event): void {
    event.stopPropagation();
    this.selectedCoreIssueLabels.clear();
    this.reapplyCoreIssueFilters();
  }

  onCategoryBarClick(categoryLabel: string): void {
    if (this.selectedCategoryLabels.has(categoryLabel)) {
      this.selectedCategoryLabels.clear();
    } else {
      this.selectedCategoryLabels.clear();
      if (categoryLabel && categoryLabel.trim()) {
        this.selectedCategoryLabels.add(categoryLabel);
      }
    }
    this.reapplyCategoryFilters();
  }

  onCoreIssueBarClick(coreIssueLabel: string): void {
    if (this.selectedCoreIssueLabels.has(coreIssueLabel)) {
      this.selectedCoreIssueLabels.clear();
    } else {
      this.selectedCoreIssueLabels.clear();
      if (coreIssueLabel && coreIssueLabel.trim()) {
        this.selectedCoreIssueLabels.add(coreIssueLabel);
      }
    }
    this.reapplyCoreIssueFilters();
  }

  getCategoryFilterText(): string {
    if (this.selectedCategoryLabels.size === 1) {
      const label = Array.from(this.selectedCategoryLabels)[0];
      return label.length > 20 ? label.substring(0, 20) + '...' : label;
    }
    return 'Filter';
  }

  getCoreIssueFilterText(): string {
    if (this.selectedCoreIssueLabels.size === 1) {
      const label = Array.from(this.selectedCoreIssueLabels)[0];
      return label.length > 20 ? label.substring(0, 20) + '...' : label;
    }
    return 'Filter';
  }

  // ── Table filter sync ─────────────────────────────────────────

  syncTableFilters(): void {
    if (!this.teamTable) return;

    const categoryFilters = Array.from(this.selectedCategoryLabels);
    const coreIssueFilters = Array.from(this.selectedCoreIssueLabels);

    if (categoryFilters.length === 0 && coreIssueFilters.length === 0) {
      this.teamTable.clearAllFilters();

      const categoryEffective = this.cachedCategoryData.filter(
        (item: any) => item.CATEGORY_COUNT > this.categoryMinThreshold,
      );
      this.categoryChartData = this.transformMatchStatusData(
        categoryEffective.length > 0
          ? categoryEffective
          : this.cachedCategoryData,
        'CATEGORY',
        'CATEGORY_COUNT',
      );
      this.visibleCategoryTotal = this.computeStackedTotal(
        this.categoryChartData,
      );

      const coreIssueEffective = this.cachedCoreIssueData.filter(
        (item: any) => item.CORE_ISSUE_COUNT > this.coreIssueMinThreshold,
      );
      this.coreIssueChartData = this.transformMatchStatusData(
        coreIssueEffective.length > 0
          ? coreIssueEffective
          : this.cachedCoreIssueData,
        'CORE_ISSUE',
        'CORE_ISSUE_COUNT',
      );
      this.visibleCoreIssueTotal = this.computeStackedTotal(
        this.coreIssueChartData,
      );
      return;
    }

    let filteredData = [...this.fullTableData];
    if (categoryFilters.length > 0) {
      const lower = categoryFilters.map((f) => f.toLowerCase());
      filteredData = filteredData.filter((row) =>
        lower.includes((row.CATEGORY || '').toLowerCase()),
      );
    }
    if (coreIssueFilters.length > 0) {
      const lower = coreIssueFilters.map((f) => f.toLowerCase());
      filteredData = filteredData.filter((row) =>
        lower.includes((row.CORE_ISSUE || '').toLowerCase()),
      );
    }

    // Cross-filter charts
    if (categoryFilters.length > 0) {
      const uniqueCoreIssues = Array.from(
        new Set(
          filteredData
            .map((row) => (row.CORE_ISSUE || '').toLowerCase())
            .filter((v) => v),
        ),
      );
      const completeCoreIssueChart = this.transformMatchStatusData(
        this.cachedCoreIssueData,
        'CORE_ISSUE',
        'CORE_ISSUE_COUNT',
      );
      this.coreIssueChartData = completeCoreIssueChart.filter((item) =>
        uniqueCoreIssues.includes(item.label.toLowerCase()),
      );
      this.visibleCoreIssueTotal = this.computeStackedTotal(
        this.coreIssueChartData,
      );
    } else if (coreIssueFilters.length === 0) {
      const effective = this.cachedCoreIssueData.filter(
        (item: any) => item.CORE_ISSUE_COUNT > this.coreIssueMinThreshold,
      );
      this.coreIssueChartData = this.transformMatchStatusData(
        effective.length > 0 ? effective : this.cachedCoreIssueData,
        'CORE_ISSUE',
        'CORE_ISSUE_COUNT',
      );
      this.visibleCoreIssueTotal = this.computeStackedTotal(
        this.coreIssueChartData,
      );
    }

    if (coreIssueFilters.length > 0) {
      const uniqueCategories = Array.from(
        new Set(
          filteredData
            .map((row) => (row.CATEGORY || '').toLowerCase())
            .filter((v) => v),
        ),
      );
      const completeCategoryChart = this.transformMatchStatusData(
        this.cachedCategoryData,
        'CATEGORY',
        'CATEGORY_COUNT',
      );
      this.categoryChartData = completeCategoryChart.filter((item) =>
        uniqueCategories.includes(item.label.toLowerCase()),
      );
      this.visibleCategoryTotal = this.computeStackedTotal(
        this.categoryChartData,
      );
    } else if (categoryFilters.length === 0) {
      const effective = this.cachedCategoryData.filter(
        (item: any) => item.CATEGORY_COUNT > this.categoryMinThreshold,
      );
      this.categoryChartData = this.transformMatchStatusData(
        effective.length > 0 ? effective : this.cachedCategoryData,
        'CATEGORY',
        'CATEGORY_COUNT',
      );
      this.visibleCategoryTotal = this.computeStackedTotal(
        this.categoryChartData,
      );
    }

    this.teamTable.dataSource.data = filteredData;
    this.teamTable.currentPage = 0;
  }

  // ── Close dropdowns on outside click ──────────────────────────

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (
      target.closest('.chart-filter-panel') ||
      target.closest('.filter-wrapper')
    ) {
      return;
    }
    if (this.showCategoryFilters || this.showCoreIssueFilters) {
      this.showCategoryFilters = false;
      this.showCoreIssueFilters = false;
      this.showCategorySelect = false;
      this.showCoreIssueSelect = false;
    }
  }

  // ── Expand modal ──────────────────────────────────────────────

  onExpandChart(chartType: 'CATEGORY' | 'CORE_ISSUE'): void {
    this.expandedChart = { type: chartType };
  }

  closeExpandModal(): void {
    this.expandedChart = null;
  }

  // ── Private helpers ───────────────────────────────────────────

  computeStackedTotal(chartData: StackedBarChartDataPoint[]): number {
    if (!Array.isArray(chartData)) return 0;
    return chartData.reduce((sum, bar) => {
      if (!bar?.segments) return sum;
      return (
        sum + bar.segments.reduce((s, seg) => s + (Number(seg.value) || 0), 0)
      );
    }, 0);
  }

  private updateExpandedCategoryData(): void {
    this.expandedCategoryData = this.transformMatchStatusData(
      this.cachedCategoryData,
      'CATEGORY',
      'CATEGORY_COUNT',
    );
    this.expandedCategoryTotal = this.computeStackedTotal(
      this.expandedCategoryData,
    );
  }

  private updateExpandedCoreIssueData(): void {
    this.expandedCoreIssueData = this.transformMatchStatusData(
      this.cachedCoreIssueData,
      'CORE_ISSUE',
      'CORE_ISSUE_COUNT',
    );
    this.expandedCoreIssueTotal = this.computeStackedTotal(
      this.expandedCoreIssueData,
    );
  }

  private updateTableData(apiData: any[]): void {
    if (Array.isArray(apiData) && apiData.length > 0) {
      this.fullTableData = [...apiData];
      this.tableData.data = apiData;
      this.totalRecords = apiData.length;
      this.tableColumns = Object.keys(apiData[0]).filter(
        (key) =>
          key !== 'DESCRIPTION' &&
          key !== 'SUMMARY' &&
          key !== 'Quarter' &&
          key !== 'Cancelled reason',
      );
    } else {
      this.fullTableData = [];
      this.totalRecords = 0;
      this.tableData.data = [];
      this.tableColumns = [];
    }
  }

  private updateAccuracyMetrics(apiData: any[]): void {
    if (Array.isArray(apiData)) {
      const teamData = apiData.find(
        (item) =>
          item.TEAM_NAME?.toUpperCase() === this.teamConfig.teamFilterName,
      );

      if (teamData) {
        this.categoryAccuracy = teamData['Category Accuracy'] ?? '-';
        this.coreIssueAccuracy = teamData['Core Issue Accuracy'] ?? '-';
        this.totalCases = teamData['Total Cases'] ?? '-';
        this.totalAccuracy = teamData['Total Accuracy'] ?? '-';
      }
    }
  }

  private transformMatchStatusData(
    apiData: any[],
    groupColumn: string,
    countColumn: string,
  ): StackedBarChartDataPoint[] {
    if (!Array.isArray(apiData)) return [];

    return apiData.map((item) => {
      const segments = item.data
        ? item.data.map((statusItem: any) => ({
            name: statusItem.MATCH_STATUS ?? 'Uncategorized',
            value: statusItem.COUNT,
            color: this.getMatchStatusColor(
              statusItem.MATCH_STATUS ?? 'Uncategorized',
            ),
          }))
        : [
            {
              name: item.MATCH_STATUS || 'Uncategorized',
              value: item[countColumn] || 0,
              color: this.getMatchStatusColor(
                item.MATCH_STATUS || 'Uncategorized',
              ),
            },
          ];

      return { label: item[groupColumn] ?? '', segments };
    });
  }

  private getMatchStatusColor(matchStatus: string): string {
    switch ((matchStatus ?? '').toUpperCase()) {
      case 'MATCHED':
        return '#00bceb';
      case 'NOT MATCHED':
        return '#b0b8c1';
      case 'ANALYZED':
        return '#f0a500';
      default:
        return '#d1d5db';
    }
  }
}
