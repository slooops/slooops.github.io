import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  HostBinding,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorArrowClockwiseBold,
  phosphorArrowLeftBold,
  phosphorCaretDownBold,
  phosphorCaretUpBold,
  phosphorFolderOpenBold,
  phosphorFunnelSimpleBold,
  phosphorMagnifyingGlassBold,
  phosphorPulseBold,
  phosphorSirenBold,
  phosphorSparkleBold,
  phosphorWarningBold,
  phosphorXBold,
} from '@ng-icons/phosphor-icons/bold';
import {
  phosphorPulseFill,
  phosphorWarningFill,
} from '@ng-icons/phosphor-icons/fill';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { BarChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import {
  catchError,
  forkJoin,
  of,
  Subject,
  Subscription,
  switchMap,
  takeUntil,
  timer,
} from 'rxjs';

import { ThemeService } from '../providers/theme.service';
import { ChatbotService } from '../chatbot/chatbot.service';
import { LoadingSymbolComponent } from '../loading-symbol/loading-symbol.component';
import { LoadingSymbolSmallComponent } from '../loading-symbol-small/loading-symbol-small.component';
import { ControlMService } from './control-m.service';
import { ControlMJobsTreeComponent } from './control-m-jobs-tree.component';
import { ControlMLogViewerComponent } from './control-m-log-viewer.component';
import {
  ControlMActionDetailsComponent,
  type ActionCompletedEvent,
} from './control-m-action-details.component';
import { ControlMAiChatComponent } from './control-m-ai-chat.component';
import {
  FOLDER_GROUPS,
  HIDE_PATTERNS,
  type ProcessArea,
} from './folder-groups';
import type {
  Folder,
  Job,
  JobCategory,
  JobSource,
  LogTabKey,
  Summary,
  TrendDay,
} from './control-m.types';

echarts.use([
  PieChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);

// Auto-refresh cadence (matches React app: 15 min for summary/folders/jobs).
const POLL_INTERVAL_MS = 900_000;
const TREND_POLL_INTERVAL_MS = 60_000;

interface RenderedProcessArea extends ProcessArea {
  children: Folder[];
  job_count: number;
  has_failure: boolean;
  has_long_running: boolean;
  has_late_start: boolean;
}

interface DisplayFolder extends Folder {
  isGroup?: boolean;
}

@Component({
  selector: 'app-control-m-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIcon,
    NgxEchartsDirective,
    LoadingSymbolComponent,
    LoadingSymbolSmallComponent,
    ControlMJobsTreeComponent,
    ControlMLogViewerComponent,
    ControlMActionDetailsComponent,
    ControlMAiChatComponent,
  ],
  providers: [
    provideEchartsCore({ echarts }),
    provideIcons({
      phosphorArrowClockwiseBold,
      phosphorArrowLeftBold,
      phosphorCaretDownBold,
      phosphorCaretUpBold,
      phosphorFolderOpenBold,
      phosphorFunnelSimpleBold,
      phosphorMagnifyingGlassBold,
      phosphorPulseBold,
      phosphorPulseFill,
      phosphorSirenBold,
      phosphorSparkleBold,
      phosphorWarningBold,
      phosphorWarningFill,
      phosphorXBold,
    }),
  ],
  templateUrl: './control-m-dashboard.component.html',
  styleUrls: ['./control-m-dashboard.component.css'],
})
export class ControlMDashboardComponent implements OnInit, OnDestroy {
  @HostBinding('class.dark-theme') get darkThemeClass() {
    return this.themeService.isDarkMode;
  }

  // ── State ──────────────────────────────────────────────────────────
  source: JobSource = 'FIN_I2C';
  readonly sources: { value: JobSource; label: string }[] = [
    { value: 'FIN_I2C', label: 'FIN_I2C' },
    { value: 'FIN_I2C_CCRM', label: 'FIN_I2C_CCRM' },
  ];

  summary: Summary | null = null;
  folders: Folder[] = [];
  allJobs: Job[] = [];
  trend: TrendDay[] = [];

  loadingSummary = true;
  loadingFolders = true;
  loadingJobs = true;

  errorSummary: string | null = null;
  errorFolders: string | null = null;
  errorJobs: string | null = null;

  refreshing = false;
  lastUpdated: Date | null = null;

  // Filters
  activeCategory: JobCategory = 'TOTAL';
  selectedFolder: string | null = null;
  selectedSubApp: string | null = null;
  searchQuery = '';

  // Popups
  activeGroupId: string | null = null;
  activeProcessAreaId: string | null = null;
  showSubAppPopup = false;

  // Drill-down (7-day trend)
  drillDay: TrendDay | null = null;
  drillJobs: Job[] = [];
  drillLoading = false;

  // Sub-app refresh tracking
  refreshingFolders = new Set<string>();

  // Derived collections
  displayFolders: DisplayFolder[] = [];
  groupProcessAreas: Record<string, RenderedProcessArea[]> = {};

  // Subscriptions / lifecycle
  private readonly destroy$ = new Subject<void>();
  private readonly subs: Subscription[] = [];

  constructor(
    public themeService: ThemeService,
    private readonly api: ControlMService,
    private readonly cdr: ChangeDetectorRef,
    private readonly chatbotService: ChatbotService,
  ) {}

  ngOnInit(): void {
    // Hide the global chatbot launcher while on this route — the Control-M
    // dashboard owns its own AI assistant that occupies the same corner.
    this.chatbotService.hide();

    this.loadAll();
    // Auto-refresh (silent)
    this.subs.push(
      timer(POLL_INTERVAL_MS, POLL_INTERVAL_MS)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.loadAll(true)),
      timer(TREND_POLL_INTERVAL_MS, TREND_POLL_INTERVAL_MS)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.loadTrend(true)),
    );
  }

  ngOnDestroy(): void {
    // Restore the global chatbot for the rest of the app.
    this.chatbotService.show();
    this.destroy$.next();
    this.destroy$.complete();
    this.subs.forEach((s) => s.unsubscribe());
  }

  // ── Data loading ───────────────────────────────────────────────────

  onSourceChange(value: JobSource): void {
    this.source = value;
    this.summary = null;
    this.folders = [];
    this.allJobs = [];
    this.trend = [];
    this.selectedFolder = null;
    this.selectedSubApp = null;
    this.activeCategory = 'TOTAL';
    this.searchQuery = '';
    this.loadAll();
  }

  loadAll(silent = false): void {
    if (!silent) {
      this.loadingSummary = true;
      this.loadingFolders = true;
      this.loadingJobs = true;
    }
    this.loadSummary();
    this.loadFolders();
    this.loadJobs();
    this.loadTrend();
  }

  loadSummary(): void {
    this.api
      .getSummary(this.source)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (s) => {
          this.summary = s;
          this.errorSummary = null;
          this.loadingSummary = false;
          this.lastUpdated = new Date();
        },
        error: (err) => {
          this.errorSummary = this.errorMessage(err);
          this.loadingSummary = false;
        },
      });
  }

  loadFolders(): void {
    this.api
      .getFolders(this.source)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (f) => {
          this.folders = f ?? [];
          this.rebuildDisplayFolders();
          this.errorFolders = null;
          this.loadingFolders = false;
        },
        error: (err) => {
          this.errorFolders = this.errorMessage(err);
          this.loadingFolders = false;
        },
      });
  }

  loadJobs(): void {
    this.api
      .getJobs(this.source, { limit: 100000 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (j) => {
          this.allJobs = j ?? [];
          this.errorJobs = null;
          this.loadingJobs = false;
        },
        error: (err) => {
          this.errorJobs = this.errorMessage(err);
          this.loadingJobs = false;
        },
      });
  }

  loadTrend(_silent = false): void {
    this.api
      .getTrend(this.source, 7)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (t) => (this.trend = t ?? []),
        error: () => (this.trend = []),
      });
  }

  forceRefresh(): void {
    if (this.refreshing) return;
    this.refreshing = true;
    this.api
      .refreshApplication(this.source)
      .pipe(
        switchMap(() => timer(1000)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: () => {
          this.loadAll(true);
          this.refreshing = false;
        },
        error: () => {
          this.refreshing = false;
          // Fall back to a plain reload
          this.loadAll(true);
        },
      });
  }

  // ── Folder grouping (mirrors React applyFolderGroups) ──────────────

  private rebuildDisplayFolders(): void {
    let folders = this.folders.filter(
      (f) =>
        !HIDE_PATTERNS.some(
          (rx) => rx.test(f.display_name) || rx.test(f.folder),
        ),
    );

    if (folders.length === 0) {
      this.displayFolders = [];
      this.groupProcessAreas = {};
      return;
    }

    const matchedIds = new Set<string>();
    const groupTiles: DisplayFolder[] = [];
    const groupProcessAreas: Record<string, RenderedProcessArea[]> = {};

    for (const group of FOLDER_GROUPS) {
      const areas: RenderedProcessArea[] = [];
      for (const area of group.processAreas) {
        const children = folders.filter((f) =>
          area.match.some((rx) => rx.test(f.display_name) || rx.test(f.folder)),
        );
        if (children.length === 0) continue;
        children.forEach((c) => matchedIds.add(c.folder));
        areas.push({
          ...area,
          children,
          job_count: children.reduce((sum, c) => sum + c.job_count, 0),
          has_failure: children.some((c) => c.has_failure),
          has_long_running: children.some((c) => c.has_long_running),
          has_late_start: children.some((c) => c.has_late_start),
        });
      }
      if (areas.length === 0) continue;
      groupProcessAreas[group.id] = areas;
      groupTiles.push({
        folder: group.id,
        display_name: group.label,
        job_count: areas.reduce((s, a) => s + a.job_count, 0),
        has_failure: areas.some((a) => a.has_failure),
        has_long_running: areas.some((a) => a.has_long_running),
        has_late_start: areas.some((a) => a.has_late_start),
        sub_applications: [],
        isGroup: true,
      });
    }

    const ungrouped = folders
      .filter((f) => !matchedIds.has(f.folder))
      .map((f) => ({
        ...f,
        display_name: f.display_name
          .replaceAll('_', ' ')
          .toLowerCase()
          .replace(/\b([a-z])/g, (_, c) => c.toUpperCase()),
      }));

    this.groupProcessAreas = groupProcessAreas;
    this.displayFolders = [...groupTiles, ...ungrouped].sort((a, b) =>
      a.display_name.localeCompare(b.display_name, undefined, {
        sensitivity: 'base',
      }),
    );
  }

  // ── Folder / sub-app interaction ───────────────────────────────────

  onFolderClick(folder: DisplayFolder): void {
    if (folder.isGroup && this.groupProcessAreas[folder.folder]) {
      this.activeGroupId = folder.folder;
      this.activeProcessAreaId = null;
      return;
    }

    if (this.selectedFolder === folder.folder) {
      this.selectedFolder = null;
      this.selectedSubApp = null;
      return;
    }

    this.selectedFolder = folder.folder;
    this.selectedSubApp = null;
    if (folder.sub_applications.length >= 1) {
      this.showSubAppPopup = true;
    }

    // Background refresh so table (if popup dismissed) is fresh
    const subApps = folder.sub_applications.map((sa) => sa.sub_app);
    if (subApps.length > 0) {
      this.refreshingFolders.add(folder.folder);
      forkJoin(
        subApps.map((sa) =>
          this.api
            .refreshFolder(this.source, sa)
            .pipe(catchError(() => of(null))),
        ),
      )
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.refreshingFolders.delete(folder.folder);
          this.loadJobs();
          this.loadFolders();
        });
    } else {
      this.loadJobs();
    }
  }

  selectProcessArea(areaId: string): void {
    this.activeProcessAreaId = areaId;
  }

  closeGroupPopup(): void {
    this.activeGroupId = null;
    this.activeProcessAreaId = null;
  }

  pickFolderFromGroup(child: Folder): void {
    this.closeGroupPopup();
    this.onFolderClick(child as DisplayFolder);
  }

  selectSubApp(subApp: string | null, folder: Folder): void {
    this.selectedSubApp = subApp;
    this.showSubAppPopup = false;
    if (subApp) {
      this.refreshingFolders.add(folder.folder);
      this.api
        .refreshFolder(this.source, subApp)
        .pipe(
          catchError(() => of(null)),
          takeUntil(this.destroy$),
        )
        .subscribe(() => {
          this.refreshingFolders.delete(folder.folder);
          this.loadJobs();
          this.loadFolders();
        });
    }
  }

  clearFolder(): void {
    this.selectedFolder = null;
    this.selectedSubApp = null;
  }

  clearCategory(): void {
    this.activeCategory = 'TOTAL';
  }

  onCategoryClick(cat: JobCategory): void {
    this.activeCategory = cat;
  }

  // ── Trend drill-down ───────────────────────────────────────────────

  openDrillDay(day: TrendDay): void {
    this.drillDay = day;
    this.drillLoading = true;
    this.drillJobs = [];
    this.api
      .getTrendDetail(this.source, day.day)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (jobs) => {
          this.drillJobs = jobs ?? [];
          this.drillLoading = false;
        },
        error: () => {
          this.drillJobs = [];
          this.drillLoading = false;
        },
      });
  }

  closeDrillDay(): void {
    this.drillDay = null;
    this.drillJobs = [];
  }

  // ── Log viewer state ──────────────────────────────────────────────

  logViewerJob: Job | null = null;
  logViewerInitialTab: LogTabKey = 'log';

  onViewLogs(job: Job): void {
    this.logViewerJob = job;
    this.logViewerInitialTab = 'log';
  }

  closeLogViewer(): void {
    this.logViewerJob = null;
  }

  // ── Action modal state ───────────────────────────────────────────

  actionJob: Job | null = null;

  onJobActionSelect(job: Job): void {
    this.actionJob = job;
  }

  closeActionModal(): void {
    this.actionJob = null;
  }

  onActionCompleted(update: ActionCompletedEvent): void {
    // Patch the in-memory jobs array so the tree/kpi update immediately.
    const category = update.category as JobCategory;
    this.allJobs = this.allJobs.map((j) =>
      j.job_name === update.job_name
        ? {
            ...j,
            job_id: update.job_id || j.job_id,
            status: update.status,
            category: this.isKnownCategory(category) ? category : j.category,
          }
        : j,
    );
  }

  private isKnownCategory(c: string): boolean {
    return [
      'TOTAL',
      'SUCCESS',
      'FAILURE',
      'LONG_RUNNING',
      'LATE_START',
      'RUNNING',
      'UNKNOWN_STATUS',
      'WAIT_CONDITION',
    ].includes(c);
  }

  // ── Getters for derived data (KPI donut / segments) ────────────────

  get kpiTotal(): number {
    return this.summary?.TOTAL ?? 0;
  }
  get kpiSuccess(): number {
    return this.summary?.SUCCESS ?? 0;
  }
  get kpiFailure(): number {
    return this.summary?.FAILURE ?? 0;
  }
  get kpiLongRunning(): number {
    return this.summary?.LONG_RUNNING ?? 0;
  }
  get kpiLateStart(): number {
    return this.summary?.LATE_START ?? 0;
  }
  get kpiPending(): number {
    return Math.max(
      0,
      this.kpiTotal -
        this.kpiSuccess -
        this.kpiFailure -
        this.kpiLongRunning -
        this.kpiLateStart,
    );
  }
  get pctDone(): number {
    return this.kpiTotal > 0
      ? Math.round((this.kpiSuccess / this.kpiTotal) * 100)
      : 0;
  }
  get pctFail(): string {
    return this.kpiTotal > 0
      ? ((this.kpiFailure / this.kpiTotal) * 100).toFixed(2)
      : '0.00';
  }

  get hasTrend(): boolean {
    return this.trend.some(
      (d) =>
        d.TOTAL > 0 ||
        d.SUCCESS > 0 ||
        d.FAILURE > 0 ||
        d.LONG_RUNNING > 0 ||
        d.LATE_START > 0,
    );
  }

  // ── Filtered jobs (for simple table below) ────────────────────────

  get currentFolderObj(): Folder | undefined {
    if (!this.selectedFolder) return undefined;
    return this.folders.find((f) => f.folder === this.selectedFolder);
  }

  get filteredJobs(): Job[] {
    let jobs = this.allJobs;
    if (this.selectedFolder) {
      const fg = this.currentFolderObj;
      if (fg) {
        const allowed = new Set(fg.sub_applications.map((s) => s.sub_app));
        jobs = jobs.filter((j) => allowed.has(j.sub_application));
      }
    }
    if (this.selectedSubApp) {
      jobs = jobs.filter((j) => j.sub_application === this.selectedSubApp);
    }
    if (this.activeCategory !== 'TOTAL') {
      jobs = jobs.filter((j) => j.category === this.activeCategory);
    }
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      jobs = jobs.filter(
        (j) =>
          (j.job_name ?? '').toLowerCase().includes(q) ||
          (j.description ?? '').toLowerCase().includes(q),
      );
    }
    // Hide never-executed stubs
    return jobs.filter((j) => (j.category as string) !== 'UNKNOWN_STATUS');
  }

  // ── Donut chart options (echarts) ──────────────────────────────────

  get donutOptions(): EChartsOption {
    const isDark = this.themeService.isDarkMode;
    const centerColor = isDark ? '#e0e6ed' : '#1b1c1d';
    const mutedColor = isDark ? '#8899a6' : '#555';
    const data = [
      {
        value: this.kpiSuccess,
        name: 'Success',
        itemStyle: { color: '#6ebe4a' },
      },
      {
        value: this.kpiFailure,
        name: 'Failures',
        itemStyle: { color: '#e53935' },
      },
      {
        value: this.kpiLongRunning,
        name: 'Long-running',
        itemStyle: { color: '#0070d2' },
      },
      {
        value: this.kpiLateStart,
        name: 'Late-start',
        itemStyle: { color: '#e6a800' },
      },
      {
        value: this.kpiPending,
        name: 'Pending',
        itemStyle: { color: isDark ? '#3a4a5a' : '#d1d5db' },
      },
    ];
    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(20, 30, 40, 0.9)',
        borderColor: 'rgba(0, 188, 235, 0.3)',
        textStyle: { color: '#e0e6ed', fontSize: 12 },
      },
      series: [
        {
          type: 'pie',
          radius: ['62%', '82%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: 'center',
            formatter: `{a|${this.pctDone}%}\n{b|complete}`,
            rich: {
              a: {
                fontSize: 22,
                fontWeight: 700,
                color: centerColor,
                lineHeight: 26,
              },
              b: { fontSize: 10, color: mutedColor, lineHeight: 14 },
            },
          },
          emphasis: { scale: false, label: { show: true } },
          labelLine: { show: false },
          data,
        },
      ],
    };
  }

  // ── 7-day trend bar chart ──────────────────────────────────────────

  get trendOptions(): EChartsOption {
    const isDark = this.themeService.isDarkMode;
    const tickColor = isDark ? '#8899a6' : '#555';
    const labels = this.trend.map((d) => d.label);
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(20, 30, 40, 0.9)',
        borderColor: 'rgba(0, 188, 235, 0.3)',
        textStyle: { color: '#e0e6ed', fontSize: 12 },
      },
      legend: {
        data: ['Failures', 'Long-running', 'Late-start'],
        textStyle: { color: tickColor, fontSize: 10 },
        top: 2,
        itemHeight: 8,
        itemWidth: 12,
      },
      grid: { top: 26, left: 8, right: 8, bottom: 6, containLabel: true },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: tickColor, fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        splitLine: {
          lineStyle: {
            color: isDark ? 'rgba(136,153,166,0.14)' : 'rgba(0,0,0,0.06)',
          },
        },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: tickColor, fontSize: 10 },
      },
      series: [
        {
          name: 'Failures',
          type: 'bar',
          stack: 'total',
          data: this.trend.map((d) => d.FAILURE),
          itemStyle: { color: '#e53935' },
          barMaxWidth: 28,
        },
        {
          name: 'Long-running',
          type: 'bar',
          stack: 'total',
          data: this.trend.map((d) => d.LONG_RUNNING),
          itemStyle: { color: '#0070d2' },
          barMaxWidth: 28,
        },
        {
          name: 'Late-start',
          type: 'bar',
          stack: 'total',
          data: this.trend.map((d) => d.LATE_START),
          itemStyle: { color: '#e6a800', borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 28,
        },
      ],
    };
  }

  onTrendChartClick(event: any): void {
    if (event?.dataIndex == null) return;
    const day = this.trend[event.dataIndex];
    if (day) this.openDrillDay(day);
  }

  // ── Utilities ──────────────────────────────────────────────────────

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
  }

  formatDuration(sec: number | null | undefined): string {
    if (sec == null || sec < 0) return '—';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  statusBadgeClass(job: Job): string {
    const status = (job.status || '').toLowerCase();
    if (status === 'not recently executed') return 'cm-badge cm-badge-neutral';
    if (status === 'executing' || job.category === 'LONG_RUNNING')
      return 'cm-badge cm-badge-info';
    if (status === 'succeeded' || job.category === 'SUCCESS')
      return 'cm-badge cm-badge-ok';
    if (status.includes('not ok') || status.includes('abend'))
      return 'cm-badge cm-badge-error';
    if (job.category === 'LATE_START') return 'cm-badge cm-badge-warn';
    return 'cm-badge cm-badge-neutral';
  }

  folderHealthClass(f: {
    has_failure?: boolean;
    has_long_running?: boolean;
    has_late_start?: boolean;
    job_count?: number;
  }): string {
    if (f.has_failure) return 'cm-dot cm-dot-error';
    if (f.has_long_running || f.has_late_start) return 'cm-dot cm-dot-warn';
    if ((f.job_count ?? 0) === 0) return 'cm-dot cm-dot-muted';
    return 'cm-dot cm-dot-ok';
  }

  folderTopClass(f: {
    has_failure?: boolean;
    has_long_running?: boolean;
    has_late_start?: boolean;
    job_count?: number;
  }): string {
    if (f.has_failure) return 'is-top-error';
    if (f.has_long_running || f.has_late_start) return 'is-top-warn';
    if ((f.job_count ?? 0) === 0) return 'is-top-muted';
    return 'is-top-ok';
  }

  trackByFolder = (_: number, f: Folder) => f.folder;
  trackByJob = (_: number, j: Job) => j.job_id;
  trackByDay = (_: number, d: TrendDay) => d.day;

  private errorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'object' && err && 'message' in err)
      return String((err as any).message);
    return 'Unknown error';
  }

  get selectedGroup(): DisplayFolder | undefined {
    return this.activeGroupId
      ? this.displayFolders.find((f) => f.folder === this.activeGroupId)
      : undefined;
  }

  get selectedProcessArea(): RenderedProcessArea | undefined {
    if (!this.activeGroupId || !this.activeProcessAreaId) return undefined;
    return (this.groupProcessAreas[this.activeGroupId] || []).find(
      (a) => a.id === this.activeProcessAreaId,
    );
  }
}
