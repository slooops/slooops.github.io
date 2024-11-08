import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { DataService } from '../providers/data.service';

@Component({
  selector: 'app-custom-revenue',
  templateUrl: './custom-revenue.component.html',
  styleUrl: './custom-revenue.component.css',
})
export class CustomRevenueComponent implements OnInit {
  constructor(private http: ApiHttpService, private dataService: DataService) {}
  ngOnInit(): void {
    this.getErrorSummaryPeriodStatus();
  }

  accrualsTotals: { [key: string]: number } = {
    KAFKA_INBOUND_ERROR: 0,
    KAFKA_INBOUND: 0,
    ACCRUAL_LINEEXTN_BILLS_AHEAD_OF_TSV: 0,
    ACCRUAL_PROCESS: 0,
    ACCRUAL_DIST: 0,
    ACCRUAL_SUMMARY: 0,
    ACCRUAL_SUMM_DIST: 0,
    KAFKA_PUBLISH: 0,
    GL_BATCH_RECON: 0,
  };

  periodStatus: any;

  accrualsDetailsColumns: string[] = [
    'PERIOD_NAME',
    'PROCESS_FLOW',
    'ORG_NAME',
    'AMOUNT',
    'PROCESS_STATUS',
    'SOURCE',
    'SUBREF_ORDER',
    'TRXN_UNIQUE_ID',
    'ERROR_MESSAGE',
  ];

  specialWords: string[] = [
    'name',
    'amount',
    'interface',
    'error',
    'number',
    'total',
    'hold',
    'pending',
    'status',
    'num',
    'year',
    'status',
    'sub',
    'staging',
    'id',
    'line',
  ];

  skippedWords: string[] = ['IOL', 'AR', 'ID'];

  accrualsUrls: { [key: string]: string } = {
    summaryUrl: 'accruals-summary',
    detailsUrl: 'accruals-details',
    filteredDetailsUrl: '',
    summaryUpdateUrl: '',
    webexMessageUrl: '',
  };

  getErrorSummaryPeriodStatus() {
    this.http.get('monitoring-period-status').subscribe((data: any) => {
      this.periodStatus = data;
    });
  }
}
