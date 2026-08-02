import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { ProcessFlowTooltipComponent } from '../process-flow-tooltip/process-flow-tooltip.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorArrowLineDownBold } from '@ng-icons/phosphor-icons/bold';

@Component({
  selector: 'app-monitoring-filter-bar',
  templateUrl: './monitoring-filter-bar.component.html',
  styleUrls: ['./monitoring-filter-bar.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ProcessFlowTooltipComponent,
    NgIcon,
  ],
  providers: [provideIcons({ phosphorArrowLineDownBold })],
})
export class MonitoringFilterBarComponent {
  constructor(private elRef: ElementRef) {}

  @Input() title: string = '';
  @Input() showProcessFlow: boolean = false;
  @Input() processFlowTotals: any[] = [];

  // Filter form support
  @Input() searchForm: FormGroup | null = null;
  @Input() selectFilters: { formControlName: string; columnName: string }[] =
    [];
  @Input() textFilters: { formControlName: string; columnName: string }[] = [];
  @Input() filterOptions: { [key: string]: string[] } = {};
  @Input() showFilters: boolean = false;

  // Count
  @Input() totalCount: number = 0;
  @Input() filteredCount: number = 0;
  @Input() showCount: boolean = false;
  @Input() countLabel: string = 'results';

  // Action buttons
  @Input() showReset: boolean = false;
  @Input() resetDisabled: boolean = false;
  @Input() showAssignUser: boolean = false;
  @Input() assignUserDisabled: boolean = false;
  @Input() showDownload: boolean = true;

  @Output() resetClick = new EventEmitter<void>();
  @Output() assignUserClick = new EventEmitter<void>();
  @Output() downloadClick = new EventEmitter<void>();
  @Output() filterChange = new EventEmitter<void>();
  @Output() filterApply = new EventEmitter<void>();
  @Output() clearFiltersClick = new EventEmitter<void>();

  filtersExpanded = false;
  openSelectId: string | null = null;
  searchTerms: { [key: string]: string } = {};

  toggleFilters(): void {
    this.filtersExpanded = !this.filtersExpanded;
    if (!this.filtersExpanded) {
      this.openSelectId = null;
    }
  }

  toggleSelect(id: string, event: Event): void {
    event.stopPropagation();
    if (this.openSelectId === id) {
      this.openSelectId = null;
      delete this.searchTerms[id];
    } else {
      this.openSelectId = id;
    }
  }

  isSelectOpen(id: string): boolean {
    return this.openSelectId === id;
  }

  getSelectedValues(formControlName: string): string[] {
    if (!this.searchForm) return [];
    const val = this.searchForm.get(formControlName)?.value;
    return Array.isArray(val) ? val : [];
  }

  toggleOption(formControlName: string, option: string): void {
    if (!this.searchForm) return;
    const control = this.searchForm.get(formControlName);
    if (!control) return;
    const current: string[] = Array.isArray(control.value)
      ? [...control.value]
      : [];
    const idx = current.indexOf(option);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(option);
    }
    control.setValue(current);
    this.filterChange.emit();
  }

  isOptionSelected(formControlName: string, option: string): boolean {
    return this.getSelectedValues(formControlName).includes(option);
  }

  onSearchInput(formControlName: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerms[formControlName] = input.value;
  }

  getFilteredOptions(formControlName: string): string[] {
    const options = this.filterOptions[formControlName] || [];
    const term = (this.searchTerms[formControlName] || '').toLowerCase();
    if (!term) return options;
    return options.filter((opt) => opt.toLowerCase().includes(term));
  }

  clearSelect(formControlName: string): void {
    if (!this.searchForm) return;
    const control = this.searchForm.get(formControlName);
    if (!control) return;
    control.setValue([]);
    this.filterChange.emit();
  }

  getActiveFilters(): {
    formControlName: string;
    columnName: string;
    value: string;
  }[] {
    const chips: {
      formControlName: string;
      columnName: string;
      value: string;
    }[] = [];
    if (!this.searchForm) return chips;
    for (const col of this.selectFilters) {
      const values = this.getSelectedValues(col.formControlName);
      for (const v of values) {
        chips.push({
          formControlName: col.formControlName,
          columnName: col.columnName,
          value: v,
        });
      }
    }
    for (const col of this.textFilters) {
      const val = this.searchForm.get(col.formControlName)?.value;
      if (val && val.trim()) {
        chips.push({
          formControlName: col.formControlName,
          columnName: col.columnName,
          value: val,
        });
      }
    }
    return chips;
  }

  getActiveFilterCount(): number {
    return this.getActiveFilters().length;
  }

  removeFilter(chip: {
    formControlName: string;
    columnName: string;
    value: string;
  }): void {
    if (!this.searchForm) return;
    const control = this.searchForm.get(chip.formControlName);
    if (!control) return;
    if (Array.isArray(control.value)) {
      const updated = control.value.filter((v: string) => v !== chip.value);
      control.setValue(updated);
    } else {
      control.setValue('');
    }
    this.filterChange.emit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.openSelectId = null;
      if (this.filtersExpanded) {
        this.filtersExpanded = false;
      }
    }
  }

  replaceUnderscore(text: string): string {
    return text?.replace(/_/g, ' ') || '';
  }
}
