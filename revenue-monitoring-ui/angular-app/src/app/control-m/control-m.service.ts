import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type {
  ChatMessage,
  ChatResponse,
  Folder,
  HierarchyJob,
  Job,
  JobAction,
  JobSource,
  JobStatistics,
  SqlInfo,
  Summary,
  TrendDay,
  WaitingInfo,
} from './control-m.types';

/**
 * Thin typed client for the i2c-control-m FastAPI backend.
 *
 * Requests go through a same-origin proxy (`/api/control-m/*`) which is
 * rewritten to `/api/ctm/*` and forwarded to the Control-M backend:
 *   - Local dev: `proxy.conf.json` (Angular CLI dev server)
 *   - Deployed:  `node-proxy-server/server.js` (Express + http-proxy-middleware)
 *
 * This avoids CORS entirely — the browser only ever calls the dashboard's
 * own origin.
 */
@Injectable({ providedIn: 'root' })
export class ControlMService {
  /** Same-origin base path. The proxy strips this and adds `/api/ctm`. */
  baseUrl = '/api/control-m';

  constructor(private readonly http: HttpClient) {}

  private url(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  // ── Summary / folders / trend ─────────────────────────────────────────

  getSummary(application: JobSource): Observable<Summary> {
    return this.http.get<Summary>(this.url('/summary'), {
      params: new HttpParams().set('application', application),
    });
  }

  getFolders(application: JobSource): Observable<Folder[]> {
    return this.http.get<Folder[]>(this.url('/folders'), {
      params: new HttpParams().set('application', application),
    });
  }

  getFoldersLive(application: JobSource): Observable<Folder[]> {
    return this.http.get<Folder[]>(this.url('/folders/live'), {
      params: new HttpParams().set('application', application),
    });
  }

  getTrend(application: JobSource, days = 7): Observable<TrendDay[]> {
    return this.http.get<TrendDay[]>(this.url('/trend'), {
      params: new HttpParams()
        .set('application', application)
        .set('days', days),
    });
  }

  getTrendDetail(
    application: JobSource,
    dateYYYYMMDD: string,
  ): Observable<Job[]> {
    return this.http.get<Job[]>(this.url('/trend/detail'), {
      params: new HttpParams()
        .set('application', application)
        .set('date', dateYYYYMMDD),
    });
  }

  // ── Jobs ──────────────────────────────────────────────────────────────

  getJobs(
    application: JobSource,
    opts: {
      category?: string;
      limit?: number;
      offset?: number;
      job_name?: string;
      sub_application?: string;
      force?: boolean;
    } = {},
  ): Observable<Job[]> {
    let params = new HttpParams()
      .set('application', application)
      .set('limit', opts.limit ?? 100000)
      .set('offset', opts.offset ?? 0);
    if (opts.category && opts.category !== 'TOTAL')
      params = params.set('category', opts.category);
    if (opts.job_name) params = params.set('job_name', opts.job_name);
    if (opts.sub_application)
      params = params.set('sub_application', opts.sub_application);
    if (opts.force) params = params.set('force', 'true');
    return this.http.get<Job[]>(this.url('/jobs'), { params });
  }

  getHierarchy(
    application: JobSource,
    sub_application?: string,
  ): Observable<HierarchyJob[]> {
    let params = new HttpParams().set('application', application);
    if (sub_application)
      params = params.set('sub_application', sub_application);
    return this.http.get<HierarchyJob[]>(this.url('/hierarchy'), { params });
  }

  // ── Refresh ───────────────────────────────────────────────────────────

  refreshApplication(application: JobSource): Observable<any> {
    return this.http.post(this.url('/refresh'), null, {
      params: new HttpParams().set('application', application),
    });
  }

  refreshFolder(
    application: JobSource,
    sub_application: string,
  ): Observable<any> {
    return this.http.post(this.url('/refresh/folder'), null, {
      params: new HttpParams()
        .set('application', application)
        .set('sub_application', sub_application),
    });
  }

  refreshStatus(run_id: string): Observable<any> {
    return this.http.get(this.url(`/refresh/${encodeURIComponent(run_id)}`));
  }

  // ── Job details / logs / actions ──────────────────────────────────────

  getCtmLog(job_id: string): Observable<string> {
    return this.http.get(this.url(`/jobs/${encodeURIComponent(job_id)}/log`), {
      responseType: 'text',
    });
  }

  getCtmOutput(job_id: string, run_no = 0): Observable<string> {
    return this.http.get(
      this.url(`/jobs/${encodeURIComponent(job_id)}/output`),
      {
        params: new HttpParams().set('run_no', run_no),
        responseType: 'text',
      },
    );
  }

  getHostLog(job_id: string): Observable<string> {
    return this.http.get(
      this.url(`/jobs/${encodeURIComponent(job_id)}/host-log`),
      { responseType: 'text' },
    );
  }

  getHostOutput(job_id: string): Observable<string> {
    return this.http.get(
      this.url(`/jobs/${encodeURIComponent(job_id)}/host-output`),
      { responseType: 'text' },
    );
  }

  getWaitingInfo(job_id: string): Observable<WaitingInfo> {
    return this.http.get<WaitingInfo>(
      this.url(`/jobs/${encodeURIComponent(job_id)}/waiting-info`),
    );
  }

  getStatistics(job_id: string): Observable<JobStatistics> {
    return this.http.get<JobStatistics>(
      this.url(`/jobs/${encodeURIComponent(job_id)}/statistics`),
    );
  }

  getSqlInfo(job_id: string): Observable<SqlInfo> {
    return this.http.get<SqlInfo>(
      this.url(`/jobs/${encodeURIComponent(job_id)}/sql-id`),
    );
  }

  getLiveJobId(
    job_name: string,
    application: JobSource,
  ): Observable<{ job_id: string; status: string }> {
    return this.http.get<{ job_id: string; status: string }>(
      this.url(`/jobs/${encodeURIComponent(job_name)}/live-id`),
      { params: new HttpParams().set('application', application) },
    );
  }

  runAction(job_id: string, action: JobAction): Observable<any> {
    return this.http.post(
      this.url(`/jobs/${encodeURIComponent(job_id)}/action`),
      { action },
    );
  }

  // ── Chat ──────────────────────────────────────────────────────────────

  jobChat(
    job_id: string,
    messages: ChatMessage[],
    context: Record<string, unknown>,
  ): Observable<{ reply: string }> {
    return this.http.post<{ reply: string }>(
      this.url(`/jobs/${encodeURIComponent(job_id)}/chat`),
      { messages, context },
    );
  }

  aiChat(
    question: string,
    application: JobSource | null,
    history: ChatMessage[],
  ): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(this.url('/chat'), {
      question,
      application,
      history,
    });
  }
}
