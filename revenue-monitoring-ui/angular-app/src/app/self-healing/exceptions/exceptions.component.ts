import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TextInputComponent } from '../../ui/atoms/text-input/text-input.component';
import { MultiSelectDropdownComponent } from '../../ui/atoms/multi-select-dropdown/multi-select-dropdown.component';
import { PaginationComponent } from '../../ui/atoms/pagination/pagination.component';
import { SelectOption, PageChangeEvent } from '../../ui/types/common.types';

interface RunRecord {
  run_id: number;
  config_id: number;
  record_id: string;
  id_column_type: string | null;
  category: string | null;
  core_issue_label: string | null;
  root_cause_text: string | null;
  findings_text: string | null;
  run_status: string;
  review_status: string;
  analysis_mode: string;
  agent_flow_json: string | null;
  run_created_at: string;
  session_id: string | null;
  session_status: string | null;
  upstream_contact: string | null;
  follow_up_count: number | null;
  session_created_at: string | null;
  last_activity_at: string | null;
}

@Component({
  selector: 'app-exceptions',
  standalone: true,
  imports: [
    CommonModule,
    TextInputComponent,
    MultiSelectDropdownComponent,
    PaginationComponent,
  ],
  templateUrl: './exceptions.component.html',
  styleUrls: ['./exceptions.component.css'],
})
export class ExceptionsComponent implements OnInit {
  @Output() viewException = new EventEmitter<string>();

  private readonly API_URL = 'https://i2c-aria-dev.cisco.com/api/runs/combined';

  searchQuery = '';
  selectedModes: string[] = [];
  selectedStatuses: string[] = [];
  isLoading = false;

  modeOptions: SelectOption[] = [];
  statusOptions: SelectOption[] = [];

  exceptions: RunRecord[] = [];
  allFetchedRecords: RunRecord[] = [];
  currentPage = 1;
  totalPages = 1;
  totalExceptions = 0;
  pageSize = 25;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchFilterOptions();
    this.fetchRuns();
  }

  /** Fetch all records once to extract distinct filter values */
  private fetchFilterOptions(): void {
    this.http
      .get<{
        data: RunRecord[];
        meta: any;
      }>(this.API_URL)
      .subscribe({
        next: (res) => {
          this.allFetchedRecords = res.data;
          this.modeOptions = this.buildDistinctOptions(
            res.data,
            'analysis_mode',
          );
          this.statusOptions = this.buildDistinctOptions(
            res.data,
            'run_status',
          );
        },
        error: () => {},
      });
  }

  private buildDistinctOptions(
    data: RunRecord[],
    key: keyof RunRecord,
  ): SelectOption[] {
    const unique = [
      ...new Set(data.map((r) => r[key]).filter(Boolean) as string[]),
    ];
    return unique.sort().map((v) => ({
      label: this.formatStatus(v),
      value: v,
    }));
  }

  fetchRuns(): void {
    this.isLoading = true;
    const url = `${this.API_URL}?page=${this.currentPage}&page_size=${this.pageSize}`;

    this.http
      .get<{
        data: RunRecord[];
        meta: { total: number; page: number; page_size: number; pages: number };
      }>(url)
      .subscribe({
        next: (res) => {
          this.exceptions = res.data;
          this.totalExceptions = res.meta.total;
          this.totalPages = res.meta.pages;
          this.currentPage = res.meta.page;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to fetch runs:', err);
          this.isLoading = false;
        },
      });
  }

  onSearchChange(value: string): void {
    this.searchQuery = value;
  }

  onModeChange(values: string[]): void {
    this.selectedModes = values;
  }

  onStatusChange(values: string[]): void {
    this.selectedStatuses = values;
  }

  onViewException(id: string): void {
    this.viewException.emit(id);
  }

  get filteredExceptions(): RunRecord[] {
    let list = this.exceptions;
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.record_id?.toLowerCase().includes(q) ||
          r.category?.toLowerCase().includes(q) ||
          r.run_status?.toLowerCase().includes(q) ||
          r.review_status?.toLowerCase().includes(q),
      );
    }
    if (this.selectedModes.length > 0) {
      list = list.filter((r) =>
        this.selectedModes.some(
          (m) => r.analysis_mode?.toUpperCase() === m.toUpperCase(),
        ),
      );
    }
    if (this.selectedStatuses.length > 0) {
      list = list.filter((r) => this.selectedStatuses.includes(r.run_status));
    }
    return list;
  }

  onPageChange(event: PageChangeEvent): void {
    this.currentPage = event.pageIndex + 1; // API is 1-based
    this.pageSize = event.pageSize;
    this.fetchRuns();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'eq__status--completed';
      case 'running':
        return 'eq__status--running';
      case 'failed':
        return 'eq__status--failed';
      default:
        return 'eq__status--default';
    }
  }

  getReviewClass(status: string): string {
    switch (status) {
      case 'reviewed':
        return 'eq__review--reviewed';
      case 'pending_review':
        return 'eq__review--pending';
      default:
        return 'eq__review--default';
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatStatus(status: string): string {
    if (!status) return '—';
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  formatDateShort(dateStr: string | null): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }
}
