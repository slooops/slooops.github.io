import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RevenueControlsComponent } from './revenue-controls/revenue-controls.component';
import { ErrorDashComponent } from './error-dash/error-dash.component';
import { DetailViewComponent } from './detail-view/detail-view.component';
import { PrecloseComponent } from './period-close-tracking/preclose/preclose.component';
import { MidcloseComponent } from './period-close-tracking/midclose/midclose.component';
import { OrderLifecycleComponent } from './order-lifecycle/order-lifecycle.component';
import { InvoiceTrackerComponent } from './invoice-tracker/invoice-tracker.component';
import { Wd0DashComponent } from './wd0-dash/wd0-dash.component';
import { Wd0HistoricalDataComponent } from './wd0-historical-data/wd0-historical-data.component';
import { RevenueAccrualsComponent } from './revenue-accruals/revenue-accruals.component';
import { HomeComponent } from './home/home.component';
import { ErrorComponent } from './error/error.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/wd0-dash',
    pathMatch: 'full',
  },
  {
    path: 'home',
    component: HomeComponent,
    data: {
      title: 'Operations Control Tower',
      header: 'Operations Control Tower',
    },
  },
  {
    path: 'error',
    component: ErrorComponent,
    data: { title: 'Error', header: '' },
  },
  {
    path: 'revenue-controls',
    component: RevenueControlsComponent,
    data: { title: 'Home', header: 'Home' },
  },
  {
    path: 'period-close-tracking-preclose',
    component: PrecloseComponent,
    data: {
      title: 'Operations Control Tower',
      header: 'Operations Control Tower',
    },
  },
  {
    path: 'period-close-tracking-midclose',
    component: MidcloseComponent,
    data: {
      title: 'Operations Control Tower',
      header: 'Operations Control Tower',
    },
  },
  {
    path: 'error-dash',
    component: ErrorDashComponent,
    data: {
      title: 'Operations Control Tower',
      header: 'Operations Control Tower',
    },
  },
  {
    path: 'detail-view',
    component: DetailViewComponent,
    data: {
      title: 'Operations Control Tower',
      header: 'Operations Control Tower',
    },
  },
  {
    path: 'large-deal-tracker',
    component: OrderLifecycleComponent,
    data: {
      title: 'Large Deal Processing Tracker',
      header: 'Large Deal Processing Tracker',
    },
  },
  {
    path: 'invoice-tracker',
    component: InvoiceTrackerComponent,
    data: { title: 'Home', header: 'Home' },
  },
  {
    path: 'wd0-dash',
    component: Wd0DashComponent,
    data: {
      title: 'WD+0 Mid Close Status Dashboard',
      header: 'WD+0 Mid Close Status Dashboard',
    },
  },
  {
    path: 'mid-close-volumes',
    component: Wd0HistoricalDataComponent,
    data: {
      title: 'WD+0 Mid Close Volumes Dashboard',
      header: 'WD+0 Mid Close Volumes Dashboard',
    },
  },
  {
    path: 'revenue-accruals',
    component: RevenueAccrualsComponent,
    data: {
      title: 'Revenue Accruals Dashboard',
      header: 'Revenue Accruals  Dashboard',
    },
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
