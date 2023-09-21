import { Component, Input, OnInit } from '@angular/core';
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
  kafkaErrorDataSource: any;

  kafkaErrors: KafkaErrorModel[];

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

  getKafkaErrors() {
    this.http.get('kafka-errors').subscribe((data: any) => {
      this.kafkaErrors = data;
      this.kafkaErrorDataSource = new MatTableDataSource<KafkaErrorModel>(
        this.kafkaErrors
      );
    });
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

  getKafkaInbound() {
    this.http.get('kafka-inbound').subscribe((data) => {
      console.log('kafka inbound:', data);
    });
  }

  getArTrxnMissing() {
    this.http.get('ar-trxn-missing').subscribe((data) => {
      console.log('ar trxn missing:', data);
    });
  }

  getAccrualsProcessingErrors() {
    this.http.get('accruals-processing-errors').subscribe((data) => {
      console.log('accruals processing errors:', data);
    });
  }

  getAccrualsDistributionErrors() {
    this.http.get('accruals-distribution-errors').subscribe((data) => {
      console.log('accruals distribution errors:', data);
    });
  }

  getAccrualsSummarizationErrors() {
    this.http.get('accruals-summarization-errors').subscribe((data) => {
      console.log('accruals summarization errors:', data);
    });
  }

  getKafkaPublishToDownstream() {
    this.http.get('kafka-publish-downstream').subscribe((data) => {
      console.log('kafka publish downstream:', data);
    });
  }

  getErrorDistributionSummarization() {
    this.http.get('error-distribution-summarization').subscribe((data) => {
      console.log('error distribution summarization:', data);
    });
  }

  @Input() data: any;
  kafkaErrorSelection: any;
  kafkaErrorSelectedData: any;
  isKafkaErrorAllSelected() {
    const numSelected = this.kafkaErrorSelection.selected.length;
    const numRows = this.kafkaErrorDataSource.data.length;
    return numSelected === numRows;
  }

  kafkaErrorMasterToggle() {
    this.isKafkaErrorAllSelected()
      ? this.kafkaErrorSelection.clear()
      : this.kafkaErrorDataSource.data.forEach((row) =>
          this.kafkaErrorSelection.select(row)
        );
  }

  onRowClicked(row: any) {
    this.kafkaErrorSelectedData = row;
  }
}
