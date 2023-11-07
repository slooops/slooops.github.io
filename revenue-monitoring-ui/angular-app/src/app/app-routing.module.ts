import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StandardArExceptionsComponent } from './standard-ar-exceptions/standard-ar-exceptions.component';
import { TsvExceptionsTopSkuComponent } from './tsv-exceptions-top-sku/tsv-exceptions-top-sku.component';
import { TsvExceptionsSubSkuComponent } from './tsv-exceptions-sub-sku/tsv-exceptions-sub-sku.component';
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

const routes: Routes = [
  {
    path: '',
    redirectTo: '/period-close-tracking-preclose',
    pathMatch: 'full',
  },
  {
    path: 'standard-ar',
    component: StandardArExceptionsComponent,
    data: { title: 'Home', header: 'Home' },
  },
  {
    path: 'tsv-exceptions-top-sku',
    component: TsvExceptionsTopSkuComponent,
    data: { title: 'Home', header: 'Home' },
  },
  {
    path: 'tsv-exceptions-sub-sku',
    component: TsvExceptionsSubSkuComponent,
    data: { title: 'Home', header: 'Home' },
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
    path: 'historical-data',
    component: Wd0HistoricalDataComponent,
    data: {
      title: 'WD+0 Mid Close Status Dashboard',
      header: 'WD+0 Mid Close Status Dashboard',
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
