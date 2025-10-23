import {
  Component,
  Input,
  ViewChild,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  HostListener,
} from '@angular/core';
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

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Filter properties
  searchTerm: string = '';
  showFiltersDropdown: boolean = false;
  activeFilters: FilterTag[] = [];

  // Dummy filter options (can be made dynamic based on data)
  filterOptions = [
    {
      id: 'priority',
      label: 'Priority',
      values: ['High Priority', 'Medium Priority', 'Low Priority'],
    },
    {
      id: 'status',
      label: 'Status',
      values: ['Open', 'In Progress', 'Closed', 'Pending'],
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
    return key.replace(/_/g, ' ');
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
  }

  isFilterDisabled(filterId: string, value: string): boolean {
    const isActive = this.isFilterActive(filterId, value);
    return !isActive && this.activeFilters.length >= 3;
  }

  removeFilter(filterId: string): void {
    this.activeFilters = this.activeFilters.filter((f) => f.id !== filterId);
  }

  clearAllFilters(): void {
    this.activeFilters = [];
    this.searchTerm = '';
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
    if (column === 'Category') {
      return element['Category match'];
    } else if (column === 'Core issue') {
      return element['Core issue match'];
    }
    return null;
  }

  // Method to filter out match columns from displayed columns
  get filteredColumns(): string[] {
    return this.displayedColumns.filter(
      (column) =>
        !column.includes('match') &&
        column !== 'Category match' &&
        column !== 'Core issue match'
    );
  }
}
