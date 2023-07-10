import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StandardArExceptionsComponent } from './standard-ar-exceptions/standard-ar-exceptions.component';
import { TsvExceptionsTopSkuComponent } from './tsv-exceptions-top-sku/tsv-exceptions-top-sku.component';
import { TsvExceptionsSubSkuComponent } from './tsv-exceptions-sub-sku/tsv-exceptions-sub-sku.component';
import { RevenueControlsComponent } from './revenue-controls/revenue-controls.component';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { ErrorDashComponent } from './error-dash/error-dash.component';
import { DetailViewComponent } from './detail-view/detail-view.component';
import { InvoiceStatusComponent } from './invoice-status/invoice-status.component';
import { PrecloseComponent } from './period-close-tracking/preclose/preclose.component';
import { MidcloseComponent } from './period-close-tracking/midclose/midclose.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/period-close-tracking-preclose',
    pathMatch: 'full',
  },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  { path: 'standard-ar', component: StandardArExceptionsComponent },
  { path: 'tsv-exceptions-top-sku', component: TsvExceptionsTopSkuComponent },
  { path: 'tsv-exceptions-sub-sku', component: TsvExceptionsSubSkuComponent },
  { path: 'revenue-controls', component: RevenueControlsComponent },
  {
    path: 'period-close-tracking-preclose',
    component: PrecloseComponent,
  },
  {
    path: 'period-close-tracking-midclose',
    component: MidcloseComponent,
  },
  { path: 'error-dash', component: ErrorDashComponent },
  { path: 'detail-view', component: DetailViewComponent },
  { path: 'invoice-status', component: InvoiceStatusComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
