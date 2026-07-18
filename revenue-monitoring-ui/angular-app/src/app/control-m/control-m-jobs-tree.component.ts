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
  phosphorWarningBold,
  phosphorXCircleBold,
} from '@ng-icons/phosphor-icons/bold';

import type { Job } from './control-m.types';

interface SubAppNode {
  subApp: string;
  jobs: Job[];
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
  imports: [CommonModule, NgIcon],
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
      phosphorWarningBold,
      phosphorXCircleBold,
    }),
  ],
  templateUrl: './control-m-jobs-tree.component.html',
  styleUrls: ['./control-m-jobs-tree.component.css'],
})
export class ControlMJobsTreeComponent implements OnChanges {
  @Input() jobs: Job[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() set darkMode(v: boolean) {
    this._darkMode = v;
  }

  @Output() jobSelect = new EventEmitter<Job>();
  @Output() viewLogs = new EventEmitter<Job>();

  @HostBinding('class.dark-theme') _darkMode = false;

  useFolderView = false;
  folderTree: FolderNode[] = [];
  subAppTree: SubAppNode[] = [];

  expandedApps = new Set<string>();
  expandedFolders = new Set<string>();

  private hasAutoExpanded = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['jobs']) {
      this.rebuild();
    }
  }

  private rebuild(): void {
    // Exclude never-executed template stubs
    const executed = this.jobs.filter(
      (j) => (j.category as string) !== 'UNKNOWN_STATUS',
    );

    // How many unique sub-apps?
    const subs = new Set<string>();
    executed.forEach((j) => subs.add(j.sub_application || '—'));
    this.useFolderView = subs.size === 1;

    if (this.useFolderView) {
      this.folderTree = this.buildFolderTree(executed);
      this.subAppTree = [];
    } else {
      this.folderTree = [];
      this.subAppTree = this.buildSubAppTree(executed);
    }

    // Auto-expand on first non-empty render
    if (!this.hasAutoExpanded) {
      if (this.useFolderView && this.folderTree.length > 0) {
        this.hasAutoExpanded = true;
        const allPaths = new Set<string>();
        const collect = (n: FolderNode) => {
          allPaths.add(n.path);
          n.children.forEach(collect);
        };
        this.folderTree.forEach(collect);
        this.expandedFolders = allPaths;
      } else if (!this.useFolderView && this.subAppTree.length > 0) {
        this.hasAutoExpanded = true;
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
      const own = (jobsByFolder.get(path) || []).sort((a, b) =>
        a.job_name.localeCompare(b.job_name),
      );
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
    const grouped = new Map<string, Job[]>();
    for (const j of jobs) {
      const sa = j.sub_application || '—';
      if (!grouped.has(sa)) grouped.set(sa, []);
      grouped.get(sa)!.push(j);
    }
    return Array.from(grouped.entries())
      .map(([subApp, list]) => ({
        subApp,
        jobs: this.dedupLatest(list).sort((a, b) =>
          a.job_name.localeCompare(b.job_name),
        ),
      }))
      .sort((a, b) => a.subApp.localeCompare(b.subApp));
  }

  // ── UI actions ───────────────────────────────────────────────────────

  toggleApp(subApp: string): void {
    if (this.expandedApps.has(subApp)) this.expandedApps.delete(subApp);
    else this.expandedApps.add(subApp);
    this.expandedApps = new Set(this.expandedApps); // trigger CD
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
    return this.subAppTree.reduce((s, g) => s + g.jobs.length, 0);
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
