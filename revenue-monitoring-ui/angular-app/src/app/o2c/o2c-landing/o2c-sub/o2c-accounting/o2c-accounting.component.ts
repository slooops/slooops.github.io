import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from 'src/app/providers/http.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { MatTableDataSource } from '@angular/material/table';
import { O2cBaseComponent } from '../../o2c-base.component';

@Component({
  selector: 'app-o2c-accounting',
  templateUrl: './o2c-accounting.component.html',
  styleUrl: './o2c-accounting.component.css',
})
export class O2cAccountingComponent extends O2cBaseComponent implements OnInit {
  exceptionData = {
    'o2c-order-ca-exception-v': {
      loading: false,
      dataSource: new MatTableDataSource(),
      displayedColumns: [],
      pieChartData: [],
      hasError: false,
      apiEndpoint: 'o2c-order-ca-exception-v',
    },
    'o2c-order-sla-exception-v': {
      loading: false,
      dataSource: new MatTableDataSource(),
      displayedColumns: [],
      pieChartData: [],
      hasError: false,
      apiEndpoint: 'o2c-order-sla-exception-v',
    },
    'o2c-order-gl-exception-v': {
      loading: false,
      dataSource: new MatTableDataSource(),
      displayedColumns: [],
      pieChartData: [],
      hasError: false,
      apiEndpoint: 'o2c-order-gl-exception-v',
    },
    'o2c-order-accot-exception-v': {
      loading: false,
      dataSource: new MatTableDataSource(),
      displayedColumns: [],
      pieChartData: [],
      hasError: false,
      apiEndpoint: 'o2c-order-accot-exception-v',
    },
  };

  detailTypeConfig = {
    'o2c-order-ca-exception-v': {
      title: 'Create Account Exceptions',
      dataKey: 'o2c-order-ca-exception-v',
    },
    'o2c-order-sla-exception-v': {
      title: 'SLA Exceptions',
      dataKey: 'o2c-order-sla-exception-v',
    },
    'o2c-order-gl-exception-v': {
      title: 'GL Exceptions',
      dataKey: 'o2c-order-gl-exception-v',
    },
    'o2c-order-accot-exception-v': {
      title: 'Other Accounting Exceptions',
      dataKey: 'o2c-order-accot-exception-v',
    },
  };

  constructor(
    private http: ApiHttpService,
    private destroyManager: DestroyManager
  ) {
    super();
  }

  ngOnInit(): void {
    Object.keys(this.exceptionData).forEach((key) => {
      this.loadExceptionData(key);
    });
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

  get o2cOrderCaExceptionPieChartData() {
    return this.exceptionData['o2c-order-ca-exception-v'].pieChartData;
  }

  get o2cOrderSlaExceptionPieChartData() {
    return this.exceptionData['o2c-order-sla-exception-v'].pieChartData;
  }

  get o2cOrderGlExceptionPieChartData() {
    return this.exceptionData['o2c-order-gl-exception-v'].pieChartData;
  }

  get o2cOrderAccotExceptionPieChartData() {
    return this.exceptionData['o2c-order-accot-exception-v'].pieChartData;
  }

  // Loading state getters
  get o2cOrderCaExceptionLoading() {
    return this.exceptionData['o2c-order-ca-exception-v'].loading;
  }

  get o2cOrderSlaExceptionLoading() {
    return this.exceptionData['o2c-order-sla-exception-v'].loading;
  }

  get o2cOrderGlExceptionLoading() {
    return this.exceptionData['o2c-order-gl-exception-v'].loading;
  }

  get o2cOrderAccotExceptionLoading() {
    return this.exceptionData['o2c-order-accot-exception-v'].loading;
  }

  // Single method to get the appropriate message for any data key
  getNoDataMessage(dataKey: string): string {
    const data = this.exceptionData[dataKey];
    return data?.hasError
      ? 'Database error: Unable to fetch data. Please contact your database administrator.'
      : 'No exceptions found';
  }
}
