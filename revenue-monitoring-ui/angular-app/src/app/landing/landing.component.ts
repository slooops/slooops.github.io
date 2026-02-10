import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthenticationService } from '../providers/authentication.service';

export interface LandingCard {
  title: string;
  description: string;
  iconEmoji: string;
  route: string | null; // null = dead link (feature not yet built)
  requiredRoles: string[];
  fullWidth?: boolean;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
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
        'Real-time monitoring of transaction processing, exception handling, and operational health across finance systems.',
      iconEmoji: '📊',
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
        'Track and manage period close activities, milestones, and key deadlines across the organization.',
      iconEmoji: '📅',
      route: '/period-close-tracking',
      requiredRoles: ['ADMIN', 'PERIOD_CLOSE'],
    },
    {
      title: 'Operational Visibility',
      description:
        'Comprehensive view of operational metrics, system health, and process performance indicators.',
      iconEmoji: '👁️',
      route: null,
      requiredRoles: ['ADMIN', 'OPERATION_CTRL'],
    },
    {
      title: 'Self-Healing',
      description:
        'Automated issue detection and resolution capabilities for common operational exceptions.',
      iconEmoji: '🔧',
      route: null,
      requiredRoles: ['ADMIN'],
    },
  ];

  /** Finance Biz Ops 360 cards */
  private readonly finBizOpsAllCards: LandingCard[] = [
    {
      title: 'Large Deal Tracking',
      description:
        'End-to-end visibility into large deal lifecycle, from order placement through revenue recognition.',
      iconEmoji: '💰',
      route: '/large-deal-tracker',
      requiredRoles: ['ADMIN', 'LARGE_DEAL'],
      fullWidth: true,
    },
    {
      title: 'Mid-Close Volume Forecasting',
      description:
        'Predictive analytics for mid-close transaction volumes and capacity planning.',
      iconEmoji: '📈',
      route: '/midclose-volumes',
      requiredRoles: ['ADMIN', 'MIDCLOSE_VOLUMES', 'WD0'],
    },
    {
      title: 'O2C Financials Visibility',
      description:
        'Order-to-cash financial tracking with real-time visibility into billing, invoicing, and collections.',
      iconEmoji: '💎',
      route: '/o2c-landing',
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
    if (card.route) {
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
