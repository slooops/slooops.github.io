import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  HostBinding,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient as NgHttpClient } from '@angular/common/http';
import { NgIconComponent } from '@ng-icons/core';
import { ThemeService } from '../../../providers/theme.service';
import { ApiHttpService } from 'src/app/providers/http.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';

interface WebexMessage {
  incident_id: string;
  username: string;
  text_plain: string;
  created_at: string;
}

/**
 * Per-incident CaseIQ conversation summary. Explains why the bot engaged the
 * user and how the conversation ended. One record per incident_number.
 */
interface WebexConvSummary {
  incident_number?: string;
  team_name?: string;
  category?: string;
  core_issue?: string;
  conv_bot_impacted_user?: string;
  conv_bot_room_id?: string;
  conv_bot_disengaged_at?: string;
  conv_bot_disengage_reason?: string;
  conv_bot_missing_required?: string;
  conv_bot_missing_atleast_one?: string;
}

interface PipelineStep {
  name: string;
  status: string;
  data: Record<string, any>;
  subAgentCalls?: {
    name: string;
    team: string;
    status: string;
    details?: any;
  }[];
  expanded: boolean;
}

interface NotificationEvent {
  type: string;
  description: string;
  timestamp: string;
  details?: any;
  expanded: boolean;
}

interface IncidentSummary {
  incidentNumber: string;
  team: string;
  category: string;
  coreIssue: string;
  outcome: string;
  resolutionPath: string;
  processedAt: string;
  processedEpoch: number;
  pipelineStages: number;
  runs: number;
  history: Array<{ sharedStateId: string }>;
}

export interface CaseReopenMetric {
  ID: number;
  TEAM_NAME: string;
  INCIDENT_NUMBER: string;
  ORIGINAL_CASE_SUMMARY: string;
  NEW_ASK_SUMMARY: string;
  PREVIOUS_CATEGORY: string | null;
  CURRENT_CATEGORY: string | null;
  PREVIOUS_CORE_ISSUE: string | null;
  CURRENT_CORE_ISSUE: string | null;
  PREVIOUS_CONTEXT_EXTRACTED: string | null;
  CURRENT_CONTEXT_EXTRACTED: string | null;
  REOPEN_DECISION: string | null;
  REOPEN_REJECT_REASON: string | null;
  REOPEN_REJECT_TEAM: string | null;
  REOPEN_REJECT_CATEGORY: string | null;
  REOPEN_REJECT_CORE_ISSUE: string | null;
  CREATED_AT: string;
  UPDATED_AT: string;
  // Fields needed to insert a new active staging run on a YES decision
  IMPACTED_SERVICE_OFFERING?: string | null;
  IMPACTED_USER?: string | null;
  INCIDENT_SUMMARY?: string | null;
  INCIDENT_DESCRIPTION?: string | null;
  PROPOSED_TEAM_NAME?: string | null;
  OPENED_BY?: string | null;
  ASSIGNMENT_GROUP?: string | null;
  CCO_USER_EMAIL?: string | null;
  INCIDENT_SYS_ID?: string | null;
}

@Component({
  selector: 'app-caseiq-incident-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent],
  templateUrl: './caseiq-incident-detail.component.html',
  styleUrls: ['./caseiq-incident-detail.component.css'],
  providers: [DestroyManager],
})
export class CaseiqIncidentDetailComponent implements OnChanges {
  @HostBinding('class.dark-theme') get darkThemeClass() {
    return this.themeService.isDarkMode;
  }

  @Input() incident: IncidentSummary | null = null;
  @Input() incidentDetailData: Record<string, any> | null = null;
  @Input() backLabel: string = 'Back to Incidents';
  @Input() reopenMetric: CaseReopenMetric | null = null;
  /**
   * Full set of Webex conversation rows loaded once by the parent. The chat
   * tab renders the subset whose incident_id matches the current incident.
   */
  @Input() webexConversations: WebexMessage[] = [];
  /**
   * Per-incident conversation summaries loaded once by the parent. The chat
   * tab shows the record whose incident_number matches the current incident.
   */
  @Input() webexSummaries: WebexConvSummary[] = [];
  @Output() back = new EventEmitter<void>();
  @Output() reopenDecision = new EventEmitter<'yes' | 'no'>();

  isLoading = false;
  error: string | null = null;
  incidentNumber = '';
  incidentViewModel: any = null;

  activeTab: 'pipeline' | 'reopen' | 'webex' = 'pipeline';
  pipelineSteps: PipelineStep[] = [];
  notifications: NotificationEvent[] = [];

  // ── Webex conversation tab state ─────────────────────────────
  webexMessages: WebexMessage[] = [];
  webexSummary: WebexConvSummary | null = null;
  webexLoading = false;
  webexError: string | null = null;
  private webexLoadedFor: string | null = null;
  private readonly webexChatUrl = 'xxcaseiq-conv-bot-chat';

  showRejectForm = false;
  rejectCategory = '';
  rejectCoreIssue = '';
  rejectReason = '';
  rejectTeam = '';
  reopenUpdateLoading = false;
  reopenUpdateSuccess = '';
  reopenUpdateError = '';
  readonly rejectTeamOptions = [
    'OM',
    'I2C',
    'AIT',
    'P2P',
    'SM',
    'FPP',
    'CAPITAL',
  ];
  private readonly reopenUpdateUrl = 'xxcaseiq-reopen-update';

  // ── SSID tab state ───────────────────────────────────────────
  sharedStateIds: string[] = [];
  sharedStateIdsLoading = false;
  sharedStateIdsError: string | null = null;
  activeSharedStateId: string | null = null;
  private tabDetailCache: Record<string, any> = {};
  tabDetailLoading: Record<string, boolean> = {};
  tabDetailError: Record<string, string> = {};

  private readonly sharedStateIdsUrl =
    '/api/caseiq-supervisor/api/v1/shared-state-ids/search/incident_number';
  private readonly incidentDetailBaseUrl =
    '/api/caseiq-supervisor/api/v1/incidents';

  constructor(
    public themeService: ThemeService,
    private readonly httpClient: ApiHttpService,
    private readonly http: NgHttpClient,
    private readonly destroyManager: DestroyManager,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['incident'] || changes['incidentDetailData']) {
      // Reset Webex conversation cache when a different incident loads
      this.webexMessages = [];
      this.webexSummary = null;
      this.webexError = null;
      this.webexLoadedFor = null;
      this.webexLoading = false;
    }
    if (changes['incidentDetailData'] && this.incidentDetailData) {
      // Data pre-fetched by parent — skip SSID fetch
      this.sharedStateIds = [];
      this.activeSharedStateId = null;
      this.hydrateDetail();
    } else if (
      changes['incident'] &&
      this.incident?.incidentNumber &&
      !this.incidentDetailData
    ) {
      this.loadSharedStateIds(this.incident.incidentNumber);
    }

    // Conversation rows can arrive after the incident is already displayed;
    // reload the chat from the latest input when they change.
    if (
      (changes['webexConversations'] || changes['webexSummaries']) &&
      !changes['incident']
    ) {
      this.loadWebexConversation(true);
    }
  }

  // ── SSID fetch & tab methods ────────────────────────────────

  private loadSharedStateIds(incidentNumber: string): void {
    this.sharedStateIdsLoading = true;
    this.sharedStateIdsError = null;
    this.sharedStateIds = [];
    this.activeSharedStateId = null;
    this.tabDetailCache = {};
    this.tabDetailLoading = {};
    this.tabDetailError = {};
    this.incidentNumber = incidentNumber;
    this.incidentViewModel = null;
    this.pipelineSteps = [];

    const url = `${this.sharedStateIdsUrl}/${encodeURIComponent(incidentNumber)}`;
    this.http.get<unknown>(url).subscribe({
      next: (response) => {
        this.sharedStateIds = this.extractSharedStateIds(response);
        this.sharedStateIdsLoading = false;
        if (this.sharedStateIds.length > 0) {
          this.selectSharedStateTab(this.sharedStateIds[0]);
        } else {
          this.hydrateDetail();
        }
      },
      error: () => {
        this.sharedStateIdsLoading = false;
        this.sharedStateIdsError = 'Failed to load executions.';
        this.hydrateDetail();
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
              ''
            );
          }
          return '';
        })
        .filter(Boolean);
    }
    if (typeof response === 'object' && response !== null) {
      const obj = response as Record<string, unknown>;
      for (const key of [
        'shared_state_ids',
        'sharedStateIds',
        'ids',
        'items',
        'results',
        'data',
      ]) {
        if (Array.isArray(obj[key])) {
          return this.extractSharedStateIds(obj[key]);
        }
      }
    }
    return [];
  }

  selectSharedStateTab(ssid: string): void {
    if (this.activeSharedStateId === ssid) return;
    this.activeSharedStateId = ssid;
    if (this.tabDetailCache[ssid]) {
      this.isLoading = false;
      this.error = null;
      this.hydrateFromApiDetail(this.tabDetailCache[ssid]);
    } else {
      this.loadTabDetail(ssid);
    }
  }

  private loadTabDetail(ssid: string): void {
    const incNum = this.incident?.incidentNumber || this.incidentNumber;
    if (!incNum || !ssid) return;

    this.tabDetailLoading[ssid] = true;
    this.tabDetailError[ssid] = '';
    this.isLoading = true;
    this.error = null;
    this.incidentViewModel = null;
    this.pipelineSteps = [];

    const url = `${this.incidentDetailBaseUrl}/${encodeURIComponent(incNum)}?ssid=${encodeURIComponent(ssid)}`;
    this.http.get<unknown>(url).subscribe({
      next: (response) => {
        const data =
          typeof response === 'object' && response !== null
            ? (response as any)
            : {};
        this.tabDetailCache[ssid] = data;
        this.tabDetailLoading[ssid] = false;
        if (this.activeSharedStateId === ssid) {
          this.isLoading = false;
          this.hydrateFromApiDetail(data);
        }
      },
      error: () => {
        this.tabDetailLoading[ssid] = false;
        this.tabDetailError[ssid] = 'Failed to load execution detail.';
        if (this.activeSharedStateId === ssid) {
          this.isLoading = false;
          this.error = 'Failed to load execution detail.';
        }
      },
    });
  }

  getTabTruncatedId(ssid: string): string {
    if (!ssid) return '--';
    if (ssid.length <= 22) return ssid;
    return `${ssid.slice(0, 12)}…${ssid.slice(-6)}`;
  }

  isTabLoading(ssid: string): boolean {
    return !!this.tabDetailLoading[ssid];
  }

  getTabError(ssid: string): string {
    return this.tabDetailError[ssid] || '';
  }

  goBack(): void {
    this.back.emit();
  }

  reloadDetail(): void {
    this.hydrateDetail();
  }

  // ── Tab switching ────────────────────────────────────────────
  selectTab(tab: 'pipeline' | 'reopen' | 'webex'): void {
    this.activeTab = tab;
    if (tab === 'webex') {
      this.loadWebexConversation();
    }
  }

  // ── Webex conversation ───────────────────────────────────────
  loadWebexConversation(forceReload = false): void {
    const incidentNumber = this.incidentNumber || this.incident?.incidentNumber;
    if (!incidentNumber) {
      this.webexMessages = [];
      this.webexError = 'No incident number available.';
      return;
    }

    // Skip refetch if already loaded for this incident
    if (
      !forceReload &&
      this.webexLoadedFor === incidentNumber &&
      !this.webexError
    ) {
      return;
    }

    // Filter the parent-provided conversation rows down to this incident and
    // render oldest→newest (latest message at the bottom, like a chat).
    this.webexLoading = false;
    this.webexError = null;
    const target = incidentNumber.trim().toUpperCase();
    const rows = Array.isArray(this.webexConversations)
      ? this.webexConversations
      : [];
    this.webexMessages = rows
      .filter(
        (m) =>
          String(m?.incident_id ?? '')
            .trim()
            .toUpperCase() === target,
      )
      .slice()
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );

    // Resolve the matching conversation summary (why the bot engaged).
    const summaries = Array.isArray(this.webexSummaries)
      ? this.webexSummaries
      : [];
    this.webexSummary =
      summaries.find(
        (s) =>
          String(
            (s as any)?.incident_number ?? (s as any)?.INCIDENT_NUMBER ?? '',
          )
            .trim()
            .toUpperCase() === target,
      ) ?? null;

    this.webexLoadedFor = incidentNumber;
    this.reconcileActiveTab();
  }

  getWebexInitials(username: string): string {
    if (!username) return '?';
    const parts = username
      .trim()
      .split(/[\s._-]+/)
      .filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  /** Bot/agent messages (e.g. caseiq1@webex.bot) render on the left. */
  isWebexBot(username: string): boolean {
    return !!username && /bot/i.test(username);
  }

  /** Friendly display name derived from the username/email. */
  getWebexDisplayName(username: string): string {
    if (!username) return 'Unknown';
    if (this.isWebexBot(username)) return 'CaseIQ Bot';
    const local = username.split('@')[0];
    const pretty = local
      .split(/[._-]+/)
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
    return pretty || username;
  }

  /** Timezone for all Webex conversation timestamps (Eastern, DST-aware). */
  private readonly webexTimeZone = 'America/New_York';

  /** Time portion only, e.g. "05:20 AM", rendered in Eastern time. */
  formatWebexTime(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: this.webexTimeZone,
    });
  }

  /** Eastern-time calendar key (YYYY-MM-DD) used for day grouping. */
  private webexDateKey(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    // en-CA yields ISO-like YYYY-MM-DD which is safe to compare as strings.
    return d.toLocaleDateString('en-CA', { timeZone: this.webexTimeZone });
  }

  /** Human-friendly date label used for day separators (Eastern time). */
  formatWebexDate(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const key = this.webexDateKey(iso);
    const todayKey = this.webexDateKey(new Date().toISOString());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = this.webexDateKey(yesterday.toISOString());
    if (key === todayKey) return 'Today';
    if (key === yesterdayKey) return 'Yesterday';
    return d.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: this.webexTimeZone,
    });
  }

  /** True when this message starts a new calendar day vs. the previous one. */
  webexShowDateSeparator(index: number): boolean {
    if (index <= 0) return true;
    const prevKey = this.webexDateKey(this.webexMessages[index - 1].created_at);
    const currKey = this.webexDateKey(this.webexMessages[index].created_at);
    if (!prevKey || !currKey) return false;
    return prevKey !== currKey;
  }

  // ── Webex conversation summary ───────────────────────────────

  /** Whether a summary record is available for the current incident. */
  get hasWebexSummary(): boolean {
    return !!this.webexSummary;
  }

  /** Normalized summary incident number (supports upper/lower-case API keys). */
  get webexSummaryIncidentNumber(): string {
    return this.getSummaryField('incident_number', 'INCIDENT_NUMBER');
  }

  /** Normalized summary team name (supports upper/lower-case API keys). */
  get webexSummaryTeamName(): string {
    return this.getSummaryField('team_name', 'TEAM_NAME');
  }

  /** Normalized impacted user display value from summary payload. */
  get webexSummaryUserDisplayName(): string {
    const user = this.getSummaryField(
      'conv_bot_impacted_user',
      'CONV_BOT_IMPACTED_USER',
    );
    return user ? this.getWebexDisplayName(user) : '';
  }

  /** Raw outcome from summary payload (upper/lower key safe). */
  get webexSummaryOutcomeRaw(): string {
    return this.getSummaryField(
      'conv_bot_disengage_reason',
      'CONV_BOT_DISENGAGE_REASON',
    );
  }

  /** Humanized classification text shown in the summary banner. */
  get webexSummaryClassification(): string {
    return [
      this.getSummaryField('category', 'CATEGORY'),
      this.getSummaryField('core_issue', 'CORE_ISSUE'),
    ]
      .map((v) => this.humanizeToken(v))
      .filter(Boolean)
      .join(' · ');
  }

  /** Optional phrase for required fields requested by the bot. */
  get webexSummaryRequestPhrase(): string {
    const needed = this.webexMissingRequiredList;
    return needed.length
      ? ` and requested the ${this.joinReadable(needed)}`
      : '';
  }

  /**
   * One-sentence reason the bot engaged the user, composed from the case
   * classification and the field(s) it needed to proceed.
   */
  get webexSummaryReason(): string {
    const s = this.webexSummary;
    if (!s) return '';

    const impactedUser = this.getSummaryField(
      'conv_bot_impacted_user',
      'CONV_BOT_IMPACTED_USER',
    );
    const user = impactedUser
      ? this.getWebexDisplayName(impactedUser)
      : 'the requester';

    const classification = this.webexSummaryClassification;

    const requestPhrase = this.webexSummaryRequestPhrase;

    let reason = `CaseIQ engaged ${user}`;
    if (classification) {
      reason += ` to resolve a ${classification} issue`;
    } else {
      reason += ' to resolve this case';
    }
    reason += requestPhrase;
    return `${reason}.`;
  }

  /** Humanized list of required fields the bot was missing (e.g. "Request ID"). */
  get webexMissingRequiredList(): string[] {
    return this.parseTokenList(
      this.getSummaryField(
        'conv_bot_missing_required',
        'CONV_BOT_MISSING_REQUIRED',
      ),
    );
  }

  /** Humanized list of "at least one of" fields the bot was missing. */
  get webexMissingAtLeastOneList(): string[] {
    return this.parseTokenList(
      this.getSummaryField(
        'conv_bot_missing_atleast_one',
        'CONV_BOT_MISSING_ATLEAST_ONE',
      ),
    );
  }

  /** Outcome label derived from the disengage reason. */
  get webexOutcomeLabel(): string {
    const reason = this.webexSummaryOutcomeRaw.trim();
    if (!reason) return 'Unknown';
    if (/success|complete|resolved/i.test(reason)) return 'Resolved';
    if (/timeout|timed.?out|expired/i.test(reason)) return 'Timed Out';
    if (/fail|error/i.test(reason)) return 'Failed';
    return this.humanizeToken(reason);
  }

  /** Status class for the outcome pill, mirroring getStatusClass buckets. */
  get webexOutcomeClass(): string {
    const reason = this.webexSummaryOutcomeRaw.trim();
    if (/success|complete|resolved/i.test(reason)) return 'status--success';
    if (/timeout|timed.?out|expired/i.test(reason)) return 'status--warning';
    if (/fail|error/i.test(reason)) return 'status--error';
    return 'status--default';
  }

  /** Formatted disengage time in Eastern, or '' when unavailable. */
  get webexDisengagedAt(): string {
    const raw = this.getSummaryField(
      'conv_bot_disengaged_at',
      'CONV_BOT_DISENGAGED_AT',
    );
    if (!raw) return '';
    const iso = this.normalizeOracleTimestamp(raw);
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: this.webexTimeZone,
    });
  }

  /** Parses a JSON-ish array string like `["REQUEST_ID"]` into humanized labels. */
  private parseTokenList(raw: string | null | undefined): string[] {
    if (!raw) return [];
    let items: unknown[] = [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        items = parsed;
      } else if (parsed) {
        items = [parsed];
      }
    } catch {
      // Fallback: strip brackets/quotes and split on commas.
      items = raw
        .replace(/[[\]"']/g, '')
        .split(',')
        .map((t) => t.trim());
    }
    return items.map((t) => this.humanizeToken(String(t))).filter((t) => !!t);
  }

  /** Turns tokens like "REQUEST_ID" / "Activation/Onboarding" into Title Case. */
  private humanizeToken(value: string | null | undefined): string {
    if (!value) return '';
    return value
      .trim()
      .replace(/[_-]+/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .replace(/\bId\b/g, 'ID');
  }

  /** Safely reads a summary field across possible key casings. */
  private getSummaryField(...keys: string[]): string {
    if (!this.webexSummary) return '';
    const s = this.webexSummary as Record<string, unknown>;
    for (const key of keys) {
      const val = s[key];
      if (val !== null && val !== undefined && String(val).trim() !== '') {
        return String(val);
      }
    }
    return '';
  }

  /** Joins a list into readable prose: "A", "A and B", "A, B and C". */
  private joinReadable(items: string[]): string {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
  }

  /**
   * Converts an Oracle timestamp string (e.g.
   * "05-AUG-26 10.20.12.569965000 PM AMERICA/LOS_ANGELES") into an ISO string
   * the Date constructor can parse. Falls back to the raw value on failure.
   */
  private normalizeOracleTimestamp(raw: string): string {
    const m = raw
      .trim()
      .match(
        /^(\d{2})-([A-Z]{3})-(\d{2})\s+(\d{2})\.(\d{2})\.(\d{2})\.\d+\s*(AM|PM)?/i,
      );
    if (!m) return raw;

    const [, dd, monStr, yy, hhStr, min, sec, ampm] = m;
    const months: Record<string, string> = {
      JAN: '01',
      FEB: '02',
      MAR: '03',
      APR: '04',
      MAY: '05',
      JUN: '06',
      JUL: '07',
      AUG: '08',
      SEP: '09',
      OCT: '10',
      NOV: '11',
      DEC: '12',
    };
    const mon = months[monStr.toUpperCase()];
    if (!mon) return raw;

    let hh = Number(hhStr);
    if (ampm) {
      const upper = ampm.toUpperCase();
      if (upper === 'PM' && hh < 12) hh += 12;
      if (upper === 'AM' && hh === 12) hh = 0;
    }
    const year = `20${yy}`;
    // Source zone is America/Los_Angeles (PDT in August = -07:00).
    const offset = '-07:00';
    return `${year}-${mon}-${dd}T${String(hh).padStart(2, '0')}:${min}:${sec}${offset}`;
  }

  get hasPipeline(): boolean {
    // Real pipeline data exists when SSIDs were found or a full detail
    // payload was passed in by the parent (not the mock fallback).
    return this.sharedStateIds.length > 0 || !!this.incidentDetailData;
  }

  get hasReopen(): boolean {
    return !!this.reopenMetric;
  }

  get hasWebex(): boolean {
    return this.webexMessages.length > 0;
  }

  get hasAnyTab(): boolean {
    return this.hasPipeline || this.hasReopen || this.hasWebex;
  }

  /** Ensure the active tab points at a tab that actually has data. */
  private reconcileActiveTab(): void {
    const order: Array<'pipeline' | 'reopen' | 'webex'> = [];
    if (this.hasPipeline) order.push('pipeline');
    if (this.hasReopen) order.push('reopen');
    if (this.hasWebex) order.push('webex');
    if (!order.includes(this.activeTab)) {
      this.activeTab = order[0] ?? 'pipeline';
    }
  }

  /** Called after hydration: eagerly load Webex and pick a valid tab. */
  private afterHydrate(): void {
    this.loadWebexConversation();
    this.reconcileActiveTab();
  }

  private hydrateDetail(): void {
    if (this.incidentDetailData) {
      this.hydrateFromApiDetail(this.incidentDetailData);
      return;
    }

    if (!this.incident) {
      this.incidentNumber = '';
      this.incidentViewModel = null;
      this.pipelineSteps = [];
      this.notifications = [];
      return;
    }

    this.incidentNumber = this.incident.incidentNumber;
    this.incidentViewModel = {
      status: this.incident.outcome,
      team_name: this.incident.team,
      category: this.incident.category,
      core_issue: this.incident.coreIssue,
      resolution_path: this.incident.resolutionPath,
      duration: '3.6m',
      shared_state_id: `ss-${this.incident.incidentNumber.toLowerCase()}-20260616`,
      pipeline: [
        {
          name: 'Intake',
          status: 'completed',
          details: {
            owner: 'ESP Gateway',
            summary: 'Incident received and validated',
            timestamp: this.incident.processedAt,
          },
        },
        {
          name: 'Classification',
          status: 'completed',
          details: {
            category: this.incident.category,
            core_issue: this.incident.coreIssue,
            confidence: '0.96',
          },
        },
        {
          name: 'Resolution Orchestration',
          status: this.incident.outcome === 'Failed' ? 'failed' : 'completed',
          details: {
            path: this.incident.resolutionPath,
            outcome: this.incident.outcome,
          },
          sub_agent_calls: [
            {
              name: 'I2C Agent',
              team: 'I2C',
              status:
                this.incident.outcome === 'Failed' ? 'failed' : 'completed',
            },
          ],
        },
        {
          name: 'Responder',
          status:
            this.incident.outcome === 'In Progress'
              ? 'in progress'
              : 'completed',
          details: {
            notification: 'CaseIQ orchestrator update sent',
            channel: 'Webex + Email',
          },
        },
      ],
      notifications: [
        {
          type: 'ESP Update',
          description: 'Incident routing status updated in orchestrator.',
          timestamp: this.incident.processedAt,
          details: {
            incident: this.incident.incidentNumber,
            team: this.incident.team,
            outcome: this.incident.outcome,
          },
        },
        {
          type: 'Agent Action',
          description: 'I2C agent completed the assigned workflow step.',
          timestamp: this.incident.processedAt,
          details: {
            path: this.incident.resolutionPath,
            pipeline_stages: this.incident.pipelineStages,
          },
        },
      ],
    };

    this.parsePipeline(this.incidentViewModel);
    this.parseNotifications(this.incidentViewModel);
    this.afterHydrate();
  }

  private hydrateFromApiDetail(data: Record<string, any>): void {
    const stages = this.isObject(data['stages']) ? data['stages'] : {};
    const supervisor = stages['supervisor'] || {};
    const analyzer = stages['case_analyser_agent'] || {};
    const resolutionAgent = stages['resolution_agent'] || {};
    const responderAgent = stages['responder_agent'] || {};

    this.incidentNumber =
      data['incident_number'] || this.incident?.incidentNumber || '';

    this.incidentViewModel = {
      status: data['outcome'] || this.incident?.outcome || 'Unknown',
      team_name:
        data['team_name'] ||
        supervisor['team_name'] ||
        this.incident?.team ||
        '--',
      category: analyzer['category'] || this.incident?.category || '--',
      core_issue: analyzer['core_issue'] || this.incident?.coreIssue || '--',
      resolution_path:
        data['resolution_path'] || this.incident?.resolutionPath || '--',
      duration: data['duration'] || '--',
      shared_state_id:
        data['shared_state_id'] || this.incident?.history?.[0]?.sharedStateId,
      pipeline: [
        {
          name: 'Intake',
          status: supervisor['status'] || 'completed',
          details: {
            incident: supervisor['incident_number'] || data['incident_number'],
            team: supervisor['team_name'] || data['team_name'],
            flow_type: supervisor['flow_type'] || '--',
            status: supervisor['status'] || '--',
            shared_state_id:
              supervisor['shared_state_id'] || data['shared_state_id'],
          },
        },
        {
          name: 'Analyzer',
          status: analyzer['status'] || 'completed',
          details: {
            category: analyzer['category'],
            core_issue: analyzer['core_issue'],
            llm_summary: analyzer['llm_summary'],
            context_extracted: Object.fromEntries(
              Object.entries(analyzer['context_extracted']).filter(
                ([_, value]) => value !== '',
              ),
            ),
          },
        },
        {
          name: 'Resolution',
          status: resolutionAgent['status'] || 'completed',
          details: {
            resolution_payload: resolutionAgent['resolution'],
          },
          sub_agent_calls:
            this.normalizeResolutionSubAgentCalls(resolutionAgent),
        },
        {
          name: 'Responder',
          status: responderAgent['status'] || 'completed',
          details: {
            status: responderAgent['status'],
            responder_state:
              responderAgent['Responder_state'] ||
              responderAgent['responder_state'],
            bot_handoff: responderAgent['bot_handoff_required'],
            final_response: responderAgent['final_response'],
            actions: responderAgent['responder'],
          },
        },
      ],
      notifications: Array.isArray(data['notifications'])
        ? data['notifications']
        : [],
    };

    const knownStages = new Set([
      'intake',
      'case_analyser_agent',
      'resolution_agent',
      'responder_agent',
      'i2c_agent',
      'i2c_agent:lifecycle',
      'supervisor',
    ]);
    Object.entries(stages)
      .filter(([key]) => !knownStages.has(key))
      .filter(([key]) => {
        const normalizedKey = key.toLowerCase();
        return !/(_agent|agent:lifecycle)$/.test(normalizedKey);
      })
      .forEach(([key, value]) => {
        this.incidentViewModel.pipeline.push({
          name: this.normalizeStageLabel(key),
          status:
            (this.isObject(value) &&
              (value as Record<string, any>)['status']) ||
            'completed',
          details: value,
        });
      });

    this.parsePipeline(this.incidentViewModel);
    this.parseNotifications(this.incidentViewModel);
    this.afterHydrate();
  }

  private normalizeResolutionSubAgentCalls(
    resolutionAgent: Record<string, any>,
  ): Array<{ name: string; team: string; status: string; details?: any }> {
    const fromList = Array.isArray(resolutionAgent['sub_agent_calls'])
      ? resolutionAgent['sub_agent_calls']
      : [];

    if (fromList.length > 0) {
      return fromList.map((call: any) => {
        const responseStatus =
          call?.response?.status ||
          call?.response?.result?.task?.status?.state ||
          resolutionAgent['task_result']?.status ||
          resolutionAgent['status'] ||
          'completed';
        return {
          name:
            call?.agent_name ||
            call?.team ||
            call?.request?.params?.message?.metadata?.teamName ||
            'Sub Agent',
          team:
            call?.team ||
            call?.request?.params?.message?.metadata?.teamName ||
            resolutionAgent['team_name'] ||
            '',
          status: responseStatus,
          details: {
            request_payload: call?.request,
            response_payload: call?.response,
          },
        };
      });
    }

    const single = resolutionAgent['task_result']?.['sub_agent_call'];
    if (single && typeof single === 'object') {
      const responseStatus =
        single?.response?.status ||
        single?.response?.result?.task?.status?.state ||
        resolutionAgent['task_result']?.status ||
        resolutionAgent['status'] ||
        'completed';
      return [
        {
          name:
            single?.agent_name ||
            single?.team ||
            single?.request?.params?.message?.metadata?.teamName ||
            'Sub Agent',
          team:
            single?.team ||
            single?.request?.params?.message?.metadata?.teamName ||
            resolutionAgent['team_name'] ||
            '',
          status: responseStatus,
          details: {
            request_payload: single?.request,
            response_payload: single?.response,
          },
        },
      ];
    }

    return [];
  }

  private normalizeStageLabel(key: string): string {
    return key
      .replace(/_/g, ' ')
      .replace(/:/g, ' - ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private parsePipeline(data: any): void {
    this.pipelineSteps = [];
    const pipeline =
      data?.pipeline || data?.agentic_pipeline || data?.steps || [];

    if (Array.isArray(pipeline)) {
      this.pipelineSteps = pipeline.map((step: any) => ({
        name: step.name || step.step_name || 'Unknown',
        status: step.status || 'unknown',
        data: step.data || step.details || step,
        subAgentCalls: step.sub_agent_calls || step.subAgentCalls || null,
        expanded: false,
      }));
    } else if (typeof pipeline === 'object') {
      // Handle object-based pipeline
      Object.entries(pipeline).forEach(([key, value]: [string, any]) => {
        this.pipelineSteps.push({
          name: key,
          status: value?.status || 'unknown',
          data: value || {},
          subAgentCalls: value?.sub_agent_calls || null,
          expanded: false,
        });
      });
    }

    // If no pipeline found, try to build from top-level fields
    if (this.pipelineSteps.length === 0 && data) {
      if (data.intake) {
        this.pipelineSteps.push({
          name: 'Intake',
          status: data.intake.status || 'completed',
          data: data.intake,
          expanded: false,
        });
      }
      if (data.analyzer) {
        this.pipelineSteps.push({
          name: 'Analyzer',
          status: data.analyzer.status || 'completed',
          data: data.analyzer,
          expanded: false,
        });
      }
      if (data.resolution) {
        this.pipelineSteps.push({
          name: 'Resolution',
          status: data.resolution.status || 'completed',
          data: data.resolution,
          subAgentCalls: data.resolution.sub_agent_calls,
          expanded: false,
        });
      }
      if (data.responder) {
        this.pipelineSteps.push({
          name: 'Responder',
          status: data.responder.status || 'completed',
          data: data.responder,
          expanded: false,
        });
      }
    }
  }

  private parseNotifications(data: any): void {
    this.notifications = [];
    const events =
      data?.notifications ||
      data?.events ||
      data?.notifications_and_actions ||
      [];

    if (Array.isArray(events)) {
      this.notifications = events.map((evt: any) => ({
        type: evt.type || evt.event_type || 'Event',
        description: evt.description || evt.message || evt.summary || '',
        timestamp: evt.timestamp || evt.created_at || evt.time || '',
        details: evt.details || evt.payload || null,
        expanded: false,
      }));
    }
  }

  toggleStep(index: number): void {
    this.pipelineSteps[index].expanded = !this.pipelineSteps[index].expanded;
  }

  toggleNotification(index: number): void {
    this.notifications[index].expanded = !this.notifications[index].expanded;
  }

  expandAll(): void {
    this.pipelineSteps.forEach((s) => (s.expanded = true));
  }

  collapseAll(): void {
    this.pipelineSteps.forEach((s) => (s.expanded = false));
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'resolved':
        return 'status--success';
      case 'in_progress':
      case 'in progress':
      case 'delegated':
        return 'status--warning';
      case 'failed':
      case 'error':
        return 'status--error';
      default:
        return 'status--default';
    }
  }

  getEventTypeClass(type: string): string {
    const t = type?.toLowerCase() || '';
    if (t.includes('esp') || t.includes('update')) return 'event-type--esp';
    if (t.includes('agent') || t.includes('action')) return 'event-type--agent';
    if (t.includes('error') || t.includes('fail')) return 'event-type--error';
    return 'event-type--default';
  }

  formatTimestamp(ts: string): string {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return (
        d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) +
        ', ' +
        d.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    } catch {
      return ts;
    }
  }

  getStepFields(step: PipelineStep): { key: string; value: any }[] {
    const exclude = [
      'status',
      'name',
      'step_name',
      'sub_agent_calls',
      'subAgentCalls',
    ];
    const data = step.data || {};
    return Object.entries(data)
      .filter(
        ([k]) => !exclude.includes(k) && data[k] != null && data[k] !== '',
      )
      .map(([key, value]) => ({ key: this.formatKey(key), value }));
  }

  formatKey(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  isObject(val: any): boolean {
    return val && typeof val === 'object' && !Array.isArray(val);
  }

  isArray(val: any): boolean {
    return Array.isArray(val);
  }

  // ── Reopen tab helpers ────────────────────────────────────────

  get categoryChanged(): boolean {
    return (
      !!this.reopenMetric &&
      (this.reopenMetric.PREVIOUS_CATEGORY ?? '') !==
        (this.reopenMetric.CURRENT_CATEGORY ?? '')
    );
  }

  get coreIssueChanged(): boolean {
    return (
      !!this.reopenMetric &&
      (this.reopenMetric.PREVIOUS_CORE_ISSUE ?? '') !==
        (this.reopenMetric.CURRENT_CORE_ISSUE ?? '')
    );
  }

  getContextDiffs(): {
    key: string;
    prev: string;
    curr: string;
    prevCount: number;
    currCount: number;
  }[] {
    if (!this.reopenMetric) return [];

    const parseCtx = (raw: string | null): Record<string, unknown> => {
      if (!raw) return {};
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed as Record<string, unknown>;
        }
      } catch {
        // ignore
      }
      return {};
    };

    /** Normalize any context value (array | object | string | scalar) to a string list. */
    const toList = (value: unknown): string[] => {
      if (value === null || value === undefined) return [];

      // Arrays: flatten each entry to a readable string.
      if (Array.isArray(value)) {
        return value
          .map((v) =>
            v !== null && typeof v === 'object' ? JSON.stringify(v) : String(v),
          )
          .map((v) => v.trim())
          .filter(Boolean);
      }

      // Objects: render as "key: value" pairs.
      if (typeof value === 'object') {
        return Object.entries(value as Record<string, unknown>)
          .map(([k, v]) => {
            const val =
              v !== null && typeof v === 'object'
                ? JSON.stringify(v)
                : String(v);
            return `${k}: ${val}`;
          })
          .filter(Boolean);
      }

      // Scalars (string | number | boolean): a single item.
      const str = String(value).trim();
      return str === '' ? [] : [str];
    };

    const prev = parseCtx(this.reopenMetric.PREVIOUS_CONTEXT_EXTRACTED);
    const curr = parseCtx(this.reopenMetric.CURRENT_CONTEXT_EXTRACTED);
    const allKeys = new Set([...Object.keys(prev), ...Object.keys(curr)]);
    const diffs: ReturnType<typeof this.getContextDiffs> = [];

    for (const key of allKeys) {
      const prevArr = toList(prev[key]);
      const currArr = toList(curr[key]);

      const PREVIEW = 4;
      const prevPreview = prevArr.slice(0, PREVIEW).join(', ') || 'empty';
      const currPreview = currArr.slice(0, PREVIEW).join(', ') || 'empty';
      const prevExtra =
        prevArr.length > PREVIEW ? ` + ${prevArr.length - PREVIEW} more` : '';
      const currExtra =
        currArr.length > PREVIEW ? ` + ${currArr.length - PREVIEW} more` : '';

      diffs.push({
        key,
        prev: prevPreview + prevExtra,
        curr: currPreview + currExtra,
        prevCount: prevArr.length,
        currCount: currArr.length,
      });
    }

    return diffs;
  }

  onYesDecision(): void {
    if (!this.reopenMetric || this.reopenUpdateLoading) {
      return;
    }

    const payload: Record<string, string> = {
      reopenDecision: 'Y',
      reopenRejectCategory: '',
      reopenRejectCoreIssue: '',
      updateRejectReason: '',
      reopenRejectTeam: '',
      incidentNumber: this.reopenMetric.INCIDENT_NUMBER || this.incidentNumber,
      ...this.buildReopenInsertFields(),
    };

    this.submitReopenUpdate(payload, 'yes');
  }

  /**
   * Extracts the columns needed by the backend to insert a new active staging
   * run when the reopen decision is YES. Sourced entirely from reopenMetric.
   */
  private buildReopenInsertFields(): Record<string, string> {
    const m = this.reopenMetric;
    if (!m) return {};
    const s = (v: string | null | undefined): string => v ?? '';
    return {
      impactedServiceOffering: s(m.IMPACTED_SERVICE_OFFERING),
      impactedUser: s(m.IMPACTED_USER),
      incidentSummary: s(m.INCIDENT_SUMMARY),
      incidentDescription: s(m.INCIDENT_DESCRIPTION),
      proposedTeamName: s(m.PROPOSED_TEAM_NAME) || s(m.TEAM_NAME),
      openedBy: s(m.OPENED_BY),
      assignmentGroup: s(m.ASSIGNMENT_GROUP),
      ccoUserEmail: s(m.CCO_USER_EMAIL),
      currentCategory: s(m.CURRENT_CATEGORY),
      currentCoreIssue: s(m.CURRENT_CORE_ISSUE),
      currentContextExtracted: s(m.CURRENT_CONTEXT_EXTRACTED),
      incidentSysId: s(m.INCIDENT_SYS_ID),
      newAskSummary: s(m.NEW_ASK_SUMMARY),
    };
  }

  onNoDecision(): void {
    this.reopenUpdateSuccess = '';
    this.reopenUpdateError = '';
    this.showRejectForm = true;
  }

  submitNoDecision(): void {
    if (
      !this.reopenMetric ||
      this.reopenUpdateLoading ||
      !this.isRejectFormValid()
    ) {
      return;
    }

    const payload: Record<string, string> = {
      reopenDecision: 'N',
      reopenRejectCategory: this.rejectCategory.trim(),
      reopenRejectCoreIssue: this.rejectCoreIssue.trim(),
      updateRejectReason: this.rejectReason.trim(),
      reopenRejectTeam: this.rejectTeam,
      incidentNumber: this.reopenMetric.INCIDENT_NUMBER || this.incidentNumber,
      ...this.buildReopenInsertFields(),
    };

    this.submitReopenUpdate(payload, 'no');
  }

  isRejectFormValid(): boolean {
    return !!(
      this.rejectCategory.trim() &&
      this.rejectCoreIssue.trim() &&
      this.rejectReason.trim() &&
      this.rejectTeam
    );
  }

  private submitReopenUpdate(
    payload: Record<string, string>,
    decisionType: 'yes' | 'no',
  ): void {
    this.reopenUpdateLoading = true;
    this.reopenUpdateSuccess = '';
    this.reopenUpdateError = '';

    this.httpClient.post<number>(this.reopenUpdateUrl, payload).subscribe({
      next: () => {
        this.reopenUpdateLoading = false;
        this.reopenUpdateSuccess =
          decisionType === 'yes'
            ? 'Reopen decision saved successfully.'
            : 'Reopen rejection details saved successfully.';
        this.reopenDecision.emit(decisionType);
        if (decisionType === 'yes') {
          this.showRejectForm = false;
          this.rejectCategory = '';
          this.rejectCoreIssue = '';
          this.rejectReason = '';
          this.rejectTeam = '';
        }
      },
      error: () => {
        this.reopenUpdateLoading = false;
        this.reopenUpdateError =
          'Failed to save reopen decision. Please try again.';
      },
    });
  }
}
