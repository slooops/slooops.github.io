import { CommonModule } from '@angular/common';
import { Component, HostBinding, HostListener, OnInit } from '@angular/core';
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
} from '@ng-icons/phosphor-icons/bold';
import { LoadingSymbolComponent } from '../monitoring-dashboard/shared/loading-symbol/loading-symbol.component';
import { AuthenticationService } from '../providers/authentication.service';
import { ThemeService } from '../providers/theme.service';

interface GeneratedDocs {
  backend?: string;
  ui?: string;
  backendHandoff?: Record<string, unknown>;
  [key: string]: unknown;
}

interface DocumentOutlineItem {
  id: string;
  text: string;
  level: number;
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

@Component({
  selector: 'app-monitoring-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon, LoadingSymbolComponent],
  providers: [
    provideIcons({
      phosphorCheckSquareBold,
      phosphorSquareBold,
      phosphorCopyBold,
    }),
  ],
  templateUrl: './monitoring-onboarding.component.html',
  styleUrl: './monitoring-onboarding.component.css',
})
export class MonitoringOnboardingComponent implements OnInit {
  @HostBinding('class.dark-theme')
  get darkThemeClass(): boolean {
    return this.themeService.isDarkMode;
  }

  form!: FormGroup;

  /** Wizard step tracking (0-based). */
  currentStep = 0;
  readonly steps = [
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

  readonly filterTypes = ['select', 'text'];

  submitting = false;
  submitError: string | null = null;
  generated: GeneratedDocs | null = null;

  /** Whether the user has copied or downloaded at least one generated doc. */
  docsSaved = false;
  /** Whether the in-page "unsaved changes" warning banner is visible. */
  leaveWarningDismissed = false;

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

  ngOnInit(): void {
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
    if (index < 0 || index >= this.steps.length) return;
    if (!this.canAccessStep(index)) return;
    this.currentStep = index;
  }

  nextStep(): void {
    if (this.currentStep >= this.steps.length - 1) return;
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
    switch (this.steps[index]?.key) {
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
    return this.steps[index]?.key !== 'advanced';
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

  // ── submit ─────────────────────────────────────────────────
  async submit(): Promise<void> {
    const resolvedUrl = this.resolveApiUrl(
      this.authService.getControlTowerSupportAgentApiUrl() || '',
    );
    if (!resolvedUrl) {
      this.submitError =
        'Code-generation API URL is unavailable from user context. Please refresh and try again.';
      this.currentStep = this.steps.findIndex((s) => s.key === 'review');
      return;
    }

    this.form.markAllAsTouched();
    if (this.form.invalid) {
      // Jump to the first invalid step for the user.
      for (let i = 0; i < this.steps.length; i++) {
        if (!this.isStepValid(i)) {
          this.currentStep = i;
          break;
        }
      }
      return;
    }

    this.submitting = true;
    this.submitError = null;
    this.generated = null;
    this.docsSaved = false;
    this.leaveWarningDismissed = false;

    try {
      const response = await fetch(resolvedUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.buildPayload()),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(
          `Request failed (${response.status} ${response.statusText}). ${text}`,
        );
      }

      const data = await response.json();
      this.generated = {
        backend:
          data.backend ??
          data.backendDoc ??
          data.backend_document ??
          data.backendDocument,
        ui: data.ui ?? data.uiDoc ?? data.ui_document ?? data.uiDocument,
        backendHandoff: data.backendHandoff ?? data.backend_handoff,
      };
    } catch (err) {
      this.submitError =
        err instanceof Error
          ? err.message
          : 'Unexpected error while contacting the code-generation service.';
    } finally {
      this.submitting = false;
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
    this.generated = null;
    this.submitError = null;
    this.docsSaved = false;
    this.leaveWarningDismissed = false;
    this.currentStep = this.steps.findIndex((s) => s.key === 'review');
  }

  resetForm(): void {
    this.generated = null;
    this.submitError = null;
    this.docsSaved = false;
    this.leaveWarningDismissed = false;
    this.currentStep = 0;

    this.form.patchValue({
      componentName: '',
      featureName: '',
      roleName: '',
      assignmentUsersKey: '',
      queries: {
        summary: '',
        details: '',
        detailsFiltered: '',
        summaryUpdate: '',
      },
    });

    this.summaryColumns.clear();
    Array.from({ length: 5 }, () => this.createColumnControl()).forEach((c) =>
      this.summaryColumns.push(c),
    );

    this.detailsTableFilters.clear();
    this.detailsTableFilters.push(this.createFilterGroup());

    this.paramAliases.clear();

    this.form.markAsPristine();
    this.form.markAsUntouched();
  }
}
