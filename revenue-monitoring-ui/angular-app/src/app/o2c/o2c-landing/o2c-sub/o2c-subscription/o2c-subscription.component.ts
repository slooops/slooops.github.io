import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from 'src/app/providers/http.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { MatTableDataSource } from '@angular/material/table';
import { O2cBaseComponent } from '../../o2c-base.component';

@Component({
  selector: 'app-o2c-subscription',
  templateUrl: './o2c-subscription.component.html',
  styleUrls: ['./o2c-subscription.component.css'],
})
export class O2cSubscriptionComponent extends O2cBaseComponent implements OnInit {
  exceptionData = {
    sab: {
      loading: true,
      dataSource: new MatTableDataSource(),
      displayedColumns: [],
      pieChartData: [],
      apiEndpoint: 'o2c-order-sab-exception-v',
    },
    subot: {
      loading: true,
      dataSource: new MatTableDataSource(),
      displayedColumns: [],
      pieChartData: [],
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
    this.http
      .get(data.apiEndpoint, this.destroyManager)
      .subscribe((response: any) => {
        data.dataSource.data = response;
        data.displayedColumns = Object.keys(response[0] || {});
        data.pieChartData = this.prepareDonutData(response);
        data.loading = false;
      });
  }

  get orderSabPieChartData() {
    return this.exceptionData['sab'].pieChartData;
  }
  get orderSubotPieChartData() {
    return this.exceptionData['subot'].pieChartData;
  }
}
