import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageChangeEvent, SelectOption } from '../../types/common.types';
import { SelectDropdownComponent } from '../select-dropdown/select-dropdown.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css'],
  standalone: true,
  imports: [CommonModule, SelectDropdownComponent, ButtonComponent],
})
export class PaginationComponent {
  @Input() pageIndex: number = 0;
  @Input() pageSize: number = 25;
  @Input() totalItems: number = 0;
  @Input() pageSizeOptions: number[] = [10, 25, 50, 100];

  @Output() pageChange = new EventEmitter<PageChangeEvent>();

  get pageSizeSelectOptions(): SelectOption[] {
    return this.pageSizeOptions.map((size) => ({
      label: `${size} per page`,
      value: size.toString(),
    }));
  }

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

  onPageSizeSelectChange(value: string): void {
    const newPageSize = parseInt(value, 10);
    this.pageChange.emit({ pageIndex: 0, pageSize: newPageSize });
  }
}
