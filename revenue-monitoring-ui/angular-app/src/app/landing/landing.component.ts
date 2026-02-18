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
import {
  phosphorSparkleBold,
  phosphorCaretRightBold,
} from '@ng-icons/phosphor-icons/bold';
import { AuthenticationService } from '../providers/authentication.service';

interface RoleRouteMap {
  roles: string[];
  route: string;
}

/**
 * Card visual variants inspired by Cisco design system:
 * - gradient-border: Rainbow gradient border effect
 * - gradient-bg-1/2/3: SVG gradient backgrounds
 * - glass: Frosted glass effect with backdrop blur
 * - inner-glow: Soft inner glow shadow
 * - soft-glow: Outer glow halo effect
 * - default: Standard card style
 */
export type CardVariant =
  | 'gradient-border'
  | 'gradient-bg-1'
  | 'gradient-bg-2'
  | 'gradient-bg-3'
  | 'glass'
  | 'inner-glow'
  | 'soft-glow'
  | 'default';

export interface LandingCard {
  title: string;
  description: string;
  icon: string;
  route: string | null; // null = dead link (feature not yet built)
  externalUrl?: string; // opens in new tab instead of router navigation
  requiredRoles: string[];
  fullWidth?: boolean;
  roleRoutes?: RoleRouteMap[];
  variant?: CardVariant; // Visual style variant
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
      phosphorCaretRightBold,
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
        'ORDER_MANAGEMENT',
        'WIPS',
      ],
      roleRoutes: [
        {
          roles: ['ADMIN', 'EXCEPTION_ADMIN', 'EXCEPTION_READ_ONLY'],
          route: '/invoice-to-cash',
        },
        {
          roles: ['ADMIN', 'ACCOUNT_RECON'],
          route: '/revenue-accounting',
        },
        {
          roles: ['ADMIN', 'ORDER_MANAGEMENT'],
          route: '/order-management',
        },
        {
          roles: ['ADMIN', 'GL_POSTING'],
          route: '/gl-posting',
        },
        {
          roles: ['ADMIN', 'OPERATION_CTRL'],
          route: '/operations-controls',
        },
        {
          roles: ['ADMIN', 'WIPS'],
          route: '/wips',
        },
      ],
      variant: 'soft-glow',
    },
    {
      title: 'Period Close Management',
      description:
        'Predictable, on-time close execution through focused monitoring and control, providing real-time visibility.',
      icon: 'phosphorCalendarCheckDuotone',
      route: '/period-close-tracking',
      requiredRoles: ['ADMIN', 'PERIOD_CLOSE'],
      variant: 'gradient-bg-1',
    },
    {
      title: 'Operational Visibility',
      description:
        'Single view of all disruptions across jobs, transactions, and ESP cases for effective resource management.',
      icon: 'phosphorEyeDuotone',
      route: '/operational-visibility',
      requiredRoles: ['ADMIN', 'OPERATION_CTRL'],
      variant: 'glass',
    },
    {
      title: 'Self-Healing',
      description:
        'AI-enabled intelligent analysis and automated remediation to accelerate issue resolution.',
      icon: 'phosphorBrainDuotone',
      route: null,
      requiredRoles: ['ADMIN'],
      variant: 'inner-glow',
    },
  ];

  /** Finance Biz Ops 360 cards */
  private readonly finBizOpsAllCards: LandingCard[] = [
    {
      title: 'Large Deal Tracking',
      description:
        'End-to-end visibility into critical order life cycles during quarter-end across commerce and finance operations.',
      icon: 'phosphorMoneyDuotone',
      route: '/business-insights',
      requiredRoles: ['ADMIN', 'LARGE_DEAL'],
      variant: 'soft-glow',
    },
    {
      title: 'Mid-Close Status',
      description:
        'Track mid-close processing across all entities with real-time completion status and FCC load visibility.',
      icon: 'phosphorGaugeDuotone',
      route: '/wd0',
      requiredRoles: ['ADMIN', 'MIDCLOSE_VOLUMES', 'WD0'],
      variant: 'gradient-bg-2',
    },
    {
      title: 'Mid-Close Volume Forecasting',
      description:
        'ML-driven predictions of volume spikes or drops to proactively manage period close processing times.',
      icon: 'phosphorChartLineUpDuotone',
      route: '/midclose-volumes',
      requiredRoles: ['ADMIN', 'MIDCLOSE_VOLUMES', 'WD0'],
      variant: 'gradient-bg-3',
    },
    {
      title: 'O2C Financials Visibility',
      description:
        'Real-time Order-to-Cash insights with immediate access to invoice and accounting details.',
      icon: 'phosphorPresentationChartDuotone',
      route: null,
      externalUrl: 'https://subscription-ai.cisco.com/',
      requiredRoles: ['ADMIN'],
      variant: 'soft-glow',
    },
  ];

  /** ESP 360 cards */
  private readonly esp360AllCards: LandingCard[] = [
    {
      title: 'Case IQ',
      description:
        'AI-powered insights and analytics for case resolution with recommended routing and automated escalation based on case complexity and team capacity.',
      icon: 'phosphorBrainDuotone',
      route: '/esp/case-iq',
      requiredRoles: ['ADMIN', 'CASE_IQ'],
      variant: 'soft-glow',
    },
    {
      title: 'Case Manager',
      description:
        'Centralized case management platform for tracking, prioritizing, and resolving operational exceptions across all processes.',
      icon: 'phosphorCalendarCheckDuotone',
      route: '/esp/case-manager',
      requiredRoles: ['ADMIN', 'CASE_MANAGER'],
      variant: 'soft-glow',
    },
  ];

  itOpsCards = computed(() => this.filterByRole(this.itOpsAllCards));
  finBizOpsCards = computed(() => this.filterByRole(this.finBizOpsAllCards));
  esp360Cards = computed(() => this.filterByRole(this.esp360AllCards));

  // Organize cards into 3 columns
  cardColumns = computed(() => {
    const itCards = this.itOpsCards();
    const finCards = this.finBizOpsCards();
    const espCards = this.esp360Cards();
    return [
      { header: 'IT Operations 360', cards: itCards },
      { header: 'Finance Biz Ops 360', cards: finCards },
      // { header: 'ESP 360', cards: espCards },
    ];
  });

  constructor(
    private authService: AuthenticationService,
    private router: Router,
  ) {
    this.userName.set(this.authService.getUserName());
    this.userRoles.set(this.authService.getRoles());
  }

  onCardClick(card: LandingCard): void {
    if (!this.isCardInteractive(card)) {
      return;
    }

    if (card.externalUrl) {
      window.open(card.externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    const route = this.resolveCardRoute(card);
    if (route) {
      this.router.navigate([route]);
    }
  }

  private resolveCardRoute(card: LandingCard): string | null {
    if (card.roleRoutes?.length) {
      const roles = this.userRoles();
      for (const mapping of card.roleRoutes) {
        const hasRole = mapping.roles.some((role) => roles.includes(role));
        if (hasRole) {
          return mapping.route;
        }
      }
    }
    if (card.route && this.canAccessCard(card)) {
      return card.route;
    }
    return null;
  }

  isCardInteractive(card: LandingCard): boolean {
    return this.cardHasDestination(card) && this.canAccessCard(card);
  }

  private cardHasDestination(card: LandingCard): boolean {
    return Boolean(card.externalUrl || card.route || card.roleRoutes?.length);
  }

  private canAccessCard(card: LandingCard): boolean {
    const roles = this.userRoles();
    if (!card.requiredRoles?.length) {
      return true;
    }
    if (!roles.length) {
      return true;
    }
    if (roles.includes('ADMIN')) {
      return true;
    }
    return card.requiredRoles.some((role) => roles.includes(role));
  }

  private filterByRole(cards: LandingCard[]): LandingCard[] {
    return cards;
  }
}
