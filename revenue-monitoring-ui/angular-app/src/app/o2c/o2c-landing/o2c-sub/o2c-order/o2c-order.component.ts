import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from 'src/app/providers/http.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { MatTableDataSource } from '@angular/material/table';

interface ExceptionData {
  loading: boolean;
  dataSource: MatTableDataSource<any>;
  displayedColumns: string[];
  pieChartData: any[];
  apiEndpoint: string;
}

@Component({
  selector: 'app-o2c-order',
  templateUrl: './o2c-order.component.html',
  styleUrls: ['./o2c-order.component.css'],
})
export class O2cOrderComponent implements OnInit {
  showDetailView = false;
  currentDetailType: string = '';
  isOpen: boolean[] = Array(9).fill(true);

  // Consolidated data structure
  private exceptionData: { [key: string]: ExceptionData } = {
    bie: {
      loading: true,
      dataSource: new MatTableDataSource<any>(),
      displayedColumns: [],
      pieChartData: [],
      apiEndpoint: 'o2c-order-bie-exception-v',
    },
    ch: {
      loading: true,
      dataSource: new MatTableDataSource<any>(),
      displayedColumns: [],
      pieChartData: [],
      apiEndpoint: 'o2c-order-ch-exception-v',
    },
    pe: {
      loading: true,
      dataSource: new MatTableDataSource<any>(),
      displayedColumns: [],
      pieChartData: [],
      apiEndpoint: 'o2c-order-pe-exception-v',
    },
    ot: {
      loading: true,
      dataSource: new MatTableDataSource<any>(),
      displayedColumns: [],
      pieChartData: [],
      apiEndpoint: 'o2c-order-ot-exception-v',
    },
    bh: {
      loading: true,
      dataSource: new MatTableDataSource<any>(),
      displayedColumns: [],
      pieChartData: [],
      apiEndpoint: 'o2c-order-bh-exception-v',
    },
    ec: {
      loading: true,
      dataSource: new MatTableDataSource<any>(),
      displayedColumns: [],
      pieChartData: [],
      apiEndpoint: 'o2c-order-ec-exception-v',
    },
  };

  // Configuration mapping detail types to data keys and metadata
  private detailTypeConfig = {
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
  ) {}

  ngOnInit(): void {
    // Load all data on init
    Object.keys(this.exceptionData).forEach((key) => {
      this.loadExceptionData(key);
    });
  }

  // Generic data loading method
  private loadExceptionData(dataKey: string): void {
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

  // Data preparation method
  prepareDonutData(rawData: any[]): any[] {
    const groupedData = rawData.reduce((acc, item) => {
      const holdReason = item.HOLD_REASON || 'Unknown';
      const orderAmount = parseFloat(item.ORDER_AMOUNT_USD) || 0;

      if (!acc[holdReason]) {
        acc[holdReason] = {
          INCIDENT_TYPE: holdReason,
          INCIDENT_COUNT: 0,
          INCIDENT_VALUE: 0,
        };
      }

      acc[holdReason].INCIDENT_COUNT++;
      acc[holdReason].INCIDENT_VALUE += orderAmount;
      return acc;
    }, {} as { [key: string]: any });

    return Object.values(groupedData).map((item: any) => ({
      ...item,
      INCIDENT_VALUE: Math.round(item.INCIDENT_VALUE * 100) / 100,
    }));
  }

  // View management
  toggleAccordion(index: number): void {
    this.isOpen[index] = !this.isOpen[index];
  }

  showDetailTable(detailType: string): void {
    this.currentDetailType = detailType;
    this.showDetailView = true;

    // Reload data for this specific type if needed
    const config = this.detailTypeConfig[detailType];
    if (config) {
      this.loadExceptionData(config.dataKey);
    }
  }

  goBack(): void {
    this.showDetailView = false;
    this.currentDetailType = '';
  }

  // Helper method to get current data configuration
  private getCurrentConfig() {
    const config = this.detailTypeConfig[this.currentDetailType];
    if (!config) return null;

    return {
      config,
      data: this.exceptionData[config.dataKey],
    };
  }

  // Simplified getters using the helper method
  getCurrentTitle(): string {
    return this.getCurrentConfig()?.config.title || '';
  }

  getCurrentSubtitle(): string {
    const category = this.getCurrentConfig()?.config.category;
    return category === 'entered'
      ? 'Orders Entered Not Booked'
      : 'Orders Booked to Fulfillment';
  }

  getCurrentFileName(): string {
    const title = this.getCurrentTitle();
    return title ? `O2C ${title} Exceptions` : 'O2C Exceptions';
  }

  getCurrentDataSource(): MatTableDataSource<any> {
    return (
      this.getCurrentConfig()?.data.dataSource || new MatTableDataSource<any>()
    );
  }

  getCurrentDisplayedColumns(): string[] {
    return this.getCurrentConfig()?.data.displayedColumns || [];
  }

  getCurrentLoadingState(): boolean {
    return this.getCurrentConfig()?.data.loading || false;
  }

  getCurrentPieChartData(): any[] {
    return this.getCurrentConfig()?.data.pieChartData || [];
  }

  // Convenience getters for template (to maintain backwards compatibility)
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
}
