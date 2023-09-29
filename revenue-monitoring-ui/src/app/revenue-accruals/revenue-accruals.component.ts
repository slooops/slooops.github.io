import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import {
  KafkaPublishDownstreamModel,
  KafkaErrorModel,
  AccrualsSummarizationErrorModel,
  AccrualsDistributionErrorModel,
  ErrorDistributionSummarizationModel,
  KafkaInboundModel,
  AccrualsProcessingErrorModel,
  ARTrxnMissingModel,
} from './revenue-accruals.interface';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-revenue-accruals-monitoring',
  templateUrl: './revenue-accruals.component.html',
  styleUrls: ['./revenue-accruals.component.css'],
})
export class RevenueAccrualsComponent implements OnInit {
  constructor(http: ApiHttpService) {
    this.http = http;
  }

  protected http: ApiHttpService;

  kafkaErrorDataSource: MatTableDataSource<KafkaErrorModel>;
  kafkaInboundDataSource: MatTableDataSource<KafkaInboundModel>;
  arTrxnMissingDataSource: MatTableDataSource<ARTrxnMissingModel>;
  accrualsProcessingErrorsDataSource: MatTableDataSource<AccrualsProcessingErrorModel>;
  kafkaPublishDownstreamDataSource: MatTableDataSource<KafkaPublishDownstreamModel>;
  accrualsSummarizationErrorDataSource: MatTableDataSource<AccrualsSummarizationErrorModel>;
  accrualsDistributionErrorDataSource: MatTableDataSource<AccrualsDistributionErrorModel>;
  errorDistributionSummarizationDataSource: MatTableDataSource<ErrorDistributionSummarizationModel>;

  kafkaErrors: KafkaErrorModel[];
  kafkaInbounds: KafkaInboundModel[];
  arTrxnMissings: ARTrxnMissingModel[];
  accrualsProcessingErrors: AccrualsProcessingErrorModel[];
  kafkaPublishDownstream: KafkaPublishDownstreamModel[];
  accrualsSummarizationErrors: AccrualsSummarizationErrorModel[];
  accrualsDistributionErrors: AccrualsDistributionErrorModel[];
  errorDistributionSummarizations: ErrorDistributionSummarizationModel[];

  @ViewChild('kafkaErrors', { static: true }) kafkaErrorsSort: MatSort;
  @ViewChild('kafkaErrorPaginator') kafkaErrorPaginator: MatPaginator;

  @ViewChild('kafkaInboundSort', { static: true }) kafkaInboundSort: MatSort;
  @ViewChild('kafkaInboundPaginator') kafkaInboundPaginator: MatPaginator;

  @ViewChild('arTrxnMissingSort', { static: true }) arTrxnMissingSort: MatSort;
  @ViewChild('arTrxnMissingPaginator') arTrxnMissingPaginator: MatPaginator;

  @ViewChild('accrualsProcessingErrorsSort', { static: true })
  accrualsProcessingErrorsSort: MatSort;
  @ViewChild('accrualsProcessingErrorsPaginator')
  accrualsProcessingErrorsPaginator: MatPaginator;

  @ViewChild('kafkaPublishDownstreamSort', { static: true })
  kafkaPublishDownstreamSort: MatSort;
  @ViewChild('kafkaPublishDownstreamPaginator')
  kafkaPublishDownstreamPaginator: MatPaginator;

  @ViewChild('accrualsSummarizationErrorSort', { static: true })
  accrualsSummarizationErrorSort: MatSort;
  @ViewChild('accrualsSummarizationErrorPaginator')
  accrualsSummarizationErrorPaginator: MatPaginator;

  @ViewChild('accrualsDistributionErrorSort', { static: true })
  accrualsDistributionErrorSort: MatSort;
  @ViewChild('accrualsDistributionErrorPaginator')
  accrualsDistributionErrorPaginator: MatPaginator;

  @ViewChild('errorDistributionSummarizationSort', { static: true })
  errorDistributionSummarizationSort: MatSort;
  @ViewChild('errorDistributionSummarizationPaginator')
  errorDistributionSummarizationPaginator: MatPaginator;

  ngOnInit() {
    this.getKafkaErrors();
    this.getKafkaInbound();
    this.getArTrxnMissing();
    this.getAccrualsProcessingErrors();
    this.getAccrualsDistributionErrors();
    this.getAccrualsSummarizationErrors();
    this.getKafkaPublishToDownstream();
    this.getErrorDistributionSummarization();
  }

  formatColumnHeader(columnName: string): string {
    return columnName.replace(/_/g, ' ');
  }

  chartOptions = {
    responsive: true,
    elements: {
      line: {
        tension: 0.3,
      },
    },
  };

  kafkaInboundvsErrorchartData = [];
  kafkachartLabels = [];

  prepareInboundvsErrorChartData(): void {
    if (this.kafkaInbounds && this.kafkaErrors) {
      const dates: string[] = [];

      const revSumByDate: number[] = [];
      const sbpSumByDate: number[] = [];

      this.kafkachartLabels = this.kafkaInbounds.map((data) =>
        new Date(data.CREATION_DATE).toLocaleDateString()
      );

      this.kafkachartLabels = Array.from(new Set(this.kafkachartLabels));

      this.kafkaInbounds.forEach((item) => {
        const creationDate = item.CREATION_DATE;
        const subscriber = item.SUBSCRIBER;
        const recordCount = item.RECORD_COUNT;

        if (!dates.includes(creationDate)) {
          dates.push(creationDate);
          revSumByDate.push(0);
          sbpSumByDate.push(0);
        }

        if (subscriber === 'REV') {
          const dateIndex = dates.indexOf(creationDate);
          revSumByDate[dateIndex] += recordCount;
        } else if (subscriber === 'SbpRevenueAccrualTsvConsumer') {
          const dateIndex = dates.indexOf(creationDate);
          sbpSumByDate[dateIndex] += recordCount;
        }
      });

      const errorDates: string[] = [];
      const revErrorsByDate: number[] = [];
      const sbpErrorsByDate: number[] = [];

      this.kafkaErrors.forEach((item) => {
        const creationDate = item.CREATION_DATE;
        const subscriber = item.SUBSCRIBER;

        // Find the index of creationDate in the errorDates array
        const errorDateIndex = errorDates.indexOf(creationDate);

        if (errorDateIndex === -1) {
          // If creationDate is not found, add it and initialize error counts
          errorDates.push(creationDate);
          revErrorsByDate.push(subscriber === 'REV' ? 1 : 0);
          sbpErrorsByDate.push(
            subscriber === 'SbpRevenueAccrualTsvConsumer' ? 1 : 0
          );
        } else {
          if (subscriber === 'REV') {
            revErrorsByDate[errorDateIndex]++;
          } else if (subscriber === 'SbpRevenueAccrualTsvConsumer') {
            sbpErrorsByDate[errorDateIndex]++;
          }
        }
      });

      errorDates.reverse();
      revErrorsByDate.reverse();
      sbpErrorsByDate.reverse();

      this.kafkaInboundvsErrorchartData = [
        {
          data: revSumByDate,
          label: 'REV (Inbound)',
        },
        {
          data: sbpSumByDate,
          label: 'SbpRevenueAccrualTsvConsumer (Inbound)',
        },
        {
          data: revErrorsByDate,
          label: 'REV (Errors)',
        },
        {
          data: sbpErrorsByDate,
          label: 'SbpRevenueAccrualTsvConsumer (Errors)',
        },
      ];

      this.kafkaInboundvsErrorchartData.forEach((dataset) => {
        if (dataset.label === 'REV (Inbound)') {
          dataset.backgroundColor = 'rgba(255, 0, 0, 0.9)';
          dataset.borderColor = 'rgba(255, 0, 0, 1)';
        } else if (dataset.label === 'SbpRevenueAccrualTsvConsumer (Inbound)') {
          dataset.backgroundColor = 'rgba(5, 189, 245, 1)';
          dataset.borderColor = 'rgba(5, 189, 245, 1)';
        } else if (dataset.label === 'REV (Errors)') {
          dataset.backgroundColor = 'rgba(2, 158, 66, 1)';
          dataset.borderColor = 'rgba(2, 158, 66, 1)';
        } else if (dataset.label === 'SbpRevenueAccrualTsvConsumer (Errors)') {
          dataset.backgroundColor = 'rgba(245, 109, 5, 1)';
          dataset.borderColor = 'rgba(245, 109, 5, 1)';
        }
      });
    }
  }

  arTrxnMissingChartData = [];
  arTrxnMissingChartLabels = [];

  prepareARTrxnMissingChartData(): void {
    if (this.arTrxnMissings) {
      this.arTrxnMissingChartLabels = this.arTrxnMissings.map((data) =>
        new Date(data.ACCRUAL_CREATION_DATE).toLocaleDateString()
      );
      const chartDataPoints = this.arTrxnMissings.map(
        (data) => +data.AMOUNT_USD
      );

      this.arTrxnMissingChartData = [
        { data: chartDataPoints, label: 'Amount USD' },
      ];
    }
  }

  accrualsProcessingErrorChartData = [];
  accrualsProcessingErrorChartLabels = [];

  prepareAccrualsProcessingErrorChartData(): void {
    if (this.accrualsProcessingErrors) {
      this.accrualsProcessingErrorChartLabels =
        this.accrualsProcessingErrors.map((data) =>
          new Date(data.CREATION_DATE).toLocaleDateString()
        );
      const chartDataPoints = this.accrualsProcessingErrors.map(
        (data) => +data.AMOUNT_USD
      );

      this.accrualsProcessingErrorChartData = [
        { data: chartDataPoints, label: 'Amount USD' },
      ];
    }
  }

  kafkaPublishDownstreamChartData = [];
  kafkaPublishDownstreamChartLabels = [];

  prepareKafkaPublishDownstreamChartData(): void {
    if (this.kafkaPublishDownstream) {
      this.kafkaPublishDownstreamChartLabels = this.kafkaPublishDownstream.map(
        (data) => new Date(data.CREATION_DATE).toLocaleDateString()
      );
      const chartDataPoints = this.kafkaPublishDownstream.map(
        (data) => +data.COUNT_SUB_REF_ID
      );

      this.kafkaPublishDownstreamChartData = [
        { data: chartDataPoints, label: 'Count Sub Ref ID' },
      ];
    }
  }

  accrualsSummarizationErrorChartData = [];
  accrualsSummarizationErrorChartLabels = [];

  prepareAccrualsSummarizationErrorChartData(): void {
    if (this.accrualsSummarizationErrors) {
      this.accrualsSummarizationErrorChartLabels =
        this.accrualsSummarizationErrors.map((data) =>
          new Date(data.CREATION_DATE).toLocaleDateString()
        );
      const chartDataPoints = this.accrualsSummarizationErrors.map(
        (data) => +data.COUNT_RECORDS
      );

      this.accrualsSummarizationErrorChartData = [
        { data: chartDataPoints, label: 'Count Records' },
      ];
    }
  }

  accrualsDistributionErrorChartData = [];
  accrualsDistributionErrorChartLabels = [];

  prepareAccrualsDistributionErrorChartData(): void {
    if (this.accrualsDistributionErrors) {
      this.accrualsDistributionErrorChartLabels =
        this.accrualsDistributionErrors.map((data) =>
          new Date(data.CREATION_DATE).toLocaleDateString()
        );
      const chartDataPoints = this.accrualsDistributionErrors.map(
        (data) => +data.COUNT_RECORDS
      );

      this.accrualsDistributionErrorChartData = [
        { data: chartDataPoints, label: 'Count Records' },
      ];
    }
  }

  errorDistributionSummarizationChartData = [];
  errorDistributionSummarizationChartLabels = [];

  prepareErrorDistributionSummarizationChartData(): void {
    if (this.errorDistributionSummarizations) {
      this.errorDistributionSummarizationChartLabels =
        this.errorDistributionSummarizations.map((data) =>
          new Date(data.CREATION_DATE).toLocaleDateString()
        );
      const chartDataPoints = this.errorDistributionSummarizations.map(
        (data) => +data.AMOUNT
      );

      this.errorDistributionSummarizationChartData = [
        { data: chartDataPoints, label: 'Amount' },
      ];
    }
  }

  kafkaErrorsDisplayedColumns: string[] = [
    'ATTRIBUTE1',
    'CREATION_DATE',
    'ERROR_MESSAGE',
    'OPERATING_UNIT',
    'PERIOD_NAME',
    'PERIOD_YEAR',
    'REV_CREATION_DATE',
    'REV_PROCESS_FLAG',
    'SUBSCRIBER',
    'SUBSCRIPTION_REF_ID',
    'SUB_TAG',
    'TAG',
    'UNIQUE_PROCESS_ID',
  ];

  kafkaInboundDisplayedColumns: string[] = [
    'CREATION_DATE',
    'PERIOD_NAME',
    'PERIOD_YEAR',
    'RECORD_COUNT',
    'REV_CREATION_DATE',
    'SOURCE',
    'SUBSCRIBER',
    'SUB_TAG',
    'TAG',
  ];

  aRTrxnMissingDisplayedColumns: string[] = [
    'ACCOUNTING_RULE_NAME',
    'ACCRUAL_CREATION_DATE',
    'ACCRUAL_FLAG',
    'AMOUNT',
    'AMOUNT_USD',
    'BATCH_SOURCE',
    'CREATION_DATE',
    'CURRENCY',
    'CUSTOMER_TRX_LINE_ID',
    'EXTENDED_AMOUNT',
    'IMM_PERCENT',
    'IMPACT_AMOUNT_USD',
    'LINES_EXTN_CREATION_DATE',
    'LINE_AMOUNT_USD_AR',
    'OA_FLAG',
    'ORG_ID',
    'PERIOD_NAME',
    'PERIOD_YEAR',
    'SUBSCRIPTION_REF_ID',
    'SUB_TAG',
    'TAG',
    'TRANSACTION_TYPE',
    'UNIQUE_ID',
  ];

  accrualsProcessingErrorDisplayedColumns: string[] = [
    'AMOUNT',
    'AMOUNT_USD',
    'CREATION_DATE',
    'CURRENCY',
    'ERROR_MESSAGE',
    'ORG_ID',
    'PERIOD_NAME',
    'PERIOD_YEAR',
    'SOURCE',
    'SUBREF_ORDER',
    'SUB_TAG',
    'TAG',
    'TRANSACTION_ID',
    'TRANSACTION_SOURCE',
    'TRANSACTION_TYPE',
    'UNIQUE_ID',
  ];

  kafkaPublishDownstreamDisplayedColumns: string[] = [
    'COUNT_ORD_NUM',
    'COUNT_SUB_REF_ID',
    'CREATION_DATE',
    'ORG_ID',
    'PERIOD_NAME',
    'PERIOD_YEAR',
    'SUB_TAG',
    'TAG',
    'TOPIC_NAME',
  ];

  accrualsSummarizationErrorDisplayedColumns: string[] = [
    'COUNT_RECORDS',
    'CREATION_DATE',
    'ERROR_MESSAGE',
    'EVENT_STATUS',
    'GROUPING_ID',
    'LEDGER_ID',
    'PERIOD_NAME',
    'PERIOD_YEAR',
    'SUB_TAG',
    'SUMM_CREATION_DATE',
    'TAG',
  ];

  accrualsDistributionErrorDisplayedColumns: string[] = [
    'COUNT_RECORDS',
    'CREATION_DATE',
    'DIST_CREATION_DATE',
    'EVENT_STATUS',
    'LEDGER_ID',
    'PERIOD_NAME',
    'PERIOD_YEAR',
    'SUB_TAG',
    'TAG',
  ];

  errorDistributionSummarizationDisplayedColumns: string[] = [
    'ACCOUNT',
    'ACCOUNT_CLASS',
    'AMOUNT',
    'CREATION_DATE',
    'DIST_AMOUNT',
    'DIST_BAL_TYPE',
    'GL_BATCH_NAME',
    'GROUPING_ID',
    'LEDGER_ID',
    'PERIOD_NUM',
    'PERIOD_YEAR',
    'SUB_TAG',
    'SUMMARY_ID',
    'SUMM_CREATION_DATE',
    'TAG',
  ];

  getKafkaErrors() {
    this.http.get('kafka-errors').subscribe((data: any) => {
      this.kafkaErrors = data;
      this.kafkaErrorDataSource = new MatTableDataSource<KafkaErrorModel>(
        this.kafkaErrors
      );
      this.kafkaErrorDataSource.sort = this.kafkaErrorsSort;
      this.kafkaErrorDataSource.paginator = this.kafkaErrorPaginator;
      this.prepareInboundvsErrorChartData();
    });
  }

  getKafkaInbound() {
    this.http.get('kafka-inbound').subscribe((data: any) => {
      this.kafkaInbounds = data;
      this.kafkaInboundDataSource = new MatTableDataSource<KafkaInboundModel>(
        this.kafkaInbounds
      );
      this.kafkaInboundDataSource.sort = this.kafkaInboundSort;
      this.kafkaInboundDataSource.paginator = this.kafkaInboundPaginator;
    });
  }

  getArTrxnMissing() {
    this.http.get('ar-trxn-missing').subscribe((data: any) => {
      this.arTrxnMissings = data;
      this.arTrxnMissingDataSource = new MatTableDataSource<ARTrxnMissingModel>(
        this.arTrxnMissings
      );
      this.arTrxnMissingDataSource.sort = this.arTrxnMissingSort;
      this.arTrxnMissingDataSource.paginator = this.arTrxnMissingPaginator;

      this.prepareARTrxnMissingChartData();
    });
  }

  getAccrualsProcessingErrors() {
    this.http.get('accruals-processing-errors').subscribe((data: any) => {
      this.accrualsProcessingErrors = data;
      this.accrualsProcessingErrorsDataSource =
        new MatTableDataSource<AccrualsProcessingErrorModel>(
          this.accrualsProcessingErrors
        );
      this.accrualsProcessingErrorsDataSource.sort =
        this.accrualsProcessingErrorsSort;
      this.accrualsProcessingErrorsDataSource.paginator =
        this.accrualsProcessingErrorsPaginator;

      this.prepareAccrualsProcessingErrorChartData();
    });
  }

  getKafkaPublishToDownstream() {
    this.http.get('kafka-publish-downstream').subscribe((data: any) => {
      this.kafkaPublishDownstream = data;
      this.kafkaPublishDownstreamDataSource =
        new MatTableDataSource<KafkaPublishDownstreamModel>(
          this.kafkaPublishDownstream
        );
      this.kafkaPublishDownstreamDataSource.sort =
        this.kafkaPublishDownstreamSort;
      this.kafkaPublishDownstreamDataSource.paginator =
        this.kafkaPublishDownstreamPaginator;
      this.prepareKafkaPublishDownstreamChartData();
    });
  }

  getAccrualsSummarizationErrors() {
    this.http.get('accruals-summarization-errors').subscribe((data: any) => {
      this.accrualsSummarizationErrors = data;
      this.accrualsSummarizationErrorDataSource =
        new MatTableDataSource<AccrualsSummarizationErrorModel>(
          this.accrualsSummarizationErrors
        );
      this.accrualsSummarizationErrorDataSource.sort =
        this.accrualsSummarizationErrorSort;
      this.accrualsSummarizationErrorDataSource.paginator =
        this.accrualsSummarizationErrorPaginator;

      this.prepareAccrualsSummarizationErrorChartData();
    });
  }

  getAccrualsDistributionErrors() {
    this.http.get('accruals-distribution-errors').subscribe((data: any) => {
      this.accrualsDistributionErrors = data;
      this.accrualsDistributionErrorDataSource =
        new MatTableDataSource<AccrualsDistributionErrorModel>(
          this.accrualsDistributionErrors
        );
      this.accrualsDistributionErrorDataSource.sort =
        this.accrualsDistributionErrorSort;
      this.accrualsDistributionErrorDataSource.paginator =
        this.accrualsDistributionErrorPaginator;
      this.prepareAccrualsDistributionErrorChartData();
    });
  }

  getErrorDistributionSummarization() {
    this.http.get('error-distribution-summarization').subscribe((data: any) => {
      this.errorDistributionSummarizations = data;
      this.errorDistributionSummarizationDataSource =
        new MatTableDataSource<ErrorDistributionSummarizationModel>(
          this.errorDistributionSummarizations
        );
      this.errorDistributionSummarizationDataSource.sort =
        this.errorDistributionSummarizationSort;
      this.errorDistributionSummarizationDataSource.paginator =
        this.errorDistributionSummarizationPaginator;
      this.prepareErrorDistributionSummarizationChartData();
    });
  }
}
