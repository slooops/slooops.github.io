import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
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

  allRecords: RunRecord[] = [];
  currentPage = 1;
  pageSize = 25;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchAllRuns();
  }

  private fetchAllRuns(): void {
    this.isLoading = true;
    // First call to get page 1 and total pages
    this.http
      .get<{
        data: RunRecord[];
        meta: { total: number; page: number; page_size: number; pages: number };
      }>(this.API_URL)
      .subscribe({
        next: (firstRes) => {
          const totalPages = firstRes.meta.pages;

          if (totalPages <= 1) {
            // Only one page, we're done
            this.allRecords = firstRes.data;
            this.buildFiltersAndFinish();
            return;
          }

          // Fetch remaining pages (2..totalPages) in parallel
          const pageRequests = [];
          for (let p = 2; p <= totalPages; p++) {
            pageRequests.push(
              this.http.get<{ data: RunRecord[]; meta: any }>(this.API_URL, {
                params: { page: p.toString() },
              }),
            );
          }

          forkJoin(pageRequests).subscribe({
            next: (responses) => {
              this.allRecords = [
                ...firstRes.data,
                ...responses.flatMap((r) => r.data),
              ];
              this.buildFiltersAndFinish();
            },
            error: (err) => {
              console.error('Failed to fetch remaining pages:', err);
              // Fall back to just page 1
              this.allRecords = firstRes.data;
              this.buildFiltersAndFinish();
            },
          });
        },
        error: (err) => {
          console.error('Failed to fetch runs:', err);
          this.isLoading = false;
        },
      });
  }

  private buildFiltersAndFinish(): void {
    this.modeOptions = this.buildDistinctOptions(
      this.allRecords,
      'analysis_mode',
    );
    this.statusOptions = this.buildDistinctOptions(
      this.allRecords,
      'run_status',
    );
    this.currentPage = 1;
    this.isLoading = false;
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

  onSearchChange(value: string): void {
    this.searchQuery = value;
    this.currentPage = 1;
  }

  onModeChange(values: string[]): void {
    this.selectedModes = values;
    this.currentPage = 1;
  }

  onStatusChange(values: string[]): void {
    this.selectedStatuses = values;
    this.currentPage = 1;
  }

  onViewException(id: string): void {
    this.viewException.emit(id);
  }

  get filteredExceptions(): RunRecord[] {
    let list = this.allRecords;
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

  get totalExceptions(): number {
    return this.filteredExceptions.length;
  }

  get paginatedExceptions(): RunRecord[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredExceptions.slice(start, start + this.pageSize);
  }

  onPageChange(event: PageChangeEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'eq__status--completed';
      case 'RESOLVED':
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
