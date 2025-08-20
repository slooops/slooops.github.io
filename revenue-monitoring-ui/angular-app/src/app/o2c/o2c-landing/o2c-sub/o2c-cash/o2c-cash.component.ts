import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from 'src/app/providers/http.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { MatTableDataSource } from '@angular/material/table';
import { O2cBaseComponent } from '../../o2c-base.component';

@Component({
  selector: 'app-o2c-cash',
  templateUrl: './o2c-cash.component.html',
  styleUrl: './o2c-cash.component.css',
})
export class O2cCashComponent extends O2cBaseComponent implements OnInit {
  exceptionData = {
    'o2c-order-pastdue-exception-v': {
      loading: false,
      dataSource: new MatTableDataSource(),
      displayedColumns: [],
      pieChartData: [],
      apiEndpoint: 'o2c-order-pastdue-exception-v',
    },
    'o2c-order-partialpay-exception-v': {
      loading: false,
      dataSource: new MatTableDataSource(),
      displayedColumns: [],
      pieChartData: [],
      apiEndpoint: 'o2c-order-partialpay-exception-v',
    },
    'o2c-order-unidentified-exception-v': {
      loading: false,
      dataSource: new MatTableDataSource(),
      displayedColumns: [],
      pieChartData: [],
      apiEndpoint: 'o2c-order-unidentified-exception-v',
    },
    'o2c-order-cashoth-exception-v': {
      loading: false,
      dataSource: new MatTableDataSource(),
      displayedColumns: [],
      pieChartData: [],
      apiEndpoint: 'o2c-order-cashoth-exception-v',
    },
  };

  detailTypeConfig = {
    'o2c-order-pastdue-exception-v': {
      title: 'Past Due Exceptions',
      dataKey: 'o2c-order-pastdue-exception-v',
    },
    'o2c-order-partialpay-exception-v': {
      title: 'Partial Payment Exceptions',
      dataKey: 'o2c-order-partialpay-exception-v',
    },
    'o2c-order-unidentified-exception-v': {
      title: 'Unidentified Exceptions',
      dataKey: 'o2c-order-unidentified-exception-v',
    },
    'o2c-order-cashoth-exception-v': {
      title: 'Cash Other Exceptions',
      dataKey: 'o2c-order-cashoth-exception-v',
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
    this.http
      .get(data.apiEndpoint, this.destroyManager)
      .subscribe((response: any) => {
        data.dataSource.data = response;
        data.displayedColumns = Object.keys(response[0] || {});
        data.pieChartData = this.prepareDonutData(response);
        data.loading = false;
      });
  }

  get o2cOrderPastdueExceptionPieChartData() {
    return this.exceptionData['o2c-order-pastdue-exception-v'].pieChartData;
  }

  get o2cOrderPartialpayExceptionPieChartData() {
    return this.exceptionData['o2c-order-partialpay-exception-v'].pieChartData;
  }

  get o2cOrderUnidentifiedExceptionPieChartData() {
    return this.exceptionData['o2c-order-unidentified-exception-v']
      .pieChartData;
  }

  get o2cOrderCashothExceptionPieChartData() {
    return this.exceptionData['o2c-order-cashoth-exception-v'].pieChartData;
  }

  // Loading state getters
  get o2cOrderPastdueExceptionLoading() {
    return this.exceptionData['o2c-order-pastdue-exception-v'].loading;
  }

  get o2cOrderPartialpayExceptionLoading() {
    return this.exceptionData['o2c-order-partialpay-exception-v'].loading;
  }

  get o2cOrderUnidentifiedExceptionLoading() {
    return this.exceptionData['o2c-order-unidentified-exception-v'].loading;
  }

  get o2cOrderCashothExceptionLoading() {
    return this.exceptionData['o2c-order-cashoth-exception-v'].loading;
  }
}
