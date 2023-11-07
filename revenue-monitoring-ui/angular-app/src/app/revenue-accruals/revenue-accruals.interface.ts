export interface KafkaPublishDownstreamModel {
  COUNT_ORD_NUM: string;
  COUNT_SUB_REF_ID: number;
  CREATION_DATE: string;
  ORG_ID: number;
  PERIOD_NAME: string;
  PERIOD_YEAR: number;
  SUB_TAG: string;
  TAG: string;
  TOPIC_NAME: string;
}

export interface KafkaErrorModel {
  ATTRIBUTE1: string;
  CREATION_DATE: string;
  ERROR_MESSAGE: string;
  OPERATING_UNIT: string;
  PERIOD_NAME: string;
  PERIOD_YEAR: number;
  REV_CREATION_DATE: string;
  REV_PROCESS_FLAG: string;
  SUBSCRIBER: string;
  SUBSCRIPTION_REF_ID: string | null;
  SUB_TAG: string;
  TAG: string;
  UNIQUE_PROCESS_ID: number;
}

export interface AccrualsSummarizationErrorModel {
  COUNT_RECORDS: number;
  CREATION_DATE: string;
  ERROR_MESSAGE: string | null;
  EVENT_STATUS: string;
  GROUPING_ID: number;
  LEDGER_ID: string;
  PERIOD_NAME: string;
  PERIOD_YEAR: number;
  SUB_TAG: string;
  SUMM_CREATION_DATE: string;
  TAG: string;
}

export interface AccrualsDistributionErrorModel {
  COUNT_RECORDS: number;
  CREATION_DATE: string;
  DIST_CREATION_DATE: string;
  EVENT_STATUS: string;
  LEDGER_ID: string;
  PERIOD_NAME: string;
  PERIOD_YEAR: number;
  SUB_TAG: string;
  TAG: string;
}

export interface ErrorDistributionSummarizationModel {
  ACCOUNT: string;
  ACCOUNT_CLASS: string;
  AMOUNT: number;
  CREATION_DATE: string;
  DIST_AMOUNT: number;
  DIST_BAL_TYPE: string;
  GL_BATCH_NAME: string;
  GROUPING_ID: number;
  LEDGER_ID: string;
  PERIOD_NUM: string;
  PERIOD_YEAR: number;
  SUB_TAG: string;
  SUMMARY_ID: number;
  SUMM_CREATION_DATE: string;
  TAG: string;
}

export interface KafkaInboundModel {
  CREATION_DATE: string;
  PERIOD_NAME: string;
  PERIOD_YEAR: number;
  RECORD_COUNT: number;
  REV_CREATION_DATE: string;
  SOURCE: string;
  SUBSCRIBER: string;
  SUB_TAG: string;
  TAG: string;
}

export interface AccrualsProcessingErrorModel {
  AMOUNT: number;
  AMOUNT_USD: number;
  CREATION_DATE: string;
  CURRENCY: string;
  ERROR_MESSAGE: string;
  ORG_ID: number;
  PERIOD_NAME: string;
  PERIOD_YEAR: number;
  SOURCE: string;
  SUBREF_ORDER: string;
  SUB_TAG: string;
  TAG: string;
  TRANSACTION_ID: number;
  TRANSACTION_SOURCE: string;
  TRANSACTION_TYPE: string;
  UNIQUE_ID: number;
}

export interface ARTrxnMissingModel {
  ACCOUNTING_RULE_NAME: string;
  ACCRUAL_CREATION_DATE: string;
  ACCRUAL_FLAG: string;
  AMOUNT: number;
  AMOUNT_USD: number;
  BATCH_SOURCE: string;
  CREATION_DATE: string;
  CURRENCY: string;
  CUSTOMER_TRX_LINE_ID: number;
  EXTENDED_AMOUNT: number;
  IMM_PERCENT: number | null;
  IMPACT_AMOUNT_USD: number | null;
  LINES_EXTN_CREATION_DATE: string;
  LINE_AMOUNT_USD_AR: number;
  OA_FLAG: string;
  ORG_ID: number;
  PERIOD_NAME: string;
  PERIOD_YEAR: number;
  SUBSCRIPTION_REF_ID: string;
  SUB_TAG: string;
  TAG: string;
  TRANSACTION_TYPE: string;
  UNIQUE_ID: number;
}
