import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { AuthenticationService } from '../../providers/authentication.service';

interface RunDetail {
  run_id: number;
  config_id: number;
  record_id: string;
  id_column_type: string | null;
  error_table: string | null;
  pattern_id: number | null;
  core_issue_label: string | null;
  category: string | null;
  root_cause_text: string | null;
  findings_text: string | null;
  resolution_text: string | null;
  proposed_fix_sql: string | null;
  tools_called_json: any[] | null;
  agent_flow_json: any | null;
  response_time_sec: number | null;
  llm_call_count: number | null;
  total_tokens: number | null;
  analysis_mode: string;
  run_status: string;
  review_status: string;
  created_at: string;
}

interface TimelineEvent {
  event_id: number;
  run_id: number;
  session_id: number | null;
  event_type: string;
  direction: string;
  actor: string;
  payload: string | null;
  tokens_used: number | null;
  latency_ms: number | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

@Component({
  selector: 'app-exception-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exception-details.component.html',
  styleUrls: ['./exception-details.component.css'],
})
export class ExceptionDetailsComponent implements OnInit, OnChanges {
  @Input() exceptionId: string = '';
  @Input() backLabel: string = 'Back to Queue';
  @Input() apiEndpoint: 'direct' | 'by-record' = 'direct';
  @Output() back = new EventEmitter<void>();

  private readonly API_URL = 'https://i2c-aria-dev.cisco.com/api/runs';

  activeTab: 'review' | 'trace' = 'review';
  accuracyAssessment: 'correct' | 'partially_correct' | 'incorrect' | null =
    'correct';
  reviewerNotes = '';
  markAsTraining = false;
  needsCrossTeam = false;
  upstreamTeamName = '';
  upstreamContact = '';
  upstreamWebexSpace = '';
  messageTemplate = '';
  expectedResolutionHours = 48;
  escalationContact = '';
  letBotHandle = false;
  reviewerEmail = '';
  isLoading = false;
  showFullRootCause = false;
  showFullSql = false;
  savingReview = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  showToast = false;

  run: RunDetail | null = null;
  timelineEvents: TimelineEvent[] = [];
  timelineLoading = false;
  expandedEventIds = new Set<number>();

  private isRoutedView = false;

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    private route: ActivatedRoute,
    private location: Location,
  ) {}

  ngOnInit(): void {
    const routeId = this.route.snapshot.paramMap.get('id');
    if (routeId) {
      this.exceptionId = routeId;
      this.apiEndpoint = 'by-record';
      this.backLabel = 'Back to Error Details';
      this.isRoutedView = true;
    }
    if (this.exceptionId) {
      this.fetchRunDetail();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['exceptionId'] &&
      !changes['exceptionId'].firstChange &&
      this.exceptionId
    ) {
      this.fetchRunDetail();
    }
  }

  private fetchRunDetail(): void {
    this.isLoading = true;
    const url =
      this.apiEndpoint === 'by-record'
        ? `${this.API_URL}/by-record/${this.exceptionId}`
        : `${this.API_URL}/${this.exceptionId}`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        if (this.apiEndpoint === 'by-record') {
          // Response: { record_id, data: RunDetail[] }
          const runs = res.data as RunDetail[];
          this.run = runs && runs.length > 0 ? runs[0] : null;
        } else {
          // Response: { data: RunDetail }
          this.run = res.data;
        }
        this.isLoading = false;
        if (this.run) {
          this.fetchTimeline(this.run.run_id);
        }
      },
      error: (err) => {
        console.error('Failed to fetch run detail:', err);
        this.isLoading = false;
      },
    });
  }

  private cleanRootCauseText(text: string): string {
    // Remove the first line if it's the ROOT CAUSE label (already shown in header)
    const lines = text.split('\n');
    if (lines[0] && /^\*{0,2}\s*ROOT\s*CAUSE\s*:/i.test(lines[0])) {
      return lines.slice(1).join('\n').trim();
    }
    return text;
  }

  get rootCausePreview(): string {
    if (!this.run?.root_cause_text) return '—';
    const cleaned = this.cleanRootCauseText(this.run.root_cause_text);
    const lines = cleaned.split('\n');
    return lines.slice(0, 4).join('\n');
  }

  get rootCauseFull(): string {
    if (!this.run?.root_cause_text) return '—';
    return this.cleanRootCauseText(this.run.root_cause_text);
  }

  get hasMoreRootCause(): boolean {
    if (!this.run?.root_cause_text) return false;
    const cleaned = this.cleanRootCauseText(this.run.root_cause_text);
    return cleaned.split('\n').length > 4;
  }

  toggleRootCause(): void {
    this.showFullRootCause = !this.showFullRootCause;
  }

  get sqlPreview(): string {
    if (!this.run?.proposed_fix_sql) return '';
    const lines = this.run.proposed_fix_sql.split('\n');
    return lines.slice(0, 6).join('\n');
  }

  get sqlFull(): string {
    return this.run?.proposed_fix_sql || '';
  }

  get hasMoreSql(): boolean {
    if (!this.run?.proposed_fix_sql) return false;
    return this.run.proposed_fix_sql.split('\n').length > 6;
  }

  toggleSql(): void {
    this.showFullSql = !this.showFullSql;
  }

  setAssessment(value: 'correct' | 'partially_correct' | 'incorrect'): void {
    this.accuracyAssessment = value;
  }

  goBack(): void {
    if (this.isRoutedView) {
      this.location.back();
    } else {
      this.back.emit();
    }
  }

  saveReview(): void {
    if (!this.run?.pattern_id) {
      this.displayToast('No Pattern ID available for this run.', 'error');
      return;
    }

    this.savingReview = true;
    const patternUrl = `https://i2c-aria-dev.cisco.com/api/patterns/${this.run.pattern_id}`;

    const feedbackBody = {
      feedback: this.accuracyAssessment || '',
      notes: this.reviewerNotes,
      reviewer: this.authService.getUserID(),
      is_training_example: this.markAsTraining,
    };

    const engagementBody = {
      upstream_contact: this.upstreamContact,
      upstream_team_name: this.upstreamTeamName,
      contact_method: this.upstreamWebexSpace,
      contact_message_template: this.messageTemplate,
      wait_time: this.expectedResolutionHours,
      max_retries: 0,
      escalation_contact: this.escalationContact,
      escalation_wait_time: 0,
      updated_by: this.reviewerEmail,
    };

    // Fire both calls in parallel
    let feedbackDone = false;
    let engagementDone = false;
    let hasError = false;

    const checkComplete = () => {
      if (feedbackDone && engagementDone) {
        this.savingReview = false;
        if (!hasError) {
          this.displayToast(
            'Review and engagement saved successfully.',
            'success',
          );
        }
      }
    };

    this.http.post(`${patternUrl}/feedback`, feedbackBody).subscribe({
      next: () => {
        feedbackDone = true;
        checkComplete();
      },
      error: () => {
        feedbackDone = true;
        hasError = true;
        this.displayToast(
          'Feedback could not be saved. Please try again.',
          'error',
        );
        checkComplete();
      },
    });

    this.http.patch(`${patternUrl}/engagement`, engagementBody).subscribe({
      next: () => {
        engagementDone = true;
        checkComplete();
      },
      error: () => {
        engagementDone = true;
        hasError = true;
        this.displayToast(
          'Engagement could not be saved. Please try again.',
          'error',
        );
        checkComplete();
      },
    });
  }

  private displayToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 4000);
  }

  /* ── Timeline ── */
  private fetchTimeline(runId: number): void {
    this.timelineLoading = true;
    this.http
      .get<{
        data: TimelineEvent[];
      }>(`${this.API_URL}/${runId}/timeline`)
      .subscribe({
        next: (res) => {
          this.timelineEvents = (res.data || []).sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );
          this.timelineLoading = false;
        },
        error: () => {
          this.timelineLoading = false;
        },
      });
  }

  toggleEventExpand(id: number): void {
    if (this.expandedEventIds.has(id)) {
      this.expandedEventIds.delete(id);
    } else {
      this.expandedEventIds.add(id);
    }
  }

  isEventExpanded(id: number): boolean {
    return this.expandedEventIds.has(id);
  }

  parsePayload(payload: string | null): Record<string, any> | null {
    if (!payload) return null;
    try {
      return JSON.parse(payload);
    } catch {
      return null;
    }
  }

  payloadEntries(payload: string | null): [string, any][] {
    const parsed = this.parsePayload(payload);
    return parsed ? Object.entries(parsed) : [];
  }

  formatLatency(ms: number | null): string {
    if (ms == null) return '—';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }

  getEventTypeIcon(type: string): string {
    switch (type) {
      case 'LLM_CALL':
        return '🧠';
      case 'TOOL_CALL':
        return '🔧';
      case 'QUERY':
        return '🔍';
      case 'ERROR':
        return '❌';
      case 'START':
        return '▶';
      case 'END':
        return '✓';
      default:
        return '●';
    }
  }

  getEventTypeClass(type: string): string {
    switch (type) {
      case 'LLM_CALL':
        return 'ed__evt--llm';
      case 'TOOL_CALL':
        return 'ed__evt--tool';
      case 'QUERY':
        return 'ed__evt--query';
      case 'ERROR':
        return 'ed__evt--error';
      default:
        return 'ed__evt--default';
    }
  }

  get traceLlmCount(): number {
    return this.timelineEvents.filter((e) => e.event_type === 'LLM_CALL')
      .length;
  }

  get traceToolCount(): number {
    return this.timelineEvents.filter((e) => e.event_type === 'TOOL_CALL')
      .length;
  }

  get traceErrorCount(): number {
    return this.timelineEvents.filter((e) => !e.success).length;
  }

  get cleanFindings(): string {
    if (!this.run?.findings_text) return 'No findings available.';
    return this.run.findings_text
      .replace(/^-\s*\[observation\]\s*/im, '')
      .trim();
  }

  formatStatus(status: string): string {
    if (!status) return '—';
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  cleanLabel(label: string | null): string {
    if (!label) return 'No issue label';
    return label
      .replace(/\*+/g, '')
      .replace(/^ROOT\s*CAUSE\s*:\s*/i, '')
      .trim();
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'ed__pill--completed';
      case 'running':
        return 'ed__pill--running';
      case 'failed':
        return 'ed__pill--failed';
      default:
        return 'ed__pill--default';
    }
  }

  getReviewClass(status: string): string {
    switch (status) {
      case 'reviewed':
        return 'ed__pill--reviewed';
      case 'pending_review':
        return 'ed__pill--pending';
      case 'cross_team_review':
        return 'ed__pill--cross-team';
      default:
        return 'ed__pill--default';
    }
  }

  getModeClass(mode: string): string {
    switch (mode?.toUpperCase()) {
      case 'Agentic':
        return 'ed__pill--agent';
      case 'Guided':
        return 'ed__pill--static';
      case 'Pattren Match':
        return 'ed__pill--agent';
      default:
        return 'ed__pill--default';
    }
  }
}
