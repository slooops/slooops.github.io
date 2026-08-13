import { CommonModule } from '@angular/common';
import {
  Component,
  HostBinding,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorCheckSquareBold,
  phosphorCopyBold,
  phosphorSquareBold,
  phosphorUploadSimpleBold,
} from '@ng-icons/phosphor-icons/bold';
import { LoadingSymbolComponent } from '../monitoring-dashboard/shared/loading-symbol/loading-symbol.component';
import { AuthenticationService } from '../providers/authentication.service';
import { ThemeService } from '../providers/theme.service';

interface GeneratedDocs {
  sessionId?: string | null;
  backendDocument?: string;
  uiDocument?: string;
  backend?: string;
  ui?: string;
  backendHandoff?: Record<string, unknown>;
  fileOperations?: unknown[];
  [key: string]: unknown;
}

interface DocumentOutlineItem {
  id: string;
  text: string;
  level: number;
}

interface PersistedCodegenJobState {
  sessionId: string;
  status: 'pending' | 'generated' | 'applied' | 'failed';
  generated?: GeneratedDocs | null;
  error?: string | null;
}

/** Inline formatting fragments within a line of document text. */
interface InlineSpan {
  type: 'text' | 'code' | 'strong' | 'em';
  value: string;
}

/** Structured, template-renderable document blocks (no innerHTML). */
type DocBlock =
  | { kind: 'heading'; level: number; id: string; spans: InlineSpan[] }
  | { kind: 'paragraph'; spans: InlineSpan[] }
  | { kind: 'list'; ordered: boolean; items: InlineSpan[][] }
  | { kind: 'checklist'; items: { done: boolean; spans: InlineSpan[] }[] }
  | { kind: 'code'; lang: string; lines: string[] }
  | { kind: 'callout'; tone: 'copy' | 'note'; blocks: DocBlock[] }
  | { kind: 'table'; headers: InlineSpan[][]; rows: InlineSpan[][][] }
  | { kind: 'rule' };

/** kebab-case: lowercase letters/digits separated by single hyphens. */
const KEBAB_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/** UPPER_SNAKE_CASE (e.g. AIT_JOBS). */
const UPPER_SNAKE_PATTERN = /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/;

/** snake_case that allows either UPPER_SNAKE_CASE or lower_snake_case. */
const FLEX_SNAKE_PATTERN =
  /^(?:[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*|[a-z][a-z0-9]*(?:_[a-z0-9]+)*)$/;

const CODEGEN_JOB_STORAGE_KEY = 'monitoringOnboarding.codegenJob';
const CODEGEN_POLL_INTERVAL_MS = 6000;
const CODEGEN_MAX_NON_200_POLL_RETRIES = 5;

const DEFAULT_MANUAL_FORM_VALUES = {
  componentName: 'AIT TEST',
  featureName: 'ait-test',
  roleName: 'AIT_TEST',
  assignmentUsersKey: 'AIT_TEST',
  queries: {
    summary: 'SELECT * FROM finisro.xxcfi_ait_jobs_summary_v',
    details: 'SELECT * FROM finisro.xxcfi_ait_jobs_detail_v',
    detailsFiltered:
      'SELECT * FROM finisro.xxcfi_ait_jobs_detail_v WHERE job_date=? AND module=? AND ctm_folder=? AND ctm_status=?',
    summaryUpdate:
      "UPDATE finisro.xxcfi_ait_jobs_audit SET assigned_to=?, assigned_date=SYSDATE, comments=? WHERE cleared_flag='N' AND job_date=TRUNC(TO_DATE(?, 'MM/DD/YYYY')) AND module=? AND ctm_folder=? AND ctm_status=?",
  },
  summaryColumns: [
    'PERIOD_NAME',
    'CTM_FOLDER',
    'JOB_NAME',
    'JOB_STATUS',
    'RUN_DATE',
  ],
  detailsTableFilters: [
    { columnName: 'RUN_DATE', type: 'text' as const },
    { columnName: 'CTM_FOLDER', type: 'select' as const },
  ],
};

@Component({
  selector: 'app-monitoring-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon, LoadingSymbolComponent],
  providers: [
    provideIcons({
      phosphorCheckSquareBold,
      phosphorSquareBold,
      phosphorCopyBold,
      phosphorUploadSimpleBold,
    }),
  ],
  templateUrl: './monitoring-onboarding.component.html',
  styleUrl: './monitoring-onboarding.component.css',
})
export class MonitoringOnboardingComponent implements OnInit, OnDestroy {
  @HostBinding('class.dark-theme')
  get darkThemeClass(): boolean {
    return this.themeService.isDarkMode;
  }

  form!: FormGroup;

  /** Wizard step tracking (0-based) for the active flow. */
  currentStep = 0;
  onboardingMode: 'spec' | 'manual' = 'spec';

  readonly manualSteps = [
    {
      key: 'identity',
      label: 'Identity',
      icon: 'phosphorIdentificationCardBold',
    },
    { key: 'queries', label: 'SQL Queries', icon: 'phosphorBookOpenBold' },
    {
      key: 'columns',
      label: 'Columns & Filters',
      icon: 'phosphorSlidersHorizontalBold',
    },
    { key: 'advanced', label: 'Advanced', icon: 'phosphorCrosshairBold' },
    { key: 'review', label: 'Review & Generate', icon: 'phosphorSparkleBold' },
  ];

  readonly specSteps = [
    {
      key: 'upload-spec',
      label: 'Spec Intake',
      icon: 'phosphorFolderOpenBold',
    },
    {
      key: 'review-spec',
      label: 'Review & Generate',
      icon: 'phosphorSparkleBold',
    },
  ];

  get activeSteps() {
    return this.onboardingMode === 'manual' ? this.manualSteps : this.specSteps;
  }

  get activeStepKey(): string {
    return this.activeSteps[this.currentStep]?.key || this.activeSteps[0].key;
  }

  readonly filterTypes = ['select', 'text'];

  submitting = false;
  submitError: string | null = null;
  generationStage: string = '';
  generated: GeneratedDocs | null = null;
  isEditingRegeneration = false;

  /** Identity-step intake mode (spec placeholder vs manual form). */
  specInputMode: 'spec' | 'manual' = 'manual';
  specDraftText = '';
  specDraftFileName = '';
  specFile: File | null = null;
  isSpecDragActive = false;
  specFileValidationMessage: string | null = null;
  readonly specAcceptedExtensions = ['md', 'txt'];

  /** Spec compile (AI parse) state. */
  specParsing = false;
  specParseError: string | null = null;
  parsedSpecPayload: Record<string, unknown> | null = null;
  private specPollTimerId: number | null = null;
  private specNon200PollFailures = 0;

  /** Apply-with-agent UX state (post-generation). */
  applyConfirmationOpen = false;
  applyAcknowledged = false;
  applyInProgress = false;
  applyError: string | null = null;
  applyResult: Record<string, unknown> | null = null;
  applyOwner = 'cisco-it-finance';
  applyRepo = 'rev-ops-monitoring';
  applyBaseBranch = 'develop';

  /** Whether the user has copied or downloaded at least one generated doc. */
  docsSaved = false;
  /** Whether the in-page "unsaved changes" warning banner is visible. */
  leaveWarningDismissed = false;
  private pollTimerId: number | null = null;
  private non200PollFailures = 0;

  constructor(
    private fb: FormBuilder,
    private authService: AuthenticationService,
    public themeService: ThemeService,
  ) {}

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedGeneratedDocs) {
      event.preventDefault();
      // Legacy browsers require returnValue to be set to trigger the prompt.
      event.returnValue = '';
    }
  }

  /** True while generated docs exist that the user has not copied or downloaded. */
  get hasUnsavedGeneratedDocs(): boolean {
    return !!this.generated && !this.docsSaved;
  }

  /** Whether the in-page leave warning banner should be shown. */
  get showLeaveWarning(): boolean {
    return !!this.generated && !this.leaveWarningDismissed;
  }

  dismissLeaveWarning(): void {
    this.leaveWarningDismissed = true;
  }
  userId: string;
  ngOnInit(): void {
    this.userId = this.authService.getUserID();
    this.form = this.fb.group({
      componentName: ['', [Validators.required, Validators.maxLength(60)]],
      featureName: [
        '',
        [Validators.required, Validators.pattern(KEBAB_PATTERN)],
      ],
      roleName: [
        '',
        [Validators.required, Validators.pattern(UPPER_SNAKE_PATTERN)],
      ],
      assignmentUsersKey: ['', [Validators.required]],
      queries: this.fb.group({
        summary: ['', [Validators.required]],
        details: ['', [Validators.required]],
        detailsFiltered: ['', [Validators.required]],
        summaryUpdate: ['', [Validators.required]],
      }),
      summaryColumns: this.fb.array(
        Array.from({ length: 5 }, () => this.createColumnControl()),
        [this.minNonEmpty(5)],
      ),
      detailsTableFilters: this.fb.array([this.createFilterGroup()]),
      paramAliases: this.fb.array([]),
    });

    this.applyManualDefaults();

    this.restorePersistedCodegenState();
  }

  ngOnDestroy(): void {
    this.clearPollTimer();
    this.clearSpecPollTimer();
  }

  private resolveApiUrl(rawUrl: string): string {
    const normalized = (rawUrl || '').trim().replace(/\/+$/, '');
    if (!normalized) return '';

    // Python endpoint is fixed: /api/dashboard-codegen
    if (/\/api\/dashboard-codegen$/i.test(normalized)) {
      return normalized;
    }
    if (/\/api$/i.test(normalized)) {
      return `${normalized}/dashboard-codegen`;
    }
    return `${normalized}/api/dashboard-codegen`;
  }

  private resolveApplyApiUrl(rawUrl: string): string {
    const codegenUrl = this.resolveApiUrl(rawUrl);
    if (!codegenUrl) return '';
    return `${codegenUrl.replace(/\/+$/, '')}/apply-with-agent`;
  }

  private resolveJobsApiUrl(rawUrl: string): string {
    const codegenUrl = this.resolveApiUrl(rawUrl);
    if (!codegenUrl) return '';
    return `${codegenUrl.replace(/\/+$/, '')}/jobs`;
  }

  private resolveJobStatusApiUrl(rawUrl: string, sessionId: string): string {
    const jobsUrl = this.resolveJobsApiUrl(rawUrl);
    if (!jobsUrl || !sessionId.trim()) return '';
    return `${jobsUrl}/${encodeURIComponent(sessionId.trim())}`;
  }

  private resolveSpecCompileApiUrl(rawUrl: string): string {
    const codegenUrl = this.resolveApiUrl(rawUrl);
    if (!codegenUrl) return '';
    // Sibling of /api/dashboard-codegen -> /api/dashboard-spec/compile
    return `${codegenUrl.replace(/\/dashboard-codegen$/i, '')}/dashboard-spec/compile`;
  }

  private resolveSpecCompileJobsApiUrl(rawUrl: string): string {
    const compileUrl = this.resolveSpecCompileApiUrl(rawUrl);
    if (!compileUrl) return '';
    return `${compileUrl.replace(/\/+$/, '')}/jobs`;
  }

  private resolveSpecCompileJobStatusApiUrl(
    rawUrl: string,
    sessionId: string,
  ): string {
    const jobsUrl = this.resolveSpecCompileJobsApiUrl(rawUrl);
    if (!jobsUrl || !sessionId.trim()) return '';
    return `${jobsUrl}/${encodeURIComponent(sessionId.trim())}`;
  }

  // ── typed getters ──────────────────────────────────────────
  get summaryColumns(): FormArray {
    return this.form.get('summaryColumns') as FormArray;
  }

  get detailsTableFilters(): FormArray {
    return this.form.get('detailsTableFilters') as FormArray;
  }

  get paramAliases(): FormArray {
    return this.form.get('paramAliases') as FormArray;
  }

  get queries(): FormGroup {
    return this.form.get('queries') as FormGroup;
  }

  // ── factory helpers ────────────────────────────────────────
  private createColumnControl() {
    return this.fb.control('', [Validators.pattern(FLEX_SNAKE_PATTERN)]);
  }

  private createFilterGroup(): FormGroup {
    return this.fb.group({
      columnName: [
        '',
        [Validators.required, Validators.pattern(FLEX_SNAKE_PATTERN)],
      ],
      type: ['select', [Validators.required]],
    });
  }

  private createAliasGroup(): FormGroup {
    return this.fb.group({
      updateColumn: ['', [Validators.required]],
      summaryColumn: ['', [Validators.required]],
    });
  }

  private applyManualDefaults(): void {
    this.form.patchValue({
      componentName: DEFAULT_MANUAL_FORM_VALUES.componentName,
      featureName: DEFAULT_MANUAL_FORM_VALUES.featureName,
      roleName: DEFAULT_MANUAL_FORM_VALUES.roleName,
      assignmentUsersKey: DEFAULT_MANUAL_FORM_VALUES.assignmentUsersKey,
      queries: {
        summary: DEFAULT_MANUAL_FORM_VALUES.queries.summary,
        details: DEFAULT_MANUAL_FORM_VALUES.queries.details,
        detailsFiltered: DEFAULT_MANUAL_FORM_VALUES.queries.detailsFiltered,
        summaryUpdate: DEFAULT_MANUAL_FORM_VALUES.queries.summaryUpdate,
      },
    });

    this.summaryColumns.clear();
    DEFAULT_MANUAL_FORM_VALUES.summaryColumns.forEach((value) => {
      const control = this.createColumnControl();
      control.setValue(value);
      this.summaryColumns.push(control);
    });

    this.detailsTableFilters.clear();
    DEFAULT_MANUAL_FORM_VALUES.detailsTableFilters.forEach((filter) => {
      const group = this.createFilterGroup();
      group.patchValue({
        columnName: filter.columnName,
        type: filter.type,
      });
      this.detailsTableFilters.push(group);
    });

    this.paramAliases.clear();

    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  // ── dynamic row management ─────────────────────────────────
  addSummaryColumn(): void {
    this.summaryColumns.push(this.createColumnControl());
  }

  removeSummaryColumn(index: number): void {
    if (this.summaryColumns.length > 5) {
      this.summaryColumns.removeAt(index);
    }
  }

  addFilter(): void {
    this.detailsTableFilters.push(this.createFilterGroup());
  }

  removeFilter(index: number): void {
    if (this.detailsTableFilters.length > 1) {
      this.detailsTableFilters.removeAt(index);
    }
  }

  addAlias(): void {
    this.paramAliases.push(this.createAliasGroup());
  }

  removeAlias(index: number): void {
    this.paramAliases.removeAt(index);
  }

  // ── validators ─────────────────────────────────────────────
  private minNonEmpty(min: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const arr = control as FormArray;
      const filled = arr.controls.filter(
        (c) => (c.value ?? '').toString().trim().length > 0,
      ).length;
      return filled >= min
        ? null
        : { minNonEmpty: { required: min, actual: filled } };
    };
  }

  // ── step navigation ────────────────────────────────────────
  goToStep(index: number): void {
    if (index < 0 || index >= this.activeSteps.length) return;
    if (!this.canAccessStep(index)) return;
    this.currentStep = index;
  }

  nextStep(): void {
    if (this.currentStep >= this.activeSteps.length - 1) return;
    if (!this.canProceedFromCurrent()) return;
    this.currentStep++;
  }

  prevStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  /** Whether every control belonging to the given step passes validation. */
  isStepValid(index: number): boolean {
    const key = this.activeSteps[index]?.key;
    switch (key) {
      case 'upload-spec':
        return this.hasSpecDraft;
      case 'review-spec':
        return true;
      case 'identity':
        return (
          this.controlValid('componentName') &&
          this.controlValid('featureName') &&
          this.controlValid('roleName') &&
          this.controlValid('assignmentUsersKey')
        );
      case 'queries':
        return this.queries.valid;
      case 'columns':
        return this.summaryColumns.valid && this.detailsTableFilters.valid;
      case 'advanced':
        return this.paramAliases.valid;
      default:
        return true;
    }
  }

  /**
   * "Advanced" is optional and should not block moving to the next step.
   */
  private isBlockingStep(index: number): boolean {
    return this.activeSteps[index]?.key !== 'advanced';
  }

  /**
   * Whether the current step can move forward.
   */
  canProceedFromCurrent(): boolean {
    return (
      !this.isBlockingStep(this.currentStep) ||
      this.isStepValid(this.currentStep)
    );
  }

  /**
   * Sequential gate:
   * - Backward navigation is always allowed.
   * - Moving forward is allowed only if all prior blocking steps are valid.
   * - Advanced is explicitly non-blocking.
   */
  canAccessStep(targetIndex: number): boolean {
    if (targetIndex <= this.currentStep) return true;

    for (let i = 0; i < targetIndex; i++) {
      if (this.isBlockingStep(i) && !this.isStepValid(i)) {
        return false;
      }
    }

    return true;
  }

  private controlValid(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.valid;
  }

  hasError(control: AbstractControl | null, error: string): boolean {
    return !!control && control.touched && control.hasError(error);
  }

  get hasSpecDraft(): boolean {
    return !!this.specDraftText.trim() || !!this.specDraftFileName.trim();
  }

  setSpecInputMode(mode: 'spec' | 'manual'): void {
    this.specInputMode = mode;
    if (mode !== 'spec') {
      this.isSpecDragActive = false;
    }
  }

  onSpecTextInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement | null;
    this.specDraftText = (target?.value || '').toString();
  }

  onSpecFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0];
    this.assignSpecFile(file || null);
  }

  onSpecDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isSpecDragActive = true;
  }

  onSpecDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isSpecDragActive = false;
  }

  onSpecDrop(event: DragEvent): void {
    event.preventDefault();
    this.isSpecDragActive = false;
    const file = event.dataTransfer?.files?.[0] || null;
    this.assignSpecFile(file);
  }

  clearSpecDraft(): void {
    this.clearSpecPollTimer();
    this.specParsing = false;
    this.specDraftText = '';
    this.specDraftFileName = '';
    this.specFile = null;
    this.specFileValidationMessage = null;
    this.specParseError = null;
    this.parsedSpecPayload = null;
  }

  get hasParsedSpec(): boolean {
    return !!this.parsedSpecPayload;
  }

  /**
   * Uploads the spec (attached file or pasted content) to the AI compile
   * job endpoint, receives a session id, and polls for the extracted payload.
   * On success the reactive form is populated and the wizard advances to the
   * review-spec step for human verification.
   */
  async parseSpec(): Promise<void> {
    if (this.specParsing) return;

    const jobsUrl = this.resolveSpecCompileJobsApiUrl(
      this.authService.getControlTowerSupportAgentApiUrl() || '',
    );
    if (!jobsUrl) {
      this.specParseError =
        'Spec compile API URL is unavailable from user context. Please refresh and try again.';
      return;
    }

    let sourceBlob: Blob;
    if (this.specFile) {
      sourceBlob = this.specFile;
    } else if (this.specDraftText.trim()) {
      sourceBlob = new Blob([this.specDraftText], { type: 'text/markdown' });
    } else {
      this.specParseError =
        'Attach a document or paste spec content before parsing.';
      return;
    }

    // The compile endpoint requires a Markdown (.md) filename; wrap non-.md
    // sources (pasted text or a .txt upload) into a spec.md payload.
    const originalName = this.specFile?.name || 'spec.md';
    const uploadName = originalName.toLowerCase().endsWith('.md')
      ? originalName
      : 'spec.md';

    const formData = new FormData();
    formData.append('file', sourceBlob, uploadName);

    this.specParsing = true;
    this.specParseError = null;
    this.specNon200PollFailures = 0;
    this.clearSpecPollTimer();

    try {
      const response = await fetch(jobsUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await this.extractSpecCompileError(response));
      }

      const data = (await response.json()) as Record<string, unknown>;
      const sessionId =
        typeof data['sessionId'] === 'string' ? data['sessionId'].trim() : '';
      if (!sessionId) {
        throw new Error('Spec compile job did not return a session ID.');
      }

      void this.pollSpecCompileJob(sessionId);
    } catch (err) {
      this.specParsing = false;
      this.specParseError =
        err instanceof Error
          ? err.message
          : 'Failed to parse the specification. Please try again.';
    }
  }

  private clearSpecPollTimer(): void {
    if (this.specPollTimerId !== null) {
      window.clearTimeout(this.specPollTimerId);
      this.specPollTimerId = null;
    }
  }

  private scheduleNextSpecPoll(sessionId: string): void {
    this.clearSpecPollTimer();
    this.specPollTimerId = window.setTimeout(() => {
      void this.pollSpecCompileJob(sessionId);
    }, CODEGEN_POLL_INTERVAL_MS);
  }

  /** Polls the spec-compile job until it is parsed or fails. */
  private async pollSpecCompileJob(sessionId: string): Promise<void> {
    const statusUrl = this.resolveSpecCompileJobStatusApiUrl(
      this.authService.getControlTowerSupportAgentApiUrl() || '',
      sessionId,
    );
    if (!statusUrl) {
      this.specParsing = false;
      this.specParseError =
        'Spec compile status URL is unavailable from user context. Please refresh and try again.';
      return;
    }

    try {
      const response = await fetch(statusUrl, { method: 'GET' });
      const raw = await response.text();
      const data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};

      if (!response.ok) {
        this.specNon200PollFailures += 1;
        if (this.specNon200PollFailures > CODEGEN_MAX_NON_200_POLL_RETRIES) {
          this.specParsing = false;
          this.clearSpecPollTimer();
          this.specParseError =
            'Unable to reconnect to spec parse status after multiple attempts. Please try again.';
          return;
        }
        throw new Error(
          (typeof data['detail'] === 'string' && data['detail']) ||
            `Status request failed (${response.status} ${response.statusText}).`,
        );
      }

      this.specNon200PollFailures = 0;
      const status = typeof data['status'] === 'string' ? data['status'] : '';

      if (status === 'parsed') {
        const payload =
          data['result'] && typeof data['result'] === 'object'
            ? (data['result'] as Record<string, unknown>)
            : null;
        this.clearSpecPollTimer();
        this.specParsing = false;
        if (!payload) {
          this.specParseError =
            'Spec parse completed but returned no payload. Please try again.';
          return;
        }
        this.parsedSpecPayload = payload;
        this.applyParsedSpecToForm(payload);
        this.currentStep = this.specSteps.findIndex(
          (s) => s.key === 'review-spec',
        );
        return;
      }

      if (status === 'failed') {
        this.clearSpecPollTimer();
        this.specParsing = false;
        this.specParseError = this.formatSpecJobError(data['error']);
        return;
      }

      // Still pending — keep polling.
      this.specParsing = true;
      this.scheduleNextSpecPoll(sessionId);
    } catch {
      // Transient error — keep the spinner and retry.
      this.specParsing = true;
      this.scheduleNextSpecPoll(sessionId);
    }
  }

  /** Normalizes a spec job error (plain string or serialized detail object). */
  private formatSpecJobError(error: unknown): string {
    if (typeof error !== 'string' || !error.trim()) {
      return 'Failed to parse the specification. Please try again.';
    }
    try {
      const parsed = JSON.parse(error) as Record<string, unknown>;
      const message = [parsed['message'], parsed['error']]
        .filter((part) => typeof part === 'string')
        .join(' ');
      if (message.trim()) return message;
    } catch {
      // not JSON — use as-is
    }
    return error;
  }

  private async extractSpecCompileError(response: Response): Promise<string> {
    try {
      const body = await response.json();
      const detail = (body as Record<string, unknown>)?.['detail'];
      if (typeof detail === 'string') return detail;
      if (detail && typeof detail === 'object') {
        const d = detail as Record<string, unknown>;
        const message = [d['message'], d['error']]
          .filter((part) => typeof part === 'string')
          .join(' ');
        if (message.trim()) return message;
      }
    } catch {
      // fall through to status text
    }
    return `Spec parse failed (${response.status} ${response.statusText}).`;
  }

  /** Populates the reactive form from an AI-parsed onboarding payload. */
  private applyParsedSpecToForm(payload: Record<string, unknown>): void {
    const queries = (payload['queries'] as Record<string, string>) || {};

    this.form.patchValue({
      componentName: (payload['componentName'] as string) || '',
      featureName: (payload['featureName'] as string) || '',
      roleName: (payload['roleName'] as string) || '',
      assignmentUsersKey: (payload['assignmentUsersKey'] as string) || '',
      queries: {
        summary: queries['summary'] || '',
        details: queries['details'] || '',
        detailsFiltered: queries['detailsFiltered'] || '',
        summaryUpdate: queries['summaryUpdate'] || '',
      },
    });

    const cols = Array.isArray(payload['summaryColumns'])
      ? (payload['summaryColumns'] as string[])
      : [];
    this.summaryColumns.clear();
    const colCount = Math.max(cols.length, 5);
    for (let i = 0; i < colCount; i++) {
      const ctrl = this.createColumnControl();
      ctrl.setValue(cols[i] ?? '');
      this.summaryColumns.push(ctrl);
    }

    const filters = Array.isArray(payload['detailsTableFilters'])
      ? (payload['detailsTableFilters'] as {
          columnName: string;
          type: string;
        }[])
      : [];
    this.detailsTableFilters.clear();
    if (filters.length === 0) {
      this.detailsTableFilters.push(this.createFilterGroup());
    } else {
      filters.forEach((f) => {
        const group = this.createFilterGroup();
        group.patchValue({
          columnName: f.columnName ?? '',
          type: f.type === 'text' ? 'text' : 'select',
        });
        this.detailsTableFilters.push(group);
      });
    }

    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  useSampleSpec(): void {
    this.specDraftText = [
      '# Exception Monitoring Spec (Demo)',
      '',
      'Dashboard Name: AIT Jobs',
      'Component Name: ait-monitoring',
      'Role Name: AIT_JOBS',
      'Assignment Users Key: AIT_USERS',
      '',
      'Summary Query: SELECT ...',
      'Details Query: SELECT ...',
      'Details Filtered Query: SELECT ... WHERE ...',
      'Summary Update Query: UPDATE ...',
    ].join('\n');
  }

  continueWithManualEntry(): void {
    this.enterManualMode();
  }

  enterManualMode(): void {
    this.onboardingMode = 'manual';
    this.currentStep = 0;
  }

  returnToSpecMode(): void {
    this.onboardingMode = 'spec';
    this.currentStep = 0;
  }

  private assignSpecFile(file: File | null): void {
    if (!file) {
      this.specDraftFileName = '';
      this.specFile = null;
      this.specFileValidationMessage = null;
      return;
    }

    const extension = this.getFileExtension(file.name);
    if (!this.specAcceptedExtensions.includes(extension)) {
      this.specDraftFileName = '';
      this.specFile = null;
      this.specFileValidationMessage =
        'Unsupported file type. Use .md or .txt.';
      return;
    }

    this.specDraftFileName = file.name;
    this.specFile = file;
    this.specFileValidationMessage = null;
    this.specParseError = null;
  }

  private getFileExtension(fileName: string): string {
    const parts = (fileName || '').toLowerCase().split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  // ── payload assembly ───────────────────────────────────────
  buildPayload(): Record<string, unknown> {
    const raw = this.form.getRawValue();

    const summaryColumns: string[] = (raw.summaryColumns as string[])
      .map((c) => (c ?? '').trim())
      .filter((c) => c.length > 0);

    const paramAliases: Record<string, string> = {};
    for (const alias of raw.paramAliases as {
      updateColumn: string;
      summaryColumn: string;
    }[]) {
      const key = (alias.updateColumn ?? '').trim();
      const value = (alias.summaryColumn ?? '').trim();
      if (key && value) {
        paramAliases[key] = value;
      }
    }

    return {
      componentName: (raw.componentName as string).trim(),
      featureName: (raw.featureName as string).trim(),
      roleName: (raw.roleName as string).trim(),
      assignmentUsersKey: (raw.assignmentUsersKey as string).trim(),
      userName: this.authService.getUserID() || null,
      userEmail: this.authService.getUserID()
        ? `${this.authService.getUserID()}@cisco.com`
        : null,
      queries: {
        summary: (raw.queries.summary as string).trim(),
        details: (raw.queries.details as string).trim(),
        detailsFiltered: (raw.queries.detailsFiltered as string).trim(),
        summaryUpdate: (raw.queries.summaryUpdate as string).trim(),
      },
      summaryColumns,
      detailsTableFilters: (
        raw.detailsTableFilters as {
          columnName: string;
          type: string;
        }[]
      ).map((f) => ({
        columnName: (f.columnName ?? '').trim(),
        type: f.type,
      })),
      paramAliases,
    };
  }

  get payloadPreview(): string {
    return JSON.stringify(this.buildPayload(), null, 2);
  }

  /**
   * Normalizes backend response shapes so the renderer can keep using
   * `generated.backend` / `generated.ui` exactly as before.
   */
  private mapGeneratedDocsResponse(
    data: Record<string, unknown>,
  ): GeneratedDocs {
    const backendRaw =
      data['backendDocument'] ??
      data['backend_document'] ??
      data['backendDoc'] ??
      data['backend'];
    const uiRaw =
      data['uiDocument'] ?? data['ui_document'] ?? data['uiDoc'] ?? data['ui'];

    const backend = typeof backendRaw === 'string' ? backendRaw : '';
    const ui = typeof uiRaw === 'string' ? uiRaw : '';

    const backendHandoffRaw = data['backendHandoff'] ?? data['backend_handoff'];
    const backendHandoff =
      backendHandoffRaw && typeof backendHandoffRaw === 'object'
        ? (backendHandoffRaw as Record<string, unknown>)
        : {};

    const fileOperationsRaw = data['fileOperations'] ?? data['file_operations'];
    const fileOperations = Array.isArray(fileOperationsRaw)
      ? fileOperationsRaw
      : [];

    const sessionIdRaw =
      data['sessionId'] ?? data['session_id'] ?? backendHandoff['sessionId'];
    const sessionId = typeof sessionIdRaw === 'string' ? sessionIdRaw : null;

    return {
      ...data,
      sessionId,
      backendDocument: backend,
      uiDocument: ui,
      // Keep old keys for current UI binding/parsers.
      backend,
      ui,
      backendHandoff,
      fileOperations,
    };
  }

  private persistCodegenJobState(state: PersistedCodegenJobState): void {
    try {
      localStorage.setItem(CODEGEN_JOB_STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* localStorage unavailable */
    }
  }

  private readPersistedCodegenJobState(): PersistedCodegenJobState | null {
    try {
      const raw = localStorage.getItem(CODEGEN_JOB_STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const sessionId =
        typeof parsed['sessionId'] === 'string'
          ? parsed['sessionId'].trim()
          : '';
      const status =
        typeof parsed['status'] === 'string' ? parsed['status'] : '';

      if (
        !sessionId ||
        !['pending', 'generated', 'applied', 'failed'].includes(status)
      ) {
        return null;
      }

      return {
        sessionId,
        status: status as PersistedCodegenJobState['status'],
        generated:
          parsed['generated'] && typeof parsed['generated'] === 'object'
            ? (parsed['generated'] as GeneratedDocs)
            : null,
        error: typeof parsed['error'] === 'string' ? parsed['error'] : null,
      };
    } catch {
      return null;
    }
  }

  private clearPersistedCodegenJobState(): void {
    try {
      localStorage.removeItem(CODEGEN_JOB_STORAGE_KEY);
    } catch {
      /* localStorage unavailable */
    }
  }

  private clearPollTimer(): void {
    if (this.pollTimerId !== null) {
      window.clearTimeout(this.pollTimerId);
      this.pollTimerId = null;
    }
  }

  private scheduleNextPoll(sessionId: string): void {
    this.clearPollTimer();
    this.pollTimerId = window.setTimeout(() => {
      void this.pollCodegenJob(sessionId);
    }, CODEGEN_POLL_INTERVAL_MS);
  }

  private restorePersistedCodegenState(): void {
    const persisted = this.readPersistedCodegenJobState();
    if (!persisted) return;

    if (
      persisted.generated &&
      (persisted.status === 'generated' || persisted.status === 'applied')
    ) {
      this.generated = persisted.generated;
      this.submitError = null;
      this.submitting = false;
      this.generationStage = '';
      this.isEditingRegeneration = false;
      return;
    }

    if (persisted.status === 'pending') {
      this.non200PollFailures = 0;
      this.submitting = true;
      this.submitError = null;
      this.generationStage = 'Resuming generation from saved job…';
      void this.pollCodegenJob(persisted.sessionId);
      return;
    }

    if (persisted.status === 'failed' && persisted.error) {
      this.submitError = persisted.error;
      this.clearPersistedCodegenJobState();
    }
  }

  private handleCompletedJob(
    sessionId: string,
    data: Record<string, unknown>,
  ): void {
    const rawResult =
      data['result'] && typeof data['result'] === 'object'
        ? (data['result'] as Record<string, unknown>)
        : data;

    const generated = this.mapGeneratedDocsResponse({
      ...rawResult,
      sessionId,
    });

    this.generated = generated;
    this.submitting = false;
    this.submitError = null;
    this.generationStage = '';
    this.isEditingRegeneration = false;
    this.clearPollTimer();
    this.clearPersistedCodegenJobState();
  }

  private async pollCodegenJob(sessionId: string): Promise<void> {
    const statusUrl = this.resolveJobStatusApiUrl(
      this.authService.getControlTowerSupportAgentApiUrl() || '',
      sessionId,
    );

    if (!statusUrl) {
      this.submitting = false;
      this.generationStage = '';
      this.submitError =
        'Code-generation status URL is unavailable from user context. Please refresh and try again.';
      return;
    }

    try {
      const response = await fetch(statusUrl, { method: 'GET' });
      const raw = await response.text();
      const data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};

      if (!response.ok) {
        this.non200PollFailures += 1;
        if (this.non200PollFailures > CODEGEN_MAX_NON_200_POLL_RETRIES) {
          this.submitting = false;
          this.generationStage = '';
          this.submitError =
            'Unable to reconnect to generation status after multiple attempts. Please click Start over and try again.';
          this.clearPollTimer();
          this.clearPersistedCodegenJobState();
          return;
        }

        const message =
          (typeof data['detail'] === 'string' && data['detail']) ||
          `Status request failed (${response.status} ${response.statusText}).`;
        throw new Error(message);
      }

      this.non200PollFailures = 0;
      const status = typeof data['status'] === 'string' ? data['status'] : '';

      if (status === 'generated' || status === 'applied') {
        this.handleCompletedJob(sessionId, data);
        return;
      }

      if (status === 'failed') {
        const error =
          (typeof data['error'] === 'string' && data['error']) ||
          'Dashboard code generation failed.';
        this.submitting = false;
        this.generationStage = '';
        this.submitError = error;
        this.clearPollTimer();
        this.persistCodegenJobState({
          sessionId,
          status: 'failed',
          generated: null,
          error,
        });
        return;
      }

      this.submitting = true;
      this.submitError = null;
      this.generationStage =
        'Generating your implementation guide… This can take a minute or two.';
      this.persistCodegenJobState({
        sessionId,
        status: 'pending',
        generated: null,
        error: null,
      });
      this.scheduleNextPoll(sessionId);
    } catch {
      this.submitting = true;
      this.generationStage = 'Still generating… reconnecting to job status…';
      this.scheduleNextPoll(sessionId);
    }
  }

  get canStartApplyWithAgent(): boolean {
    if (!this.generated) return false;
    return (
      Array.isArray(this.generated.fileOperations) &&
      this.generated.fileOperations.length > 0
    );
  }

  get applySucceeded(): boolean {
    return this.applyResult?.['ok'] === true;
  }

  get applyStage(): string {
    const value = this.applyResult?.['stage'];
    return typeof value === 'string' ? value : '';
  }

  get applyPrUrl(): string | null {
    const value = this.applyResult?.['prUrl'];
    return typeof value === 'string' && value.trim() ? value : null;
  }

  get applyBranch(): string | null {
    const value = this.applyResult?.['branch'];
    return typeof value === 'string' && value.trim() ? value : null;
  }

  get applyResultError(): string | null {
    const value = this.applyResult?.['error'];
    return typeof value === 'string' && value.trim() ? value : null;
  }

  get applyChangedFileCount(): number | null {
    const value = this.applyResult?.['changedFileCount'];
    return typeof value === 'number' ? value : null;
  }

  openApplyConfirmation(): void {
    if (!this.canStartApplyWithAgent || this.applyInProgress) return;
    this.applyError = null;
    this.applyAcknowledged = false;
    this.applyConfirmationOpen = true;
  }

  cancelApplyConfirmation(): void {
    this.applyConfirmationOpen = false;
    this.applyAcknowledged = false;
  }

  private resetApplyState(): void {
    this.applyConfirmationOpen = false;
    this.applyAcknowledged = false;
    this.applyInProgress = false;
    this.applyError = null;
    this.applyResult = null;
  }

  async confirmApplyAndProceed(): Promise<void> {
    if (!this.applyAcknowledged || this.applyInProgress) return;

    const resolvedApplyUrl = this.resolveApplyApiUrl(
      this.authService.getControlTowerSupportAgentApiUrl() || '',
    );
    if (!resolvedApplyUrl) {
      this.applyError =
        'Apply endpoint is unavailable from user context. Please refresh and try again.';
      return;
    }

    if (!this.generated) {
      this.applyError =
        'No generated output found. Generate backend/frontend documents first.';
      return;
    }

    const backendDocument =
      (this.generated.backendDocument || this.generated.backend || '') + '';
    const uiDocument =
      (this.generated.uiDocument || this.generated.ui || '') + '';
    const backendHandoff =
      this.generated.backendHandoff &&
      typeof this.generated.backendHandoff === 'object'
        ? this.generated.backendHandoff
        : {};
    const fileOperations = Array.isArray(this.generated.fileOperations)
      ? this.generated.fileOperations
      : [];

    if (!fileOperations.length) {
      this.applyError =
        'No file operations were generated. Regenerate the documents and try again.';
      return;
    }

    const payload = {
      owner: this.applyOwner.trim(),
      repo: this.applyRepo.trim(),
      baseBranch: this.applyBaseBranch.trim() || 'develop',
      dryRun: false,
      backendDocument,
      uiDocument,
      backendHandoff,
      fileOperations,
    };

    this.applyInProgress = true;
    this.applyError = null;
    this.applyResult = null;
    this.applyConfirmationOpen = false;

    try {
      const response = await fetch(resolvedApplyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const raw = await response.text();
      const data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      this.applyResult = data;

      if (!response.ok) {
        const message =
          (typeof data['error'] === 'string' && data['error']) ||
          `Apply request failed (${response.status} ${response.statusText}).`;
        throw new Error(message);
      }

      if (data['ok'] !== true) {
        const stage =
          typeof data['stage'] === 'string' && data['stage']
            ? `[${data['stage']}] `
            : '';
        const error =
          typeof data['error'] === 'string' && data['error']
            ? data['error']
            : 'Apply flow did not complete successfully.';
        this.applyError = `${stage}${error}`;
      }
    } catch (err) {
      this.applyError =
        err instanceof Error
          ? err.message
          : 'Unexpected error while applying generated code.';
    } finally {
      this.applyInProgress = false;
      this.applyAcknowledged = false;
    }
  }

  // ── submit ─────────────────────────────────────────────────
  async submit(): Promise<void> {
    if (this.onboardingMode === 'spec' && !this.parsedSpecPayload) {
      this.submitError =
        'Parse a spec first, or click Enter manually to continue.';
      return;
    }

    const resolvedJobsUrl = this.resolveJobsApiUrl(
      this.authService.getControlTowerSupportAgentApiUrl() || '',
    );
    if (!resolvedJobsUrl) {
      this.submitError =
        'Code-generation API URL is unavailable from user context. Please refresh and try again.';
      this.currentStep = this.manualSteps.findIndex((s) => s.key === 'review');
      return;
    }

    this.form.markAllAsTouched();
    if (this.form.invalid) {
      // Jump to the first invalid step for the user.
      for (let i = 0; i < this.activeSteps.length; i++) {
        if (!this.isStepValid(i)) {
          this.currentStep = i;
          break;
        }
      }
      return;
    }

    this.submitting = true;
    this.submitError = null;
    this.generationStage = 'Queueing generation job…';
    this.non200PollFailures = 0;
    this.resetApplyState();
    this.docsSaved = false;
    this.leaveWarningDismissed = false;
    this.clearPollTimer();
    this.clearPersistedCodegenJobState();

    try {
      const payload = this.buildPayload();
      const response = await fetch(resolvedJobsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(
          `Request failed (${response.status} ${response.statusText}). ${text}`,
        );
      }

      const data = (await response.json()) as Record<string, unknown>;
      const sessionId =
        typeof data['sessionId'] === 'string' ? data['sessionId'].trim() : '';
      if (!sessionId) {
        throw new Error('Code-generation job did not return a session ID.');
      }

      this.persistCodegenJobState({
        sessionId,
        status: 'pending',
        generated: null,
        error: null,
      });
      this.generationStage = 'Generating your implementation guide…';
      void this.pollCodegenJob(sessionId);
    } catch (err) {
      this.submitError =
        err instanceof Error
          ? err.message
          : 'Unexpected error while contacting the code-generation service.';
      this.submitting = false;
      this.generationStage = '';
    } finally {
      if (!this.submitError) {
        return;
      }
    }
  }

  async copyToClipboard(text?: string): Promise<void> {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      this.docsSaved = true;
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  }

  async copyCodeBlock(lines: string[]): Promise<void> {
    if (!lines?.length) return;
    await this.copyToClipboard(lines.join('\n'));
  }

  get backendBlocks(): DocBlock[] {
    return this.parseDocument(this.generated?.backend, 'backend');
  }

  get frontendBlocks(): DocBlock[] {
    return this.parseDocument(this.generated?.ui, 'frontend');
  }

  get backendOutline(): DocumentOutlineItem[] {
    return this.buildDocumentOutline(this.generated?.backend, 'backend');
  }

  get frontendOutline(): DocumentOutlineItem[] {
    return this.buildDocumentOutline(this.generated?.ui, 'frontend');
  }

  scrollToDocumentSection(kind: 'backend' | 'frontend', id: string): void {
    const container = document.querySelector(
      `[data-doc-kind="${kind}"] .mo-doc-surface`,
    ) as HTMLElement | null;
    const target = document.querySelector(
      `[data-doc-kind="${kind}"] #${id}`,
    ) as HTMLElement | null;

    if (!container || !target) return;

    container.scrollTo({
      top: Math.max(target.offsetTop - 56, 0),
      behavior: 'smooth',
    });
  }

  downloadGeneratedDoc(kind: 'backend' | 'frontend'): void {
    const content = this.buildDownloadMarkdown(kind);
    if (!content) return;

    const fileName =
      kind === 'backend'
        ? `${this.getDownloadBaseName()}-backend-onboarding.md`
        : `${this.getDownloadBaseName()}-frontend-onboarding.md`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    this.docsSaved = true;
  }

  private buildDownloadMarkdown(kind: 'backend' | 'frontend'): string {
    const raw =
      kind === 'backend' ? this.generated?.backend : this.generated?.ui;
    if (!raw) return '';

    const sectionTitle =
      kind === 'backend'
        ? 'Backend Onboarding Guide'
        : 'Frontend Onboarding Guide';

    const componentName =
      ((this.generated?.backendHandoff?.['componentName'] as string) ||
        this.form?.get('componentName')?.value ||
        'Component') + '';
    const featureName =
      ((this.generated?.backendHandoff?.['featureName'] as string) ||
        this.form?.get('featureName')?.value ||
        'feature') + '';

    const normalized = this.prepareDocumentLines(raw).join('\n');

    return [
      `# ${sectionTitle}`,
      '',
      `> Generated for **${componentName}** using feature **${featureName}**.`,
      '',
      '---',
      '',
      normalized,
    ].join('\n');
  }

  /**
   * Headings whose sections should be hidden from the rendered UI (they are
   * internal notes / reference material not meant for the reader).
   */
  private readonly EXCLUDED_SECTION_PATTERNS: RegExp[] = [
    /naming\s+reference\s+card/i,
    /input\s+binding\s+reference/i,
    /internal\s+note/i,
    /internal\s+only/i,
    /implementation\s+checklist/i,
    /(?:^|\b)(?:notes?|end\s+of\s+document)(?:\b|:)/i,
  ];

  private isExcludedHeading(text: string): boolean {
    return this.EXCLUDED_SECTION_PATTERNS.some((re) => re.test(text));
  }

  /**
   * Parses raw markdown into a typed block model that the template renders
   * natively (no innerHTML). Handles headings, paragraphs, ordered/unordered
   * lists, task checklists, fenced code (with language), blockquote callouts,
   * pipe tables, horizontal rules, and standalone bold lines as subheadings.
   */
  private parseDocument(
    rawText?: string,
    prefix: 'backend' | 'frontend' = 'backend',
  ): DocBlock[] {
    if (!rawText) return [];

    const lines = this.prepareDocumentLines(rawText);

    return this.parseBlocks(lines, prefix);
  }

  private parseBlocks(
    lines: string[],
    prefix: 'backend' | 'frontend',
  ): DocBlock[] {
    const blocks: DocBlock[] = [];
    let index = 0;

    while (index < lines.length) {
      const trimmed = lines[index].trim();

      if (!trimmed) {
        index++;
        continue;
      }

      // Fenced code block (captures language after the opening fence).
      const fence = trimmed.match(/^```([\w+-]*)\s*$/);
      if (fence) {
        const lang = fence[1] || '';
        const codeLines: string[] = [];
        index++;
        while (index < lines.length && !/^```/.test(lines[index].trim())) {
          codeLines.push(lines[index]);
          index++;
        }
        index++; // consume closing fence
        blocks.push({ kind: 'code', lang, lines: codeLines });
        continue;
      }

      // ATX heading.
      const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (heading) {
        const level = Math.min(heading[1].length, 6);
        const text = heading[2].trim();
        blocks.push({
          kind: 'heading',
          level,
          id: this.slugifyHeading(prefix, text),
          spans: this.parseInline(text),
        });
        index++;
        continue;
      }

      // Some agent responses flatten the first heading and paragraph into one
      // line (for example, "Overview This document..."). Restore the heading
      // as its own native block before rendering the body text.
      const inlineOverview = trimmed.match(/^Overview\s+(.+)$/i);
      if (inlineOverview) {
        blocks.push({
          kind: 'heading',
          level: 3,
          id: this.slugifyHeading(prefix, 'Overview'),
          spans: this.parseInline('Overview'),
        });
        blocks.push({
          kind: 'paragraph',
          spans: this.parseInline(inlineOverview[1]),
        });
        index++;
        continue;
      }

      // The frontend document emits "Copy to:" instructions as plain text
      // lines (not blockquotes). Detect and render as a copy callout so they
      // receive the same blue-background treatment as blockquote callouts.
      if (/^Copy to:/i.test(trimmed)) {
        blocks.push({
          kind: 'callout',
          tone: 'copy',
          blocks: [{ kind: 'paragraph', spans: this.parseInline(trimmed) }],
        });
        index++;
        continue;
      }

      // The frontend document emits its section titles ("Overview",
      // "Step 0 — Scaffold the component", etc.) as plain text lines rather
      // than Markdown headings. Promote those well-known titles to headings
      // so they render bold like the backend document.
      if (this.isPlainSectionTitle(trimmed)) {
        blocks.push({
          kind: 'heading',
          level: 3,
          id: this.slugifyHeading(prefix, trimmed),
          spans: this.parseInline(trimmed),
        });
        // Underline the promoted title with a divider, matching the backend
        // document where each section heading is followed by a rule.
        blocks.push({ kind: 'rule' });
        index++;
        continue;
      }

      // Horizontal rule.
      if (/^---+$/.test(trimmed)) {
        blocks.push({ kind: 'rule' });
        index++;
        continue;
      }

      // Blockquote callout (recursively parse inner content).
      if (/^>\s?/.test(trimmed)) {
        const inner: string[] = [];
        while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
          inner.push(lines[index].trim().replace(/^>\s?/, ''));
          index++;
        }
        const tone: 'copy' | 'note' = inner.some((line) =>
          /^Copy to:/i.test(line.trim()),
        )
          ? 'copy'
          : 'note';

        const parsedInnerBlocks = this.parseBlocks(inner, prefix);
        const normalizedInnerBlocks =
          tone === 'copy'
            ? parsedInnerBlocks.flatMap((block) =>
                block.kind === 'callout' && block.tone === 'copy'
                  ? block.blocks
                  : [block],
              )
            : parsedInnerBlocks;

        blocks.push({
          kind: 'callout',
          tone,
          blocks: normalizedInnerBlocks,
        });
        continue;
      }

      // Pipe table.
      if (this.isTableHeader(lines, index)) {
        const tableLines = [lines[index]];
        index += 2; // skip header + separator
        while (
          index < lines.length &&
          /^\|.*\|\s*$/.test(lines[index].trim())
        ) {
          tableLines.push(lines[index]);
          index++;
        }
        blocks.push(this.parseTable(tableLines));
        continue;
      }

      // The agent sometimes emits .properties assignments without a fenced
      // block. Keep their line breaks and render them as configuration code.
      if (this.isPropertiesAssignment(trimmed)) {
        const propertyLines: string[] = [];
        while (
          index < lines.length &&
          this.isPropertiesAssignment(lines[index].trim())
        ) {
          propertyLines.push(lines[index].trim());
          index++;
        }
        blocks.push({
          kind: 'code',
          lang: 'properties',
          lines: propertyLines,
        });
        continue;
      }

      // Task checklist (- [ ] / - [x]).
      if (/^[-*]\s+\[[ xX]\]\s+/.test(trimmed)) {
        const items: { done: boolean; spans: InlineSpan[] }[] = [];
        while (
          index < lines.length &&
          /^[-*]\s+\[[ xX]\]\s+/.test(lines[index].trim())
        ) {
          const m = lines[index].trim().match(/^[-*]\s+\[([ xX])\]\s+(.*)$/);
          if (m) {
            items.push({
              done: m[1].toLowerCase() === 'x',
              spans: this.parseInline(m[2]),
            });
          }
          index++;
        }
        blocks.push({ kind: 'checklist', items });
        continue;
      }

      // Unordered list.
      if (/^[-*]\s+/.test(trimmed)) {
        const items: InlineSpan[][] = [];
        while (
          index < lines.length &&
          /^[-*]\s+/.test(lines[index].trim()) &&
          !/^[-*]\s+\[[ xX]\]\s+/.test(lines[index].trim())
        ) {
          items.push(
            this.parseInline(lines[index].trim().replace(/^[-*]\s+/, '')),
          );
          index++;
        }
        blocks.push({ kind: 'list', ordered: false, items });
        continue;
      }

      // Ordered list.
      if (/^\d+[.)]\s+/.test(trimmed)) {
        const items: InlineSpan[][] = [];
        while (
          index < lines.length &&
          /^\d+[.)]\s+/.test(lines[index].trim())
        ) {
          items.push(
            this.parseInline(lines[index].trim().replace(/^\d+[.)]\s+/, '')),
          );
          index++;
        }
        blocks.push({ kind: 'list', ordered: true, items });
        continue;
      }

      // Standalone bold line -> subheading.
      const boldOnly = trimmed.match(/^\*\*(.+?)\*\*:?$/);
      if (boldOnly) {
        const text = boldOnly[1].trim();
        blocks.push({
          kind: 'heading',
          level: 4,
          id: this.slugifyHeading(prefix, text),
          spans: this.parseInline(text),
        });
        index++;
        continue;
      }

      // Paragraph (collect consecutive plain lines).
      const paragraphLines: string[] = [];
      while (index < lines.length) {
        const current = lines[index].trim();
        if (
          !current ||
          /^#{1,6}\s+/.test(current) ||
          /^```/.test(current) ||
          /^>\s?/.test(current) ||
          /^[-*]\s+/.test(current) ||
          /^\d+[.)]\s+/.test(current) ||
          /^---+$/.test(current) ||
          /^\*\*(.+?)\*\*:?$/.test(current) ||
          /^Copy to:/i.test(current) ||
          this.isPlainSectionTitle(current) ||
          this.isPropertiesAssignment(current) ||
          this.isTableHeader(lines, index)
        ) {
          break;
        }
        paragraphLines.push(current);
        index++;
      }

      if (paragraphLines.length) {
        blocks.push({
          kind: 'paragraph',
          spans: this.parseInline(paragraphLines.join(' ')),
        });
      }
    }

    return blocks;
  }

  private parseTable(lines: string[]): Extract<DocBlock, { kind: 'table' }> {
    const rows = lines.map((line) =>
      line
        .trim()
        .replace(/^\||\|$/g, '')
        .split('|')
        .map((cell) => cell.trim()),
    );

    const [headerRow, ...bodyRows] = rows;
    const headers = (headerRow || []).map((cell) => this.parseInline(cell));
    const body = bodyRows
      .filter((row) => !row.every((cell) => /^:?-+:?$/.test(cell)))
      .map((row) => row.map((cell) => this.parseInline(cell)));

    return { kind: 'table', headers, rows: body };
  }

  /** Splits a line of text into inline spans (code / strong / em / text). */
  private parseInline(value: string): InlineSpan[] {
    const spans: InlineSpan[] = [];
    const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(value)) !== null) {
      if (match.index > lastIndex) {
        spans.push({
          type: 'text',
          value: value.slice(lastIndex, match.index),
        });
      }

      const token = match[0];
      if (token.startsWith('`')) {
        spans.push({ type: 'code', value: token.slice(1, -1) });
      } else if (token.startsWith('**')) {
        spans.push({ type: 'strong', value: token.slice(2, -2) });
      } else {
        spans.push({ type: 'em', value: token.slice(1, -1) });
      }

      lastIndex = match.index + token.length;
    }

    if (lastIndex < value.length) {
      spans.push({ type: 'text', value: value.slice(lastIndex) });
    }

    return spans.length ? spans : [{ type: 'text', value }];
  }

  private buildDocumentOutline(
    rawText?: string,
    prefix: 'backend' | 'frontend' = 'backend',
  ): DocumentOutlineItem[] {
    if (!rawText) return [];

    return this.prepareDocumentLines(rawText)
      .map((line) => line.trim())
      .filter((line) => /^#{2,4}\s+/.test(line))
      .map((line) => {
        const [, hashes, text] = line.match(/^(#{2,4})\s+(.*)$/) || [];
        const headingText = text || '';

        return {
          id: this.slugifyHeading(prefix, headingText),
          text: headingText,
          level: (hashes || '##').length,
        };
      });
  }

  private normalizeMarkdown(value: string): string {
    return (value || '').replace(/\r\n/g, '\n').trim();
  }

  /** Applies the display rules shared by the document view, outline, and download. */
  private prepareDocumentLines(value: string): string[] {
    const lines = this.normalizeMarkdown(value)
      .split('\n')
      .map((line) => this.normalizeDocumentLine(line));

    return this.removeExcludedSections(lines);
  }

  private normalizeDocumentLine(line: string): string {
    return line
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F]/gu, '')
      .replace(/\bPhase\s+(\d+)/gi, 'Step $1');
  }

  /**
   * Removes excluded sections regardless of whether the agent marks their
   * title as a Markdown heading, bold line, plain label, or blockquote.
   */
  private removeExcludedSections(lines: string[]): string[] {
    const output: string[] = [];
    let skipping = false;
    let insideCodeFence = false;

    for (const line of lines) {
      if (/^```/.test(line.trim())) {
        insideCodeFence = !insideCodeFence;
        if (!skipping) output.push(line);
        continue;
      }

      if (insideCodeFence) {
        if (!skipping) output.push(line);
        continue;
      }

      const title = this.getSectionTitle(line);

      if (title && this.isTerminalExcludedSection(title)) {
        break;
      }

      if (title && this.isExcludedHeading(title)) {
        skipping = true;
        continue;
      }

      if (skipping) {
        if (this.isDocumentSectionStart(line)) {
          skipping = false;
        } else {
          continue;
        }
      }

      output.push(line);
    }

    return output.filter((line, index, all) => {
      const isRule = /^---+\s*$/.test(line.trim());
      return !(isRule && (!all[index - 1]?.trim() || !all[index + 1]?.trim()));
    });
  }

  private getSectionTitle(line: string): string | null {
    const trimmed = line
      .trim()
      .replace(/^>\s*/, '')
      .replace(/^[-*]\s+/, '')
      .replace(/^#{1,6}\s+/, '')
      .replace(/^\*\*(.+?)\*\*:??$/, '$1')
      .trim();

    if (
      /^(?:naming\s+reference|input\s+binding|implementation\s+checklist|internal\s+note|internal\s+only|notes?|end\s+of\s+document)\b/i.test(
        trimmed,
      )
    ) {
      return trimmed;
    }

    return null;
  }

  private isTerminalExcludedSection(title: string): boolean {
    return /implementation\s+checklist/i.test(title);
  }

  private isDocumentSectionStart(line: string): boolean {
    const trimmed = line.trim();
    return (
      /^#{1,6}\s+/.test(trimmed) ||
      /^\*\*(?:Step|Phase)\s+\d+/i.test(trimmed) ||
      /^(?:Step|Phase)\s+\d+\b/i.test(trimmed)
    );
  }

  private isTableHeader(lines: string[], index: number): boolean {
    const current = lines[index]?.trim() || '';
    const next = lines[index + 1]?.trim() || '';
    return /^\|.*\|\s*$/.test(current) && /^\|?\s*[-:| ]+\|\s*$/.test(next);
  }

  private isPropertiesAssignment(line: string): boolean {
    return /^[A-Za-z][\w.-]*\s*=\s*\$\{[^}]+\}\s*$/.test(line);
  }

  /**
   * True for the frontend document's plain-text section titles that should
   * render as bold headings, e.g. "Overview" or "Step 0 — Scaffold the
   * component". Keeps them short enough not to swallow real prose.
   */
  private isPlainSectionTitle(line: string): boolean {
    const trimmed = line.trim();
    if (/^Overview$/i.test(trimmed)) return true;
    return /^Step\s+\d+\b/i.test(trimmed) && trimmed.length <= 80;
  }

  private slugifyHeading(prefix: string, value: string): string {
    const normalized = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `${prefix}-${normalized || 'section'}`;
  }

  private getDownloadBaseName(): string {
    const rawFeature =
      ((this.generated?.backendHandoff?.['featureName'] as string) ||
        this.form?.get('featureName')?.value ||
        '') + '';
    const rawComponent =
      ((this.generated?.backendHandoff?.['componentName'] as string) ||
        this.form?.get('componentName')?.value ||
        '') + '';

    const feature = this.toFilePart(rawFeature, 'feature');
    const component = this.toFilePart(rawComponent, 'component');

    return `${feature}-${component}`;
  }

  private toFilePart(value: string, fallback: string): string {
    const normalized = (value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return normalized || fallback;
  }

  editForRegeneration(): void {
    this.submitError = null;
    this.resetApplyState();
    this.docsSaved = false;
    this.leaveWarningDismissed = false;
    this.isEditingRegeneration = true;
    // Return to the review step of whichever flow produced the generation.
    const reviewKey = this.onboardingMode === 'spec' ? 'review-spec' : 'review';
    this.currentStep = this.activeSteps.findIndex((s) => s.key === reviewKey);
  }

  backToGeneratedResult(): void {
    if (!this.generated) return;
    this.isEditingRegeneration = false;
    this.submitError = null;
  }

  resetForm(): void {
    this.clearPollTimer();
    this.clearSpecPollTimer();
    this.clearPersistedCodegenJobState();
    this.generated = null;
    this.submitError = null;
    this.submitting = false;
    this.generationStage = '';
    this.resetApplyState();
    this.docsSaved = false;
    this.leaveWarningDismissed = false;
    this.isEditingRegeneration = false;
    this.onboardingMode = 'spec';
    this.currentStep = 0;
    this.specInputMode = 'spec';
    this.non200PollFailures = 0;
    this.specNon200PollFailures = 0;
    this.specParsing = false;
    this.specParseError = null;
    this.parsedSpecPayload = null;
    this.specFile = null;
    this.specFileValidationMessage = null;
    this.specDraftText = '';
    this.specDraftFileName = '';

    this.applyManualDefaults();
  }
}
