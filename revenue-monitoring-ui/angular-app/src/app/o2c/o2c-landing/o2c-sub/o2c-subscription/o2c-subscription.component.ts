import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from 'src/app/providers/http.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { MatTableDataSource } from '@angular/material/table';
import { O2cBaseComponent } from '../../o2c-base.component';
import { CommonModule } from '@angular/common';
import { O2cAccordionComponent } from '../../../../components/o2c-accordion/o2c-accordion.component';
import { O2cDonutComponent } from '../../../../components/o2c-donut/o2c-donut.component';
import { O2cToolbarComponent } from '../../../../components/o2c-toolbar/o2c-toolbar.component';
import { O2cTableComponent } from '../../../../components/o2c-table/o2c-table.component';

@Component({
    selector: 'app-o2c-subscription',
    templateUrl: './o2c-subscription.component.html',
    styleUrls: ['./o2c-subscription.component.css'],
    imports: [
    CommonModule,
    O2cAccordionComponent,
    O2cDonutComponent,
    O2cToolbarComponent,
    O2cTableComponent
  ],
  standalone: true
})
export class O2cSubscriptionComponent
  extends O2cBaseComponent
  implements OnInit
{
  exceptionData = {
    sab: {
      loading: true,
      dataSource: new MatTableDataSource(),
      displayedColumns: [],
      pieChartData: [],
      hasError: false,
      apiEndpoint: 'o2c-order-sab-exception-v',
    },
    subot: {
      loading: true,
      dataSource: new MatTableDataSource(),
      displayedColumns: [],
      pieChartData: [],
      hasError: false,
      apiEndpoint: 'o2c-order-subot-exception-v',
    },
  };

  detailTypeConfig = {
    'sab-order-entered': {
      title: 'Subscription Activation and Billing',
      dataKey: 'sab',
    },
    'subot-order-entered': {
      title: 'Others',
      dataKey: 'subot',
    },
  };

  constructor(
    private http: ApiHttpService,
    private destroyManager: DestroyManager
  ) {
    super();
  }

  ngOnInit(): void {
    Object.keys(this.exceptionData).forEach((key) =>
      this.loadExceptionData(key)
    );
  }

  loadExceptionData(dataKey: string): void {
    const data = this.exceptionData[dataKey];
    if (!data) return;
    data.loading = true;
    data.hasError = false;
    this.http.get(data.apiEndpoint, this.destroyManager).subscribe({
      next: (response: any) => {
        data.dataSource.data = response;
        data.displayedColumns = Object.keys(response[0] || {});
        data.pieChartData = this.prepareDonutData(response);
        data.loading = false;
      },
      error: (error) => {
        console.error(`ERROR`, error);
        data.loading = false;
        data.hasError = true;
        data.dataSource.data = [];
        data.displayedColumns = [];
        data.pieChartData = [];
      },
    });
  }

  get orderSabPieChartData() {
    return this.exceptionData['sab'].pieChartData;
  }
  get orderSubotPieChartData() {
    return this.exceptionData['subot'].pieChartData;
  }

  // Loading state getters
  get orderSabLoading() {
    return this.exceptionData['sab'].loading;
  }
  get orderSubotLoading() {
    return this.exceptionData['subot'].loading;
  }

  // Single method to get the appropriate message for any data key
  getNoDataMessage(dataKey: string): string {
    const data = this.exceptionData[dataKey];
    return data?.hasError
      ? 'Database error: Unable to fetch data. Please contact your database administrator.'
      : 'No exceptions found';
  }
}
