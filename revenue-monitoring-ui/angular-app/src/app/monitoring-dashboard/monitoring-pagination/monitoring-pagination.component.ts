import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MonitoringPageChangeEvent {
  pageIndex: number;
  pageSize: number;
}

@Component({
  selector: 'app-monitoring-pagination',
  templateUrl: './monitoring-pagination.component.html',
  styleUrls: ['./monitoring-pagination.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class MonitoringPaginationComponent {
  @Input() pageIndex: number = 0;
  @Input() pageSize: number = 20;
  @Input() totalItems: number = 0;
  @Input() pageSizeOptions: number[] = [10, 20, 50, 100];
  @Input() showPageSizeSelector: boolean = true;
  @Input() showItemCount: boolean = true;

  @Output() pageChange = new EventEmitter<MonitoringPageChangeEvent>();

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get startItem(): number {
    return this.totalItems === 0 ? 0 : this.pageIndex * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min((this.pageIndex + 1) * this.pageSize, this.totalItems);
  }

  get hasPrevious(): boolean {
    return this.pageIndex > 0;
  }

  get hasNext(): boolean {
    return this.pageIndex < this.totalPages - 1;
  }

  onPrevious(): void {
    if (this.hasPrevious) {
      this.pageChange.emit({
        pageIndex: this.pageIndex - 1,
        pageSize: this.pageSize,
      });
    }
  }

  onNext(): void {
    if (this.hasNext) {
      this.pageChange.emit({
        pageIndex: this.pageIndex + 1,
        pageSize: this.pageSize,
      });
    }
  }

  onPageSizeChange(event: Event): void {
    const newPageSize = parseInt((event.target as HTMLSelectElement).value, 10);
    this.pageChange.emit({ pageIndex: 0, pageSize: newPageSize });
  }
}
