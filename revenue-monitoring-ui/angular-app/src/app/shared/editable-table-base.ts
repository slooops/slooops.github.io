import { Directive, Input, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthenticationService } from '../providers/authentication.service';

/* =========================================================================
   Shared Types
   ========================================================================= */

export interface TableVersion {
  versionId: number;
  sprintName: string;
  createdBy: string;
  createdAt: string;
  notes: string;
}

export interface ColorPair {
  bg: string;
  accent: string;
}

export interface EditableTableConfig {
  /** Roles allowed to enter edit mode (e.g. ['ADMIN','SCORECARD_ADMIN','SCORECARD']) */
  editRoles: string[];
  /** Roles considered admin — full edit, can add/remove rows */
  adminRoles: string[];
  /** localStorage key for draft persistence */
  draftKey: string;
  /** Router path for the version-history page */
  historyRoute: string;
  /** Prefix used in email subject line */
  emailSubjectPrefix: string;
}

/* =========================================================================
   Abstract Base Class
   Every "editable snapshot table" extends this.
   Subclasses provide:  data service wiring, column layout,
   email HTML rendering, and any table-specific edit rules.
   ========================================================================= */

@Directive()
export abstract class EditableTableBase<TRow> implements OnInit, OnDestroy {
  version: TableVersion | null = null;
  userId = '';
  userRoles: string[] = [];
  isEditing = false;
  isSaving = false;
  isLoading = true;
  saveNotes = '';
  editableSprintName = '';
  toastMessage = '';
  hasDraftAvailable = false;
  @Input() showEmailButton = true;

  protected rowsSnapshot: TRow[] = [];
  private draftDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    protected authService: AuthenticationService,
    protected router: Router,
    protected config: EditableTableConfig,
  ) {}

  /* ——— Abstract — each table must implement ——————————————————————————— */

  /** Return every data row as a flat array (used for save, drafts, email). */
  abstract getAllRows(): TRow[];

  /** Replace the component's row data (flat array → component-specific structure). */
  abstract restoreRows(rows: TRow[]): void;

  /** Observable that fetches the current version + rows from the API. */
  abstract loadRemoteData(): Observable<{
    version: TableVersion;
    rows: TRow[];
  }>;

  /** Observable that persists the given payload to the API. */
  abstract saveRemoteData(payload: {
    username: string;
    sprintName: string;
    notes: string;
    rows: TRow[];
  }): Observable<any>;

  /** Build a styled HTML table for clipboard → email export. */
  abstract buildEmailHtml(): string;

  /** Build a plain-text fallback for email export. */
  abstract buildPlainText(): string;

  /* ——— Lifecycle ————————————————————————————————————————————————————— */

  ngOnInit(): void {
    this.userId = this.authService.getUserID() || '';
    this.userRoles = this.authService.getRoles() || [];
    this.hasDraftAvailable = this.hasDraft();
    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.draftDebounceTimer) clearTimeout(this.draftDebounceTimer);
  }

  /* ——— Auth / Roles ————————————————————————————————————————————————— */

  get canEdit(): boolean {
    return this.userRoles.some((r) => this.config.editRoles.includes(r));
  }

  get isAdmin(): boolean {
    return this.userRoles.some((r) => this.config.adminRoles.includes(r));
  }

  /* ——— Data loading ————————————————————————————————————————————————— */

  protected loadData(): void {
    this.isLoading = true;
    this.loadRemoteData().subscribe({
      next: (data) => {
        this.version = data.version;
        this.restoreRows(data.rows);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  /* ——— Editing flow —————————————————————————————————————————————————— */

  startEditing(): void {
    this.rowsSnapshot = this.getAllRows().map((r) => ({ ...r }));
    this.isEditing = true;
    this.saveNotes = '';
    this.editableSprintName = this.version?.sprintName || '';

    const draft = this.loadDraftData();
    if (draft) {
      this.restoreRows(draft.rows);
      this.saveNotes = draft.saveNotes || '';
      this.hasDraftAvailable = false;
      this.showToast('Draft restored — your previous edits have been loaded');
    }

    this.autoSizeTextareas();
  }

  cancelEditing(): void {
    this.restoreRows(this.rowsSnapshot.map((r) => ({ ...r })));
    this.isEditing = false;
    this.saveNotes = '';
    this.clearDraft();
  }

  saveChanges(): void {
    if (!this.canEdit || this.isSaving) return;
    this.isSaving = true;
    const rows = this.getAllRows();
    const sprintName = this.editableSprintName || this.version?.sprintName || 'Sprint 1';
    this.saveRemoteData({
      username: this.userId,
      sprintName,
      notes: this.saveNotes,
      rows,
    }).subscribe({
      next: () => {
        this.isSaving = false;
        this.isEditing = false;
        this.saveNotes = '';
        this.clearDraft();
        this.loadData();
      },
      error: () => {
        this.isSaving = false;
      },
    });
  }

  /* ——— Cell-input handlers —————————————————————————————————————————— */

  onCellInput(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
    this.saveDraftDebounced();
  }

  onFieldInput(): void {
    this.saveDraftDebounced();
  }

  /* ——— Navigation ——————————————————————————————————————————————————— */

  goToHistory(): void {
    this.router.navigate([this.config.historyRoute]);
  }

  /* ——— Email export ————————————————————————————————————————————————— */

  async exportToEmail(): Promise<void> {
    const html = this.buildEmailHtml();
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([this.buildPlainText()], {
            type: 'text/plain',
          }),
        }),
      ]);
    } catch {
      await navigator.clipboard.writeText(this.buildPlainText());
    }
    const subject = encodeURIComponent(
      `${this.config.emailSubjectPrefix} — ${this.version?.sprintName || 'Current'}`,
    );
    window.open(`mailto:?subject=${subject}`, '_self');
    this.showToast('Table copied — paste into your email body (Cmd+V)');
  }

  /* ——— Toast ———————————————————————————————————————————————————————— */

  showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => (this.toastMessage = ''), 5000);
  }

  /* ——— Formatting helpers —————————————————————————————————————————— */

  formatTimestamp(ts: string): string {
    if (!ts) return '';
    const d = new Date(ts);
    return (
      d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) +
      ' at ' +
      d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    );
  }

  protected esc(s: string): string {
    return (s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* ——— Draft persistence (localStorage) ———————————————————————————— */

  protected saveDraftDebounced(): void {
    if (this.draftDebounceTimer) clearTimeout(this.draftDebounceTimer);
    this.draftDebounceTimer = setTimeout(() => this.saveDraft(), 400);
  }

  private saveDraft(): void {
    const draft = {
      rows: this.getAllRows(),
      saveNotes: this.saveNotes,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(this.config.draftKey, JSON.stringify(draft));
    } catch {
      /* Storage full or unavailable — silently ignore */
    }
  }

  private loadDraftData(): { rows: TRow[]; saveNotes: string } | null {
    try {
      const raw = localStorage.getItem(this.config.draftKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private hasDraft(): boolean {
    return localStorage.getItem(this.config.draftKey) !== null;
  }

  private clearDraft(): void {
    localStorage.removeItem(this.config.draftKey);
    this.hasDraftAvailable = false;
  }

  discardDraft(): void {
    this.clearDraft();
  }

  /* ——— Auto-size textareas after edit mode is entered ————————————— */

  protected autoSizeTextareas(): void {
    setTimeout(() => {
      document
        .querySelectorAll<HTMLTextAreaElement>('.cell-input-textarea')
        .forEach((el) => {
          el.style.height = 'auto';
          el.style.height = el.scrollHeight + 'px';
        });
    });
  }
}
