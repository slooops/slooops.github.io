// ── Control-M dashboard types ─────────────────────────────────────────────
// Ported from i2c-control-m/frontend/src/types/index.ts

export type JobSource = 'FIN_I2C' | 'FIN_I2C_CCRM';

export type JobCategory =
  | 'TOTAL'
  | 'SUCCESS'
  | 'FAILURE'
  | 'LONG_RUNNING'
  | 'LATE_START'
  | 'RUNNING'
  | 'UNKNOWN_STATUS'
  | 'WAIT_CONDITION';

export interface Job {
  job_id: string;
  job_name: string;
  application: string;
  sub_application: string;
  folder_name: string;
  folder?: string;
  server: string;
  job_source: string;
  erp_name: string;
  entity_name: string | null;
  business_process: string | null;
  category: JobCategory;
  status: string;
  return_code: number | null;
  start_time: string | null;
  end_time: string | null;
  order_date: string;
  elapsed_sec: number | null;
  avg_run_sec: number | null;
  request_id: string;
  description: string;
  waiting_on: string;
  estimated_start_time: string;
  last_synced: string;
}

export interface Summary {
  TOTAL: number;
  SUCCESS: number;
  FAILURE: number;
  LONG_RUNNING: number;
  LATE_START: number;
}

export interface SubApplication {
  sub_app: string;
  display_name: string;
  count: number;
  has_failure: boolean;
  has_long_running: boolean;
  has_late_start: boolean;
}

export interface Folder {
  folder: string;
  display_name: string;
  job_count: number;
  has_failure: boolean;
  has_long_running: boolean;
  has_late_start: boolean;
  sub_applications: SubApplication[];
}

export interface TrendDay {
  day: string; // YYYYMMDD
  label: string; // MM/DD
  SUCCESS: number;
  FAILURE: number;
  LONG_RUNNING: number;
  LATE_START: number;
  TOTAL: number;
}

export interface HierarchyJob {
  application: string;
  sub_application: string;
  folder: string;
  job_name: string;
  description: string;
  priority: number | null;
  average_runtime: number | null;
  entity_name: string | null;
  business_process: string | null;
  job_id: string | null;
  category: string;
  status: string;
  start_time: string | null;
  end_time: string | null;
  elapsed_sec: number | null;
  request_id: string | null;
  erp_name: string | null;
}

// ── Log/output types ────────────────────────────────────────────────────

export type LogTabKey =
  | 'log'
  | 'output'
  | 'host-log'
  | 'host-output'
  | 'waiting-info'
  | 'statistic-info'
  | 'sql-info';

export interface WaitingInfo {
  job_id: string;
  waiting_on: string;
  estimated_start_time: string;
  lines: string[];
}

export interface SqlInfo {
  request_id: string;
  phase_code: string;
  phase_label: string;
  status_code: string;
  status_label: string;
  started: string;
  completed: string;
  sql_id: string;
  sql_text: string;
  wait_event: string;
  sid: number | null;
  inst_id: number | null;
  bind_variables: Array<{
    position: number;
    name: string;
    datatype: string;
    value: string | null;
  }>;
}

export interface JobStatRun {
  orderDate?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  runTime?: string;
  runNo?: string | number;
  runAs?: string;
}

export interface JobStatPeriod {
  description?: string;
  runInfo?: {
    averageInfo?: { runTime?: string; numberOfRuns?: number };
    runs?: JobStatRun[];
  };
}

export interface JobStatistics {
  jobId?: string;
  jobName?: string;
  periods?: JobStatPeriod[];
}

// ── Chat types ──────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface MatchedJob {
  job_name: string;
  application?: string | null;
  sub_application?: string | null;
  folder_name?: string | null;
  status?: string | null;
  category?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  elapsed_sec?: number | null;
}

export interface ChatResponse {
  answer: string;
  matched_jobs: MatchedJob[];
  keywords: string[];
}

// ── Actions ─────────────────────────────────────────────────────────────

export type JobAction = 'hold' | 'free' | 'rerun' | 'set_to_ok';
