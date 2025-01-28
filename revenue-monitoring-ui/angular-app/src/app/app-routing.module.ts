import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { InvoicingComponent } from './invoicing/invoicing.component';
import { PeriodCloseTrackingComponent } from './period-close-tracking/period-close-tracking.component';
import { CustomRevenueComponent } from './custom-revenue/custom-revenue.component';
import { EspCaseAnalyzerComponent } from './esp-case-analyzer/esp-case-analyzer.component';
import { O2cDemoComponent } from './o2c-demo/o2c-demo.component';
import { GlPostingComponent } from './gl-posting/gl-posting.component';

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
      title: 'Operations Control Tower',
      header: 'Home',
    },
  },
  // {
  //   path: 'error',
  //   component: ErrorComponent,
  //   data: { title: 'Error', header: '' },
  // },

  {
    path: 'period-close-tracking',
    component: PeriodCloseTrackingComponent,
    data: {
      title: 'Operations Control Tower',
      header: 'Period Close Tracking',
    },
  },
  {
    path: 'revenue-accounting',
    component: CustomRevenueComponent,
    data: {
      title: 'Operations Control Tower',
      header: 'Revenue Accounting',
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
      title: 'Operations Control Tower',
      header: 'ESP Case Analyzer Dashboard',
    },
  },
  {
    path: 'invoice-to-cash',
    component: InvoicingComponent,
    data: {
      title: 'Operations Control Tower',
      header: 'Invoice to Cash',
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
    path: 'gl-posting',
    component: GlPostingComponent,
    data: {
      title: 'Operations Control Tower',
      header: 'GL Posting',
    },
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
