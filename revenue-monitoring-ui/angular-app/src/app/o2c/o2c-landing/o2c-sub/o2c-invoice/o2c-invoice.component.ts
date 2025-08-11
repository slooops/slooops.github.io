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
  selector: 'app-o2c-invoice',
  templateUrl: './o2c-invoice.component.html',
  styleUrl: './o2c-invoice.component.css',
})
export class O2cInvoiceComponent {
  showDetailView = false;
  currentDetailType: string = '';
  isOpen: boolean[] = Array(9).fill(true);

  private exceptionData: { [key: string]: ExceptionData } = {
    'pre-invoicing': {
      loading: true,
      dataSource: new MatTableDataSource<any>(),
      displayedColumns: [],
      pieChartData: [],
      apiEndpoint: 'o2c-order-preinv-exception-v',
    },
    'invoice-creation': {
      loading: true,
      dataSource: new MatTableDataSource<any>(),
      displayedColumns: [],
      pieChartData: [],
      apiEndpoint: 'o2c-order-inv-exception-v',
    },
    'invoice-pid': {
      loading: true,
      dataSource: new MatTableDataSource<any>(),
      displayedColumns: [],
      pieChartData: [],
      apiEndpoint: 'o2c-order-invpid-exception-v',
    },
    'invoice-others': {
      loading: true,
      dataSource: new MatTableDataSource<any>(),
      displayedColumns: [],
      pieChartData: [],
      apiEndpoint: 'o2c-order-invoth-exception-v',
    },
  };

  private detailTypeConfig: { [key: string]: any } = {
    'pre-invoicing': {
      title: 'Pre-Invoicing',
      dataKey: 'pre-invoicing',
    },
    'invoice-creation': {
      title: 'Invoice Creation',
      dataKey: 'invoice-creation',
    },
    'invoice-pid': {
      title: 'Invoice PID',
      dataKey: 'invoice-pid',
    },
    'invoice-others': {
      title: 'Invoice Others',
      dataKey: 'invoice-others',
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
    return category === 'entered'
      ? 'Fulfillment to Invoicing'
      : 'Fulfillment to Invoicing';
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

  // CORRECT - Each getter returns its own specific data
  get orderPreInvPieChartData(): any[] {
    return this.exceptionData['pre-invoicing'].pieChartData;
  }

  get orderInvPieChartData(): any[] {
    return this.exceptionData['invoice-creation'].pieChartData;
  }

  get orderInvPidPieChartData(): any[] {
    return this.exceptionData['invoice-pid'].pieChartData;
  }

  get orderInvOthersPieChartData(): any[] {
    return this.exceptionData['invoice-others'].pieChartData;
  }
}
