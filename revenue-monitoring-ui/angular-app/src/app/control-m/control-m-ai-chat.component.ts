import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostBinding,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorArrowClockwiseBold,
  phosphorChatCenteredTextBold,
  phosphorPaperPlaneRightBold,
  phosphorSparkleBold,
  phosphorXBold,
} from '@ng-icons/phosphor-icons/bold';
import { Subject, takeUntil } from 'rxjs';

import { ControlMService } from './control-m.service';
import type { ChatMessage, JobSource, MatchedJob } from './control-m.types';

const STARTER_QUESTIONS = [
  'What is the status of FI10200081?',
  "What's the status on 845?",
  'Any failures today?',
  'Show me long-running jobs',
];

@Component({
  selector: 'app-control-m-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon],
  providers: [
    provideIcons({
      phosphorArrowClockwiseBold,
      phosphorChatCenteredTextBold,
      phosphorPaperPlaneRightBold,
      phosphorSparkleBold,
      phosphorXBold,
    }),
  ],
  templateUrl: './control-m-ai-chat.component.html',
  styleUrls: ['./control-m-ai-chat.component.css'],
})
export class ControlMAiChatComponent implements AfterViewChecked, OnDestroy {
  @Input({ required: true }) application!: JobSource;
  @Input() set darkMode(v: boolean) {
    this._darkMode = v;
  }

  @HostBinding('class.dark-theme') _darkMode = false;

  @ViewChild('scrollRegion') scrollRegion?: ElementRef<HTMLDivElement>;
  @ViewChild('inputEl') inputEl?: ElementRef<HTMLTextAreaElement>;

  readonly starterQuestions = STARTER_QUESTIONS;

  open = false;
  messages: ChatMessage[] = [];
  input = '';
  busy = false;
  lastMatches: MatchedJob[] = [];

  private shouldScroll = false;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly api: ControlMService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.scrollRegion) {
      const el = this.scrollRegion.nativeElement;
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggle(): void {
    this.open = !this.open;
    if (this.open) {
      // Focus input on next tick
      setTimeout(() => this.inputEl?.nativeElement.focus(), 0);
      this.shouldScroll = true;
    }
  }

  close(): void {
    this.open = false;
  }

  clearChat(): void {
    this.messages = [];
    this.lastMatches = [];
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send(this.input);
    }
  }

  send(text: string): void {
    const q = (text || '').trim();
    if (!q || this.busy) return;

    // history sent to backend is prior turns (excluding this new user msg)
    const priorHistory = [...this.messages];
    const userMsg: ChatMessage = { role: 'user', content: q };
    this.messages = [...this.messages, userMsg];
    this.input = '';
    this.busy = true;
    this.shouldScroll = true;

    this.api
      .aiChat(q, this.application, priorHistory)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.messages = [
            ...this.messages,
            {
              role: 'assistant',
              content: data.answer || '(empty response)',
            },
          ];
          this.lastMatches = Array.isArray(data.matched_jobs)
            ? data.matched_jobs
            : [];
          this.busy = false;
          this.shouldScroll = true;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.messages = [
            ...this.messages,
            {
              role: 'assistant',
              content: `Sorry, I couldn't reach the AI service.\n\n${this.errorMessage(err)}`,
            },
          ];
          this.busy = false;
          this.shouldScroll = true;
          this.cdr.markForCheck();
        },
      });
  }

  autogrow(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }

  trackByIndex(i: number): number {
    return i;
  }

  trackByJobName(_: number, j: MatchedJob): string {
    return j.job_name;
  }

  private errorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (err && typeof err === 'object' && 'message' in err) {
      return String((err as { message: unknown }).message);
    }
    return 'Unknown error';
  }
}
