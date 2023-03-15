import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StandardArExceptionsComponent } from './standard-ar-exceptions/standard-ar-exceptions.component';
import { TsvExceptionsTopSkuComponent } from './tsv-exceptions-top-sku/tsv-exceptions-top-sku.component';
import { TsvExceptionsSubSkuComponent } from './tsv-exceptions-sub-sku/tsv-exceptions-sub-sku.component';

const routes: Routes = [
  { path: '', redirectTo: '/standard-ar', pathMatch: 'full' },
  { path: 'standard-ar', component: StandardArExceptionsComponent },
  { path: 'tsv-exceptions-top-sku', component: TsvExceptionsTopSkuComponent },
  { path: 'tsv-exceptions-sub-sku', component: TsvExceptionsSubSkuComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
