import { Component, HostBinding, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { ExceptionsComponent } from './exceptions/exceptions.component';
import { ExceptionDetailsComponent } from './exception-details/exception-details.component';

interface MenuItem {
  label: string;
  icon: string;
  active?: boolean;
}

interface ActionLog {
  title: string;
  subtitle: string;
  color: 'amber' | 'primary' | 'primary-light';
}

interface KpiCard {
  label: string;
  value: string;
  highlight?: boolean;
  highlightColor?: string;
  bars: number[];
}

interface Session {
  id: string;
  category: string;
  issueType: string;
  status: string;
  statusClass: string;
}

interface CategorySlice {
  label: string;
  percent: number;
  color: string;
  colorEnd: string;
  offset: number;
}

interface ExceptionRow {
  id: string;
  timeAgo: string;
  title: string;
  tags: { label: string; type: 'agentic' | 'auto-fix' }[];
  impactLevel: string;
  impactClass: string;
}

interface PatternRow {
  id: string;
  title: string;
  errorSnippet: string;
  confidence: 'HIGH' | 'MED';
  successRate: number;
  seenCount: number;
  category: string;
}

@Component({
  selector: 'app-self-healing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIcon,
    ExceptionsComponent,
    ExceptionDetailsComponent,
  ],
  templateUrl: './self-healing.component.html',
  styleUrls: ['./self-healing.component.css'],
})
export class SelfHealingComponent {
  /* ── Dark Mode ── */
  isDarkMode = false;

  @HostBinding('class.dark-theme')
  get darkThemeClass() {
    return this.isDarkMode;
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
  }

  /* ── Menu ── */
  showGridMenu = false;
  selectedMenuIndex = 0;
  selectedExceptionId: string | null = null;
  exceptionOrigin: 'command-center' | 'exceptions-queue' = 'command-center';

  menuItems: MenuItem[] = [
    { label: 'Command Center', icon: 'phosphorSquaresFourBold' },
    { label: 'Exceptions', icon: 'phosphorWarningBold' },
    { label: 'Sessions', icon: 'phosphorCrosshairBold' },
    { label: 'Patterns', icon: 'phosphorSparkleBold' },
  ];

  toggleGridMenu(event: Event): void {
    event.stopPropagation();
    this.showGridMenu = !this.showGridMenu;
  }

  onGridMenuItemClick(index: number): void {
    this.showGridMenu = false;
    this.selectedMenuIndex = index;
    this.selectedExceptionId = null;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.showGridMenu = false;
  }

  /* Navigate to exception detail from command center */
  openException(id: string): void {
    this.selectedExceptionId = id;
    this.exceptionOrigin = 'command-center';
    this.selectedMenuIndex = 1;
  }

  /* Navigate to exception detail from exceptions queue */
  openExceptionFromQueue(id: string): void {
    this.selectedExceptionId = id;
    this.exceptionOrigin = 'exceptions-queue';
  }

  /* Back from exception detail — return to origin */
  backFromExceptionDetail(): void {
    if (this.exceptionOrigin === 'command-center') {
      this.selectedExceptionId = null;
      this.selectedMenuIndex = 0;
    } else {
      this.selectedExceptionId = null;
    }
  }

  /* Navigate to full exceptions list */
  viewAllExceptions(): void {
    this.selectedExceptionId = null;
    this.selectedMenuIndex = 1;
  }

  /* Back arrow in header — return to command center */
  goBackToCommandCenter(): void {
    this.selectedMenuIndex = 0;
    this.selectedExceptionId = null;
  }

  backToQueue(): void {
    this.selectedExceptionId = null;
  }

  /* ── Hero ── */
  systemHealth = '99.9%';
  systemDescription =
    'System is performing within optimal parameters. 1,240 nodes are active and synchronized across global regions.';

  /* ── Period Status ── */
  periodStatus = {
    periodName: 'APR-26',
    periodEndDate: '04/25/2026',
    lastUpdated: new Date().toLocaleString(),
  };

  /* ── Action Logs ── */
  actionLogs: ActionLog[] = [
    {
      title: 'Memory leak suppressed in Cluster-A7',
      subtitle: '2 minutes ago • Automated Fix',
      color: 'amber',
    },
    {
      title: 'New session #SES-94821-X initiated',
      subtitle: '5 minutes ago • Inbound Request',
      color: 'primary',
    },
    {
      title: 'Global Sync complete across 12 nodes',
      subtitle: '12 minutes ago • Scheduled Task',
      color: 'primary-light',
    },
  ];

  /* ── KPI Cards ── */
  kpiCards: KpiCard[] = [
    { label: 'Exceptions Analysed', value: '1,284', bars: [40, 60, 30, 80] },
    {
      label: 'Awaiting Review',
      value: '47',
      highlight: true,
      highlightColor: 'amber',
      bars: [80, 50, 60, 30],
    },
    { label: 'Reviewed', value: '1,237', bars: [20, 40, 70, 90] },
    {
      label: 'Auto-Routing Active',
      value: '12 Sessions',
      bars: [40, 40, 40, 40],
    },
    { label: 'Avg Analysis Time', value: '4.2 Sec', bars: [60, 40, 20, 15] },
  ];

  /* ── Donut Chart ── */
  donutTotal = '1.2k';
  categorySlices: CategorySlice[] = [
    {
      label: 'Revenue',
      percent: 41,
      color: '#00bceb',
      colorEnd: '#33d4f5',
      offset: 0,
    },
    {
      label: 'Billing',
      percent: 21,
      color: '#ff9000',
      colorEnd: '#ffb04d',
      offset: -45,
    },
    {
      label: 'Attribution',
      percent: 26,
      color: '#87e15d',
      colorEnd: '#a8ec85',
      offset: -70,
    },
  ];

  /* ── Active Sessions ── */
  sessions: Session[] = [
    {
      id: '#SES-94821-X',
      category: 'Revenue',
      issueType: 'Auth Failure',
      status: 'AWAITING_UPSTREAM',
      statusClass: 'status--awaiting',
    },
    {
      id: '#SES-94825-B',
      category: 'Billing',
      issueType: 'Duplicate Invoice',
      status: 'PENDING',
      statusClass: 'status--pending',
    },
    {
      id: '#SES-94830-L',
      category: 'Attribution',
      issueType: 'Token Expiry',
      status: 'PENDING',
      statusClass: 'status--pending',
    },
    {
      id: '#SES-94832-M',
      category: 'Revenue',
      issueType: 'Gateway Timeout',
      status: 'FAILED',
      statusClass: 'status--failed',
    },
  ];

  /* ── Patterns ── */
  patternSearch = '';
  patternConfidenceFilter = 'all';
  patternCategoryFilter = 'all';
  patternsDisplayCount = 6;

  allPatterns: PatternRow[] = [
    {
      id: 'PTRN-88219',
      title: 'Socket Hangup Exception',
      errorSnippet: 'Error: ETIMEDOUT at TCPConnectWrap.afterCo...',
      confidence: 'HIGH',
      successRate: 94,
      seenCount: 1242,
      category: 'Network',
    },
    {
      id: 'PTRN-44912',
      title: 'SQL Transaction Deadlock',
      errorSnippet: 'Transaction (Process ID 72) was deadlocked...',
      confidence: 'MED',
      successRate: 68,
      seenCount: 452,
      category: 'Database',
    },
    {
      id: 'PTRN-12093',
      title: 'Memory Leak Warning',
      errorSnippet: 'Heap usage near limit: 94.2% [2048mb / 217...',
      confidence: 'HIGH',
      successRate: 82,
      seenCount: 89,
      category: 'Infrastructure',
    },
    {
      id: 'PTRN-55100',
      title: 'Invalid API Key Signature',
      errorSnippet: '401 Unauthorized: The request signature do...',
      confidence: 'HIGH',
      successRate: 99,
      seenCount: 2104,
      category: 'Auth',
    },
    {
      id: 'PTRN-99023',
      title: 'Permission Denied (S3)',
      errorSnippet: 'AccessDenied: User is not authorized to pe...',
      confidence: 'MED',
      successRate: 41,
      seenCount: 312,
      category: 'Auth',
    },
    {
      id: 'PTRN-00122',
      title: 'Worker Process Crash',
      errorSnippet: 'FATAL ERROR: Ineffective mark-compacts nea...',
      confidence: 'HIGH',
      successRate: 76,
      seenCount: 156,
      category: 'Infrastructure',
    },
    {
      id: 'PTRN-33401',
      title: 'Rate Limit Exceeded',
      errorSnippet: '429 Too Many Requests: Rate limit exceeded ...',
      confidence: 'HIGH',
      successRate: 91,
      seenCount: 834,
      category: 'Network',
    },
    {
      id: 'PTRN-77012',
      title: 'Certificate Expiry Warning',
      errorSnippet: 'SSL: CERTIFICATE_VERIFY_FAILED cert expire...',
      confidence: 'MED',
      successRate: 55,
      seenCount: 67,
      category: 'Network',
    },
  ];

  get recentPatterns(): PatternRow[] {
    return this.allPatterns.slice(0, 4);
  }

  get filteredPatterns(): PatternRow[] {
    let patterns = this.allPatterns;
    if (this.patternSearch) {
      const q = this.patternSearch.toLowerCase();
      patterns = patterns.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.errorSnippet.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      );
    }
    if (this.patternConfidenceFilter !== 'all') {
      patterns = patterns.filter(
        (p) => p.confidence === this.patternConfidenceFilter,
      );
    }
    if (this.patternCategoryFilter !== 'all') {
      patterns = patterns.filter(
        (p) => p.category === this.patternCategoryFilter,
      );
    }
    return patterns.slice(0, this.patternsDisplayCount);
  }

  get patternCategories(): string[] {
    return [...new Set(this.allPatterns.map((p) => p.category))];
  }

  viewAllPatterns(): void {
    this.selectedMenuIndex = 3;
  }

  openPatternDetail(id: string): void {
    /* Navigate to patterns full view */
    this.selectedMenuIndex = 3;
  }

  loadMorePatterns(): void {
    this.patternsDisplayCount += 6;
  }

  getSuccessBarColor(rate: number): string {
    if (rate >= 80) return 'var(--sh-cyan)';
    if (rate >= 60) return 'var(--sh-amber)';
    return 'var(--sh-red)';
  }

  /* ── Exceptions Table ── */
  recentExceptions: ExceptionRow[] = [
    {
      id: 'EXC-2024-00847',
      timeAgo: '2 hours ago',
      title: 'Billing Mismatch',
      tags: [
        { label: 'AGENTIC', type: 'agentic' },
        { label: 'AUTO_FIX', type: 'auto-fix' },
      ],
      impactLevel: 'High Criticality',
      impactClass: 'impact--high',
    },
    {
      id: 'EXC-2024-00912',
      timeAgo: '4 hours ago',
      title: 'API Handshake Timeout',
      tags: [{ label: 'AGENTIC', type: 'agentic' }],
      impactLevel: 'Medium',
      impactClass: 'impact--medium',
    },
    {
      id: 'EXC-2024-01042',
      timeAgo: '6 hours ago',
      title: 'Stale Cache Policy Conflict',
      tags: [{ label: 'AUTO_FIX', type: 'auto-fix' }],
      impactLevel: 'Low',
      impactClass: 'impact--low',
    },
    {
      id: 'EXC-2024-01183',
      timeAgo: '12 hours ago',
      title: 'Redundant Token Generation',
      tags: [
        { label: 'AGENTIC', type: 'agentic' },
        { label: 'AUTO_FIX', type: 'auto-fix' },
      ],
      impactLevel: 'Medium',
      impactClass: 'impact--medium',
    },
  ];
}
