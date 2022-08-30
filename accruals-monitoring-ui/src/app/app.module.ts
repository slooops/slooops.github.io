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
} from '@cisco-ngx/cui-components';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HealthComponent } from './health/health.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ContractAssetBalanceComponent } from './contract-asset-balance/contract-asset-balance.component';
import { ExceptionReportComponent } from './exception-report/exception-report.component';
import { DailyMonitoringComponent } from './daily-monitoring/daily-monitoring.component';
import { HttpConfigInterceptor } from './providers/http-config.interceptor';
import { AuthenticationService } from './providers/authentication.service';
import { FormsModule } from '@angular/forms';

export function initApp(authService: AuthenticationService) {
  return (): Promise<any> => {
    return authService.getTokens();
  };
}

@NgModule({
  declarations: [
    AppComponent,
    HealthComponent,
    DashboardComponent,
    ContractAssetBalanceComponent,
    ExceptionReportComponent,
    DailyMonitoringComponent
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
    NgChartsModule
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initApp,
      deps: [AuthenticationService],
      multi: true
    },
    { provide: HTTP_INTERCEPTORS, useClass: HttpConfigInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
