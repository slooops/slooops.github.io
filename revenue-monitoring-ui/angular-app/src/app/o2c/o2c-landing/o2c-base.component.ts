import { MatTableDataSource } from '@angular/material/table';

export abstract class O2cBaseComponent {
  showDetailView = false;
  currentDetailType = '';
  isOpen: boolean[] = Array(9).fill(true);

  abstract exceptionData: any;
  abstract detailTypeConfig: any;

  toggleAccordion(index: number): void {
    this.isOpen[index] = !this.isOpen[index];
  }

  showDetailTable(detailType: string): void {
    this.currentDetailType = detailType;
    this.showDetailView = true;
    const config = this.detailTypeConfig[detailType];
    if (config) this.loadExceptionData(config.dataKey);
  }

  goBack(): void {
    this.showDetailView = false;
    this.currentDetailType = '';
  }

  abstract loadExceptionData(dataKey: string): void;

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
    }, {});
    return Object.values(groupedData).map((item: any) => ({
      ...item,
      INCIDENT_VALUE: Math.round(item.INCIDENT_VALUE * 100) / 100,
    }));
  }

  private getCurrentConfig() {
    const config = this.detailTypeConfig[this.currentDetailType];
    return config ? { config, data: this.exceptionData[config.dataKey] } : null;
  }

  getCurrentTitle() {
    return this.getCurrentConfig()?.config.title || '';
  }
  getCurrentSubtitle() {
    return 'Fulfillment to Invoicing';
  }
  getCurrentFileName() {
    const title = this.getCurrentTitle();
    return title ? `O2C ${title} Exceptions` : 'O2C Exceptions';
  }
  getCurrentDataSource() {
    return this.getCurrentConfig()?.data.dataSource || new MatTableDataSource();
  }
  getCurrentDisplayedColumns() {
    return this.getCurrentConfig()?.data.displayedColumns || [];
  }
  getCurrentLoadingState() {
    return this.getCurrentConfig()?.data.loading || false;
  }
  getCurrentPieChartData() {
    return this.getCurrentConfig()?.data.pieChartData || [];
  }
}
