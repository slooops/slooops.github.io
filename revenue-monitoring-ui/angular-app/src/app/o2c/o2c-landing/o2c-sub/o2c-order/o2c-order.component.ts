import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from 'src/app/providers/http.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { MatTableDataSource } from '@angular/material/table';
import { O2cBaseComponent } from '../../o2c-base.component';

@Component({
  selector: 'app-o2c-order',
  templateUrl: './o2c-order.component.html',
  styleUrls: ['./o2c-order.component.css'],
})
export class O2cOrderComponent extends O2cBaseComponent implements OnInit {
  exceptionData = {
    bie: {
      loading: true,
      dataSource: new MatTableDataSource(),
      displayedColumns: [],
      pieChartData: [],
      hasError: false,
      apiEndpoint: 'o2c-order-bie-exception-v',
    },
    ch: {
      loading: true,
      dataSource: new MatTableDataSource(),
      displayedColumns: [],
      pieChartData: [],
      hasError: false,
      apiEndpoint: 'o2c-order-ch-exception-v',
    },
    pe: {
      loading: true,
      dataSource: new MatTableDataSource(),
      displayedColumns: [],
      pieChartData: [],
      hasError: false,
      apiEndpoint: 'o2c-order-pe-exception-v',
    },
    ot: {
      loading: true,
      dataSource: new MatTableDataSource(),
      displayedColumns: [],
      pieChartData: [],
      hasError: false,
      apiEndpoint: 'o2c-order-ot-exception-v',
    },
    bh: {
      loading: true,
      dataSource: new MatTableDataSource(),
      displayedColumns: [],
      pieChartData: [],
      hasError: false,
      apiEndpoint: 'o2c-order-bh-exception-v',
    },
    ec: {
      loading: true,
      dataSource: new MatTableDataSource(),
      displayedColumns: [],
      pieChartData: [],
      hasError: false,
      apiEndpoint: 'o2c-order-ec-exception-v',
    },
  };

  detailTypeConfig = {
    'bie-order-entered': {
      dataKey: 'bie',
      title: 'Cisco Business Inclusion and Exclusion (BIE)',
      category: 'entered',
    },
    'bie-booked': {
      dataKey: 'bie',
      title: 'Cisco Business Inclusion and Exclusion (BIE)',
      category: 'booked',
    },
    'credit-holds-entered': {
      dataKey: 'ch',
      title: 'Credit Holds',
      category: 'entered',
    },
    'process-exceptions-entered': {
      dataKey: 'pe',
      title: 'Process Exceptions',
      category: 'entered',
    },
    'other-exceptions-entered': {
      dataKey: 'ot',
      title: 'Other Exceptions',
      category: 'entered',
    },
    'booking-holds-entered': {
      dataKey: 'bh',
      title: 'Booking Holds',
      category: 'entered',
    },
    'export-compliance-booked': {
      dataKey: 'ec',
      title: 'Export Compliance',
      category: 'booked',
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
        data.pieChartData = []; // Return empty array to trigger no data state
      },
    });
  }

  get orderBiePieChartData() {
    return this.exceptionData['bie'].pieChartData;
  }
  get orderChPieChartData() {
    return this.exceptionData['ch'].pieChartData;
  }
  get orderPePieChartData() {
    return this.exceptionData['pe'].pieChartData;
  }
  get orderOtPieChartData() {
    return this.exceptionData['ot'].pieChartData;
  }
  get orderBhPieChartData() {
    return this.exceptionData['bh'].pieChartData;
  }
  get orderEcPieChartData() {
    return this.exceptionData['ec'].pieChartData;
  }

  // Loading state getters
  get orderBieLoading() {
    return this.exceptionData['bie'].loading;
  }
  get orderChLoading() {
    return this.exceptionData['ch'].loading;
  }
  get orderPeLoading() {
    return this.exceptionData['pe'].loading;
  }
  get orderOtLoading() {
    return this.exceptionData['ot'].loading;
  }
  get orderBhLoading() {
    return this.exceptionData['bh'].loading;
  }
  get orderEcLoading() {
    return this.exceptionData['ec'].loading;
  }

  // Single method to get the appropriate message for any data key
  getNoDataMessage(dataKey: string): string {
    const data = this.exceptionData[dataKey];
    return data?.hasError
      ? 'Database error: Unable to fetch data. Please contact your database administrator.'
      : 'No exceptions found';
  }
}
