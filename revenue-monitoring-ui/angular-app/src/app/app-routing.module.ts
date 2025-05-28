import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { InvoicingComponent } from './invoicing/invoicing.component';
import { PeriodCloseTrackingComponent } from './period-close-tracking/period-close-tracking.component';
import { CustomRevenueComponent } from './custom-revenue/custom-revenue.component';
import { EspCaseAnalyzerComponent } from './esp-case-analyzer/esp-case-analyzer.component';
import { O2cDemoComponent } from './o2c-demo/o2c-demo.component';
import { O2cDetailsComponent } from './o2c-demo/o2c-details/o2c-details.component';
import { O2cInvoicingComponent } from './o2c-demo/o2c-invoicing/o2c-invoicing.component';
import { O2cOrderComponent } from './o2c-demo/o2c-order/o2c-order.component';
import { O2cSubComponent } from './o2c-demo/o2c-sub/o2c-sub.component';
import { O2cAccrualComponent } from './o2c-demo/o2c-accrual/o2c-accrual.component';
import { O2cLandingComponent } from './o2c-demo/o2c-landing/o2c-landing.component';
import { O2cOverviewComponent } from './o2c-demo/o2c-overview/o2c-overview.component';
import { GlPostingComponent } from './gl-posting/gl-posting.component';
import { ErrorComponent } from './error/error.component';
import { OplComponent } from './opl/opl.component';
import { PrecloseComponent } from './period-close-tracking/preclose/preclose.component';
import { MidcloseComponent } from './period-close-tracking/midclose/midclose.component';
import { OrderLifecycleComponent } from './order-lifecycle/order-lifecycle.component';
import { StandardRevenueComponent } from './standard-revenue/standard-revenue.component';
import { AccrualsComponent } from './accruals/accruals.component';
import { AccountReconComponent } from './account-recon/account-recon.component';
import { PreInvoicingComponent } from './pre-invoicing/pre-invoicing.component';
import { PostInvoicingComponent } from './post-invoicing/post-invoicing.component';
import { EinvoicingComponent } from './einvoicing/einvoicing.component';
import { FusionComponent } from './fusion/fusion.component';
import { Wd0DashComponent } from './wd0-dash/wd0-dash.component';
import { Wd0HistoricalDataComponent } from './wd0-historical-data/wd0-historical-data.component';
import { BusinessInsightsComponent } from './business-insights/business-insights.component';
import { CmsComponent } from './cms/cms.component';
import { OrderManagementComponent } from './order-management/order-management.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    component: HomeComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Home',
    },
  },
  {
    path: 'error',
    component: ErrorComponent,
    data: { title: 'Finance IT Control Tower', header: '' },
  },

  {
    path: 'period-close-tracking',
    component: PeriodCloseTrackingComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Continuous Monitoring',
    },
  },
  {
    path: 'period-close-tracking-midclose',
    component: MidcloseComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Period Close Tracking',
    },
  },
  {
    path: 'large-deal-tracker',
    component: OrderLifecycleComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Large Deal Tracker',
    },
  },
  {
    path: 'standard-revenue',
    component: StandardRevenueComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Standard Revenue',
    },
  },
  {
    path: 'revenue-accounting',
    component: CustomRevenueComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Continuous Monitoring',
    },
  },
  {
    path: 'accruals',
    component: AccrualsComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Accruals',
    },
  },
  {
    path: 'accounts',
    component: AccountReconComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Accounts',
    },
  },
  {
    path: 'gl-posting',
    component: GlPostingComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Continuous Monitoring',
    },
  },
  // {
  //   path: 'sbp',
  //   component: SbpComponent,
  //   data: {
  //     title: 'SBP Monitoring',
  //     header: 'Subscription Billing Platform Monitoring',
  //   },
  // },
  {
    path: 'case-analyzer',
    component: EspCaseAnalyzerComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'ESP Case Manager',
    },
  },
  {
    path: 'pre-invoicing',
    component: PreInvoicingComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Pre-Invoicing',
    },
  },
  {
    path: 'invoice-to-cash',
    component: InvoicingComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Continuous Monitoring',
    },
  },
  {
    path: 'post-invoicing',
    component: PostInvoicingComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Post-Invoicing',
    },
  },
  {
    path: 'einvoicing',
    component: EinvoicingComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'EInvoicing',
    },
  },
  {
    path: 'fusion',
    component: FusionComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Fusion',
    },
  },
  {
    path: 'o2c-demo',
    component: O2cDemoComponent,
    data: {
      title: 'O2C Demo',
      header: 'O2C Demo',
      hideNavbar: true,
    },
  },
  {
    path: 'o2c-details',
    component: O2cDetailsComponent,
    data: { title: 'O2C Details', header: 'O2C Details', hideNavbar: true },
  },
  {
    path: 'o2c-order',
    component: O2cOrderComponent,
    data: { title: 'O2C Orders', header: 'O2C Orders', hideNavbar: true },
  },
  {
    path: 'o2c-sub',
    component: O2cSubComponent,
    data: {
      title: 'O2C Subscriptions',
      header: 'O2C Subscriptions',
      hideNavbar: true,
    },
  },
  {
    path: 'o2c-accrual',
    component: O2cAccrualComponent,
    data: { title: 'O2C Accrual', header: 'O2C Accruals', hideNavbar: true },
  },
  {
    path: 'o2c-invoicing',
    component: O2cInvoicingComponent,
    data: { title: 'O2C Invoicing', header: 'O2C Invoicing', hideNavbar: true },
  },
  {
    path: 'o2c-landing',
    component: O2cLandingComponent,
    data: { title: 'O2C Home', header: 'O2C Home', hideNavbar: true },
  },
  {
    path: 'o2c-overview',
    component: O2cOverviewComponent,
    data: {
      title: 'O2C Overview',
      header: 'O2C Overview',
      hideNavbar: true,
    },
  },
  // {
  //   path: 'gl-posting',
  //   component: GlPostingComponent,
  //   data: {
  //     title: 'Operations Control Tower',
  //     header: 'GL Posting',
  //   },
  // },
  {
    path: 'opl',
    component: OplComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'OPL',
    },
  },
  {
    path: 'order-management',
    component: OrderManagementComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Order Management Monitoring',
    },
  },
  {
    path: 'wd0',
    component: Wd0DashComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Miclose Status',
    },
  },
  {
    path: 'midclose-volumes',
    component: Wd0HistoricalDataComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Midclose Volumes',
    },
  },
  {
    path: 'business-insights',
    component: BusinessInsightsComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'Business Insights',
    },
  },
  {
    path: 'cms',
    component: CmsComponent,
    data: {
      title: 'Finance IT Control Tower',
      header: 'CMS',
    },
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
