import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MultiSelectDropdownComponent } from '../../ui/atoms/multi-select-dropdown/multi-select-dropdown.component';
import { SelectOption } from '../../ui/types/common.types';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import {
  phosphorArrowLineDownBold,
  phosphorArrowLineUpBold,
} from '@ng-icons/phosphor-icons/bold';

export interface FilterConfig {
  id: string;
  label: string;
  type: 'multi-select' | 'text';
  placeholder?: string;
  options?: SelectOption[];
}

export interface ActionButtonConfig {
  id: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'icon';
  icon?: string;
  visible?: boolean;
  disabled?: boolean;
}

export interface FilterValues {
  [key: string]: string[] | string;
}

@Component({
  selector: 'app-filter-button-bar',
  templateUrl: './filter-button-bar.component.html',
  styleUrls: ['./filter-button-bar.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MultiSelectDropdownComponent,
    NgIconComponent,
  ],
  providers: [
    provideIcons({ phosphorArrowLineDownBold, phosphorArrowLineUpBold }),
  ],
})
export class FilterButtonBarComponent {
  @Input() title: string = '';
  @Input() filters: FilterConfig[] = [];
  @Input() filterValues: FilterValues = {};
  @Input() actions: ActionButtonConfig[] = [];
  @Input() totalCount: number = 0;
  @Input() filteredCount: number = 0;
  @Input() showFilterToggle: boolean = true;
  @Input() countLabel: string = 'results';

  @Output() filterChange = new EventEmitter<FilterValues>();
  @Output() filterClear = new EventEmitter<void>();
  @Output() actionClick = new EventEmitter<string>();

  filtersExpanded = false;
  textInputValues: { [key: string]: string } = {};

  constructor(private elRef: ElementRef) {}

  get selectFilters(): FilterConfig[] {
    return this.filters.filter((f) => f.type === 'multi-select');
  }

  get textFilters(): FilterConfig[] {
    return this.filters.filter((f) => f.type === 'text');
  }

  get activeFilterCount(): number {
    let count = 0;
    for (const filter of this.filters) {
      const val = this.filterValues[filter.id];
      if (Array.isArray(val) && val.length > 0) count += val.length;
      else if (typeof val === 'string' && val.trim()) count++;
    }
    return count;
  }

  get activeChips(): { filterId: string; label: string; value: string }[] {
    const chips: { filterId: string; label: string; value: string }[] = [];
    for (const filter of this.filters) {
      const val = this.filterValues[filter.id];
      if (Array.isArray(val)) {
        for (const v of val) {
          chips.push({ filterId: filter.id, label: filter.label, value: v });
        }
      } else if (typeof val === 'string' && val.trim()) {
        chips.push({ filterId: filter.id, label: filter.label, value: val });
      }
    }
    return chips;
  }

  get visibleActions(): ActionButtonConfig[] {
    return this.actions.filter((a) => a.visible !== false);
  }

  toggleFilters(): void {
    this.filtersExpanded = !this.filtersExpanded;
  }

  onSelectChange(filterId: string, values: string[]): void {
    const updated = { ...this.filterValues, [filterId]: values };
    this.filterValues = updated;
    this.filterChange.emit(updated);
  }

  onTextChange(filterId: string, value: string): void {
    this.textInputValues[filterId] = value;
    const updated = { ...this.filterValues, [filterId]: value };
    this.filterValues = updated;
    this.filterChange.emit(updated);
  }

  removeChip(chip: { filterId: string; value: string }): void {
    const val = this.filterValues[chip.filterId];
    if (Array.isArray(val)) {
      const updated = {
        ...this.filterValues,
        [chip.filterId]: val.filter((v) => v !== chip.value),
      };
      this.filterValues = updated;
      this.filterChange.emit(updated);
    } else {
      const updated = { ...this.filterValues, [chip.filterId]: '' };
      this.filterValues = updated;
      this.filterChange.emit(updated);
    }
  }

  clearAll(): void {
    this.textInputValues = {};
    this.filterClear.emit();
  }

  onActionClick(actionId: string): void {
    this.actionClick.emit(actionId);
  }

  getSelectedValues(filterId: string): string[] {
    const val = this.filterValues[filterId];
    return Array.isArray(val) ? val : [];
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.filtersExpanded = false;
    }
  }
}
