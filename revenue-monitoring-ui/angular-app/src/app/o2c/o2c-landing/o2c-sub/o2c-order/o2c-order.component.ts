import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiHttpService } from 'src/app/providers/http.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { FiltersService } from 'src/app/providers/filters.service';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-o2c-order',
  templateUrl: './o2c-order.component.html',
  styleUrls: ['./o2c-order.component.css'],
})
export class O2cOrderComponent implements OnInit {
  // Data properties
  orderBieExceptionLoading = true;
  orderBieExceptionDataSource = new MatTableDataSource<any>();
  orderBieExceptionDisplayedColumns: string[] = [];
  orderBiePieChartData: any[] = [];

  // View state
  showDetailView = false;
  currentDetailType: string = '';
  isOpen: boolean[] = Array(9).fill(true);

  // Dummy data for charts (consolidate similar data)
  dummyData = {
    single: [
      { INCIDENT_TYPE: 'Order Entry', INCIDENT_COUNT: 5, INCIDENT_VALUE: 2.1 },
    ],
    multi: [
      { INCIDENT_TYPE: 'Order Entry', INCIDENT_COUNT: 5, INCIDENT_VALUE: 4 },
      { INCIDENT_TYPE: 'Manual Entry', INCIDENT_COUNT: 3, INCIDENT_VALUE: 2 },
      { INCIDENT_TYPE: 'Data Entry', INCIDENT_COUNT: 2, INCIDENT_VALUE: 1.2 },
    ],
    config: [
      { INCIDENT_TYPE: 'Order Entry', INCIDENT_COUNT: 50, INCIDENT_VALUE: 1.4 },
      { INCIDENT_TYPE: 'Manual Entry', INCIDENT_COUNT: 3, INCIDENT_VALUE: 0.9 },
    ],
    fourItems: [
      { INCIDENT_TYPE: 'Order Entry', INCIDENT_COUNT: 5, INCIDENT_VALUE: 2.1 },
      { INCIDENT_TYPE: 'Manual Entry', INCIDENT_COUNT: 3, INCIDENT_VALUE: 1.5 },
      { INCIDENT_TYPE: 'Data Entry', INCIDENT_COUNT: 2, INCIDENT_VALUE: 0.8 },
      { INCIDENT_TYPE: 'System Error', INCIDENT_COUNT: 1, INCIDENT_VALUE: 0.3 },
    ],
  };

  // Configuration for detail types
  private detailTypeConfig = {
    'bie-order-entered': {
      title: 'Cisco Business Inclusion and Exclusion (BIE)',
      category: 'entered',
    },
    'credit-holds-entered': { title: 'Credit Holds', category: 'entered' },
    'data-config-entered': { title: 'Data Configuration', category: 'entered' },
    'process-exceptions-entered': {
      title: 'Process Exceptions',
      category: 'entered',
    },
    'bie-booked': {
      title: 'Cisco Business Inclusion and Exclusion (BIE)',
      category: 'booked',
    },
    'credit-holds-booked': { title: 'Credit Holds', category: 'booked' },
    'data-config-booked': { title: 'Data Configuration', category: 'booked' },
  };

  constructor(
    private http: ApiHttpService,
    private destroyManager: DestroyManager,
    private route: ActivatedRoute,
    private router: Router,
    private filtersService: FiltersService
  ) {}

  ngOnInit(): void {
    this.getOrderBieException();
  }

  // Data preparation and accordion methods
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

  toggleAccordion(index: number): void {
    this.isOpen[index] = !this.isOpen[index];
  }

  // View management
  showDetailTable(detailType: string): void {
    this.currentDetailType = detailType;
    this.showDetailView = true;
    this.loadDataForDetailType(detailType);
  }

  goBack(): void {
    this.showDetailView = false;
    this.currentDetailType = '';
  }

  // Data loading
  private loadDataForDetailType(detailType: string): void {
    switch (detailType) {
      case 'bie-order-entered':
        this.getOrderBieException();
        break;
      // Add other API calls here as they're implemented
      default:
        console.log(`Loading data for ${detailType}...`);
    }
  }

  getOrderBieException(): void {
    this.orderBieExceptionLoading = true;
    this.http
      .get('o2c-order-bie-exception-v', this.destroyManager)
      .subscribe((data: any) => {
        this.orderBieExceptionDataSource.data = data;
        this.orderBieExceptionDisplayedColumns = Object.keys(data[0] || {});
        this.orderBiePieChartData = this.prepareDonutData(data);
        this.orderBieExceptionLoading = false;
      });
  }

  // Current state getters (used by template)
  getCurrentTitle(): string {
    return this.detailTypeConfig[this.currentDetailType]?.title || '';
  }

  getCurrentSubtitle(): string {
    const category = this.detailTypeConfig[this.currentDetailType]?.category;
    return category === 'entered'
      ? 'Orders Entered Not Booked'
      : 'Orders Booked to Fulfillment';
  }

  getCurrentFileName(): string {
    const baseNames = {
      'bie-order-entered': 'O2C Order BIE Exceptions',
      'credit-holds-entered': 'O2C Credit Holds Exceptions',
      'data-config-entered': 'O2C Data Config Exceptions',
      'process-exceptions-entered': 'O2C Process Exceptions',
    };
    return baseNames[this.currentDetailType] || 'O2C Exceptions';
  }

  getCurrentDataSource(): MatTableDataSource<any> {
    switch (this.currentDetailType) {
      case 'bie-order-entered':
        return this.orderBieExceptionDataSource;
      default:
        return new MatTableDataSource<any>();
    }
  }

  getCurrentDisplayedColumns(): string[] {
    switch (this.currentDetailType) {
      case 'bie-order-entered':
        return this.orderBieExceptionDisplayedColumns;
      default:
        return [];
    }
  }

  getCurrentLoadingState(): boolean {
    switch (this.currentDetailType) {
      case 'bie-order-entered':
        return this.orderBieExceptionLoading;
      default:
        return false;
    }
  }

  // Dummy data getters for template
  get dummyData1() {
    return this.dummyData.multi;
  }
  get dummyData2() {
    return this.dummyData.single;
  }
  get dummyData3() {
    return this.dummyData.config;
  }
  get dummyData4() {
    return this.dummyData.fourItems;
  }
  get dummyData5() {
    return this.dummyData.single;
  }
}
