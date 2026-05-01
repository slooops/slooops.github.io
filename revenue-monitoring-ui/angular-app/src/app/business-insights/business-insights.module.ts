import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';

// Material Modules
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { provideNativeDateAdapter } from '@angular/material/core';

// Components
import { OrderLifecycleComponent } from '../order-lifecycle/order-lifecycle.component';
import { Wd0DashComponent } from '../wd0-dash/wd0-dash.component';
import { Wd0HistoricalDataComponent } from '../wd0-historical-data/wd0-historical-data.component';
import { IssueReportingComponent } from '../issue-reporting/issue-reporting.component';

// Standalone components used by the declared components
import { LoadingSymbolComponent } from '../loading-symbol/loading-symbol.component';
import { ModalComponent } from '../components/modal/modal.component';
import { FormatNumberPipe } from '../format-number.pipe';

@NgModule({
  declarations: [
    OrderLifecycleComponent,
    Wd0DashComponent,
    Wd0HistoricalDataComponent,
    IssueReportingComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatMenuModule,
    MatTooltipModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDividerModule,
    // Standalone components that these components use
    LoadingSymbolComponent,
    ModalComponent,
    FormatNumberPipe,
    NgIcon,
  ],
  exports: [
    OrderLifecycleComponent,
    Wd0DashComponent,
    Wd0HistoricalDataComponent,
    IssueReportingComponent,
  ],
  providers: [provideNativeDateAdapter()],
})
export class BusinessInsightsModule {}
