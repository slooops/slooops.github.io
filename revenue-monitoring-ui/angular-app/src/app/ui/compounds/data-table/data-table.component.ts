import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ColumnConfig, PageChangeEvent } from '../../types/common.types';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css'],
})
export class DataTableComponent {
  @Input() columns: ColumnConfig[] = [];
  @Input() rows: any[] = [];
  @Input() enableGlobalSearch: boolean = false;
  @Input() pageSizeOptions: number[] = [25, 50, 100];
  @Input() editableRow: any | null = null;
  @Input() isLoading: boolean = false;
  @Input() validationErrors: { [key: string]: string } = {};

  @Output() rowClick = new EventEmitter<any>();
  @Output() filterChange = new EventEmitter<{
    column: string;
    value: string;
  }>();
  @Output() saveRow = new EventEmitter<any>();
  @Output() cancelEdit = new EventEmitter<void>();
  @Output() enabledFlagChange = new EventEmitter<{
    row: any;
    enabled: boolean;
  }>();

  searchTerm: string = '';
  filteredRows: any[] = [];
  paginatedRows: any[] = [];
  pageIndex: number = 0;
  pageSize: number = 25;
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' | '' = '';

  ngOnInit(): void {
    this.applyFilters();
  }

  ngOnChanges(): void {
    this.applyFilters();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.pageIndex = 0;
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.rows];

    // Apply global search
    if (this.searchTerm && this.enableGlobalSearch) {
      const lowerSearch = this.searchTerm.toLowerCase();
      filtered = filtered.filter((row) => {
        return this.columns.some((col) => {
          const value = row[col.key];
          return value?.toString().toLowerCase().includes(lowerSearch);
        });
      });
    }

    // Apply sorting
    if (this.sortColumn) {
      filtered.sort((a, b) => {
        const aVal = a[this.sortColumn];
        const bVal = b[this.sortColumn];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return this.sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    this.filteredRows = filtered;
    this.updatePagination();
  }

  updatePagination(): void {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedRows = this.filteredRows.slice(start, end);
  }

  onPageChange(event: PageChangeEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagination();
  }

  onRowClick(row: any): void {
    this.rowClick.emit(row);
  }

  onSort(column: ColumnConfig): void {
    if (!column.isSortable) return;

    if (this.sortColumn === column.key) {
      this.sortDirection =
        this.sortDirection === 'asc'
          ? 'desc'
          : this.sortDirection === 'desc'
          ? ''
          : 'asc';
    } else {
      this.sortColumn = column.key;
      this.sortDirection = 'asc';
    }

    if (!this.sortDirection) {
      this.sortColumn = '';
    }

    this.applyFilters();
  }

  onEditableRowChange(key: string, value: any): void {
    if (this.editableRow) {
      this.editableRow[key] = value;
    }
  }

  onSaveRow(): void {
    if (this.editableRow) {
      this.saveRow.emit(this.editableRow);
    }
  }

  onCancelEdit(): void {
    this.cancelEdit.emit();
  }

  get shimmerRows(): number[] {
    // Return an array to create 5 shimmer rows
    return Array(5).fill(0);
  }

  /**
   * Check if a field has a validation error
   */
  hasError(fieldKey: string): boolean {
    return !!this.validationErrors[fieldKey];
  }

  /**
   * Get the error message for a field
   */
  getErrorMessage(fieldKey: string): string {
    return this.validationErrors[fieldKey] || '';
  }

  onToggleEnabled(row: any, checked: boolean): void {
    this.enabledFlagChange.emit({ row, enabled: checked });
  }
}
