import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  HostBinding,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../providers/theme.service';

interface PipelineStep {
  name: string;
  status: string;
  data: Record<string, any>;
  subAgentCalls?: {
    name: string;
    team: string;
    status: string;
    details?: any;
  }[];
  expanded: boolean;
}

interface NotificationEvent {
  type: string;
  description: string;
  timestamp: string;
  details?: any;
  expanded: boolean;
}

interface IncidentSummary {
  incidentNumber: string;
  team: string;
  category: string;
  coreIssue: string;
  outcome: string;
  resolutionPath: string;
  processedAt: string;
  processedEpoch: number;
  pipelineStages: number;
  runs: number;
  history: Array<{ sharedStateId: string }>;
}

@Component({
  selector: 'app-caseiq-incident-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './caseiq-incident-detail.component.html',
  styleUrls: ['./caseiq-incident-detail.component.css'],
})
export class CaseiqIncidentDetailComponent implements OnChanges {
  @HostBinding('class.dark-theme') get darkThemeClass() {
    return this.themeService.isDarkMode;
  }

  @Input() incident: IncidentSummary | null = null;
  @Input() incidentDetailData: Record<string, any> | null = null;
  @Input() backLabel: string = 'Back to Incidents';
  @Output() back = new EventEmitter<void>();

  isLoading = false;
  error: string | null = null;
  incidentNumber = '';
  incidentViewModel: any = null;

  activeTab: 'pipeline' | 'notifications' = 'pipeline';
  pipelineSteps: PipelineStep[] = [];
  notifications: NotificationEvent[] = [];

  constructor(public themeService: ThemeService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['incident'] || changes['incidentDetailData']) {
      this.hydrateDetail();
    }
  }

  goBack(): void {
    this.back.emit();
  }

  reloadDetail(): void {
    this.hydrateDetail();
  }

  private hydrateDetail(): void {
    if (this.incidentDetailData) {
      this.hydrateFromApiDetail(this.incidentDetailData);
      return;
    }

    if (!this.incident) {
      this.incidentNumber = '';
      this.incidentViewModel = null;
      this.pipelineSteps = [];
      this.notifications = [];
      return;
    }

    this.incidentNumber = this.incident.incidentNumber;
    this.incidentViewModel = {
      status: this.incident.outcome,
      team_name: this.incident.team,
      category: this.incident.category,
      core_issue: this.incident.coreIssue,
      resolution_path: this.incident.resolutionPath,
      duration: '3.6m',
      shared_state_id: `ss-${this.incident.incidentNumber.toLowerCase()}-20260616`,
      pipeline: [
        {
          name: 'Intake',
          status: 'completed',
          details: {
            owner: 'ESP Gateway',
            summary: 'Incident received and validated',
            timestamp: this.incident.processedAt,
          },
        },
        {
          name: 'Classification',
          status: 'completed',
          details: {
            category: this.incident.category,
            core_issue: this.incident.coreIssue,
            confidence: '0.96',
          },
        },
        {
          name: 'Resolution Orchestration',
          status: this.incident.outcome === 'Failed' ? 'failed' : 'completed',
          details: {
            path: this.incident.resolutionPath,
            outcome: this.incident.outcome,
          },
          sub_agent_calls: [
            {
              name: 'I2C Agent',
              team: 'I2C',
              status:
                this.incident.outcome === 'Failed' ? 'failed' : 'completed',
            },
          ],
        },
        {
          name: 'Responder',
          status:
            this.incident.outcome === 'In Progress'
              ? 'in progress'
              : 'completed',
          details: {
            notification: 'CaseIQ orchestrator update sent',
            channel: 'Webex + Email',
          },
        },
      ],
      notifications: [
        {
          type: 'ESP Update',
          description: 'Incident routing status updated in orchestrator.',
          timestamp: this.incident.processedAt,
          details: {
            incident: this.incident.incidentNumber,
            team: this.incident.team,
            outcome: this.incident.outcome,
          },
        },
        {
          type: 'Agent Action',
          description: 'I2C agent completed the assigned workflow step.',
          timestamp: this.incident.processedAt,
          details: {
            path: this.incident.resolutionPath,
            pipeline_stages: this.incident.pipelineStages,
          },
        },
      ],
    };

    this.parsePipeline(this.incidentViewModel);
    this.parseNotifications(this.incidentViewModel);
  }

  private hydrateFromApiDetail(data: Record<string, any>): void {
    const stages = this.isObject(data['stages']) ? data['stages'] : {};
    const supervisor = stages['supervisor'] || {};
    const analyzer = stages['case_analyser_agent'] || {};
    const resolutionAgent = stages['resolution_agent'] || {};
    const responderAgent = stages['responder_agent'] || {};

    this.incidentNumber =
      data['incident_number'] || this.incident?.incidentNumber || '';

    this.incidentViewModel = {
      status: data['outcome'] || this.incident?.outcome || 'Unknown',
      team_name:
        data['team_name'] ||
        supervisor['team_name'] ||
        this.incident?.team ||
        '--',
      category: analyzer['category'] || this.incident?.category || '--',
      core_issue: analyzer['core_issue'] || this.incident?.coreIssue || '--',
      resolution_path:
        data['resolution_path'] || this.incident?.resolutionPath || '--',
      duration: data['duration'] || '--',
      shared_state_id:
        data['shared_state_id'] || this.incident?.history?.[0]?.sharedStateId,
      pipeline: [
        {
          name: 'Intake',
          status: supervisor['status'] || 'completed',
          details: {
            incident: supervisor['incident_number'] || data['incident_number'],
            team: supervisor['team_name'] || data['team_name'],
            flow_type: supervisor['flow_type'] || '--',
            status: supervisor['status'] || '--',
            shared_state_id:
              supervisor['shared_state_id'] || data['shared_state_id'],
          },
        },
        {
          name: 'Analyzer',
          status: analyzer['status'] || 'completed',
          details: {
            category: analyzer['category'],
            core_issue: analyzer['core_issue'],
            llm_summary: analyzer['llm_summary'],
            context_extracted: analyzer['context_extracted'],
          },
        },
        {
          name: 'Resolution',
          status: resolutionAgent['status'] || 'completed',
          details: {
            resolution_payload: resolutionAgent['resolution'],
          },
          sub_agent_calls:
            this.normalizeResolutionSubAgentCalls(resolutionAgent),
        },
        {
          name: 'Responder',
          status: responderAgent['status'] || 'completed',
          details: {
            status: responderAgent['status'],
            responder_state:
              responderAgent['Responder_state'] ||
              responderAgent['responder_state'],
            bot_handoff: responderAgent['bot_handoff_required'],
            final_response: responderAgent['final_response'],
            actions: responderAgent['responder'],
          },
        },
      ],
      notifications: Array.isArray(data['notifications'])
        ? data['notifications']
        : [],
    };

    const knownStages = new Set([
      'intake',
      'case_analyser_agent',
      'resolution_agent',
      'responder_agent',
      'i2c_agent',
      'i2c_agent:lifecycle',
      'supervisor',
    ]);
    Object.entries(stages)
      .filter(([key]) => !knownStages.has(key))
      .forEach(([key, value]) => {
        this.incidentViewModel.pipeline.push({
          name: this.normalizeStageLabel(key),
          status:
            (this.isObject(value) &&
              (value as Record<string, any>)['status']) ||
            'completed',
          details: value,
        });
      });

    this.parsePipeline(this.incidentViewModel);
    this.parseNotifications(this.incidentViewModel);
  }

  private normalizeResolutionSubAgentCalls(
    resolutionAgent: Record<string, any>,
  ): Array<{ name: string; team: string; status: string; details?: any }> {
    const fromList = Array.isArray(resolutionAgent['sub_agent_calls'])
      ? resolutionAgent['sub_agent_calls']
      : [];

    if (fromList.length > 0) {
      return fromList.map((call: any) => {
        const responseStatus =
          call?.response?.status ||
          call?.response?.result?.task?.status?.state ||
          resolutionAgent['task_result']?.status ||
          resolutionAgent['status'] ||
          'completed';
        return {
          name:
            call?.agent_name ||
            call?.team ||
            call?.request?.params?.message?.metadata?.teamName ||
            'Sub Agent',
          team:
            call?.team ||
            call?.request?.params?.message?.metadata?.teamName ||
            resolutionAgent['team_name'] ||
            '',
          status: responseStatus,
          details: {
            request_payload: call?.request,
            response_payload: call?.response,
          },
        };
      });
    }

    const single = resolutionAgent['task_result']?.['sub_agent_call'];
    if (single && typeof single === 'object') {
      const responseStatus =
        single?.response?.status ||
        single?.response?.result?.task?.status?.state ||
        resolutionAgent['task_result']?.status ||
        resolutionAgent['status'] ||
        'completed';
      return [
        {
          name:
            single?.agent_name ||
            single?.team ||
            single?.request?.params?.message?.metadata?.teamName ||
            'Sub Agent',
          team:
            single?.team ||
            single?.request?.params?.message?.metadata?.teamName ||
            resolutionAgent['team_name'] ||
            '',
          status: responseStatus,
          details: {
            request_payload: single?.request,
            response_payload: single?.response,
          },
        },
      ];
    }

    return [];
  }

  private normalizeStageLabel(key: string): string {
    return key
      .replace(/_/g, ' ')
      .replace(/:/g, ' - ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private parsePipeline(data: any): void {
    this.pipelineSteps = [];
    const pipeline =
      data?.pipeline || data?.agentic_pipeline || data?.steps || [];

    if (Array.isArray(pipeline)) {
      this.pipelineSteps = pipeline.map((step: any) => ({
        name: step.name || step.step_name || 'Unknown',
        status: step.status || 'unknown',
        data: step.data || step.details || step,
        subAgentCalls: step.sub_agent_calls || step.subAgentCalls || null,
        expanded: false,
      }));
    } else if (typeof pipeline === 'object') {
      // Handle object-based pipeline
      Object.entries(pipeline).forEach(([key, value]: [string, any]) => {
        this.pipelineSteps.push({
          name: key,
          status: value?.status || 'unknown',
          data: value || {},
          subAgentCalls: value?.sub_agent_calls || null,
          expanded: false,
        });
      });
    }

    // If no pipeline found, try to build from top-level fields
    if (this.pipelineSteps.length === 0 && data) {
      if (data.intake) {
        this.pipelineSteps.push({
          name: 'Intake',
          status: data.intake.status || 'completed',
          data: data.intake,
          expanded: false,
        });
      }
      if (data.analyzer) {
        this.pipelineSteps.push({
          name: 'Analyzer',
          status: data.analyzer.status || 'completed',
          data: data.analyzer,
          expanded: false,
        });
      }
      if (data.resolution) {
        this.pipelineSteps.push({
          name: 'Resolution',
          status: data.resolution.status || 'completed',
          data: data.resolution,
          subAgentCalls: data.resolution.sub_agent_calls,
          expanded: false,
        });
      }
      if (data.responder) {
        this.pipelineSteps.push({
          name: 'Responder',
          status: data.responder.status || 'completed',
          data: data.responder,
          expanded: false,
        });
      }
    }
  }

  private parseNotifications(data: any): void {
    this.notifications = [];
    const events =
      data?.notifications ||
      data?.events ||
      data?.notifications_and_actions ||
      [];

    if (Array.isArray(events)) {
      this.notifications = events.map((evt: any) => ({
        type: evt.type || evt.event_type || 'Event',
        description: evt.description || evt.message || evt.summary || '',
        timestamp: evt.timestamp || evt.created_at || evt.time || '',
        details: evt.details || evt.payload || null,
        expanded: false,
      }));
    }
  }

  toggleStep(index: number): void {
    this.pipelineSteps[index].expanded = !this.pipelineSteps[index].expanded;
  }

  toggleNotification(index: number): void {
    this.notifications[index].expanded = !this.notifications[index].expanded;
  }

  expandAll(): void {
    this.pipelineSteps.forEach((s) => (s.expanded = true));
  }

  collapseAll(): void {
    this.pipelineSteps.forEach((s) => (s.expanded = false));
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'resolved':
        return 'status--success';
      case 'in_progress':
      case 'in progress':
      case 'delegated':
        return 'status--warning';
      case 'failed':
      case 'error':
        return 'status--error';
      default:
        return 'status--default';
    }
  }

  getEventTypeClass(type: string): string {
    const t = type?.toLowerCase() || '';
    if (t.includes('esp') || t.includes('update')) return 'event-type--esp';
    if (t.includes('agent') || t.includes('action')) return 'event-type--agent';
    if (t.includes('error') || t.includes('fail')) return 'event-type--error';
    return 'event-type--default';
  }

  formatTimestamp(ts: string): string {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return (
        d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) +
        ', ' +
        d.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    } catch {
      return ts;
    }
  }

  getStepFields(step: PipelineStep): { key: string; value: any }[] {
    const exclude = [
      'status',
      'name',
      'step_name',
      'sub_agent_calls',
      'subAgentCalls',
    ];
    const data = step.data || {};
    return Object.entries(data)
      .filter(
        ([k]) => !exclude.includes(k) && data[k] != null && data[k] !== '',
      )
      .map(([key, value]) => ({ key: this.formatKey(key), value }));
  }

  formatKey(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  isObject(val: any): boolean {
    return val && typeof val === 'object' && !Array.isArray(val);
  }

  isArray(val: any): boolean {
    return Array.isArray(val);
  }
}
