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
  phosphorBrowserBold,
  phosphorCaretDownBold,
  phosphorCaretUpBold,
  phosphorFolderOpenBold,
  phosphorFunnelSimpleBold,
  phosphorMagnifyingGlassBold,
  phosphorPulseBold,
  phosphorSidebarBold,
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
  debounceTime,
  distinctUntilChanged,
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
  SubApplication,
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
      phosphorBrowserBold,
      phosphorCaretDownBold,
      phosphorCaretUpBold,
      phosphorFolderOpenBold,
      phosphorFunnelSimpleBold,
      phosphorMagnifyingGlassBold,
      phosphorPulseBold,
      phosphorPulseFill,
      phosphorSidebarBold,
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

  // Tile-selector UI mode ─ user-toggleable between the classic modal and a
  // right-hand sidebar drawer that lets the tile grid stay in view while a
  // selection is being made. Persisted per browser.
  private static readonly TILE_SELECTOR_MODE_KEY = 'ctm.tile-selector-mode';
  tileSelectorMode: 'drawer' | 'modal' = 'drawer';

  toggleTileSelectorMode(): void {
    this.tileSelectorMode =
      this.tileSelectorMode === 'drawer' ? 'modal' : 'drawer';
    try {
      localStorage.setItem(
        ControlMDashboardComponent.TILE_SELECTOR_MODE_KEY,
        this.tileSelectorMode,
      );
    } catch {
      /* localStorage unavailable — best-effort only. */
    }
  }

  /** True when a group / sub-app selector is currently active. */
  get tileSelectorOpen(): boolean {
    return (
      (this.activeGroupId !== null &&
        !!this.groupProcessAreas[this.activeGroupId]) ||
      (this.showSubAppPopup && !!this.currentFolderObj)
    );
  }

  closeTileSelector(): void {
    this.activeGroupId = null;
    this.activeProcessAreaId = null;
    this.showSubAppPopup = false;
  }

  /**
   * Loading signal for the Job Hierarchy Tree. Covers the window between
   * a sub-app selection and the first page landing — without this the tree
   * would misreport "No jobs to display" while the fetch is in flight.
   */
  get treeLoading(): boolean {
    if (this.loadingJobs || this.searchLoading) return true;
    if (this.selectedSubApp) {
      if (this.loadingSubApps.has(this.selectedSubApp)) return true;
      // Between selectSubApp() and the first fetch subscribing, only
      // refreshingFolders is populated. Treat that window as loading too.
      if (
        this.refreshingFolders.size > 0 &&
        !this.loadedSubApps.has(this.selectedSubApp)
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Human-friendly label describing the tree's current narrowing. Rendered
   * beside the tree title so users can see which folder / sub-app the table
   * is scoped to. Prefers display_name where the outline/folder provides one.
   */
  get treeScopeLabel(): string | null {
    if (this.selectedSubApp) {
      const outline = this.fullSubAppOutline.find(
        (o) => o.sub_app === this.selectedSubApp,
      );
      return outline?.display_name || this.selectedSubApp;
    }
    if (this.selectedFolder) {
      const folder = this.folders.find((f) => f.folder === this.selectedFolder);
      return folder?.display_name || this.selectedFolder;
    }
    return null;
  }

  // Drill-down (7-day trend)
  drillDay: TrendDay | null = null;
  drillJobs: Job[] = [];
  drillLoading = false;

  // Sub-app refresh tracking
  refreshingFolders = new Set<string>();

  // Lazy-load state (server-side pagination for the hierarchy tree)
  /** Page size for a single sub-app fetch. */
  static readonly SUBAPP_PAGE_SIZE = 100;
  /**
   * Full outline of every sub-application, derived from `folders`. One entry
   * per distinct sub_app name; counts + health flags are unioned across the
   * folders that contain that sub-app.
   */
  fullSubAppOutline: SubApplication[] = [];
  /** Sub-apps currently being fetched (used by the tree to show a spinner). */
  loadingSubApps = new Set<string>();
  /** Sub-apps we've already fetched at least the first page for. */
  loadedSubApps = new Set<string>();
  /**
   * Sub-apps where the server has confirmed no more pages exist (last page
   * was smaller than the requested limit). Used to suppress the "Load more"
   * button when a category filter drops loaded count below the outline total.
   */
  fullyLoadedSubApps = new Set<string>();
  /**
   * Bumped on every filter change (category / search / folder). In-flight
   * job fetches stamp themselves with the current version and discard their
   * results if it has moved on — prevents stale responses from polluting
   * a newer filter state.
   */
  private filterVersion = 0;
  /** Debounced source for the tree's search input. */
  private readonly searchInput$ = new Subject<string>();
  /** Global search in progress (server-side, across all sub-apps). */
  searchLoading = false;
  /**
   * Truthy when the last global search hit the fetch limit — signals to the
   * user that the visible results may be a subset of all matches.
   */
  searchTruncated = false;
  /** Cap on rows returned by a single global search fetch. */
  static readonly SEARCH_MAX_RESULTS = 500;

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

    // Restore the user's preferred tile-selector UI (drawer vs modal).
    try {
      const stored = localStorage.getItem(
        ControlMDashboardComponent.TILE_SELECTOR_MODE_KEY,
      );
      if (stored === 'drawer' || stored === 'modal') {
        this.tileSelectorMode = stored;
      }
    } catch {
      /* localStorage unavailable — fall back to default. */
    }

    // Debounced global search: whenever the tree's search box changes we run
    // one server-side fetch that spans every sub-application in the current
    // source and (optionally) the active category filter.
    this.subs.push(
      this.searchInput$
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          takeUntil(this.destroy$),
        )
        .subscribe(() => this.applyFilterChange()),
    );

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
    this.fullSubAppOutline = [];
    this.loadingSubApps = new Set();
    this.loadedSubApps = new Set();
    this.fullyLoadedSubApps = new Set();
    this.searchTruncated = false;
    this.filterVersion++;
    this.loadAll();
  }

  loadAll(silent = false): void {
    if (!silent) {
      this.loadingSummary = true;
      this.loadingFolders = true;
      // Jobs are loaded lazily per sub-app — no bulk load at mount.
      this.loadingJobs = false;
    }
    this.loadSummary();
    this.loadFolders();
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
          this.rebuildSubAppOutline();
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

  /**
   * Build a flat outline of every sub-application from `this.folders`.
   * A sub-app may appear under multiple folders; we dedupe by `sub_app`
   * name and union counts + health flags.
   */
  private rebuildSubAppOutline(): void {
    const map = new Map<string, SubApplication>();
    for (const folder of this.folders) {
      for (const sa of folder.sub_applications ?? []) {
        const existing = map.get(sa.sub_app);
        if (!existing) {
          map.set(sa.sub_app, { ...sa });
        } else {
          existing.count += sa.count;
          existing.has_failure = existing.has_failure || sa.has_failure;
          existing.has_long_running =
            existing.has_long_running || sa.has_long_running;
          existing.has_late_start =
            existing.has_late_start || sa.has_late_start;
        }
      }
    }
    this.fullSubAppOutline = Array.from(map.values()).sort((a, b) =>
      a.sub_app.localeCompare(b.sub_app),
    );
  }

  /**
   * Outline currently shown to the tree. When a folder (or a folder + sub-app)
   * is selected the outline is narrowed so the tree can enter folder view.
   */
  get visibleSubAppOutline(): SubApplication[] {
    if (this.selectedSubApp) {
      return this.fullSubAppOutline.filter(
        (o) => o.sub_app === this.selectedSubApp,
      );
    }
    if (this.selectedFolder) {
      const folder = this.folders.find((f) => f.folder === this.selectedFolder);
      if (folder) {
        const names = new Set(
          (folder.sub_applications ?? []).map((sa) => sa.sub_app),
        );
        return this.fullSubAppOutline.filter((o) => names.has(o.sub_app));
      }
    }
    return this.fullSubAppOutline;
  }

  loadJobs(): void {
    // Legacy full-load path is intentionally a no-op; the tree fetches jobs
    // per sub-application on demand via `onSubAppExpand` / `onSubAppLoadMore`.
    // Callers that used to trigger a bulk refresh should instead re-fetch
    // the sub-apps they care about (see `refetchLoadedSubApps`).
    this.loadingJobs = false;
  }

  // ── Lazy sub-app fetching (server-side pagination) ──────────────

  /** Tree emitted an expand for a sub-app we haven't loaded yet. */
  onSubAppExpand(evt: { subApp: string; loadedCount: number }): void {
    if (
      this.loadingSubApps.has(evt.subApp) ||
      this.loadedSubApps.has(evt.subApp)
    ) {
      return;
    }
    this.fetchSubAppJobs(evt.subApp, 0);
  }

  /** Tree emitted a "Load more" for a sub-app. */
  onSubAppLoadMore(evt: { subApp: string; loadedCount: number }): void {
    if (this.loadingSubApps.has(evt.subApp)) return;
    this.fetchSubAppJobs(evt.subApp, evt.loadedCount);
  }

  private fetchSubAppJobs(subApp: string, offset: number): void {
    const version = this.filterVersion;
    const limit = ControlMDashboardComponent.SUBAPP_PAGE_SIZE;
    const opts: {
      sub_application: string;
      limit: number;
      offset: number;
      category?: JobCategory;
      job_name?: string;
    } = { sub_application: subApp, limit, offset };
    if (this.activeCategory !== 'TOTAL') opts.category = this.activeCategory;
    const trimmedQuery = this.searchQuery.trim();
    if (trimmedQuery) opts.job_name = trimmedQuery;

    this.loadingSubApps = new Set(this.loadingSubApps).add(subApp);
    this.api
      .getJobs(this.source, opts)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (jobs) => {
          if (version !== this.filterVersion) return; // stale
          const page = jobs ?? [];
          // Append — dedupe by job_id (fall back to job_name) so a re-fetch
          // of an existing page does not double-count rows.
          const seen = new Set(this.allJobs.map((j) => j.job_id || j.job_name));
          const additions = page.filter(
            (j) => !seen.has(j.job_id || j.job_name),
          );
          this.allJobs = [...this.allJobs, ...additions];
          this.loadedSubApps = new Set(this.loadedSubApps).add(subApp);
          // Server returned a partial page → no more results for this filter.
          if (page.length < limit) {
            this.fullyLoadedSubApps = new Set(this.fullyLoadedSubApps).add(
              subApp,
            );
          }
          const nextLoading = new Set(this.loadingSubApps);
          nextLoading.delete(subApp);
          this.loadingSubApps = nextLoading;
        },
        error: () => {
          if (version !== this.filterVersion) return;
          const nextLoading = new Set(this.loadingSubApps);
          nextLoading.delete(subApp);
          this.loadingSubApps = nextLoading;
        },
      });
  }

  // ── Filter changes (category / search) ─────────────────────────────

  /**
   * Reset every trace of previously-loaded jobs. Called whenever a filter
   * (category or global search) changes so the tree starts from an empty
   * slate under the new criteria.
   */
  private resetLoadedJobState(): void {
    this.filterVersion++;
    this.allJobs = [];
    this.loadedSubApps = new Set();
    this.loadingSubApps = new Set();
    this.fullyLoadedSubApps = new Set();
    this.searchTruncated = false;
  }

  /**
   * Called on any filter transition (category click, folder change, search
   * input). Clears loaded state and, if a search is active, kicks off a
   * global server-side search across all sub-applications.
   */
  private applyFilterChange(): void {
    this.resetLoadedJobState();
    const query = this.searchQuery.trim();
    if (query) {
      this.performGlobalSearch(query);
    }
  }

  private performGlobalSearch(query: string): void {
    const version = this.filterVersion;
    const limit = ControlMDashboardComponent.SEARCH_MAX_RESULTS;
    const opts: {
      job_name: string;
      limit: number;
      category?: JobCategory;
    } = { job_name: query, limit };
    if (this.activeCategory !== 'TOTAL') opts.category = this.activeCategory;

    this.searchLoading = true;
    this.api
      .getJobs(this.source, opts)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (jobs) => {
          if (version !== this.filterVersion) return;
          const results = jobs ?? [];
          this.allJobs = results;
          this.searchTruncated = results.length >= limit;
          // Everything is loaded up-front; mark each represented sub-app so
          // "Load more" is suppressed inside the tree.
          const subApps = new Set(results.map((j) => j.sub_application || '—'));
          this.loadedSubApps = new Set(subApps);
          this.fullyLoadedSubApps = new Set(subApps);
          this.searchLoading = false;
        },
        error: () => {
          if (version !== this.filterVersion) return;
          this.searchLoading = false;
        },
      });
  }

  /** Tree emits searchChange as the user types. */
  onSearchChange(value: string): void {
    this.searchQuery = value;
    this.searchInput$.next(value);
  }

  /** True whenever the global search box has a trimmed value. */
  get searchActive(): boolean {
    return this.searchQuery.trim().length > 0;
  }

  /**
   * Re-fetch the first page of every sub-app the user has already loaded.
   * Used after a targeted refresh so the tree stays in sync without pulling
   * every job in the application.
   */
  private refetchLoadedSubApps(): void {
    const subApps = Array.from(this.loadedSubApps);
    if (subApps.length === 0) return;
    // Drop existing jobs for those sub-apps so a fresh page replaces them.
    const wanted = new Set(subApps);
    this.allJobs = this.allJobs.filter(
      (j) => !wanted.has(j.sub_application || ''),
    );
    this.loadedSubApps = new Set();
    for (const sa of subApps) {
      this.fetchSubAppJobs(sa, 0);
    }
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
      this.applyFilterChange();
      return;
    }

    this.selectedFolder = folder.folder;
    this.selectedSubApp = null;
    // Filter scope changed — invalidate previously-loaded jobs so the tree
    // shows only the folder's sub-apps under any active category filter.
    this.applyFilterChange();
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
          this.loadFolders();
          if (this.searchActive) return; // search results already cover this
          // Prefetch jobs for the folder's sub-apps so folder view has data
          // ready under the current category filter.
          for (const sa of subApps) {
            this.loadedSubApps.delete(sa);
            this.fullyLoadedSubApps.delete(sa);
            this.allJobs = this.allJobs.filter((j) => j.sub_application !== sa);
            this.fetchSubAppJobs(sa, 0);
          }
        });
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
    // Sub-app narrowing is another filter change — invalidate prior state.
    this.applyFilterChange();
    if (subApp) {
      // Kick off the first page fetch immediately so the tree shows jobs
      // without waiting on the (potentially slow) refreshFolder round-trip.
      this.fetchSubAppJobs(subApp, 0);
      this.refreshingFolders.add(folder.folder);
      this.api
        .refreshFolder(this.source, subApp)
        .pipe(
          catchError(() => of(null)),
          takeUntil(this.destroy$),
        )
        .subscribe(() => {
          this.refreshingFolders.delete(folder.folder);
          this.loadFolders();
          if (this.searchActive) return;
          // Force a fresh fetch of this sub-app's first page under the
          // current category filter so any newly-synced rows appear.
          this.loadedSubApps.delete(subApp);
          this.fullyLoadedSubApps.delete(subApp);
          this.allJobs = this.allJobs.filter(
            (j) => j.sub_application !== subApp,
          );
          this.fetchSubAppJobs(subApp, 0);
        });
    }
  }

  clearFolder(): void {
    this.selectedFolder = null;
    this.selectedSubApp = null;
    this.applyFilterChange();
  }

  clearCategory(): void {
    if (this.activeCategory === 'TOTAL') return;
    this.activeCategory = 'TOTAL';
    this.applyFilterChange();
  }

  onCategoryClick(cat: JobCategory): void {
    if (this.activeCategory === cat) return;
    this.activeCategory = cat;
    this.applyFilterChange();
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
    // Server-side filters (category, global search, sub-application) have
    // already narrowed the fetched jobs; we only need to enforce the
    // folder/sub-app scope client-side (in case the server returned a
    // superset from a broader fetch) and drop UNKNOWN_STATUS stubs.
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
