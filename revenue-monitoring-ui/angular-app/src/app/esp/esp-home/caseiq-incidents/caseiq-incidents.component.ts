import {
  Component,
  HostBinding,
  OnInit,
  OnDestroy,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ThemeService } from 'src/app/providers/theme.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { takeUntil } from 'rxjs';

export interface Incident {
  [key: string]: any;
}

@Component({
  selector: 'app-caseiq-incidents',
  templateUrl: './caseiq-incidents.component.html',
  styleUrl: './caseiq-incidents.component.css',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DestroyManager],
})
export class CaseiqIncidentsComponent implements OnInit, OnChanges {
  @HostBinding('class.dark-theme') get darkThemeClass() {
    return this.themeService.isDarkMode;
  }

  @Input() teamFilter: string = '';

  private readonly API_URL = '/api/caseiq-supervisor/incidents';

  incidents: Incident[] = [];
  filteredIncidents: Incident[] = [];
  displayedColumns: string[] = [];
  isLoading = true;
  errorMessage = '';
  searchTerm = '';

  // Pagination
  currentPage = 1;
  pageSize = 25;
  totalPages = 1;

  constructor(
    private http: HttpClient,
    public themeService: ThemeService,
    private destroyManager: DestroyManager,
  ) {}

  ngOnInit(): void {
    this.loadIncidents();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['teamFilter'] && !changes['teamFilter'].firstChange) {
      this.applyFilter();
    }
  }

  loadIncidents(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http
      .get<Incident[]>(this.API_URL)
      .pipe(takeUntil(this.destroyManager.destroyObservable))
      .subscribe({
        next: (data) => {
          this.incidents = Array.isArray(data) ? data : [];
          if (this.incidents.length > 0) {
            this.displayedColumns = Object.keys(this.incidents[0]);
          }
          this.applyFilter();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading incidents:', err);
          this.errorMessage =
            'Failed to load incidents. Please try again later.';
          this.isLoading = false;
        },
      });
  }

  applyFilter(): void {
    let result = [...this.incidents];

    // Filter by team name if specified
    if (this.teamFilter) {
      result = result.filter(
        (row) =>
          String(row['team_name'] ?? '').toLowerCase() ===
          this.teamFilter.toLowerCase(),
      );
    }

    // Filter by search term
    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter((row) =>
        Object.values(row).some((val) =>
          String(val ?? '')
            .toLowerCase()
            .includes(term),
        ),
      );
    }

    this.filteredIncidents = result;
    this.currentPage = 1;
    this.totalPages =
      Math.ceil(this.filteredIncidents.length / this.pageSize) || 1;
  }

  get paginatedIncidents(): Incident[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredIncidents.slice(start, start + this.pageSize);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  formatHeader(col: string): string {
    return col
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
