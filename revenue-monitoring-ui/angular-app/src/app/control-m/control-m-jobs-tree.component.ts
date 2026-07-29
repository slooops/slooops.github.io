import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorCaretDownBold,
  phosphorCaretRightBold,
  phosphorCheckCircleBold,
  phosphorCircleNotchBold,
  phosphorClockBold,
  phosphorEyeBold,
  phosphorFileTextBold,
  phosphorFolderBold,
  phosphorFolderOpenBold,
  phosphorLockBold,
  phosphorMagnifyingGlassBold,
  phosphorWarningBold,
  phosphorXBold,
  phosphorXCircleBold,
} from '@ng-icons/phosphor-icons/bold';

import { LoadingSymbolComponent } from '../loading-symbol/loading-symbol.component';
import { LoadingSymbolSmallComponent } from '../loading-symbol-small/loading-symbol-small.component';
import type { Job, SubApplication } from './control-m.types';

interface SubAppNode {
  subApp: string;
  displayName: string;
  totalCount: number;
  loadedJobs: Job[];
  hasFailure: boolean;
  hasLongRunning: boolean;
  hasLateStart: boolean;
}

interface FolderNode {
  path: string;
  name: string;
  jobs: Job[];
  children: FolderNode[];
  totalJobs: number;
}

@Component({
  selector: 'app-control-m-jobs-tree',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIcon,
    LoadingSymbolComponent,
    LoadingSymbolSmallComponent,
  ],
  providers: [
    provideIcons({
      phosphorCaretDownBold,
      phosphorCaretRightBold,
      phosphorCheckCircleBold,
      phosphorCircleNotchBold,
      phosphorClockBold,
      phosphorEyeBold,
      phosphorFileTextBold,
      phosphorFolderBold,
      phosphorFolderOpenBold,
      phosphorLockBold,
      phosphorMagnifyingGlassBold,
      phosphorWarningBold,
      phosphorXBold,
      phosphorXCircleBold,
    }),
  ],
  templateUrl: './control-m-jobs-tree.component.html',
  styleUrls: ['./control-m-jobs-tree.component.css'],
})
export class ControlMJobsTreeComponent implements OnChanges {
  /**
   * Jobs that have already been fetched from the server. In lazy-load mode
   * this is the accumulator the parent appends to as sub-apps are expanded.
   */
  @Input() jobs: Job[] = [];

  /**
   * Sub-application outline (name + total job count + health flags) used to
   * render the top-level tree structure BEFORE any jobs are loaded.
   * When set, the tree renders one row per outline entry and only pulls
   * `jobs` when a row is expanded.
   */
  @Input() subAppOutline: SubApplication[] = [];

  /**
   * Sub-applications currently being fetched. Used to show a per-row spinner.
   */
  @Input() loadingSubApps: Set<string> = new Set();

  /**
   * Sub-applications the parent has confirmed as fully loaded under the
   * current filter (server returned a short page). When present, the
   * "Load more" button is suppressed even if `loadedJobs.length` is below
   * the outline `totalCount` — typical when a category filter is active.
   */
  @Input() fullyLoadedSubApps: Set<string> = new Set();

  /**
   * When true (e.g. global search mode), all sub-app rows auto-expand on
   * rebuild so the user sees results without clicking each row.
   */
  @Input() forceExpandAll = false;

  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() search = '';
  /**
   * Optional label describing the current narrowing (folder name, sub-app
   * display name). When set, it renders next to the tree title so users can
   * see which selection the tree is currently scoped to.
   */
  @Input() scopeLabel: string | null = null;
  @Input() set darkMode(v: boolean) {
    this._darkMode = v;
  }

  @Output() jobSelect = new EventEmitter<Job>();
  @Output() viewLogs = new EventEmitter<Job>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() subAppExpand = new EventEmitter<{
    subApp: string;
    loadedCount: number;
  }>();
  @Output() subAppLoadMore = new EventEmitter<{
    subApp: string;
    loadedCount: number;
  }>();

  onSearchInput(value: string): void {
    this.search = value;
    this.searchChange.emit(value);
  }

  clearSearch(): void {
    this.onSearchInput('');
  }

  @HostBinding('class.dark-theme') _darkMode = false;

  useFolderView = false;
  folderTree: FolderNode[] = [];
  subAppTree: SubAppNode[] = [];

  expandedApps = new Set<string>();
  expandedFolders = new Set<string>();

  /**
   * Signature of the last folder-view shape we auto-expanded for. Only used
   * in `useFolderView` (single-sub-app) mode. In multi-sub-app mode with the
   * lazy-loading outline we default all rows to COLLAPSED and never
   * auto-expand.
   */
  private lastFolderShapeKey = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['jobs'] ||
      changes['subAppOutline'] ||
      changes['forceExpandAll']
    ) {
      this.rebuild();
    }
  }

  private rebuild(): void {
    // Exclude never-executed template stubs
    const executed = this.jobs.filter(
      (j) => (j.category as string) !== 'UNKNOWN_STATUS',
    );

    // Prefer the parent-supplied outline for the top-level structure. Fall
    // back to unique sub-apps from the loaded jobs (legacy / drill-down
    // paths where the outline isn't set).
    let sourceSubApps: string[];
    if (this.subAppOutline.length > 0) {
      sourceSubApps = this.subAppOutline.map((s) => s.sub_app);
    } else {
      const set = new Set<string>();
      executed.forEach((j) => set.add(j.sub_application || '—'));
      sourceSubApps = Array.from(set);
    }

    // Folder view kicks in when the caller has narrowed the outline (or the
    // loaded jobs) to a single sub-application — typically after a tile click.
    this.useFolderView = sourceSubApps.length === 1;

    if (this.useFolderView) {
      this.folderTree = this.buildFolderTree(executed);
      this.subAppTree = [];
    } else {
      this.folderTree = [];
      this.subAppTree = this.buildSubAppTree(executed);
    }

    if (this.useFolderView && this.folderTree.length > 0) {
      // Folder view is triggered by a deliberate narrowing (single sub-app)
      // and typically contains a small number of folders — expand them all
      // by default when the shape changes so contents are immediately visible.
      const allPaths = new Set<string>();
      const collect = (n: FolderNode) => {
        allPaths.add(n.path);
        n.children.forEach(collect);
      };
      this.folderTree.forEach(collect);

      const key = Array.from(allPaths).sort().join('|');
      if (key !== this.lastFolderShapeKey) {
        this.expandedFolders = allPaths;
        this.lastFolderShapeKey = key;
      }
      this.expandedApps = new Set();
    } else {
      // Multi-sub-app (outline) mode: everything starts collapsed by default.
      // User explicitly opens rows, which triggers on-demand job fetches.
      // Exception: search mode passes `forceExpandAll` so the caller can flip
      // every row open once search results arrive.
      this.expandedFolders = new Set();
      this.lastFolderShapeKey = '';
      if (this.forceExpandAll && this.subAppTree.length > 0) {
        this.expandedApps = new Set(this.subAppTree.map((n) => n.subApp));
      }
    }
  }

  // ── Dedup: keep the latest run per job_name ──────────────────────────

  private dedupLatest(jobs: Job[]): Job[] {
    const map = new Map<string, Job>();
    for (const job of jobs) {
      const existing = map.get(job.job_name);
      if (!existing) {
        map.set(job.job_name, job);
        continue;
      }
      const et = existing.start_time
        ? new Date(existing.start_time).getTime()
        : 0;
      const nt = job.start_time ? new Date(job.start_time).getTime() : 0;
      if (nt > et) map.set(job.job_name, job);
    }
    return Array.from(map.values());
  }

  // ── Job sort: Ended Not OK → Wait Condition → Ended OK → other, then
  //             within each bucket ordered by start_time ascending. ────

  private jobSortRank(job: Job): number {
    const status = (job.status || '').toLowerCase();
    const category = (job.category || '').toUpperCase();
    if (category === 'FAILURE' || status === 'ended not ok') return 0;
    if (category === 'WAIT_CONDITION' || status.includes('wait')) return 1;
    if (category === 'SUCCESS' || status === 'ended ok') return 2;
    return 3;
  }

  private readonly compareJobs = (a: Job, b: Job): number => {
    const ra = this.jobSortRank(a);
    const rb = this.jobSortRank(b);
    if (ra !== rb) return ra - rb;
    const at = a.start_time
      ? new Date(a.start_time).getTime()
      : Number.POSITIVE_INFINITY;
    const bt = b.start_time
      ? new Date(b.start_time).getTime()
      : Number.POSITIVE_INFINITY;
    if (at !== bt) return at - bt;
    return a.job_name.localeCompare(b.job_name);
  };

  // ── Folder tree (single-sub-app mode) ────────────────────────────────

  private buildFolderTree(jobs: Job[]): FolderNode[] {
    const unique = this.dedupLatest(jobs);

    const jobsByFolder = new Map<string, Job[]>();
    const allFolders = new Set<string>();
    for (const j of unique) {
      const folder = j.folder || 'Unknown';
      allFolders.add(folder);
      if (!jobsByFolder.has(folder)) jobsByFolder.set(folder, []);
      jobsByFolder.get(folder)!.push(j);
    }

    const buildNode = (path: string): FolderNode => {
      const own = (jobsByFolder.get(path) || []).sort(this.compareJobs);
      const childPaths = Array.from(allFolders).filter((f) => {
        if (!f.startsWith(path + '/')) return false;
        const rest = f.slice(path.length + 1);
        return !rest.includes('/');
      });
      const children = childPaths
        .map((cp) => buildNode(cp))
        .sort((a, b) => a.name.localeCompare(b.name));
      const totalJobs =
        own.length + children.reduce((sum, c) => sum + c.totalJobs, 0);
      return {
        path,
        name: path.split('/').pop() || path,
        jobs: own,
        children,
        totalJobs,
      };
    };

    // Roots: folders whose parent path isn't in the set
    const roots = Array.from(allFolders).filter((f) => {
      const parent = f.split('/').slice(0, -1).join('/');
      return !parent || !allFolders.has(parent);
    });

    return roots
      .map((r) => buildNode(r))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // ── Sub-app tree (multi-sub-app mode) ────────────────────────────────

  private buildSubAppTree(jobs: Job[]): SubAppNode[] {
    // Group loaded jobs by sub-application
    const grouped = new Map<string, Job[]>();
    for (const j of jobs) {
      const sa = j.sub_application || '—';
      if (!grouped.has(sa)) grouped.set(sa, []);
      grouped.get(sa)!.push(j);
    }

    if (this.subAppOutline.length > 0) {
      // Outline mode: one row per outline entry. `loadedJobs` may be empty
      // (nothing fetched yet) or a subset up to the sub-app's total count.
      return this.subAppOutline
        .map((sa) => {
          const loaded = this.dedupLatest(grouped.get(sa.sub_app) ?? []).sort(
            this.compareJobs,
          );
          return {
            subApp: sa.sub_app,
            displayName: sa.display_name || sa.sub_app,
            totalCount: sa.count,
            loadedJobs: loaded,
            hasFailure: sa.has_failure,
            hasLongRunning: sa.has_long_running,
            hasLateStart: sa.has_late_start,
          } satisfies SubAppNode;
        })
        .sort((a, b) => a.subApp.localeCompare(b.subApp));
    }

    // Legacy fallback: no outline supplied — derive rows from loaded jobs only.
    return Array.from(grouped.entries())
      .map(([subApp, list]) => {
        const loaded = this.dedupLatest(list).sort(this.compareJobs);
        return {
          subApp,
          displayName: subApp,
          totalCount: loaded.length,
          loadedJobs: loaded,
          hasFailure: false,
          hasLongRunning: false,
          hasLateStart: false,
        } satisfies SubAppNode;
      })
      .sort((a, b) => a.subApp.localeCompare(b.subApp));
  }

  // ── UI actions ───────────────────────────────────────────────────────

  toggleApp(subApp: string): void {
    const opening = !this.expandedApps.has(subApp);
    if (opening) this.expandedApps.add(subApp);
    else this.expandedApps.delete(subApp);
    this.expandedApps = new Set(this.expandedApps); // trigger CD

    // Fire load request if this sub-app has no jobs loaded yet and isn't
    // already being fetched. The parent decides page size / offset.
    if (opening) {
      const node = this.subAppTree.find((n) => n.subApp === subApp);
      if (
        node?.loadedJobs.length === 0 &&
        node.totalCount > 0 &&
        !this.loadingSubApps.has(subApp)
      ) {
        this.subAppExpand.emit({ subApp, loadedCount: 0 });
      }
    }
  }

  loadMoreForSubApp(node: SubAppNode, event: Event): void {
    event.stopPropagation();
    if (this.loadingSubApps.has(node.subApp)) return;
    if (node.loadedJobs.length >= node.totalCount) return;
    this.subAppLoadMore.emit({
      subApp: node.subApp,
      loadedCount: node.loadedJobs.length,
    });
  }

  toggleFolder(path: string): void {
    if (this.expandedFolders.has(path)) this.expandedFolders.delete(path);
    else this.expandedFolders.add(path);
    this.expandedFolders = new Set(this.expandedFolders);
  }

  onViewLogs(job: Job, event: Event): void {
    event.stopPropagation();
    this.viewLogs.emit(job);
  }

  onJobSelect(job: Job, event: Event): void {
    event.stopPropagation();
    this.jobSelect.emit(job);
  }

  // ── Presentational helpers ───────────────────────────────────────────

  countJobs(node: FolderNode): number {
    return node.totalJobs;
  }

  countFolders(nodes: FolderNode[]): number {
    return nodes.reduce((sum, n) => sum + 1 + this.countFolders(n.children), 0);
  }

  get flatJobCount(): number {
    if (this.useFolderView) {
      return this.folderTree.reduce((s, f) => s + this.countJobs(f), 0);
    }
    // Prefer outline totals (accurate even before jobs are fetched).
    return this.subAppTree.reduce((s, g) => s + g.totalCount, 0);
  }

  get folderCount(): number {
    return this.countFolders(this.folderTree);
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

  formatDateTime(v: string | null): string {
    if (!v) return '—';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    return d.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  /**
   * Status icon metadata for a job — matches React StatusIcon component.
   * Returns null if no icon should be shown.
   */
  statusIcon(
    job: Job,
  ): { name: string; cls: string; label: string; spin?: boolean } | null {
    const s = (job.status || '').toLowerCase();
    if (s.includes('hold') || s.includes('held'))
      return { name: 'phosphorLockBold', cls: 'cm-si-neutral', label: 'Held' };
    if (
      s.includes('not ok') ||
      s.includes('abend') ||
      job.category === 'FAILURE'
    )
      return {
        name: 'phosphorXCircleBold',
        cls: 'cm-si-error',
        label: 'Failed',
      };
    if (
      s.includes('ended ok') ||
      s.includes('succeeded') ||
      job.category === 'SUCCESS'
    )
      return {
        name: 'phosphorCheckCircleBold',
        cls: 'cm-si-ok',
        label: 'Succeeded',
      };
    if (s.includes('executing') || (job.category as string) === 'RUNNING')
      return {
        name: 'phosphorCircleNotchBold',
        cls: 'cm-si-info',
        label: 'Running',
        spin: true,
      };
    if (job.category === 'LONG_RUNNING')
      return {
        name: 'phosphorWarningBold',
        cls: 'cm-si-long',
        label: 'Long running',
      };
    if (job.category === 'LATE_START' || s.includes('wait'))
      return { name: 'phosphorClockBold', cls: 'cm-si-warn', label: 'Waiting' };
    return null;
  }

  statusBadgeClass(job: Job): string {
    const cat = job.category;
    const s = (job.status || '').toLowerCase();
    if (s.includes('not ok') || s.includes('abend') || cat === 'FAILURE')
      return 'cm-status cm-status-error';
    if (s.includes('ended ok') || s.includes('succeeded') || cat === 'SUCCESS')
      return 'cm-status cm-status-ok';
    if (cat === 'LONG_RUNNING') return 'cm-status cm-status-long';
    if ((cat as string) === 'RUNNING' || s.includes('executing'))
      return 'cm-status cm-status-info';
    if (cat === 'LATE_START' || s.includes('wait'))
      return 'cm-status cm-status-warn';
    return 'cm-status cm-status-neutral';
  }

  trackByJob = (_: number, j: Job) => j.job_id;
  trackByFolder = (_: number, n: FolderNode) => n.path;
  trackBySubApp = (_: number, n: SubAppNode) => n.subApp;

  folderIndent(depth: number): { [key: string]: string } {
    return { 'padding-left': `${depth * 24 + 16}px` };
  }
}
