import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-table-header-cell',
  templateUrl: './table-header-cell.component.html',
  styleUrls: ['./table-header-cell.component.css'],
  standalone: true,
})
export class TableHeaderCellComponent {
  @Input() isSortable: boolean = false;
  @Input() sortDirection?: 'asc' | 'desc';
  @Input() align: 'left' | 'center' | 'right' = 'left';

  @Output() sort = new EventEmitter<void>();

  onSort(): void {
    if (this.isSortable) {
      this.sort.emit();
    }
  }
}
