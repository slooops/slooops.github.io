import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorArrowClockwiseBold,
  phosphorArrowSquareOutBold,
  phosphorCaretDownBold,
  phosphorCheckBold,
  phosphorChatCenteredTextBold,
  phosphorPaperPlaneRightBold,
  phosphorSparkleBold,
  phosphorXBold,
} from '@ng-icons/phosphor-icons/bold';
import { Subject, takeUntil } from 'rxjs';

import { ControlMService } from './control-m.service';
import type {
  ChatMessage,
  Job,
  JobSource,
  JobStatistics,
  LogTabKey,
  SqlInfo,
  WaitingInfo,
} from './control-m.types';

interface LogTab {
  value: LogTabKey;
  label: string;
}

interface TextTabState {
  loading: boolean;
  error: string | null;
  content: string | null;
}

interface WaitingTabState {
  loading: boolean;
  error: string | null;
  info: WaitingInfo | null;
}

interface StatsTabState {
  loading: boolean;
  error: string | null;
  data: JobStatistics | null;
}

interface SqlTabState {
  loading: boolean;
  error: string | null;
  info: SqlInfo | null;
}

const LOG_TABS: LogTab[] = [
  { value: 'log', label: 'CTM Log' },
  { value: 'output', label: 'CTM Output' },
  { value: 'host-log', label: 'Host Log' },
  { value: 'host-output', label: 'Host Output' },
  { value: 'waiting-info', label: 'Waiting Info' },
  { value: 'statistic-info', label: 'Statistic Info' },
  { value: 'sql-info', label: 'SQL Info' },
];

const SUGGESTED_PROMPTS = [
  'Is it safe to cancel this request?',
  'What does this concurrent program do?',
  'Why is the job waiting on this event?',
  'Is the current SQL performing well?',
  'What business impact would cancelling have?',
];

@Component({
  selector: 'app-control-m-log-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon],
  providers: [
    provideIcons({
      phosphorArrowClockwiseBold,
      phosphorArrowSquareOutBold,
      phosphorCaretDownBold,
      phosphorCheckBold,
      phosphorChatCenteredTextBold,
      phosphorPaperPlaneRightBold,
      phosphorSparkleBold,
      phosphorXBold,
    }),
  ],
  templateUrl: './control-m-log-viewer.component.html',
  styleUrls: ['./control-m-log-viewer.component.css'],
})
export class ControlMLogViewerComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) job!: Job;
  @Input({ required: true }) source!: JobSource;
  @Input() initialTab: LogTabKey = 'log';
  @Input() serviceNowUrl = '';
  @Input() set darkMode(v: boolean) {
    this._darkMode = v;
  }

  @Output() closed = new EventEmitter<void>();

  @HostBinding('class.dark-theme') _darkMode = false;

  readonly tabs = LOG_TABS;
  readonly suggestedPrompts = SUGGESTED_PROMPTS;
  activeTab: LogTabKey = 'log';

  // Per-tab caches keyed by tab
  textStates: Partial<Record<LogTabKey, TextTabState>> = {};
  waitingState: WaitingTabState = {
    loading: false,
    error: null,
    info: null,
  };
  statsState: StatsTabState = { loading: false, error: null, data: null };
  sqlState: SqlTabState = { loading: false, error: null, info: null };

  // SQL-Info sub-panels
  showChat = false;
  showPrefill = false;
  copied = false;

  // Chat
  chatMessages: ChatMessage[] = [];
  chatInput = '';
  chatBusy = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly api: ControlMService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['job'] && !changes['job'].firstChange) {
      // Reset caches on job change (should be a fresh modal, but guard anyway)
      this.resetCaches();
    }
    if (changes['initialTab'] || changes['job']) {
      this.activeTab = this.initialTab || 'log';
      this.loadActiveTab();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  close(): void {
    this.closed.emit();
  }

  onBackdropClick(): void {
    this.close();
  }

  selectTab(tab: LogTabKey): void {
    this.activeTab = tab;
    this.loadActiveTab();
  }

  private resetCaches(): void {
    this.textStates = {};
    this.waitingState = { loading: false, error: null, info: null };
    this.statsState = { loading: false, error: null, data: null };
    this.sqlState = { loading: false, error: null, info: null };
    this.showChat = false;
    this.showPrefill = false;
    this.chatMessages = [];
    this.chatInput = '';
  }

  loadActiveTab(): void {
    switch (this.activeTab) {
      case 'log':
      case 'output':
      case 'host-log':
      case 'host-output':
        this.loadTextTab(this.activeTab);
        break;
      case 'waiting-info':
        this.loadWaitingInfo();
        break;
      case 'statistic-info':
        this.loadStatistics();
        break;
      case 'sql-info':
        this.loadSqlInfo();
        break;
    }
  }

  // ── Text tabs (log / output / host-log / host-output) ───────────────

  loadTextTab(tab: LogTabKey): void {
    const state: TextTabState = { loading: true, error: null, content: null };
    this.textStates[tab] = state;

    const obs = this.textObservable(tab);
    if (!obs) return;

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: (content) => {
        this.textStates[tab] = { loading: false, error: null, content };
      },
      error: (err) => {
        this.textStates[tab] = {
          loading: false,
          error: this.errorMessage(err),
          content: null,
        };
      },
    });
  }

  private textObservable(tab: LogTabKey) {
    switch (tab) {
      case 'log':
        return this.api.getCtmLog(this.job.job_id);
      case 'output':
        return this.api.getCtmOutput(this.job.job_id);
      case 'host-log':
        return this.api.getHostLog(this.job.job_id);
      case 'host-output':
        return this.api.getHostOutput(this.job.job_id);
      default:
        return null;
    }
  }

  retryTextTab(tab: LogTabKey): void {
    this.loadTextTab(tab);
  }

  // ── Waiting Info tab ────────────────────────────────────────────────

  loadWaitingInfo(): void {
    this.waitingState = { loading: true, error: null, info: null };
    this.api
      .getWaitingInfo(this.job.job_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (info) => {
          this.waitingState = { loading: false, error: null, info };
        },
        error: (err) => {
          this.waitingState = {
            loading: false,
            error: this.errorMessage(err),
            info: null,
          };
        },
      });
  }

  // ── Statistics tab ──────────────────────────────────────────────────

  showRawJson = false;

  loadStatistics(): void {
    this.statsState = { loading: true, error: null, data: null };
    this.api
      .getStatistics(this.job.job_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.statsState = { loading: false, error: null, data };
        },
        error: (err) => {
          this.statsState = {
            loading: false,
            error: this.errorMessage(err),
            data: null,
          };
        },
      });
  }

  statusRunClass(status: string | undefined): string {
    const s = (status || '').toLowerCase();
    if (s.includes('not')) return 'cm-lv-run-fail';
    if (s.includes('ok')) return 'cm-lv-run-ok';
    return 'cm-lv-run-neutral';
  }

  toggleRawJson(): void {
    this.showRawJson = !this.showRawJson;
  }

  formatJson(v: unknown): string {
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return typeof v === 'string' ? v : Object.prototype.toString.call(v);
    }
  }

  // ── SQL Info tab ────────────────────────────────────────────────────

  loadSqlInfo(): void {
    this.sqlState = { loading: true, error: null, info: null };
    this.api
      .getSqlInfo(this.job.job_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (info) => {
          this.sqlState = { loading: false, error: null, info };
        },
        error: (err) => {
          this.sqlState = {
            loading: false,
            error: this.errorMessage(err),
            info: null,
          };
        },
      });
  }

  refreshSql(): void {
    this.loadSqlInfo();
  }

  isRunning(info: SqlInfo | null): boolean {
    return info?.phase_code === 'R';
  }

  sqlStatusCardClass(info: SqlInfo | null): string {
    if (!info) return 'cm-lv-status-neutral';
    if (info.status_code === 'E') return 'cm-lv-status-error';
    if (info.status_code === 'W') return 'cm-lv-status-warn';
    return 'cm-lv-status-neutral';
  }

  sqlStatusHeadline(info: SqlInfo | null): string {
    if (!info) return 'No status.';
    if (!info.phase_label) {
      return 'No request ID found for this job.';
    }
    return info.status_label
      ? `Request ${info.phase_label} — ${info.status_label}`
      : `Request ${info.phase_label}`;
  }

  // ── SQL Info action buttons ────────────────────────────────────────

  openPrefill(): void {
    this.showPrefill = true;
  }

  closePrefill(): void {
    this.showPrefill = false;
  }

  toggleChat(): void {
    this.showChat = !this.showChat;
  }

  buildDescription(info: SqlInfo): string {
    return [
      `Job Name           : ${this.job.job_name}`,
      `Concurrent Program : ${this.job.description || '—'}`,
      `Request ID         : ${info.request_id}`,
      `SQL ID             : ${info.sql_id || '—'}`,
      `Instance           : ${info.inst_id ?? '—'}`,
      `Session (SID)      : ${info.sid ?? '—'}`,
      `Wait Event         : ${info.wait_event || '—'}`,
      '',
      '--- Current Running SQL ---',
      info.sql_text || '(not available)',
    ].join('\n');
  }

  copyAndOpen(info: SqlInfo): void {
    const text = this.buildDescription(info);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.copied = true;
        this.cdr.markForCheck();
        setTimeout(() => {
          this.copied = false;
          this.cdr.markForCheck();
        }, 3000);
      });
    }
    if (this.serviceNowUrl) {
      window.open(this.serviceNowUrl, '_blank', 'noopener,noreferrer');
    }
  }

  // ── Chat panel ──────────────────────────────────────────────────────

  onChatKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendChat(this.chatInput);
    }
  }

  sendChat(text: string): void {
    const trimmed = (text || '').trim();
    if (!trimmed || this.chatBusy) return;

    const info = this.sqlState.info;
    if (!info) return;

    const context = {
      job_name: this.job.job_name,
      program_name: this.job.description || '—',
      request_id: info.request_id,
      sql_id: info.sql_id,
      sql_text: info.sql_text,
      wait_event: info.wait_event,
      sid: info.sid,
      inst_id: info.inst_id,
    };

    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    this.chatMessages = [...this.chatMessages, userMsg];
    this.chatInput = '';
    this.chatBusy = true;

    this.api
      .jobChat(this.job.job_id, this.chatMessages, context)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.chatMessages = [
            ...this.chatMessages,
            { role: 'assistant', content: res.reply || 'No response.' },
          ];
          this.chatBusy = false;
        },
        error: () => {
          this.chatMessages = [
            ...this.chatMessages,
            {
              role: 'assistant',
              content: 'Error reaching AI service.',
            },
          ];
          this.chatBusy = false;
        },
      });
  }

  // ── Utility ─────────────────────────────────────────────────────────

  private errorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'object' && err && 'message' in err)
      return String((err as any).message);
    return 'Unknown error';
  }

  trackByTab = (_: number, t: LogTab) => t.value;
  trackByMsg = (i: number) => i;

  bindVarValue(v: string | null | undefined): string {
    return v ?? '—';
  }
}
