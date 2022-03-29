import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HealthComponent } from './health/health.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ContractAssetBalanceComponent } from './contract-asset-balance/contract-asset-balance.component';
import { CuiPagerModule, CuiTableModule } from '@cisco-ngx/cui-components';

@NgModule({
  declarations: [
    AppComponent,
    HealthComponent,
    DashboardComponent,
    ContractAssetBalanceComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    CuiTableModule,
    CuiPagerModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
