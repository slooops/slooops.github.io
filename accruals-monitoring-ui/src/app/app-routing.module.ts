import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContractAssetBalanceComponent } from './contract-asset-balance/contract-asset-balance.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HealthComponent } from './health/health.component';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'health', component: HealthComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'contract-asset-balance', component: ContractAssetBalanceComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
