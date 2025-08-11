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
  selector: 'app-o2c-accounting',
  templateUrl: './o2c-accounting.component.html',
  styleUrl: './o2c-accounting.component.css',
})
export class O2cAccountingComponent {
  showDetailView = false;
  currentDetailType: string = '';
  isOpen: boolean[] = Array(7).fill(true);

  private exceptionData: { [key: string]: ExceptionData } = {
    'o2c-order-ca-exception-v': {
      loading: false,
      dataSource: new MatTableDataSource<any>(),
      displayedColumns: [],
      pieChartData: [],
      apiEndpoint: 'o2c-order-ca-exception-v',
    },
    'o2c-order-sla-exception-v': {
      loading: false,
      dataSource: new MatTableDataSource<any>(),
      displayedColumns: [],
      pieChartData: [],
      apiEndpoint: 'o2c-order-sla-exception-v',
    },
    'o2c-order-gl-exception-v': {
      loading: false,
      dataSource: new MatTableDataSource<any>(),
      displayedColumns: [],
      pieChartData: [],
      apiEndpoint: 'o2c-order-gl-exception-v',
    },
    'o2c-order-accot-exception-v': {
      loading: false,
      dataSource: new MatTableDataSource<any>(),
      displayedColumns: [],
      pieChartData: [],
      apiEndpoint: 'o2c-order-accot-exception-v',
    },
  };

  private detailTypeConfig: { [key: string]: any } = {
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
  ) {}

  ngOnInit(): void {
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
    return category === 'entered' ? 'Accounting' : 'Accounting';
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
}
