import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  HostListener,
  HostBinding,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorXBold,
  phosphorFunnelSimpleBold,
} from '@ng-icons/phosphor-icons/bold';
import {
  StackedBarChartDataPoint,
  BarChartComponent,
} from 'src/app/components/bar-chart/bar-chart.component';
import { ThemeService } from '../../providers/theme.service';

@Component({
  selector: 'app-caseiq-expand-modal',
  templateUrl: './caseiq-expand-modal.component.html',
  styleUrl: './caseiq-expand-modal.component.css',
  standalone: true,
  imports: [CommonModule, NgIcon, BarChartComponent],
  viewProviders: [provideIcons({ phosphorXBold, phosphorFunnelSimpleBold })],
})
export class CaseiqExpandModalComponent implements OnInit, OnChanges {
  @HostBinding('class.dark-theme') get darkThemeClass() {
    return this.themeService.isDarkMode;
  }

  constructor(public themeService: ThemeService) {}

  /** e.g. "OM Category" or "SM Core Issue" */
  @Input() title = '';

  /** Which chart to show */
  @Input() type: 'CATEGORY' | 'CORE_ISSUE' = 'CATEGORY';

  /** Accuracy percentages */
  @Input() categoryAccuracy: number | string = 0;
  @Input() coreIssueAccuracy: number | string = 0;

  /** Raw chart data arrays */
  @Input() categoryData: StackedBarChartDataPoint[] = [];
  @Input() coreIssueData: StackedBarChartDataPoint[] = [];

  /** Totals */
  @Input() categoryTotal = 0;
  @Input() coreIssueTotal = 0;

  /** Unique prefix for canvas IDs to avoid Chart.js collisions */
  @Input() canvasPrefix = 'expanded';

  /** Emitted when the modal should close */
  @Output() close = new EventEmitter<void>();

  // ── Filter state ──
  showCategoryFilters = false;
  showCoreIssueFilters = false;
  showCategorySelect = false;
  showCoreIssueSelect = false;

  categoryLabels: string[] = [];
  coreIssueLabels: string[] = [];
  selectedCategoryLabels = new Set<string>();
  selectedCoreIssueLabels = new Set<string>();
  filteredCategoryData: StackedBarChartDataPoint[] = [];
  filteredCoreIssueData: StackedBarChartDataPoint[] = [];

  @HostListener('document:keydown.escape')
  onEscape() {
    this.close.emit();
  }

  ngOnInit(): void {
    this.initLabels();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categoryData'] || changes['coreIssueData']) {
      this.initLabels();
    }
  }

  private initLabels(): void {
    if (Array.isArray(this.categoryData)) {
      this.categoryLabels = this.categoryData
        .map((d) => d.label)
        .sort((a, b) => a.localeCompare(b));
      this.filteredCategoryData = this.categoryData;
    }
    if (Array.isArray(this.coreIssueData)) {
      this.coreIssueLabels = this.coreIssueData
        .map((d) => d.label)
        .sort((a, b) => a.localeCompare(b));
      this.filteredCoreIssueData = this.coreIssueData;
    }
  }

  // ── Category filter actions ──
  toggleCategoryLabel(label: string): void {
    if (this.selectedCategoryLabels.has(label)) {
      this.selectedCategoryLabels.delete(label);
    } else {
      this.selectedCategoryLabels.add(label);
    }
    this.applyCategoryFilter();
  }

  clearCategorySelection(event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedCategoryLabels.clear();
    this.applyCategoryFilter();
  }

  private applyCategoryFilter(): void {
    this.filteredCategoryData = this.selectedCategoryLabels.size
      ? this.categoryData.filter((d) =>
          this.selectedCategoryLabels.has(d.label),
        )
      : this.categoryData;
  }

  // ── Core Issue filter actions ──
  toggleCoreIssueLabel(label: string): void {
    if (this.selectedCoreIssueLabels.has(label)) {
      this.selectedCoreIssueLabels.delete(label);
    } else {
      this.selectedCoreIssueLabels.add(label);
    }
    this.applyCoreIssueFilter();
  }

  clearCoreIssueSelection(event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedCoreIssueLabels.clear();
    this.applyCoreIssueFilter();
  }

  private applyCoreIssueFilter(): void {
    this.filteredCoreIssueData = this.selectedCoreIssueLabels.size
      ? this.coreIssueData.filter((d) =>
          this.selectedCoreIssueLabels.has(d.label),
        )
      : this.coreIssueData;
  }
}
