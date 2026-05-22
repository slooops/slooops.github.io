import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  HostBinding,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
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

@Component({
  selector: 'app-caseiq-incident-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './caseiq-incident-detail.component.html',
  styleUrls: ['./caseiq-incident-detail.component.css'],
})
export class CaseiqIncidentDetailComponent implements OnInit, OnChanges {
  @HostBinding('class.dark-theme') get darkThemeClass() {
    return this.themeService.isDarkMode;
  }

  @Input() incidentNumber: string = '';
  @Output() back = new EventEmitter<void>();

  isLoading = false;
  error: string | null = null;
  incident: any = null;

  activeTab: 'pipeline' | 'notifications' = 'pipeline';
  pipelineSteps: PipelineStep[] = [];
  notifications: NotificationEvent[] = [];

  constructor(
    private httpClient: HttpClient,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    if (this.incidentNumber) {
      this.fetchIncidentDetail();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['incidentNumber'] && !changes['incidentNumber'].firstChange) {
      this.fetchIncidentDetail();
    }
  }

  goBack(): void {
    this.back.emit();
  }

  fetchIncidentDetail(): void {
    if (!this.incidentNumber) return;
    this.isLoading = true;
    this.error = null;

    this.httpClient
      .get<any>(`/api/caseiq-supervisor/incidents/${this.incidentNumber}`)
      .subscribe({
        next: (data) => {
          this.incident = data;
          this.parsePipeline(data);
          this.parseNotifications(data);
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load incident details.';
          this.isLoading = false;
        },
      });
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
