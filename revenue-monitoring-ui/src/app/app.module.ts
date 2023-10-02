import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgChartsModule } from 'ng2-charts';
import {
  CuiPagerModule,
  CuiTableModule,
  CuiFilterModule,
  CuiTabsNavModule,
  CuiModalModule,
  CuiLoaderModule,
  CuiInputModule,
  CuiProgressbarModule,
} from '@cisco-ngx/cui-components';

import {
  CngProgressbarModule,
  CngSortModule,
  CngTableModule,
  CngTabsModule,
} from '@cisco/cui-ng';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpConfigInterceptor } from './providers/http-config.interceptor';
import { AuthenticationService } from './providers/authentication.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StandardArExceptionsComponent } from './standard-ar-exceptions/standard-ar-exceptions.component';
import { TsvExceptionsTopSkuComponent } from './tsv-exceptions-top-sku/tsv-exceptions-top-sku.component';
import { TsvExceptionsSubSkuComponent } from './tsv-exceptions-sub-sku/tsv-exceptions-sub-sku.component';
import { RevenueControlsComponent } from './revenue-controls/revenue-controls.component';
import { PeriodCloseTrackingComponent } from './period-close-tracking/period-close-tracking.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSelectModule } from '@angular/material/select';
import { MenuComponent } from './menu/menu.component';
import { PrecloseComponent } from './period-close-tracking/preclose/preclose.component';
import { MidcloseComponent } from './period-close-tracking/midclose/midclose.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DatePipe } from '@angular/common';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { ErrorDashComponent } from './error-dash/error-dash.component';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DetailViewComponent } from './detail-view/detail-view.component';
import { LoadingSymbolComponent } from './loading-symbol/loading-symbol.component';
import { OrderLifecycleComponent } from './order-lifecycle/order-lifecycle.component';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

import {
  MAT_DIALOG_DEFAULT_OPTIONS,
  MatDialogModule,
} from '@angular/material/dialog';
import { OrderLifecycleSummaryComponent } from './order-lifecycle-summary/order-lifecycle-summary.component';
import { OrderLifecycleUploadComponent } from './order-lifecycle-upload/order-lifecycle-upload.component';
import { RevenueAccrualsComponent } from './revenue-accruals/revenue-accruals.component';
import { RevAccruals2Component } from './rev-accruals2/rev-accruals2.component';

export function initApp(authService: AuthenticationService) {
  return (): Promise<any> => {
    return authService.getTokens();
  };
}

@NgModule({
  declarations: [
    AppComponent,
    StandardArExceptionsComponent,
    TsvExceptionsTopSkuComponent,
    TsvExceptionsSubSkuComponent,
    RevenueControlsComponent,
    PeriodCloseTrackingComponent,
    MenuComponent,
    PrecloseComponent,
    MidcloseComponent,
    ErrorDashComponent,
    DetailViewComponent,
    LoadingSymbolComponent,
    OrderLifecycleComponent,
    OrderLifecycleSummaryComponent,
    OrderLifecycleUploadComponent,
    RevenueAccrualsComponent,
    RevAccruals2Component,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    CuiTableModule,
    CuiPagerModule,
    CuiFilterModule,
    CuiTabsNavModule,
    CuiModalModule,
    CuiLoaderModule,
    CuiInputModule,
    NgChartsModule,
    CuiProgressbarModule,
    CngSortModule,
    CngTableModule,
    CngTabsModule,
    CngProgressbarModule,
    MatProgressBarModule,
    FontAwesomeModule,
    MatTabsModule,
    BrowserAnimationsModule,
    MatSelectModule,
    ReactiveFormsModule,
    NgbModule,
    NgCircleProgressModule.forRoot({
      radius: 20,
      outerStrokeWidth: 4,
      innerStrokeWidth: 0,
      animationDuration: 300,
      showSubtitle: false,
      titleFontSize: '14',
    }),
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatMenuModule,
    MatTableModule,
    MatSortModule,
    MatIconModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatExpansionModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatCardModule,
  ],
  providers: [
    DatePipe,
    {
      provide: APP_INITIALIZER,
      useFactory: initApp,
      deps: [AuthenticationService],
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpConfigInterceptor,
      multi: true,
    },
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: false } },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
