import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  AfterViewInit,
  OnChanges,
  OnInit,
  SimpleChanges,
  HostListener,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UploadScreenComponent } from 'src/app/esp/esp-home/upload-screen/upload-screen.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import * as XLSX from 'xlsx';

interface FilterTag {
  id: string;
  label: string;
  value: string;
  filterId: string;
}

@Component({
  selector: 'app-caseiq-table',
  templateUrl: './caseiq-table.component.html',
  styleUrls: ['./caseiq-table.component.css'],
})
export class CaseiqTableComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() dataSource!: MatTableDataSource<any>; // Data for the table
  @Input() displayedColumns!: string[]; // Columns to display
  @Input() exportFileName!: string; // File name for export
  @Input() extraWideColumns: string[] = []; // Columns that should be wider
  @Input() enablePagination: boolean = false; // Enable pagination
  @Input() pageSize: number = 10; // Records per page
  @Input() totalRecords: number = 0; // Total number of records
  @Input() source: string;
  @Output() uploadResult = new EventEmitter<any>();
  @Output() bothYRequested = new EventEmitter<void>();
  @Input() backendLoading: boolean = false; // Show loading overlay during backend fetch

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private dialog: MatDialog) {}

  // Filter properties
  searchTerm: string = '';
  showFiltersDropdown: boolean = false;
  activeFilters: FilterTag[] = [];
  private originalData: any[] = []; // Preserve unfiltered data
  private fullData: any[] = []; // Complete dataset including (Y,Y) rows
  // Local overlay trigger specifically after a successful upload while parent refresh is in progress
  showFetchingOverlay: boolean = false;
  // Internal multi-select dropdown state for Incident State inside filters popup
  showIncidentStateInner: boolean = false;
  showCancelPredictionInner: boolean = false;

  // Dummy filter options (can be made dynamic based on data)
  filterOptions = [
    {
      id: 'categoryMatch',
      label: 'Category Match',
      values: ['Y', 'N'],
    },
    {
      id: 'coreIssueMatch',
      label: 'Core Issue Match',
      values: ['Y', 'N'],
    },
    {
      id: 'incidentState',
      label: 'Incident State',
      values: [
        'Closed',
        'Work In Progress',
        'Awaiting Assignment',
        'Resolved',
        'Cancelled',
      ],
    },
    {
      id: 'cancelPrediction',
      label: 'Cancel Prediction',
      values: ['Recommend Cancel', 'Cancel'],
    },
  ];

  ngOnInit() {
    // Filter out (Y,Y) rows on initial load
    if (this.dataSource?.data?.length > 0) {
      this.fullData = [...this.dataSource.data];

      // Filter out (Y,Y) rows for default view
      this.originalData = this.fullData.filter((row) => {
        const catMatch = (row['CATEGORY_MATCH'] ?? '').toString().trim();
        const coreMatch = (row['CORE_ISSUE_MATCH'] ?? '').toString().trim();
        return !(catMatch === 'Y' && coreMatch === 'Y');
      });

      // Set filtered data
      this.dataSource.data = [...this.originalData];
      this.dataSource._updateChangeSubscription();
    }
  }

  ngAfterViewInit() {
    // Filter out (Y,Y) rows on initial load if data exists
    if (this.dataSource?.data?.length > 0) {
      // Store full data if not already stored
      if (this.fullData.length === 0) {
        this.fullData = [...this.dataSource.data];

        // Filter out (Y,Y) rows for default view
        this.originalData = this.fullData.filter((row) => {
          const catMatch = (row['CATEGORY_MATCH'] ?? '').toString().trim();
          const coreMatch = (row['CORE_ISSUE_MATCH'] ?? '').toString().trim();
          return !(catMatch === 'Y' && coreMatch === 'Y');
        });

        // Set filtered data
        this.dataSource.data = [...this.originalData];
        this.dataSource._updateChangeSubscription();
      }

      this.setupPaginator();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Check if we need to process data - either dataSource changed OR data length indicates new data
    const hasData = this.dataSource?.data?.length > 0;
    const shouldProcessData =
      hasData &&
      (changes['dataSource'] ||
        changes['totalRecords'] ||
        this.fullData.length === 0); // First time data arrives

    if (shouldProcessData) {
      // Always process if we have data but no fullData stored yet
      if (this.fullData.length === 0 || changes['dataSource']) {
        // Store complete dataset including (Y,Y) rows
        this.fullData = this.dataSource.data ? [...this.dataSource.data] : [];

        // Filter out (Y,Y) rows for the default view
        this.originalData = this.fullData.filter((row) => {
          const catMatch = (row['CATEGORY_MATCH'] ?? '').toString().trim();
          const coreMatch = (row['CORE_ISSUE_MATCH'] ?? '').toString().trim();
          // Exclude rows where both are 'Y'
          return !(catMatch === 'Y' && coreMatch === 'Y');
        });

        // Set the dataSource to show originalData (without Y,Y) by default
        this.dataSource.data = [...this.originalData];
        this.dataSource._updateChangeSubscription();

        // Populate dynamic Incident State filter values from FULL data
        const statesSet = new Set(
          (this.fullData || [])
            .map((r) => (r['INCIDENT_STATE'] ?? '').toString().trim())
            .filter((v) => !!v)
        );
        const incidentStateOption = this.filterOptions.find(
          (o) => o.id === 'incidentState'
        );
        if (incidentStateOption) {
          // Keep the original configured order; include 'Cancelled' if either 'Cancelled' or 'Canceled' appears.
          const hasCancelledVariant =
            statesSet.has('Cancelled') || statesSet.has('Canceled');
          incidentStateOption.values = incidentStateOption.values.filter(
            (v) => {
              if (v === 'Cancelled') return hasCancelledVariant;
              return statesSet.has(v);
            }
          );
        }
      }
      // Use setTimeout to ensure the DOM has updated with the new data
      setTimeout(() => {
        this.setupPaginator();
      }, 0);
    }

    // Sync local fetching overlay with backendLoading input if parent turns it off
    if (changes['backendLoading'] && !changes['backendLoading'].currentValue) {
      this.showFetchingOverlay = false;
    }
  }

  private setupPaginator() {
    if (
      !this.enablePagination ||
      !this.dataSource ||
      this.dataSource.data.length === 0 ||
      !this.paginator
    ) {
      return;
    }

    // Set the paginator length to match the current data length
    this.paginator.length = this.dataSource.data.length;
    this.paginator.pageIndex = 0; // Start at first page
    this.dataSource.paginator = this.paginator;

    // Force a refresh of the table
    this.dataSource._updateChangeSubscription();
  }

  /**
   * Helper method to properly update pagination when data changes
   * This ensures the paginator is in sync with the data
   */
  private updatePagination(dataLength: number) {
    if (this.enablePagination && this.paginator) {
      // Temporarily disconnect paginator to avoid issues
      this.dataSource.paginator = null;

      // Update paginator properties
      this.paginator.length = dataLength;
      this.paginator.pageIndex = 0;

      // Reconnect paginator
      this.dataSource.paginator = this.paginator;

      // Force paginator to first page
      this.paginator.firstPage();
    }
  }

  // Public method to manually trigger paginator setup from parent component
  public initializePaginator() {
    setTimeout(() => {
      this.setupPaginator();
    }, 0);
  }

  removeUnderscores(key: string): string {
    const ACRONYMS = new Set(['LLM']);
    return key
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map((w) => {
        if (!w) return w;
        if (ACRONYMS.has(w.toUpperCase())) return w.toUpperCase();
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(' ');
  }

  exportTableToExcel(): void {
    const MAX_CELL_LENGTH = 32767; // Excel cell character limit

    // Use fullData to include ALL rows including (Y,Y) combinations
    // If fullData is empty, fall back to dataSource.data
    const sourceData =
      this.fullData.length > 0 ? this.fullData : this.dataSource.data;

    // Truncate any cell values that exceed Excel's character limit
    const data = sourceData.map((row) => {
      const truncatedRow: any = {};
      Object.keys(row).forEach((key) => {
        const value = row[key];
        if (typeof value === 'string' && value.length > MAX_CELL_LENGTH) {
          // Truncate with a note that content was cut off
          truncatedRow[key] =
            value.substring(0, MAX_CELL_LENGTH - 50) +
            '\n\n[Content truncated due to Excel cell limit]';
        } else {
          truncatedRow[key] = value;
        }
      });

      // Add COMMENTS column at the end (empty by default for user input)
      truncatedRow['COMMENTS'] = '';

      return truncatedRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = {
      Sheets: { [this.exportFileName]: worksheet },
      SheetNames: [this.exportFileName],
    };
    XLSX.writeFile(workbook, `${this.exportFileName}.xlsx`);
  }

  openUploadDialog(): void {
    const dialogRef = this.dialog.open(UploadScreenComponent, {
      width: '40vw',
      maxWidth: '500px',
      panelClass: 'caseiq-upload-dialog',
      autoFocus: false,
      data: { source: this.source },
    });
    // Provide source input after creation (component has @Input source)
    if (dialogRef.componentInstance) {
      (dialogRef.componentInstance as UploadScreenComponent).source =
        this.source;
    }

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Emit result for parent listeners
        this.uploadResult.emit(result);
        if (result.success) {
          console.log('Upload succeeded:', result);
          // Future: trigger data refresh here if backend changes reflect immediately
          // Immediately show a fetching overlay to indicate background data refresh
          this.showFetchingOverlay = true;
          // Optional safety timeout: hide after 20s if parent forgets to clear backendLoading
          setTimeout(() => {
            if (!this.backendLoading) {
              this.showFetchingOverlay = false;
            }
          }, 20000);
        } else {
          console.warn('Upload failed or returned error:', result);
        }
      } else {
        console.log('Upload dialog closed without an upload action');
      }
    });
  }

  // Accessibility: handle key events inside filters dropdown
  onDropdownKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.showFiltersDropdown = false;
      (event.target as HTMLElement)?.blur();
    }
  }

  // Generic noop for template bindings if required by a11y rules
  noop() {}

  // Filter methods
  toggleFiltersDropdown(event: Event): void {
    event.stopPropagation(); // Prevent the document click listener from firing
    this.showFiltersDropdown = !this.showFiltersDropdown;
    if (!this.showFiltersDropdown) {
      this.showIncidentStateInner = false;
      this.showCancelPredictionInner = false;
    }
  }

  // Toggle inner Incident State multi-select dropdown
  toggleIncidentStateInner(event: Event) {
    event.stopPropagation();
    this.showIncidentStateInner = !this.showIncidentStateInner;
  }

  // Toggle a single incident state value (mimics checkbox add/remove)
  toggleIncidentStateValue(value: string, label: string) {
    this.addFilter('incidentState', label, value);
  }

  // Cancel Prediction inner multi-select
  toggleCancelPredictionInner(event: Event) {
    event.stopPropagation();
    this.showCancelPredictionInner = !this.showCancelPredictionInner;
  }
  toggleCancelPredictionValue(value: string, label: string) {
    this.addFilter('cancelPrediction', label, value);
  }

  addFilter(filterId: string, filterLabel: string, value: string): void {
    const newFilterId = `${filterId}-${value}`;

    // Check if filter already exists
    const existingFilterIndex = this.activeFilters.findIndex(
      (f) => f.id === newFilterId
    );

    if (existingFilterIndex > -1) {
      // Remove filter if it already exists (unchecking)
      this.activeFilters.splice(existingFilterIndex, 1);
    } else {
      // Check if we already have 3 filters
      // if (this.activeFilters.length >= 3) {
      //   return; // Don't add more than 3 filters
      // }

      // Add new filter
      const newFilter: FilterTag = {
        id: newFilterId,
        label: filterLabel,
        value: value,
        filterId: filterId,
      };
      this.activeFilters.push(newFilter);
    }

    this.applyFilters();
  }

  isFilterDisabled(filterId: string, value: string): boolean {
    // No limit on number of filters - always allow selection
    return false;
  }

  getSelectedCount(filterId: string): number {
    return this.activeFilters.filter((f) => f.filterId === filterId).length;
  }

  clearFiltersFor(filterId: string) {
    const before = this.activeFilters.length;
    this.activeFilters = this.activeFilters.filter(
      (f) => f.filterId !== filterId
    );
    if (before !== this.activeFilters.length) {
      this.applyFilters();
    }
  }

  removeFilter(filterId: string): void {
    this.activeFilters = this.activeFilters.filter((f) => f.id !== filterId);
    this.applyFilters();
  }

  clearAllFilters(): void {
    this.activeFilters = [];
    this.searchTerm = '';
    this.applyFilters();
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    // Add your search logic here
  }

  isFilterActive(filterId: string, value: string): boolean {
    return this.activeFilters.some(
      (f) => f.filterId === filterId && f.value === value
    );
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Close dropdown when clicking outside the filters container
    this.showFiltersDropdown = false;
    this.showIncidentStateInner = false;
    this.showCancelPredictionInner = false;
  }

  // Method to get match status for Category and Core issue columns
  getMatchStatus(element: any, column: string): string | null {
    if (column === 'CATEGORY') {
      return element['CATEGORY_MATCH'];
    } else if (column === 'CORE_ISSUE') {
      return element['CORE_ISSUE_MATCH'];
    }
    return null;
  }

  // Method to filter out match columns from displayed columns
  get filteredColumns(): string[] {
    return this.displayedColumns.filter(
      (column) =>
        !column.includes('MATCH') &&
        column !== 'CATEGORY_MATCH' &&
        column !== 'CORE_ISSUE_MATCH'
    );
  }

  /**
   * Apply combination-based filtering across all active filters.
   *
   * Rules:
   * - When no filters are applied: Show all rows EXCEPT (Y,Y) combinations
   * - (Y,Y) rows are ONLY shown when BOTH categoryMatch='Y' AND coreIssueMatch='Y' are explicitly selected
   * - In all other cases, (Y,Y) rows are hidden
   * - Multiple values in one filter create OR logic within that filter
   * - Multiple different filters create AND logic between filters
   *
   * Example:
   * - categoryMatch=['Y'] only → Shows (Y,N) rows, NOT (Y,Y)
   * - categoryMatch=['Y'] AND coreIssueMatch=['Y'] → Shows ONLY (Y,Y) rows
   * - categoryMatch=['Y','N'] AND coreIssueMatch=['Y'] → Shows (Y,Y) AND (N,Y) rows
   */
  private applyFilters(): void {
    if (!this.dataSource) return;

    // Initialize fullData lazily if not yet stored
    if (this.fullData.length === 0 && this.dataSource.data?.length) {
      this.fullData = [...this.dataSource.data];
      // Also initialize originalData (without Y,Y rows)
      this.originalData = this.fullData.filter((row) => {
        const catMatch = (row['CATEGORY_MATCH'] ?? '').toString().trim();
        const coreMatch = (row['CORE_ISSUE_MATCH'] ?? '').toString().trim();
        return !(catMatch === 'Y' && coreMatch === 'Y');
      });
    }

    // When no filters are active: restore originalData (excludes Y,Y rows)
    if (this.activeFilters.length === 0) {
      this.dataSource.data = [...this.originalData];
      this.dataSource._updateChangeSubscription();

      // Update pagination after data sync
      setTimeout(() => {
        this.updatePagination(this.dataSource.data.length);
      }, 0);
      return;
    }

    // Build active filter maps grouped by filterId
    const activeFiltersMap = new Map<string, Set<string>>();

    this.activeFilters.forEach((filter) => {
      if (!activeFiltersMap.has(filter.filterId)) {
        activeFiltersMap.set(filter.filterId, new Set<string>());
      }
      activeFiltersMap.get(filter.filterId)!.add(filter.value);
    });

    // Check if (Y,Y) rows should be included
    // Only include (Y,Y) rows if BOTH categoryMatch='Y' AND coreIssueMatch='Y' are selected
    const categoryHasY =
      activeFiltersMap.get('categoryMatch')?.has('Y') ?? false;
    const coreIssueHasY =
      activeFiltersMap.get('coreIssueMatch')?.has('Y') ?? false;
    const shouldIncludeYY = categoryHasY && coreIssueHasY;

    // Apply combination-based filtering
    const filtered = this.fullData.filter((row) => {
      const catMatch = (row['CATEGORY_MATCH'] ?? '').toString().trim();
      const coreMatch = (row['CORE_ISSUE_MATCH'] ?? '').toString().trim();

      // Exclude (Y,Y) rows unless explicitly allowed
      if (catMatch === 'Y' && coreMatch === 'Y' && !shouldIncludeYY) {
        return false;
      }

      // For each filter type, check if the row matches at least one of the selected values
      let matchesAllFilters = true;

      // Check categoryMatch filter
      if (activeFiltersMap.has('categoryMatch')) {
        const selectedValues = activeFiltersMap.get('categoryMatch')!;
        const rowValue = catMatch;
        let matches = false;

        for (const value of selectedValues) {
          if (value === 'Y' && rowValue === 'Y') {
            matches = true;
            break;
          } else if (value === 'N' && rowValue !== 'Y') {
            // 'N' matches anything that's not 'Y' (including empty/null)
            matches = true;
            break;
          }
        }

        if (!matches) {
          matchesAllFilters = false;
        }
      }

      // Check coreIssueMatch filter
      if (matchesAllFilters && activeFiltersMap.has('coreIssueMatch')) {
        const selectedValues = activeFiltersMap.get('coreIssueMatch')!;
        const rowValue = coreMatch;
        let matches = false;

        for (const value of selectedValues) {
          if (value === 'Y' && rowValue === 'Y') {
            matches = true;
            break;
          } else if (value === 'N' && rowValue !== 'Y') {
            matches = true;
            break;
          }
        }

        if (!matches) {
          matchesAllFilters = false;
        }
      }

      // Check incidentState filter
      if (matchesAllFilters && activeFiltersMap.has('incidentState')) {
        const selectedValues = activeFiltersMap.get('incidentState')!;
        const rowValue = (row['INCIDENT_STATE'] ?? '').toString().trim();

        // Normalize 'Canceled' to 'Cancelled' for comparison
        let normalizedRowValue = rowValue;
        if (rowValue.toLowerCase() === 'canceled') {
          normalizedRowValue = 'Cancelled';
        }

        if (!selectedValues.has(normalizedRowValue)) {
          matchesAllFilters = false;
        }
      }

      // Check cancelPrediction filter
      if (matchesAllFilters && activeFiltersMap.has('cancelPrediction')) {
        const selectedValues = activeFiltersMap.get('cancelPrediction')!;

        // Try multiple possible column names
        let rawCancelPrediction: any =
          row['Cancel Prediction'] ??
          row['Cancel prediction'] ??
          row['CANCEL_PREDICTION'];

        if (rawCancelPrediction === undefined) {
          // Fallback: case-insensitive search
          const matchKey = Object.keys(row).find(
            (k) => k.toLowerCase().replace(/_/g, ' ') === 'cancel prediction'
          );
          if (matchKey) {
            rawCancelPrediction = row[matchKey];
          }
        }

        const rowValue = (rawCancelPrediction ?? '').toString().trim();

        // Empty values don't match any selected prediction
        if (rowValue === '') {
          matchesAllFilters = false;
        } else {
          // Check if rowValue matches any selected value (case-insensitive)
          let matches = false;
          for (const value of selectedValues) {
            if (value.toLowerCase() === rowValue.toLowerCase()) {
              matches = true;
              break;
            }
          }

          if (!matches) {
            matchesAllFilters = false;
          }
        }
      }

      return matchesAllFilters;
    });

    // Update the dataSource with filtered results
    this.dataSource.data = filtered;

    // Update the table change subscription first
    this.dataSource._updateChangeSubscription();

    // Then update pagination after a micro-task to ensure data is synced
    setTimeout(() => {
      this.updatePagination(filtered.length);
    }, 0);
  }

  // Allow parent to externally set data (e.g., backend both-Y fetch) without overwriting original baseline unless requested
  public setExternalData(data: any[], replaceOriginal: boolean = false) {
    if (replaceOriginal || this.fullData.length === 0) {
      // Store complete dataset
      this.fullData = [...data];

      // Filter out (Y,Y) rows for originalData
      this.originalData = this.fullData.filter((row) => {
        const catMatch = (row['CATEGORY_MATCH'] ?? '').toString().trim();
        const coreMatch = (row['CORE_ISSUE_MATCH'] ?? '').toString().trim();
        return !(catMatch === 'Y' && coreMatch === 'Y');
      });
    }

    this.dataSource.data = data ? [...data] : [];

    // Data arrived: clear local fetching overlay
    this.showFetchingOverlay = false;

    // Update pagination with proper reset
    this.updatePagination(this.dataSource.data.length);
    this.dataSource._updateChangeSubscription();
  }
}
