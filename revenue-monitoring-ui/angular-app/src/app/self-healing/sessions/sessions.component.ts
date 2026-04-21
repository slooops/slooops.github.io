import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TextInputComponent } from '../../ui/atoms/text-input/text-input.component';
import { MultiSelectDropdownComponent } from '../../ui/atoms/multi-select-dropdown/multi-select-dropdown.component';
import { PaginationComponent } from '../../ui/atoms/pagination/pagination.component';
import { SelectOption, PageChangeEvent } from '../../ui/types/common.types';

interface SessionRecord {
  session_id: string;
  run_id: number;
  enrichment_id: string | null;
  upstream_team: string | null;
  upstream_contact: string;
  session_status: string;
  first_message_at: string | null;
  last_activity_at: string | null;
  resolved_at: string | null;
  total_response_sec: number | null;
  follow_up_count: number;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [
    CommonModule,
    TextInputComponent,
    MultiSelectDropdownComponent,
    PaginationComponent,
  ],
  templateUrl: './sessions.component.html',
  styleUrls: ['./sessions.component.css'],
})
export class SessionsComponent implements OnInit {
  private readonly API_URL = 'https://i2c-aria-dev.cisco.com/api/sessions';

  searchQuery = '';
  selectedStatuses: string[] = [];
  selectedContacts: string[] = [];
  isLoading = false;

  statusOptions: SelectOption[] = [];
  contactOptions: SelectOption[] = [];

  sessions: SessionRecord[] = [];
  allFetchedRecords: SessionRecord[] = [];
  currentPage = 1;
  totalPages = 1;
  totalSessions = 0;
  pageSize = 25;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchFilterOptions();
    this.fetchSessions();
  }

  private fetchFilterOptions(): void {
    this.http
      .get<{
        data: SessionRecord[];
        meta: any;
      }>(this.API_URL)
      .subscribe({
        next: (res) => {
          this.allFetchedRecords = res.data;
          this.statusOptions = this.buildDistinctOptions(
            res.data,
            'session_status',
          );
          this.contactOptions = this.buildDistinctOptions(
            res.data,
            'upstream_contact',
          );
        },
        error: () => {},
      });
  }

  private buildDistinctOptions(
    data: SessionRecord[],
    key: keyof SessionRecord,
  ): SelectOption[] {
    const unique = [
      ...new Set(data.map((r) => r[key]).filter(Boolean) as string[]),
    ];
    return unique.sort().map((v) => ({
      label: this.formatStatus(v),
      value: v,
    }));
  }

  fetchSessions(): void {
    this.isLoading = true;
    const url = `${this.API_URL}?page=${this.currentPage}&page_size=${this.pageSize}`;

    this.http
      .get<{
        data: SessionRecord[];
        meta: { total: number; page: number; page_size: number; pages: number };
      }>(url)
      .subscribe({
        next: (res) => {
          this.sessions = res.data;
          this.totalSessions = res.meta.total;
          this.totalPages = res.meta.pages;
          this.currentPage = res.meta.page;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to fetch sessions:', err);
          this.isLoading = false;
        },
      });
  }

  onSearchChange(value: string): void {
    this.searchQuery = value;
  }

  onStatusChange(values: string[]): void {
    this.selectedStatuses = values;
  }

  onContactChange(values: string[]): void {
    this.selectedContacts = values;
  }

  get filteredSessions(): SessionRecord[] {
    let list = this.sessions;
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.session_id?.toLowerCase().includes(q) ||
          r.upstream_contact?.toLowerCase().includes(q) ||
          r.session_status?.toLowerCase().includes(q),
      );
    }
    if (this.selectedStatuses.length > 0) {
      list = list.filter((r) =>
        this.selectedStatuses.includes(r.session_status),
      );
    }
    if (this.selectedContacts.length > 0) {
      list = list.filter((r) =>
        this.selectedContacts.includes(r.upstream_contact),
      );
    }
    return list;
  }

  onPageChange(event: PageChangeEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.fetchSessions();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'resolved':
        return 'ss__status--resolved';
      case 'awaiting_upstream':
        return 'ss__status--awaiting';
      case 'in_progress':
        return 'ss__status--progress';
      case 'closed':
        return 'ss__status--closed';
      default:
        return 'ss__status--default';
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

  truncateId(id: string): string {
    if (!id) return '—';
    return id.substring(0, 8) + '…';
  }
}
