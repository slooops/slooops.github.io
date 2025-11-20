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
  @Input() enableSelection: boolean = false;

  @Output() rowClick = new EventEmitter<any>();
  @Output() filterChange = new EventEmitter<{
    column: string;
    value: string;
  }>();
  @Output() selectionChange = new EventEmitter<any[]>();

  searchTerm: string = '';
  filteredRows: any[] = [];
  paginatedRows: any[] = [];
  pageIndex: number = 0;
  pageSize: number = 25;
  selectedRows: Set<any> = new Set();
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

  onRowSelect(row: any, checked: boolean): void {
    if (checked) {
      this.selectedRows.add(row);
    } else {
      this.selectedRows.delete(row);
    }
    this.selectionChange.emit(Array.from(this.selectedRows));
  }

  onSelectAll(checked: boolean): void {
    if (checked) {
      this.paginatedRows.forEach((row) => this.selectedRows.add(row));
    } else {
      this.paginatedRows.forEach((row) => this.selectedRows.delete(row));
    }
    this.selectionChange.emit(Array.from(this.selectedRows));
  }

  isRowSelected(row: any): boolean {
    return this.selectedRows.has(row);
  }

  get allPageRowsSelected(): boolean {
    return (
      this.paginatedRows.length > 0 &&
      this.paginatedRows.every((row) => this.selectedRows.has(row))
    );
  }
}
