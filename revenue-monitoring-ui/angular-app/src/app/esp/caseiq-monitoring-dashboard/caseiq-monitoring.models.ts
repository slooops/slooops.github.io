export interface HealthOverview {
  TOTAL_PROCESSED: number;
  NOT_SUPPORTED_CNT: number;
  SUCCESS_CNT: number;
  PARTIAL_CNT: number;
  ERROR_CNT: number;
  UNKNOWN_CNT: number;
  NULL_STATUS_CNT: number;
  NOT_DEFINED_CNT: number;
  NULL_CATEGORY_CNT: number;
  UNKNOWN_TEAM_CNT: number;
  GHOST_SUCCESS_CNT: number;
  EXCEPTION_CNT: number;
  MINUTES_SINCE_LAST_RUN: number;
  AVG_PROCESSING_MINUTES: number;
  health_score: number;
  health_status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'NO_DATA';
  success_rate_pct: number;
  error_rate_pct: number;
  anomaly_rate_pct: number;
}

export interface AnomalyItem {
  INCIDENT_NUMBER: string;
  TEAM_NAME: string;
  CATEGORY: string;
  CORE_ISSUE: string;
  RESOLUTION_API_STATUS: string;
  CASE_ANALYZER_STATUS: string;
  CASEIQ_RUN_DATE: string;
  ANOMALY_TYPE?: string;
  EXCEPTION_FIELD?: string;
  LLM_SUMMARY?: string;
  anomalyLabel?: string;
}

export interface StatusDistribution {
  RESOLUTION_API_STATUS: string;
  CNT: number;
  PCT: number;
}

export interface AnalyzerStatusDistribution {
  CASE_ANALYZER_STATUS: string;
  CNT: number;
  PCT: number;
}

export interface TeamSummary {
  TEAM_NAME: string;
  UNIQUE_INCIDENTS: number;
  TOTAL_RECORDS: number;
  SUCCESS: number;
  PARTIAL: number;
  ERRORS: number;
  NOT_RESOLVED: number;
  NOT_SUPPORTED: number;
  WARNINGS: number;
  SUCCESS_RATE_PCT: number;
}

export interface ThroughputEntry {
  RUN_HOUR: string;
  CASES_PROCESSED: number;
  SUCCESS_COUNT: number;
  ERROR_COUNT: number;
}

export interface ErrorCategory {
  TEAM_NAME: string;
  CATEGORY: string;
  CORE_ISSUE: string;
  ERROR_COUNT: number;
  PCT_OF_ALL_ERRORS: number;
}

export interface AnomalyBreakdownItem {
  name: string;
  count: number;
  severity: 'critical' | 'warning' | 'ok';
  issueKey?: string;
}

export interface TeamIssueMatrixEntry {
  TEAM_NAME: string;
  TOTAL: number;
  GHOST_SUCCESS: number;
  NOT_DEFINED: number;
  NULL_CLASSIFICATION: number;
  EXCEPTIONS: number;
  RESOLUTION_FAILURES: number;
}

export interface IssueTrendEntry {
  WEEK_START: string;
  ISSUE_COUNT: number;
}
