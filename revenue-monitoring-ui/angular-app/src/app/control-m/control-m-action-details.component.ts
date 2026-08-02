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
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorArrowClockwiseBold,
  phosphorCaretDownBold,
  phosphorCheckBold,
  phosphorWarningBold,
  phosphorXBold,
} from '@ng-icons/phosphor-icons/bold';
import { Subject, takeUntil, timer } from 'rxjs';

import { ControlMService } from './control-m.service';
import type { Job, JobAction, JobSource } from './control-m.types';

interface ActionResult {
  ok: boolean;
  message: string;
}

const ACTION_LABELS: Record<JobAction, string> = {
  hold: 'Hold',
  free: 'Free',
  rerun: 'Rerun',
  set_to_ok: 'Set to OK',
};

export interface ActionCompletedEvent {
  job_id: string;
  job_name: string;
  status: string;
  category: string;
}

@Component({
  selector: 'app-control-m-action-details',
  standalone: true,
  imports: [CommonModule, NgIcon],
  providers: [
    provideIcons({
      phosphorArrowClockwiseBold,
      phosphorCaretDownBold,
      phosphorCheckBold,
      phosphorWarningBold,
      phosphorXBold,
    }),
  ],
  templateUrl: './control-m-action-details.component.html',
  styleUrls: ['./control-m-action-details.component.css'],
})
export class ControlMActionDetailsComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) job!: Job;
  @Input({ required: true }) source!: JobSource;
  @Input() set darkMode(v: boolean) {
    this._darkMode = v;
  }

  @Output() closed = new EventEmitter<void>();
  @Output() actionCompleted = new EventEmitter<ActionCompletedEvent>();

  @HostBinding('class.dark-theme') _darkMode = false;

  readonly actionLabels = ACTION_LABELS;
  readonly actionKeys: JobAction[] = ['hold', 'free', 'rerun', 'set_to_ok'];

  // Live state
  liveJobId = '';
  liveStatus = '';
  liveCategory = '';
  statusLoading = false;

  // Action UI state
  selectedAction: JobAction | '' = '';
  actionDropdownOpen = false;
  actionRunning = false;
  actionResult: ActionResult | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly api: ControlMService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['job']) {
      this.liveJobId = this.job.job_id;
      this.liveStatus = this.job.status;
      this.liveCategory = this.job.category;
      this.selectedAction = '';
      this.actionResult = null;
      this.actionDropdownOpen = false;
      this.fetchStatus();
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

  get currentJobId(): string {
    return this.liveJobId || this.job.job_id;
  }

  get displayStatus(): string {
    return this.liveStatus || this.job.status;
  }

  // ── Live status ─────────────────────────────────────────────────────

  fetchStatus(): void {
    if (!this.job) return;
    this.statusLoading = true;
    this.api
      .getLiveJobId(this.job.job_name, this.job.application as JobSource)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.liveJobId = data.job_id;
          this.liveStatus = data.status;
          this.statusLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          // Fall back to cached values (already assigned in ngOnChanges)
          this.statusLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  // ── Dropdown ────────────────────────────────────────────────────────

  toggleDropdown(): void {
    this.actionDropdownOpen = !this.actionDropdownOpen;
  }

  chooseAction(a: JobAction): void {
    this.selectedAction = a;
    this.actionDropdownOpen = false;
    this.actionResult = null;
  }

  // ── Run action ──────────────────────────────────────────────────────

  runAction(): void {
    if (!this.selectedAction || this.actionRunning) return;
    const action = this.selectedAction;
    this.actionRunning = true;
    this.actionResult = null;

    // Re-fetch live job_id before acting to avoid using a stale id.
    this.api
      .getLiveJobId(this.job.job_name, this.job.application as JobSource)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.liveJobId = data.job_id;
          this.liveStatus = data.status;
          this.executeAction(action, data.job_id);
        },
        error: () => {
          // Keep prior liveJobId
          this.executeAction(action, this.currentJobId);
        },
      });
  }

  private executeAction(action: JobAction, effectiveJobId: string): void {
    this.api
      .runAction(effectiveJobId, action)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.actionResult = {
            ok: true,
            message: `${ACTION_LABELS[action]} executed successfully.`,
          };
          this.applyOptimisticUpdate(action);
          this.actionRunning = false;
          this.reconcileStatus(action);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.actionResult = {
            ok: false,
            message: this.errorDetail(err) || 'Action failed.',
          };
          this.actionRunning = false;
          this.cdr.markForCheck();
        },
      });
  }

  private applyOptimisticUpdate(action: JobAction): void {
    const priorStatus = this.liveStatus || this.job.status;
    const optimisticStatus: Record<JobAction, string> = {
      hold: 'Hold',
      free: priorStatus === 'Hold' ? 'Wait Condition' : priorStatus,
      rerun: 'Executing',
      set_to_ok: 'Ended OK',
    };
    const optStatus = optimisticStatus[action];
    const optCategory = this.mapStatusToCategory(optStatus);
    this.liveStatus = optStatus;
    this.liveCategory = optCategory;
    this.actionCompleted.emit({
      job_id: this.job.job_id,
      job_name: this.job.job_name,
      status: optStatus,
      category: optCategory,
    });
  }

  private reconcileStatus(action: JobAction): void {
    const priorStatus = this.job.status;
    const optStatus = this.liveStatus;
    const delays = [1500, 4000, 7000];

    delays.forEach((delay) => {
      timer(delay)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.api
            .getLiveJobId(this.job.job_name, this.job.application as JobSource)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (data) => {
                this.liveJobId = data.job_id;
                // Only override optimistic if CTM returns a status distinct
                // from both prior and optimistic values
                if (
                  data.status &&
                  data.status !== priorStatus &&
                  data.status !== optStatus
                ) {
                  const cat = this.mapStatusToCategory(data.status);
                  this.liveStatus = data.status;
                  this.liveCategory = cat;
                  this.actionCompleted.emit({
                    job_id: this.job.job_id,
                    job_name: this.job.job_name,
                    status: data.status,
                    category: cat,
                  });
                  this.cdr.markForCheck();
                }
              },
              error: () => {
                /* keep retrying */
              },
            });
        });
    });
  }

  private mapStatusToCategory(status: string): string {
    const s = (status || '').trim().toLowerCase();
    if (s === 'ended ok' || s === 'succeeded') return 'SUCCESS';
    if (s === 'ended not ok' || s === 'abended') return 'FAILURE';
    if (s === 'executing') return 'RUNNING';
    if (s === 'wait condition') return 'LATE_START';
    if (s === 'hold' || s === 'held') return 'HOLD';
    return 'UNKNOWN_STATUS';
  }

  statusChipClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('ended ok') || s.includes('succeed')) return 'ok';
    if (s.includes('ended not ok') || s.includes('abend') || s.includes('fail'))
      return 'err';
    if (s.includes('executing') || s.includes('running')) return 'run';
    if (s.includes('wait') || s.includes('long')) return 'warn';
    if (s.includes('hold')) return 'hold';
    return 'neutral';
  }

  private errorDetail(err: unknown): string {
    if (err && typeof err === 'object') {
      const anyErr = err as { error?: { detail?: string }; message?: string };
      if (anyErr.error?.detail) return anyErr.error.detail;
      if (anyErr.message) return anyErr.message;
    }
    return '';
  }
}
