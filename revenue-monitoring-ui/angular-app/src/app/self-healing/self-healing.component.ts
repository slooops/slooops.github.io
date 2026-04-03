import { Component, HostBinding, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
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

@Component({
  selector: 'app-self-healing',
  standalone: true,
  imports: [
    CommonModule,
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

  openException(id: string): void {
    this.selectedExceptionId = id;
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
}
