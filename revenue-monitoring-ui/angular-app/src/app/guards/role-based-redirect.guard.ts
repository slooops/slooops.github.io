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
    const roles = this.authService.getUserAccessRoles();
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

    // ADMIN and EXEC_VIEW go to /home
    if (roles.includes('ADMIN') || roles.includes('EXEC_VIEW')) {
      return '/home';
    }

    // PERIOD_CLOSE gets /period-close-tracking
    if (roles.includes('PERIOD_CLOSE')) {
      return '/period-close-tracking';
    }

    // MONITORING_I2C gets /invoice-to-cash
    if (
      roles.includes('MONITORING_I2C') ||
      roles.includes('MONITORING_I2C_ADMIN')
    ) {
      return '/invoice-to-cash';
    }

    // ACCOUNT_RECON or MONITORING_REVENUE_ACCOUNTING gets /revenue-accounting
    if (
      roles.includes('ACCOUNT_RECON') ||
      roles.includes('MONITORING_REVENUE_ACCOUNTING') ||
      roles.includes('MONITORING_REVENUE_ACCOUNTING_ADMIN')
    ) {
      return '/revenue-accounting';
    }

    // MONITORING_OM gets /order-management
    if (
      roles.includes('MONITORING_OM') ||
      roles.includes('MONITORING_OM_ADMIN')
    ) {
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

    // GL_AR gets /gl-posting
    if (
      roles.includes('MONITORING_GL_AR') ||
      roles.includes('MONITORING_GL_AR_ADMIN')
    ) {
      return '/gl-posting';
    }

    // Default fallback
    return '/home';
  }
}
