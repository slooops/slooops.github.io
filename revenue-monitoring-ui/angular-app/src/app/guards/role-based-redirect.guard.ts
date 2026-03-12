import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthenticationService } from '../providers/authentication.service';

@Injectable({
  providedIn: 'root',
})
export class RoleBasedRedirectGuard implements CanActivate {
  constructor(
    private authService: AuthenticationService,
    private router: Router,
  ) {}

  canActivate():
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    const roles = this.authService.getRoles();
    const defaultRoute = this.getDefaultRouteForRoles(roles);

    // Always redirect to the appropriate default route
    return this.router.createUrlTree([defaultRoute]);
  }

  /**
   * Determine the default route based on user roles
   * Priority order: ADMIN > PERIOD_CLOSE > EXCEPTION_* > ACCOUNT_RECON > Other roles
   */
  private getDefaultRouteForRoles(roles: string[]): string {
    if (!roles || roles.length === 0) {
      return '/error';
    }

    // ADMIN gets /period-close-tracking
    if (roles.includes('ADMIN')) {
      return '/period-close-tracking';
    }

    // PERIOD_CLOSE gets /period-close-tracking
    if (roles.includes('PERIOD_CLOSE')) {
      return '/period-close-tracking';
    }

    // EXCEPTION_ADMIN or EXCEPTION_READ_ONLY gets /invoice-to-cash
    if (
      roles.includes('EXCEPTION_ADMIN') ||
      roles.includes('EXCEPTION_READ_ONLY')
    ) {
      return '/invoice-to-cash';
    }

    // ACCOUNT_RECON gets /revenue-accounting
    if (roles.includes('ACCOUNT_RECON')) {
      return '/revenue-accounting';
    }

    // MONITORING_OM gets /order-management
    if (roles.includes('MONITORING_OM')) {
      return '/order-management';
    }

    if (
      roles.includes('CASE_IQ_MANAGER') ||
      roles.includes('CASE_IQ_OM') ||
      roles.includes('CASE_IQ_SBP') ||
      roles.includes('CASE_IQ_I2C') ||
      roles.includes('CASE_IQ_AIT') ||
      roles.includes('CASE_IQ_FPP') ||
      roles.includes('CASE_IQ_P2P') ||
      roles.includes('CASE_IQ_CAPITAL')
    ) {
      return '/case-iq';
    }

    // Business Insights roles
    if (
      roles.includes('LARGE_DEAL') ||
      roles.includes('WD0') ||
      roles.includes('MIDCLOSE_VOLUMES') ||
      roles.includes('ISSUE_RESOLUTION')
    ) {
      return '/business-insights';
    }

    // GL Posting
    if (roles.includes('GL_POSTING')) {
      return '/gl-posting';
    }

    // Operations Controls
    if (roles.includes('OPERATION_CTRL')) {
      return '/operations-controls';
    }

    // Default fallback
    return '/landing';
  }
}
