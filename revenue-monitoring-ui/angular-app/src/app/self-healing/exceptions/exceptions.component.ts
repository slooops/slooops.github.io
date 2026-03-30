import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextInputComponent } from '../../ui/atoms/text-input/text-input.component';
import { MultiSelectDropdownComponent } from '../../ui/atoms/multi-select-dropdown/multi-select-dropdown.component';
import { SelectOption } from '../../ui/types/common.types';

interface ExceptionCard {
  id: string;
  timeAgo: string;
  title: string;
  tags: { label: string; type: 'agentic' | 'auto-fix' }[];
  impactLevel: string;
  impactClass: string;
}

@Component({
  selector: 'app-exceptions',
  standalone: true,
  imports: [CommonModule, TextInputComponent, MultiSelectDropdownComponent],
  templateUrl: './exceptions.component.html',
  styleUrls: ['./exceptions.component.css'],
})
export class ExceptionsComponent {
  @Output() viewException = new EventEmitter<string>();

  searchQuery = '';
  selectedCategories: string[] = [];
  selectedStatuses: string[] = [];

  categoryOptions: SelectOption[] = [
    { label: 'Billing', value: 'Billing' },
    { label: 'Provisioning', value: 'Provisioning' },
    { label: 'Security', value: 'Security' },
  ];

  statusOptions: SelectOption[] = [
    { label: 'Pending', value: 'Pending' },
    { label: 'Resolved', value: 'Resolved' },
    { label: 'Ignored', value: 'Ignored' },
  ];

  onSearchChange(value: string): void {
    this.searchQuery = value;
  }

  onCategoryChange(values: string[]): void {
    this.selectedCategories = values;
  }

  onStatusChange(values: string[]): void {
    this.selectedStatuses = values;
  }

  onViewException(id: string): void {
    this.viewException.emit(id);
  }

  currentPage = 1;
  totalPages = 12;
  totalExceptions = 48;
  pageSize = 4;

  exceptions: ExceptionCard[] = [
    {
      id: 'EXC-2024-00847',
      timeAgo: '2 hours ago',
      title: 'Billing Mismatch',
      tags: [
        { label: 'AGENTIC', type: 'agentic' },
        { label: 'AUTO_FIX', type: 'auto-fix' },
      ],
      impactLevel: 'High Criticality',
      impactClass: 'impact--high',
    },
    {
      id: 'EXC-2024-00912',
      timeAgo: '4 hours ago',
      title: 'API Handshake Timeout',
      tags: [{ label: 'AGENTIC', type: 'agentic' }],
      impactLevel: 'Medium',
      impactClass: 'impact--medium',
    },
    {
      id: 'EXC-2024-01042',
      timeAgo: '6 hours ago',
      title: 'Stale Cache Policy Conflict',
      tags: [{ label: 'AUTO_FIX', type: 'auto-fix' }],
      impactLevel: 'Low',
      impactClass: 'impact--low',
    },
    {
      id: 'EXC-2024-01183',
      timeAgo: '12 hours ago',
      title: 'Redundant Token Generation',
      tags: [
        { label: 'AGENTIC', type: 'agentic' },
        { label: 'AUTO_FIX', type: 'auto-fix' },
      ],
      impactLevel: 'Medium',
      impactClass: 'impact--medium',
    },
  ];

  get showingFrom(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalExceptions);
  }

  get visiblePages(): (number | '...')[] {
    const pages: (number | '...')[] = [];
    if (this.totalPages <= 5) {
      for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    } else {
      pages.push(1, 2, 3, '...', this.totalPages);
    }
    return pages;
  }

  goToPage(page: number | '...'): void {
    if (page === '...') return;
    this.currentPage = page as number;
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }
}
