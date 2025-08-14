import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from 'src/app/providers/http.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { MatTableDataSource } from '@angular/material/table';
import { O2cBaseComponent } from '../../o2c-base.component';

@Component({
  selector: 'app-o2c-invoice',
  templateUrl: './o2c-invoice.component.html',
  styleUrl: './o2c-invoice.component.css',
})
export class O2cInvoiceComponent extends O2cBaseComponent implements OnInit {
  exceptionData = {
    'pre-invoicing': {
      loading: true,
      dataSource: new MatTableDataSource(),
      displayedColumns: [],
      pieChartData: [],
      apiEndpoint: 'o2c-order-preinv-exception-v',
    },
    'invoice-creation': {
      loading: true,
      dataSource: new MatTableDataSource(),
      displayedColumns: [],
      pieChartData: [],
      apiEndpoint: 'o2c-order-inv-exception-v',
    },
    'invoice-pid': {
      loading: true,
      dataSource: new MatTableDataSource(),
      displayedColumns: [],
      pieChartData: [],
      apiEndpoint: 'o2c-order-invpid-exception-v',
    },
    'invoice-others': {
      loading: true,
      dataSource: new MatTableDataSource(),
      displayedColumns: [],
      pieChartData: [],
      apiEndpoint: 'o2c-order-invoth-exception-v',
    },
  };

  detailTypeConfig = {
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
