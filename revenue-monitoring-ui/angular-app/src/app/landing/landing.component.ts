import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorShieldCheckDuotone,
  phosphorCalendarCheckDuotone,
  phosphorEyeDuotone,
  phosphorBrainDuotone,
  phosphorMoneyDuotone,
  phosphorChartLineUpDuotone,
  phosphorPresentationChartDuotone,
  phosphorGaugeDuotone,
  phosphorRocketLaunchDuotone,
} from '@ng-icons/phosphor-icons/duotone';
import { phosphorSparkleBold } from '@ng-icons/phosphor-icons/bold';
import { AuthenticationService } from '../providers/authentication.service';

export interface LandingCard {
  title: string;
  description: string;
  icon: string;
  route: string | null; // null = dead link (feature not yet built)
  externalUrl?: string; // opens in new tab instead of router navigation
  requiredRoles: string[];
  fullWidth?: boolean;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, NgIcon],
  providers: [
    provideIcons({
      phosphorShieldCheckDuotone,
      phosphorCalendarCheckDuotone,
      phosphorEyeDuotone,
      phosphorBrainDuotone,
      phosphorMoneyDuotone,
      phosphorChartLineUpDuotone,
      phosphorPresentationChartDuotone,
      phosphorGaugeDuotone,
      phosphorRocketLaunchDuotone,
      phosphorSparkleBold,
    }),
  ],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
})
export class LandingComponent {
  userName = signal('');
  userRoles = signal<string[]>([]);

  /** IT Operations 360 cards */
  private readonly itOpsAllCards: LandingCard[] = [
    {
      title: 'Continuous Monitoring',
      description:
        'Real-time detection of operational and transaction failures for proactive resolution to prevent business impact.',
      icon: 'phosphorShieldCheckDuotone',
      route: '/invoice-to-cash',
      requiredRoles: [
        'ADMIN',
        'PERIOD_CLOSE',
        'EXCEPTION_ADMIN',
        'EXCEPTION_READ_ONLY',
        'ACCOUNT_RECON',
        'GL_POSTING',
        'OPERATION_CTRL',
      ],
    },
    {
      title: 'Period Close Management',
      description:
        'Predictable, on-time close execution through focused monitoring and control.',
      icon: 'phosphorCalendarCheckDuotone',
      route: '/period-close-tracking',
      requiredRoles: ['ADMIN', 'PERIOD_CLOSE'],
    },
    {
      title: 'Operational Visibility',
      description:
        'Single view of all disruptions across jobs, transactions, and ESP cases for effective resource management.',
      icon: 'phosphorEyeDuotone',
      route: '/home',
      requiredRoles: ['ADMIN', 'OPERATION_CTRL'],
    },
    {
      title: 'Self-Healing',
      description:
        'AI-enabled intelligent analysis and automated remediation to accelerate issue resolution.',
      icon: 'phosphorBrainDuotone',
      route: null,
      requiredRoles: ['ADMIN'],
    },
  ];

  /** Finance Biz Ops 360 cards */
  private readonly finBizOpsAllCards: LandingCard[] = [
    {
      title: 'Large Deal Tracking',
      description:
        'End-to-end visibility into critical order life cycle during quarter-end enables collaboration between commerce and finance operations.',
      icon: 'phosphorMoneyDuotone',
      route: '/business-insights',
      requiredRoles: ['ADMIN', 'LARGE_DEAL'],
    },
    {
      title: 'Mid-Close Status',
      description:
        'Track mid-close processing phases—invoicing, AR posting, revenue, deferrals, and intercompany—across all entities with real-time completion status and FCC load visibility.',
      icon: 'phosphorGaugeDuotone',
      route: '/wd0',
      requiredRoles: ['ADMIN', 'MIDCLOSE_VOLUMES', 'WD0'],
    },
    {
      title: 'Mid-Close Volume Forecasting',
      description:
        'ML-driven predictions of volume spikes or drops to proactively manage period close.',
      icon: 'phosphorChartLineUpDuotone',
      route: '/midclose-volumes',
      requiredRoles: ['ADMIN', 'MIDCLOSE_VOLUMES', 'WD0'],
    },
    {
      title: 'O2C Financials Visibility',
      description:
        'Real-time insights into Order-to-Cash financials with immediate access to invoice and accounting details in a single view.',
      icon: 'phosphorPresentationChartDuotone',
      route: null,
      externalUrl: 'https://subscription-ai.cisco.com/',
      requiredRoles: ['ADMIN'],
    },
  ];

  itOpsCards = computed(() => this.filterByRole(this.itOpsAllCards));
  finBizOpsCards = computed(() => this.filterByRole(this.finBizOpsAllCards));

  constructor(
    private authService: AuthenticationService,
    private router: Router,
  ) {
    this.userName.set(this.authService.getUserName());
    this.userRoles.set(this.authService.getRoles());
  }

  onCardClick(card: LandingCard): void {
    if (card.externalUrl) {
      window.open(card.externalUrl, '_blank', 'noopener,noreferrer');
    } else if (card.route) {
      this.router.navigate([card.route]);
    }
  }

  private filterByRole(cards: LandingCard[]): LandingCard[] {
    const roles = this.userRoles();
    // Show all cards if roles haven't loaded yet or user is ADMIN
    if (!roles.length || roles.includes('ADMIN')) return cards;
    return cards.filter((c) => c.requiredRoles.some((r) => roles.includes(r)));
  }
}
