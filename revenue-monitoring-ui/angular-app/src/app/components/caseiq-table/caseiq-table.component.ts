import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  AfterViewInit,
  OnChanges,
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
export class CaseiqTableComponent implements AfterViewInit, OnChanges {
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
      id: 'cancelMatch',
      label: 'Cancel',
      values: ['Y', 'N'],
    },
  ];

  ngAfterViewInit() {
    // Only setup if we have data, otherwise wait for ngOnChanges
    if (this.dataSource?.data?.length > 0) {
      this.setupPaginator();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Setup paginator when data arrives or pagination settings change
    if (
      (changes['dataSource'] || changes['totalRecords']) &&
      this.dataSource?.data?.length > 0
    ) {
      // Capture original data when first set or when input dataSource changes
      if (changes['dataSource']) {
        this.originalData = this.dataSource.data
          ? [...this.dataSource.data]
          : [];
      }
      // Use setTimeout to ensure the DOM has updated with the new data
      setTimeout(() => {
        this.setupPaginator();
      }, 0);
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

    this.dataSource.paginator = this.paginator;
    // Force a refresh of the table
    this.dataSource._updateChangeSubscription();
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
    const data = this.dataSource.data;
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
        } else {
          console.warn('Upload failed or returned error:', result);
        }
      } else {
        console.log('Upload dialog closed without an upload action');
      }
    });
  }

  // Filter methods
  toggleFiltersDropdown(event: Event): void {
    event.stopPropagation(); // Prevent the document click listener from firing
    this.showFiltersDropdown = !this.showFiltersDropdown;
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
      if (this.activeFilters.length >= 3) {
        return; // Don't add more than 3 filters
      }

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
    const isActive = this.isFilterActive(filterId, value);
    return !isActive && this.activeFilters.length >= 3;
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

  // Determine if both Y filters are selected (Category Match Y and Core Issue Match Y)
  private bothYSelected(): boolean {
    const hasCatY = this.activeFilters.some(
      (f) => f.filterId === 'categoryMatch' && f.value === 'Y'
    );
    const hasCoreY = this.activeFilters.some(
      (f) => f.filterId === 'coreIssueMatch' && f.value === 'Y'
    );
    return hasCatY && hasCoreY;
  }

  // Apply filtering logic based on active filters (client-side) except when both Y selected
  private applyFilters(): void {
    if (!this.dataSource) return;

    // Capture original data lazily if not yet stored
    if (this.originalData.length === 0 && this.dataSource.data?.length) {
      this.originalData = [...this.dataSource.data];
    }

    // Restore original when no filters
    if (this.activeFilters.length === 0) {
      this.dataSource.data = [...this.originalData];
      this.dataSource._updateChangeSubscription();
      if (this.enablePagination && this.paginator) {
        this.paginator.length = this.dataSource.data.length;
        this.paginator.firstPage();
      }
      return;
    }

    // When both Y selected, emit event so parent can fetch backend data; do not modify original baseline
    if (this.bothYSelected()) {
      this.bothYRequested.emit();
      return;
    }

    // Build active value maps per filterId
    const categoryValues = this.activeFilters
      .filter((f) => f.filterId === 'categoryMatch')
      .map((f) => f.value);
    const coreIssueValues = this.activeFilters
      .filter((f) => f.filterId === 'coreIssueMatch')
      .map((f) => f.value);
    const cancelValues = this.activeFilters
      .filter((f) => f.filterId === 'cancelMatch')
      .map((f) => f.value);

    const categoryHasSingle = categoryValues.length === 1;
    const coreIssueHasSingle = coreIssueValues.length === 1;
    const cancelHasSingle = cancelValues.length === 1;

    // Filtering function
    const filtered = this.originalData.filter((row) => {
      // CATEGORY_MATCH and CORE_ISSUE_MATCH can be 'Y', 'N', or null
      const catMatch = (row['CATEGORY_MATCH'] ?? '').toString().trim();
      const coreMatch = (row['CORE_ISSUE_MATCH'] ?? '').toString().trim();

      // Category filter evaluation
      let categoryOk = true;
      if (categoryHasSingle) {
        const target = categoryValues[0];
        if (target === 'Y') {
          categoryOk = catMatch === 'Y';
        } else if (target === 'N') {
          // Treat N as anything not Y (includes 'N' or null/empty)
          categoryOk = catMatch !== 'Y';
        }
      }

      // Core Issue filter evaluation
      let coreIssueOk = true;
      if (coreIssueHasSingle) {
        const target = coreIssueValues[0];
        if (target === 'Y') {
          coreIssueOk = coreMatch === 'Y';
        } else if (target === 'N') {
          coreIssueOk = coreMatch !== 'Y';
        }
      }

      // Cancel filter evaluation (assumes CANCEL column or CANCEL_MATCH field exists; treat N as not Y)
      let cancelOk = true;
      if (cancelHasSingle) {
        const cancelField = (row['CANCEL'] || row['CANCEL_MATCH'] || '')
          .toString()
          .trim();
        const target = cancelValues[0];
        if (target === 'Y') {
          cancelOk = cancelField === 'Y';
        } else if (target === 'N') {
          cancelOk = cancelField !== 'Y';
        }
      }

      return categoryOk && coreIssueOk && cancelOk;
    });

    this.dataSource.data = filtered;
    // Update visible counts & paginator
    if (this.enablePagination && this.paginator) {
      this.paginator.length = filtered.length;
      this.paginator.firstPage();
    }
    this.dataSource._updateChangeSubscription();
  }

  // Allow parent to externally set data (e.g., backend both-Y fetch) without overwriting original baseline unless requested
  public setExternalData(data: any[], replaceOriginal: boolean = false) {
    if (replaceOriginal || this.originalData.length === 0) {
      this.originalData = [...data];
    }
    this.dataSource.data = data ? [...data] : [];
    if (this.enablePagination && this.paginator) {
      this.paginator.length = this.dataSource.data.length;
      this.paginator.firstPage();
    }
    this.dataSource._updateChangeSubscription();
  }
}
