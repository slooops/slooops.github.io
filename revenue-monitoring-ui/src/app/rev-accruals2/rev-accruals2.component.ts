import { Component, OnInit, TemplateRef } from '@angular/core';
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
} from '../revenue-accruals/revenue-accruals.interface';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { ChartDialogComponent } from './chart-dialog/chart-dialog.component';
import { TableDialogComponent } from './table-dialog/table-dialog.component';

@Component({
  selector: 'app-rev-accruals2',
  templateUrl: './rev-accruals2.component.html',
  styleUrls: ['./rev-accruals2.component.css'],
})
export class RevAccruals2Component implements OnInit {
  isExpanded = false;

  constructor(
    http: ApiHttpService,
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<RevAccruals2Component>
  ) {
    this.http = http;
  }

  protected http: ApiHttpService;

  kafkaErrors: KafkaErrorModel[];
  kafkaInbounds: KafkaInboundModel[];
  arTrxnMissings: ARTrxnMissingModel[];
  accrualsProcessingErrors: AccrualsProcessingErrorModel[];
  kafkaPublishDownstream: KafkaPublishDownstreamModel[];
  accrualsSummarizationErrors: AccrualsSummarizationErrorModel[];
  accrualsDistributionErrors: AccrualsDistributionErrorModel[];
  errorDistributionSummarizations: ErrorDistributionSummarizationModel[];

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
  kafkaInboundvsErrorchartLabels = [];

  prepareInboundvsErrorChartData(): void {
    const kafkaInbounds = this.kafkaInbounds;
    const kafkaErrors = this.kafkaErrors;

    kafkaInbounds.sort((a, b) => {
      const dateA = new Date(a.REV_CREATION_DATE);
      const dateB = new Date(b.REV_CREATION_DATE);

      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      return 0;
    });

    kafkaErrors.sort((a, b) => {
      const dateA = new Date(a.REV_CREATION_DATE);
      const dateB = new Date(b.REV_CREATION_DATE);

      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      return 0;
    });

    if (kafkaInbounds && kafkaErrors) {
      const dates: string[] = [];

      const revSumByDate: number[] = [];
      const sbpSumByDate: number[] = [];

      this.kafkaInboundvsErrorchartLabels = this.kafkaInbounds.map((data) =>
        new Date(data.REV_CREATION_DATE).toLocaleDateString('en-US', {
          month: 'numeric',
          day: 'numeric',
        })
      );

      this.kafkaInboundvsErrorchartLabels = Array.from(
        new Set(this.kafkaInboundvsErrorchartLabels)
      );

      kafkaInbounds.forEach((item) => {
        let creationDate = item.REV_CREATION_DATE;
        const subscriber = item.SOURCE;
        const recordCount = item.RECORD_COUNT;

        if (!dates.includes(creationDate)) {
          dates.push(creationDate);
          revSumByDate.push(0);
          sbpSumByDate.push(0);
        }

        if (subscriber === 'OPL') {
          const dateIndex = dates.indexOf(creationDate);
          revSumByDate[dateIndex] += recordCount;
        } else if (subscriber === 'SBP') {
          const dateIndex = dates.indexOf(creationDate);
          sbpSumByDate[dateIndex] += recordCount;
        }
      });

      let errorDates: string[] = [];
      let revErrorsByDate: number[] = [];
      let sbpErrorsByDate: number[] = [];

      kafkaErrors.forEach((item) => {
        let creationDate = item.REV_CREATION_DATE;
        const subscriber = item.ATTRIBUTE1;

        const errorDateIndex = errorDates.indexOf(creationDate);

        if (errorDateIndex === -1) {
          errorDates.push(creationDate);
          revErrorsByDate.push(subscriber === 'OPL' ? 1 : 0);
          sbpErrorsByDate.push(subscriber === 'SBP' ? 1 : 0);
        } else {
          if (subscriber === 'OPL') {
            revErrorsByDate[errorDateIndex]++;
          } else if (subscriber === 'SBP') {
            sbpErrorsByDate[errorDateIndex]++;
          }
        }
      });

      this.kafkaInboundvsErrorchartData = [
        {
          data: revSumByDate,
          label: 'OPL (Inbound)',
        },
        {
          data: sbpSumByDate,
          label: 'SBP (Inbound)',
        },
        {
          data: revErrorsByDate,
          label: 'OPL (Errors)',
        },
        {
          data: sbpErrorsByDate,
          label: 'SBP (Errors)',
        },
      ];

      this.kafkaInboundvsErrorchartData.forEach((dataset) => {
        if (dataset.label === 'OPL (Inbound)') {
          dataset.backgroundColor = 'rgba(245, 109, 5, 1)';
          dataset.borderColor = 'rgba(245, 109, 5, 1)';
          dataset.pointBackgroundColor = 'rgba(245, 109, 5, 1)';
        } else if (dataset.label === 'SBP (Inbound)') {
          dataset.backgroundColor = 'rgba(5, 189, 245, 1)';
          dataset.borderColor = 'rgba(5, 189, 245, 1)';
          dataset.pointBackgroundColor = 'rgba(5, 189, 245, 1)';
        } else if (dataset.label === 'OPL (Errors)') {
          dataset.backgroundColor = 'rgba(2, 158, 66, 1)';
          dataset.borderColor = 'rgba(2, 158, 66, 1)';
          dataset.pointBackgroundColor = 'rgba(2, 158, 66, 1)';
        } else if (dataset.label === 'SBP (Errors)') {
          dataset.backgroundColor = 'rgba(255, 0, 0, 0.9)';
          dataset.borderColor = 'rgba(255, 0, 0, 1)';
          dataset.fillStyle = 'rgba(255, 0, 0, 1)';
          dataset.pointBackgroundColor = 'rgba(255, 0, 0, 1)';
        }
      });
    }
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
    const chartBox = document.querySelector('.chart-box');
    if (this.isExpanded) {
      chartBox.classList.add('expanded');
    } else {
      chartBox.classList.remove('expanded');
    }
  }

  arTrxnMissingChartData = [];
  arTrxnMissingChartLabels = [];

  prepareARTrxnMissingChartData(): void {
    const artrxnMissing = this.arTrxnMissings;
    artrxnMissing.sort((a, b) => {
      const dateA = new Date(a.ACCRUAL_CREATION_DATE);
      const dateB = new Date(b.ACCRUAL_CREATION_DATE);

      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      return 0;
    });
    if (artrxnMissing) {
      this.arTrxnMissingChartLabels = artrxnMissing.map((data) =>
        new Date(data.ACCRUAL_CREATION_DATE).toLocaleDateString('en-US', {
          month: 'numeric',
          day: 'numeric',
        })
      );
      this.arTrxnMissingChartLabels = Array.from(
        new Set(this.arTrxnMissingChartLabels)
      );
      const dates: string[] = [];

      const xaasSumByDate: number[] = [];

      artrxnMissing.forEach((item) => {
        let creationDate = item.ACCRUAL_CREATION_DATE;
        const batchSource = item.BATCH_SOURCE;

        const errorDateIndex = dates.indexOf(creationDate);

        if (errorDateIndex === -1) {
          dates.push(creationDate);
          xaasSumByDate.push(batchSource === 'XAAS' ? 1 : 0);
        } else {
          if (batchSource === 'XAAS') {
            xaasSumByDate[errorDateIndex]++;
          }
        }
      });

      this.arTrxnMissingChartData = [
        {
          data: xaasSumByDate,
          label: 'XAAS',
        },
      ];

      this.arTrxnMissingChartData.forEach((dataset) => {
        if (dataset.label === 'XAAS') {
          dataset.backgroundColor = 'rgba(5, 189, 245, 1)';
          dataset.borderColor = 'rgba(5, 189, 245, 1)';
          dataset.pointBackgroundColor = 'rgba(5, 189, 245, 1)';
        }
      });
    }
  }

  accrualsProcessingErrorChartData = [];
  accrualsProcessingErrorChartLabels = [];

  prepareAccrualsProcessingErrorChartData(): void {
    const accrualsProcessingErrors = this.accrualsProcessingErrors;
    accrualsProcessingErrors.sort((a, b) => {
      const dateA = new Date(a.CREATION_DATE);
      const dateB = new Date(b.CREATION_DATE);

      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      return 0;
    });
    if (accrualsProcessingErrors) {
      this.accrualsProcessingErrorChartLabels = accrualsProcessingErrors.map(
        (data) =>
          new Date(data.CREATION_DATE).toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
          })
      );

      this.accrualsProcessingErrorChartLabels = Array.from(
        new Set(this.accrualsProcessingErrorChartLabels)
      );

      let errorDates: string[] = [];
      let xaasErrorsByDate: number[] = [];
      let omErrorsByDate: number[] = [];

      accrualsProcessingErrors.forEach((item) => {
        let creationDate = item.CREATION_DATE;
        const subscriber = item.SOURCE;

        const errorDateIndex = errorDates.indexOf(creationDate);

        if (errorDateIndex === -1) {
          errorDates.push(creationDate);
          xaasErrorsByDate.push(subscriber === 'XAAS' ? 1 : 0);
          omErrorsByDate.push(subscriber === 'OM' ? 1 : 0);
        } else {
          if (subscriber === 'XAAS') {
            xaasErrorsByDate[errorDateIndex]++;
          } else if (subscriber === 'OM') {
            omErrorsByDate[errorDateIndex]++;
          }
        }
      });

      this.accrualsProcessingErrorChartData = [
        {
          data: xaasErrorsByDate,
          label: 'XAAS',
        },
        {
          data: omErrorsByDate,
          label: 'OM',
        },
      ];

      this.accrualsProcessingErrorChartData.forEach((dataset) => {
        if (dataset.label === 'XAAS') {
          dataset.backgroundColor = 'rgba(245, 109, 5, 1)';
          dataset.borderColor = 'rgba(245, 109, 5, 1)';
          dataset.pointBackgroundColor = 'rgba(245, 109, 5, 1)';
        } else if (dataset.label === 'OM') {
          dataset.backgroundColor = 'rgba(5, 189, 245, 1)';
          dataset.borderColor = 'rgba(5, 189, 245, 1)';
          dataset.pointBackgroundColor = 'rgba(5, 189, 245, 1)';
        }
      });
    }
  }

  kafkaPublishDownstreamChartData = [];
  kafkaPublishDownstreamChartLabels = [];

  prepareKafkaPublishDownstreamChartData(): void {
    if (this.kafkaPublishDownstream) {
      this.kafkaPublishDownstreamChartLabels = this.kafkaPublishDownstream.map(
        (data) =>
          new Date(data.CREATION_DATE).toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
          })
      );
      const chartDataPoints = this.kafkaPublishDownstream.map(
        (data) => +data.COUNT_SUB_REF_ID
      );

      this.kafkaPublishDownstreamChartData = [
        { data: chartDataPoints, label: 'Count Sub Ref ID' },
      ];

      this.kafkaPublishDownstreamChartData.forEach((dataset) => {
        if (dataset.label === 'Count Sub Ref ID') {
          dataset.backgroundColor = 'rgba(5, 189, 245, 1)';
          dataset.borderColor = 'rgba(5, 189, 245, 1)';
          dataset.pointBackgroundColor = 'rgba(5, 189, 245, 1)';
        }
      });
    }
  }

  accrualsSummarizationErrorChartData = [];
  accrualsSummarizationErrorChartLabels = [];

  prepareAccrualsSummarizationErrorChartData(): void {
    const accrualssummarizationErrors = this.accrualsSummarizationErrors;
    accrualssummarizationErrors.sort((a, b) => {
      const dateA = new Date(a.SUMM_CREATION_DATE);
      const dateB = new Date(b.SUMM_CREATION_DATE);

      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      return 0;
    });
    if (accrualssummarizationErrors) {
      this.accrualsSummarizationErrorChartLabels =
        accrualssummarizationErrors.map((data) =>
          new Date(data.CREATION_DATE).toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
          })
        );
      this.accrualsSummarizationErrorChartLabels = Array.from(
        new Set(this.accrualsSummarizationErrorChartLabels)
      );

      let errorDates: string[] = [];
      let errorsByDate: number[] = [];

      accrualssummarizationErrors.forEach((item) => {
        let creationDate = item.SUMM_CREATION_DATE;
        const recordCount = item.COUNT_RECORDS;

        if (!errorDates.includes(creationDate)) {
          errorDates.push(creationDate);
          errorsByDate.push(0);
        }
        const dateIndex = errorDates.indexOf(creationDate);
        errorsByDate[dateIndex] += recordCount;
      });

      this.accrualsSummarizationErrorChartData = [
        {
          data: errorsByDate,
          label: 'Record Count',
        },
      ];

      this.accrualsSummarizationErrorChartData.forEach((dataset) => {
        if (dataset.label === 'Record Count') {
          dataset.backgroundColor = 'rgba(5, 189, 245, 1)';
          dataset.borderColor = 'rgba(5, 189, 245, 1)';
          dataset.pointBackgroundColor = 'rgba(5, 189, 245, 1)';
        }
      });
    }
  }

  accrualsDistributionErrorChartData = [];
  accrualsDistributionErrorChartLabels = [];

  prepareAccrualsDistributionErrorChartData(): void {
    const accrualsDistributionErrors = this.accrualsDistributionErrors;
    accrualsDistributionErrors.sort((a, b) => {
      const dateA = new Date(a.DIST_CREATION_DATE);
      const dateB = new Date(b.DIST_CREATION_DATE);

      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      return 0;
    });
    if (accrualsDistributionErrors) {
      this.accrualsDistributionErrorChartLabels =
        accrualsDistributionErrors.map((data) =>
          new Date(data.CREATION_DATE).toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
          })
        );
      this.accrualsDistributionErrorChartLabels = Array.from(
        new Set(this.accrualsDistributionErrorChartLabels)
      );

      let errorDates: string[] = [];
      let errorsByDate: number[] = [];

      accrualsDistributionErrors.forEach((item) => {
        let creationDate = item.DIST_CREATION_DATE;
        const recordCount = item.COUNT_RECORDS;

        if (!errorDates.includes(creationDate)) {
          errorDates.push(creationDate);
          errorsByDate.push(0);
        }
        const dateIndex = errorDates.indexOf(creationDate);
        errorsByDate[dateIndex] += recordCount;
      });

      this.accrualsDistributionErrorChartData = [
        {
          data: errorsByDate,
          label: 'Record Count',
        },
      ];

      this.accrualsDistributionErrorChartData.forEach((dataset) => {
        if (dataset.label === 'Record Count') {
          dataset.backgroundColor = 'rgba(5, 189, 245, 1)';
          dataset.borderColor = 'rgba(5, 189, 245, 1)';
          dataset.pointBackgroundColor = 'rgba(5, 189, 245, 1)';
        }
      });
    }
  }

  errorDistributionSummarizationChartData = [];
  errorDistributionSummarizationChartLabels = [];

  prepareErrorDistributionSummarizationChartData(): void {
    const errorDistributionSummarization = this.errorDistributionSummarizations;
    errorDistributionSummarization.sort((a, b) => {
      const dateA = new Date(a.SUMM_CREATION_DATE);
      const dateB = new Date(b.SUMM_CREATION_DATE);

      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      return 0;
    });
    if (errorDistributionSummarization) {
      this.errorDistributionSummarizationChartLabels =
        errorDistributionSummarization.map((data) =>
          new Date(data.CREATION_DATE).toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
          })
        );

      this.errorDistributionSummarizationChartLabels = Array.from(
        new Set(this.errorDistributionSummarizationChartLabels)
      );

      let errorDates: string[] = [];
      let caErrorsByDate: number[] = [];
      let revErrorsByDate: number[] = [];

      errorDistributionSummarization.forEach((item) => {
        let creationDate = item.SUMM_CREATION_DATE;
        const subscriber = item.ACCOUNT_CLASS;

        const errorDateIndex = errorDates.indexOf(creationDate);

        if (errorDateIndex === -1) {
          errorDates.push(creationDate);
          caErrorsByDate.push(subscriber === 'CONTRACT_ASSETS' ? 1 : 0);
          revErrorsByDate.push(subscriber === 'REVENUE' ? 1 : 0);
        } else {
          if (subscriber === 'CONTRACT_ASSETS') {
            caErrorsByDate[errorDateIndex]++;
          } else if (subscriber === 'REVENUE') {
            revErrorsByDate[errorDateIndex]++;
          }
        }
      });

      this.errorDistributionSummarizationChartData = [
        {
          data: caErrorsByDate,
          label: 'CONTRACT ASSETS',
        },
        {
          data: revErrorsByDate,
          label: 'REVENUE',
        },
      ];

      this.errorDistributionSummarizationChartData.forEach((dataset) => {
        if (dataset.label === 'CONTRACT ASSETS') {
          dataset.backgroundColor = 'rgba(245, 109, 5, 1)';
          dataset.borderColor = 'rgba(245, 109, 5, 1)';
          dataset.pointBackgroundColor = 'rgba(245, 109, 5, 1)';
        } else if (dataset.label === 'REVENUE') {
          dataset.backgroundColor = 'rgba(5, 189, 245, 1)';
          dataset.borderColor = 'rgba(5, 189, 245, 1)';
          dataset.pointBackgroundColor = 'rgba(5, 189, 245, 1)';
        }
      });
    }
  }

  kafkaErrorsDisplayedColumns: string[] = [
    'select',
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
    'select',
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
    'select',
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
    'select',
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
    'select',
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
    'select',
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
    'select',
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
    'select',
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
      this.kafkaErrors.forEach((ele) => {
        for (const key in ele) {
          if (key == 'CREATION_DATE' || key == 'REV_CREATION_DATE') {
            ele[key] = new Date(ele[key]).toLocaleDateString();
          }
        }
      });
      this.prepareInboundvsErrorChartData();
    });
  }

  getKafkaInbound() {
    this.http.get('kafka-inbound').subscribe((data: any) => {
      this.kafkaInbounds = data;
      this.kafkaInbounds.forEach((ele) => {
        for (const key in ele) {
          if (key == 'CREATION_DATE' || key == 'REV_CREATION_DATE') {
            ele[key] = new Date(ele[key]).toLocaleDateString();
          }
        }
      });
    });
  }

  getArTrxnMissing() {
    this.http.get('ar-trxn-missing').subscribe((data: any) => {
      this.arTrxnMissings = data;
      this.arTrxnMissings.forEach((ele) => {
        for (const key in ele) {
          if (
            key == 'CREATION_DATE' ||
            key == 'ACCRUAL_CREATION_DATE' ||
            key == 'LINES_EXTN_CREATION_DATE'
          ) {
            ele[key] = new Date(ele[key]).toLocaleDateString();
          }
        }
      });
      this.prepareARTrxnMissingChartData();
    });
  }

  getAccrualsProcessingErrors() {
    this.http.get('accruals-processing-errors').subscribe((data: any) => {
      this.accrualsProcessingErrors = data;
      this.accrualsProcessingErrors.forEach((ele) => {
        for (const key in ele) {
          if (key == 'CREATION_DATE') {
            ele[key] = new Date(ele[key]).toLocaleDateString();
          }
        }
      });
      this.prepareAccrualsProcessingErrorChartData();
    });
  }

  getKafkaPublishToDownstream() {
    this.http.get('kafka-publish-downstream').subscribe((data: any) => {
      this.kafkaPublishDownstream = data;
      this.kafkaPublishDownstream.forEach((ele) => {
        for (const key in ele) {
          if (key == 'CREATION_DATE') {
            ele[key] = new Date(ele[key]).toLocaleDateString();
          }
        }
      });
      this.prepareKafkaPublishDownstreamChartData();
    });
  }

  getAccrualsSummarizationErrors() {
    this.http.get('accruals-summarization-errors').subscribe((data: any) => {
      this.accrualsSummarizationErrors = data;
      this.accrualsSummarizationErrors.forEach((ele) => {
        for (const key in ele) {
          if (key == 'CREATION_DATE' || key == 'SUMM_CREATION_DATE') {
            ele[key] = new Date(ele[key]).toLocaleDateString();
          }
        }
      });
      this.prepareAccrualsSummarizationErrorChartData();
    });
  }

  getAccrualsDistributionErrors() {
    this.http.get('accruals-distribution-errors').subscribe((data: any) => {
      this.accrualsDistributionErrors = data;
      this.accrualsDistributionErrors.forEach((ele) => {
        for (const key in ele) {
          if (key == 'CREATION_DATE' || key == 'DIST_CREATION_DATE') {
            ele[key] = new Date(ele[key]).toLocaleDateString();
          }
        }
      });
      this.prepareAccrualsDistributionErrorChartData();
    });
  }

  getErrorDistributionSummarization() {
    this.http.get('error-distribution-summarization').subscribe((data: any) => {
      this.errorDistributionSummarizations = data;
      this.errorDistributionSummarizations.forEach((ele) => {
        for (const key in ele) {
          if (key == 'CREATION_DATE' || key == 'SUMM_CREATION_DATE') {
            ele[key] = new Date(ele[key]).toLocaleDateString();
          }
        }
      });
      this.prepareErrorDistributionSummarizationChartData();
    });
  }

  openDialog(dialogTemplate: TemplateRef<any>) {
    this.dialogRef = this.dialog.open(dialogTemplate, {
      width: '1500px',
      height: '800px',
      data: {},
    });
  }

  closeDialog(result) {
    this.dialogRef.close(result);
  }

  setChart(chart: string) {
    let chartData, chartLabels, chartType, chartName;
    if (chart === 'inboundError') {
      chartData = this.kafkaInboundvsErrorchartData;
      chartLabels = this.kafkaInboundvsErrorchartLabels;
      chartType = 'line';
      chartName = 'Inbound Errors';
    } else if (chart === 'artrxnMissing') {
      chartData = this.arTrxnMissingChartData;
      chartLabels = this.arTrxnMissingChartLabels;
      chartType = 'line';
      chartName = 'AR Trxn Missing';
    } else if (chart === 'accrualsprocessingError') {
      chartData = this.accrualsProcessingErrorChartData;
      chartLabels = this.accrualsProcessingErrorChartLabels;
      chartType = 'line';
      chartName = 'Accruals Processing Error';
    } else if (chart === 'kafkapublishDownstream') {
      chartData = this.kafkaPublishDownstreamChartData;
      chartLabels = this.kafkaPublishDownstreamChartLabels;
      chartType = 'line';
      chartName = 'Kafka Publish Downstream';
    } else if (chart === 'accrualssummarizationError') {
      chartData = this.accrualsSummarizationErrorChartData;
      chartLabels = this.accrualsSummarizationErrorChartLabels;
      chartType = 'line';
      chartName = 'Accruals Summarization Errorr';
    } else if (chart === 'accrualsdistributionError') {
      chartData = this.accrualsDistributionErrorChartData;
      chartLabels = this.accrualsDistributionErrorChartLabels;
      chartType = 'bar';
      chartName = 'Accruals Distribution Error';
    } else if (chart === 'errordistributionSummarization') {
      chartData = this.errorDistributionSummarizationChartData;
      chartLabels = this.errorDistributionSummarizationChartLabels;
      chartType = 'bar';
      chartName = 'Error Distribution Summarization';
    }

    this.expandChart(chartData, chartLabels, chartType, chartName);
  }

  expandChart(
    chartData: string,
    chartLabels: string,
    chartType: string,
    chartName: string
  ) {
    const dialogRef = this.dialog.open(ChartDialogComponent, {
      width: '90vw',
      height: 'fit-content',
      data: {
        chartData: chartData,
        chartLabels: chartLabels,
        chartType: chartType,
        chartName: chartName,
      },
    });
  }

  setTable(table: string) {
    let dataSource, displayedColumns, title, length;
    if (table === 'kafkaerror') {
      dataSource = new MatTableDataSource<KafkaErrorModel>(this.kafkaErrors);
      displayedColumns = this.kafkaErrorsDisplayedColumns;
      title = 'Kafka Errors';
      length = this.kafkaErrors.length;
    } else if (table === 'kafkainbound') {
      dataSource = new MatTableDataSource<KafkaInboundModel>(
        this.kafkaInbounds
      );
      displayedColumns = this.kafkaInboundDisplayedColumns;
      title = 'Kafka Inbound';
      length = this.kafkaInbounds.length;
    } else if (table === 'artrxnmissing') {
      dataSource = new MatTableDataSource<ARTrxnMissingModel>(
        this.arTrxnMissings
      );
      displayedColumns = this.aRTrxnMissingDisplayedColumns;
      title = 'AR Transactions Missing';
      length = this.arTrxnMissings.length;
    } else if (table === 'accrualsprocessingerror') {
      dataSource = new MatTableDataSource<AccrualsProcessingErrorModel>(
        this.accrualsProcessingErrors
      );
      displayedColumns = this.accrualsProcessingErrorDisplayedColumns;
      title = 'Accruals Processing Errors';
      length = this.accrualsProcessingErrors.length;
    } else if (table === 'kakfapublishdownstream') {
      dataSource = new MatTableDataSource<KafkaPublishDownstreamModel>(
        this.kafkaPublishDownstream
      );
      displayedColumns = this.kafkaPublishDownstreamDisplayedColumns;
      title = 'Kafka Published to Downstream';
      length = this.kafkaPublishDownstream.length;
    } else if (table === 'accrualssummarizationerror') {
      dataSource = new MatTableDataSource<AccrualsSummarizationErrorModel>(
        this.accrualsSummarizationErrors
      );
      displayedColumns = this.accrualsSummarizationErrorDisplayedColumns;
      title = 'Accruals Summarization Errors';
      length = this.accrualsSummarizationErrors.length;
    } else if (table === 'accrualsdistributionerror') {
      dataSource = new MatTableDataSource<AccrualsDistributionErrorModel>(
        this.accrualsDistributionErrors
      );
      displayedColumns = this.accrualsDistributionErrorDisplayedColumns;
      title = 'Accruals Distribution Errors';
      length = this.accrualsDistributionErrors.length;
    } else if (table === 'errordistributionsummarization') {
      dataSource = new MatTableDataSource<ErrorDistributionSummarizationModel>(
        this.errorDistributionSummarizations
      );
      displayedColumns = this.errorDistributionSummarizationDisplayedColumns;
      title = 'Error Distribution Summarization';
      length = this.errorDistributionSummarizations.length;
    }
    this.openTable(dataSource, displayedColumns, title, length);
  }

  openTable(
    dataSource: any,
    displayedColumns: string[],
    title: string,
    length: string
  ) {
    const dialogRef = this.dialog.open(TableDialogComponent, {
      width: '90vw',
      height: 'fit-content',
      data: {
        dataSource: dataSource,
        displayedColumns: displayedColumns,
        title: title,
        length: length,
      },
    });
  }
}
