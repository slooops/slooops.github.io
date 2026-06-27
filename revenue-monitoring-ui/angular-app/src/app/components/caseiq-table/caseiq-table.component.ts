import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  AfterViewInit,
  OnChanges,
  OnInit,
  SimpleChanges,
  HostListener,
  HostBinding,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UploadScreenComponent } from 'src/app/esp/esp-home/upload-screen/upload-screen.component';
import { MatTableDataSource } from '@angular/material/table';
import ExcelJS from 'exceljs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoadingSymbolComponent } from '../../loading-symbol/loading-symbol.component';
import { PaginationComponent } from '../../ui/atoms/pagination/pagination.component';
import { PageChangeEvent } from '../../ui';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { SupervisorIncident } from '../../esp/esp-home/caseiq-incidents/caseiq-incidents.component';
import {
  phosphorArrowLineDownBold,
  phosphorCaretDownBold,
  phosphorCaretUpBold,
  phosphorCloudArrowUpBold,
  phosphorInfoBold,
  phosphorFunnelSimpleBold,
  phosphorMagnifyingGlassBold,
} from '@ng-icons/phosphor-icons/bold';
import { ThemeService } from '../../providers/theme.service';

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
  imports: [
    CommonModule,
    FormsModule,
    MatTooltipModule,
    NgIcon,
    LoadingSymbolComponent,
    PaginationComponent,
  ],
  providers: [
    provideIcons({
      phosphorArrowLineDownBold,
      phosphorCaretDownBold,
      phosphorCaretUpBold,
      phosphorCloudArrowUpBold,
      phosphorInfoBold,
      phosphorFunnelSimpleBold,
      phosphorMagnifyingGlassBold,
    }),
  ],
  standalone: true,
})
export class CaseiqTableComponent implements OnInit, AfterViewInit, OnChanges {
  @HostBinding('class.dark-theme') get darkThemeClass() {
    return this.themeService.isDarkMode;
  }

  @Input() dataSource!: MatTableDataSource<any>; // Data for the table
  @Input() displayedColumns!: string[]; // Columns to display
  @Input() exportFileName!: string; // File name for export
  @Input() extraWideColumns: string[] = []; // Columns that should be wider
  @Input() enablePagination: boolean = false; // Enable pagination
  @Input() pageSize: number = 10; // Records per page
  @Input() totalRecords: number = 0; // Total number of records
  @Input() source: string;
  @Input() tableTitle: string = '';
  @Input() tableTitleTooltip: string = '';
  @Input() showToolbar: boolean = true;
  @Input() showNavArrows: boolean = false;
  @Input() navPrevDisabled: boolean = false;
  @Input() navNextDisabled: boolean = false;
  @Output() navPrev = new EventEmitter<void>();
  @Output() navNext = new EventEmitter<void>();
  @Output() uploadResult = new EventEmitter<any>();
  @Output() bothYRequested = new EventEmitter<void>();
  @Output() cellClick = new EventEmitter<{
    column: string;
    value: any;
    row: any;
  }>();
  @Output() timelineDetailOpen = new EventEmitter<SupervisorIncident>();
  @Input() clickableColumns: string[] = [];
  @Input() backendLoading: boolean = false; // Show loading overlay during backend fetch

  currentPage: number = 0;

  constructor(
    private dialog: MatDialog,
    public themeService: ThemeService,
  ) {}

  // Filter properties
  searchTerm: string = '';
  showFiltersDropdown: boolean = false;
  activeFilters: FilterTag[] = [];
  private originalData: any[] = []; // Preserve unfiltered data
  private fullData: any[] = []; // Complete dataset including (Y,Y) rows
  private lastProcessedDataLength: number = 0; // Track when we last processed data to avoid re-processing
  // Local overlay trigger specifically after a successful upload while parent refresh is in progress
  showFetchingOverlay: boolean = false;
  // Internal multi-select dropdown state for Incident State inside filters popup
  showIncidentStateInner: boolean = false;
  showCancelPredictionInner: boolean = false;
  showImpactedServiceOfferingInner: boolean = false;
  incidentNumberSearch: string = '';

  // I2C-only expandable agent processing timeline mockup
  expandedRowId: string | null = null;
  private expandedRowIdLocked: boolean = false; // Prevent clearing expansion during initial setup
  readonly mockProcessedDate = 'Jun 12, 04:36 PM';
  readonly mockOutcomes = ['Resolved', 'Routed Out', 'Cancelled'];

  // Dummy filter options (can be made dynamic based on data)
  filterOptions = [
    {
      id: 'categoryMatch',
      label: 'Category Match',
      values: ['Y', 'N'],
    },
    {
      id: 'incidentState',
      label: 'Incident State',
      values: [
        'Closed',
        'Work In Progress',
        'Awaiting Assignment',
        'Resolved',
        'Cancelled',
      ],
    },
    {
      id: 'impactedServiceOffering',
      label: 'Impacted Service Offering',
      values: [], // Will be populated dynamically from data
    },
    {
      id: 'coreIssueMatch',
      label: 'Core Issue Match',
      values: ['Y', 'N'],
    },
    {
      id: 'cancelPrediction',
      label: 'Cancel Prediction',
      values: ['Recommend Cancel', 'Cancel'],
    },
    {
      id: 'incidentNumber',
      label: 'Incident Number',
      values: [], // Text-based search, no predefined values
    },
  ];

  ngOnInit() {
    console.log(
      'CaseIQ Table initialized with dataSource:',
      this.dataSource.data.length,
    );
    // Filter out (Y,Y) rows on initial load
    if (this.dataSource?.data?.length > 0) {
      this.lastProcessedDataLength = this.dataSource.data.length;
      this.fullData = [...this.dataSource.data];

      // Filter out (Y,Y) rows for default view
      this.originalData = this.fullData.filter((row) => {
        const catMatch = (row['CATEGORY_MATCH'] ?? '').toString().trim();
        const coreMatch = (row['CORE_ISSUE_MATCH'] ?? '').toString().trim();
        return !(catMatch === 'Y' && coreMatch === 'Y');
      });

      // Set filtered data and enforce filter state
      this.enforceCurrentFilterState();
    }
  }

  ngAfterViewInit() {
    // Filter out (Y,Y) rows on initial load if data exists
    if (this.dataSource?.data?.length > 0) {
      // Store full data if not already stored
      if (this.fullData.length === 0) {
        this.lastProcessedDataLength = this.dataSource.data.length;
        this.fullData = [...this.dataSource.data];

        // Filter out (Y,Y) rows for default view
        this.originalData = this.fullData.filter((row) => {
          const catMatch = (row['CATEGORY_MATCH'] ?? '').toString().trim();
          const coreMatch = (row['CORE_ISSUE_MATCH'] ?? '').toString().trim();
          return !(catMatch === 'Y' && coreMatch === 'Y');
        });

        // Enforce the current filter state
        this.enforceCurrentFilterState();
      }

      this.setupPaginator();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Only reprocess fullData if the actual data length changed
    const hasData = this.dataSource?.data?.length > 0;
    const dataLengthChanged =
      hasData && this.dataSource.data.length !== this.lastProcessedDataLength;

    if (dataLengthChanged || this.fullData.length === 0) {
      // Update the tracked data length
      this.lastProcessedDataLength = this.dataSource.data?.length || 0;

      // Store complete dataset including (Y,Y) rows
      this.fullData = this.dataSource.data ? [...this.dataSource.data] : [];

      // Filter out (Y,Y) rows for the default view
      this.originalData = this.fullData.filter((row) => {
        const catMatch = (row['CATEGORY_MATCH'] ?? '').toString().trim();
        const coreMatch = (row['CORE_ISSUE_MATCH'] ?? '').toString().trim();
        // Exclude rows where both are 'Y'
        return !(catMatch === 'Y' && coreMatch === 'Y');
      });

      // Populate dynamic Incident State filter values from FULL data
      const statesSet = new Set(
        (this.fullData || [])
          .map((r) => (r['INCIDENT_STATE'] ?? '').toString().trim())
          .filter((v) => !!v),
      );
      const incidentStateOption = this.filterOptions.find(
        (o) => o.id === 'incidentState',
      );
      if (incidentStateOption) {
        // Keep the original configured order; include 'Cancelled' if either 'Cancelled' or 'Canceled' appears.
        const hasCancelledVariant =
          statesSet.has('Cancelled') || statesSet.has('Canceled');
        incidentStateOption.values = incidentStateOption.values.filter((v) => {
          if (v === 'Cancelled') return hasCancelledVariant;
          return statesSet.has(v);
        });
      }

      // Populate dynamic Impacted Service Offering filter values from FULL data
      const serviceOfferingsSet = new Set(
        (this.fullData || [])
          .map((r) => (r['IMPACTED_SERVICE_OFFERING'] ?? '').toString().trim())
          .filter((v) => !!v),
      );
      const impactedServiceOfferingOption = this.filterOptions.find(
        (o) => o.id === 'impactedServiceOffering',
      );
      if (impactedServiceOfferingOption) {
        // Sort alphabetically for consistent display
        impactedServiceOfferingOption.values =
          Array.from(serviceOfferingsSet).sort();
      }
    }

    // Always enforce filter state and setup paginator to ensure display is updated
    if (hasData) {
      this.enforceCurrentFilterState();
      setTimeout(() => {
        this.setupPaginator();
      }, 0);
    }

    // Sync local fetching overlay with backendLoading input if parent turns it off
    if (changes['backendLoading'] && !changes['backendLoading'].currentValue) {
      this.showFetchingOverlay = false;
    }
  }

  get paginatedData(): any[] {
    if (!this.dataSource?.data) return [];
    if (!this.enablePagination) return this.dataSource.data;
    const start = this.currentPage * this.pageSize;
    return this.dataSource.data.slice(start, start + this.pageSize);
  }

  private setupPaginator() {
    if (
      !this.enablePagination ||
      !this.dataSource ||
      this.dataSource.data.length === 0
    ) {
      return;
    }
    this.currentPage = 0;
  }

  /**
   * Enforce the current filter state on the dataSource.
   * If no filters are active, shows originalData (without Y,Y rows).
   * If filters are active, applies the filter logic via applyFilters().
   * This method ensures the dataSource always shows the correct filtered view.
   */
  private enforceCurrentFilterState(): void {
    if (this.activeFilters.length === 0) {
      // No filters active: always show originalData (without Y,Y rows)
      this.dataSource.data = [...this.originalData];
      this.dataSource._updateChangeSubscription();
    } else {
      // Filters active: apply the filter logic
      this.applyFilters();
    }
  }

  /**
   * Helper method to properly update pagination when data changes
   * Resets to first page.
   */
  private updatePagination(dataLength: number) {
    if (this.enablePagination) {
      this.currentPage = 0;
    }
  }

  // Public method to manually trigger paginator setup from parent component
  public initializePaginator() {
    setTimeout(() => {
      this.setupPaginator();
    }, 0);
  }

  onPageChange(event: PageChangeEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    // Don't clear expansion state on pagination to preserve user interaction
    // Only clear if the user explicitly navigates away from the page
  }

  trackByRowId(row: any): string {
    // Use stable row identifier for tracking to prevent DOM recreation
    // when data is refreshed but row content is identical
    return this.getRowId(row);
  }

  removeUnderscores(key: string): string {
    const ACRONYMS = new Set(['LLM']);
    return key
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map((w) => {
        if (!w) return w;
        if (ACRONYMS.has(w.toUpperCase())) return w.toUpperCase();
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(' ');
  }

  async exportTableToExcel(): Promise<void> {
    const MAX_CELL_LENGTH = 32767; // Excel cell character limit

    // Use the current dataSource.data which contains the filtered/displayed data
    // This ensures we export what the user is actually seeing
    const sourceData = this.dataSource.data || [];

    // Truncate any cell values that exceed Excel's character limit
    const data = sourceData.map((row) => {
      const truncatedRow: any = {};
      Object.keys(row).forEach((key) => {
        const value = row[key];
        if (typeof value === 'string' && value.length > MAX_CELL_LENGTH) {
          // Truncate with a note that content was cut off
          truncatedRow[key] =
            value.substring(0, MAX_CELL_LENGTH - 50) +
            '\n\n[Content truncated due to Excel cell limit]';
        } else {
          truncatedRow[key] = value;
        }
      });

      // Add COMMENTS column at the end (empty by default for user input) only if it doesn't exist
      if (!truncatedRow.hasOwnProperty('COMMENTS')) {
        truncatedRow['COMMENTS'] = '';
      }

      return truncatedRow;
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(
      this.exportFileName.substring(0, 31),
    );

    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);
      data.forEach((row) => worksheet.addRow(headers.map((h) => row[h])));
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.exportFileName}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  openUploadDialog(): void {
    const dialogRef = this.dialog.open(UploadScreenComponent, {
      width: '40vw',
      maxWidth: '500px',
      panelClass: 'caseiq-upload-dialog',
      autoFocus: false,
      data: { source: this.source },
    });
    // Provide source input after creation (component has @Input source)
    if (dialogRef.componentInstance) {
      (dialogRef.componentInstance as UploadScreenComponent).source =
        this.source;
    }

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Emit result for parent listeners
        this.uploadResult.emit(result);
        if (result.success) {
          console.log('Upload succeeded:', result);
          // Future: trigger data refresh here if backend changes reflect immediately
          // Immediately show a fetching overlay to indicate background data refresh
          this.showFetchingOverlay = true;
          // Optional safety timeout: hide after 20s if parent forgets to clear backendLoading
          setTimeout(() => {
            if (!this.backendLoading) {
              this.showFetchingOverlay = false;
            }
          }, 20000);
        } else {
          console.warn('Upload failed or returned error:', result);
        }
      } else {
        console.log('Upload dialog closed without an upload action');
      }
    });
  }

  // Accessibility: handle key events inside filters dropdown
  onDropdownKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.showFiltersDropdown = false;
      (event.target as HTMLElement)?.blur();
    }
  }

  // Generic noop for template bindings if required by a11y rules
  noop() {}

  // Filter methods
  toggleFiltersDropdown(event: Event): void {
    event.stopPropagation(); // Prevent the document click listener from firing
    this.showFiltersDropdown = !this.showFiltersDropdown;
    if (!this.showFiltersDropdown) {
      this.showIncidentStateInner = false;
      this.showCancelPredictionInner = false;
      this.showImpactedServiceOfferingInner = false;
    }
  }

  // Toggle inner Incident State multi-select dropdown
  toggleIncidentStateInner(event: Event) {
    event.stopPropagation();
    this.showIncidentStateInner = !this.showIncidentStateInner;
  }

  // Toggle a single incident state value (mimics checkbox add/remove)
  toggleIncidentStateValue(value: string, label: string) {
    this.addFilter('incidentState', label, value);
  }

  // Cancel Prediction inner multi-select
  toggleCancelPredictionInner(event: Event) {
    event.stopPropagation();
    this.showCancelPredictionInner = !this.showCancelPredictionInner;
  }
  toggleCancelPredictionValue(value: string, label: string) {
    this.addFilter('cancelPrediction', label, value);
  }

  // Impacted Service Offering inner multi-select
  toggleImpactedServiceOfferingInner(event: Event) {
    event.stopPropagation();
    this.showImpactedServiceOfferingInner =
      !this.showImpactedServiceOfferingInner;
  }
  toggleImpactedServiceOfferingValue(value: string, label: string) {
    this.addFilter('impactedServiceOffering', label, value);
  }

  // Incident Number search handler
  onIncidentNumberSearch(value: string) {
    this.incidentNumberSearch = value.trim();

    // Remove existing incident number filter if any
    this.activeFilters = this.activeFilters.filter(
      (f) => f.filterId !== 'incidentNumber',
    );

    // Add new filter if search term is not empty
    if (this.incidentNumberSearch) {
      const newFilter: FilterTag = {
        id: `incidentNumber-${this.incidentNumberSearch}`,
        label: 'Incident Number',
        filterId: 'incidentNumber',
        value: this.incidentNumberSearch,
      };
      this.activeFilters.push(newFilter);
    }

    this.applyFilters();
  }

  addFilter(filterId: string, filterLabel: string, value: string): void {
    const newFilterId = `${filterId}-${value}`;

    // Check if filter already exists
    const existingFilterIndex = this.activeFilters.findIndex(
      (f) => f.id === newFilterId,
    );

    if (existingFilterIndex > -1) {
      // Remove filter if it already exists (unchecking)
      this.activeFilters.splice(existingFilterIndex, 1);
    } else {
      // Check if we already have 3 filters
      // if (this.activeFilters.length >= 3) {
      //   return; // Don't add more than 3 filters
      // }

      // Add new filter
      const newFilter: FilterTag = {
        id: newFilterId,
        label: filterLabel,
        value: value,
        filterId: filterId,
      };
      this.activeFilters.push(newFilter);
    }

    this.applyFilters();
  }

  isFilterDisabled(filterId: string, value: string): boolean {
    // No limit on number of filters - always allow selection
    return false;
  }

  getSelectedCount(filterId: string): number {
    return this.activeFilters.filter((f) => f.filterId === filterId).length;
  }

  clearFiltersFor(filterId: string) {
    const before = this.activeFilters.length;
    this.activeFilters = this.activeFilters.filter(
      (f) => f.filterId !== filterId,
    );
    if (before !== this.activeFilters.length) {
      this.applyFilters();
    }
  }

  removeFilter(filterId: string): void {
    this.activeFilters = this.activeFilters.filter((f) => f.id !== filterId);

    // Clear incident number search if removing that filter
    if (filterId.startsWith('incidentNumber-')) {
      this.incidentNumberSearch = '';
    }

    this.applyFilters();
  }

  clearAllFilters(): void {
    this.activeFilters = [];
    this.searchTerm = '';
    this.incidentNumberSearch = '';
    this.applyFilters();
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    // Add your search logic here
  }

  isFilterActive(filterId: string, value: string): boolean {
    return this.activeFilters.some(
      (f) => f.filterId === filterId && f.value === value,
    );
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Close dropdown when clicking outside the filters container
    this.showFiltersDropdown = false;
    this.showIncidentStateInner = false;
    this.showCancelPredictionInner = false;
    this.showImpactedServiceOfferingInner = false;
  }

  // Method to get match status for Category and Core issue columns
  getMatchStatus(element: any, column: string): string | null {
    if (column === 'CATEGORY') {
      return element['CATEGORY_MATCH'];
    } else if (column === 'CORE_ISSUE') {
      return element['CORE_ISSUE_MATCH'];
    }
    return null;
  }

  // Method to filter out match columns from displayed columns
  get filteredColumns(): string[] {
    return this.displayedColumns.filter(
      (column) =>
        !column.includes('MATCH') &&
        column !== 'CATEGORY_MATCH' &&
        column !== 'CORE_ISSUE_MATCH',
    );
  }

  get isI2CSource(): boolean {
    return (this.source ?? '').toString().trim().toLowerCase() === 'i2c';
  }

  get expandedColspan(): number {
    return this.filteredColumns.length + (this.isI2CSource ? 1 : 0);
  }

  toggleRowExpansion(row: any, rowIndex: number): void {
    const rowId = this.getRowId(row);
    this.expandedRowId = this.expandedRowId === rowId ? null : rowId;

    // Lock the expansion state briefly to prevent change detection cycles from interfering
    // during the initial render and setup
    this.expandedRowIdLocked = true;
    setTimeout(() => {
      this.expandedRowIdLocked = false;
    }, 100); // 100ms should be enough for change detection cycles to settle
  }

  isRowExpanded(row: any, rowIndex: number): boolean {
    return this.expandedRowId === this.getRowId(row);
  }

  getTimelineIncidentNumber(row: any): string {
    return this.getFirstValue(row, [
      'INCIDENT_NUMBER',
      'incident_number',
      'Incident Number',
    ]);
  }

  getTimelineSharedState(row: any): string {
    return (
      this.getFirstValue(row, [
        'SHARED_STATE',
        'shared_state',
        'Shared State',
      ]) || 'ss-20260612203311-0ee99c92'
    );
  }

  getTimelineTeam(row: any): string {
    return (
      this.getFirstValue(row, ['TEAM', 'TEAM_NAME', 'team_name']) || 'BRIM/BRM'
    );
  }

  getTimelineCategory(row: any): string {
    return this.getFirstValue(row, ['CATEGORY', 'category']) || 'NA';
  }

  getTimelineCoreIssue(row: any): string {
    return this.getFirstValue(row, ['CORE_ISSUE', 'core_issue']) || 'NA';
  }

  getTimelineResolutionPath(row: any): string {
    return (
      this.getFirstValue(row, [
        'RESOLUTION_PATH',
        'resolution_path',
        'Resolution Path',
      ]) || 'A2A: I2C Agent'
    );
  }

  getTimelineDuration(row: any): string {
    const value = this.getFirstValue(row, ['DURATION', 'duration', 'Duration']);
    return value || '3.6m';
  }

  getTimelineOutcome(row: any, rowIndex: number): string {
    const seed = this.getRowId(row);
    const hash = seed
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return this.mockOutcomes[hash % this.mockOutcomes.length];
  }

  openIncidentDetailFromTimeline(
    row: any,
    rowIndex: number,
    event?: Event,
  ): void {
    event?.stopPropagation();

    const outcome = this.getTimelineOutcome(row, rowIndex);
    const normalizedOutcome: SupervisorIncident['outcome'] =
      outcome === 'Resolved' ||
      outcome === 'Routed Out' ||
      outcome === 'Cancelled' ||
      outcome === 'Failed' ||
      outcome === 'Bot Handoff' ||
      outcome === 'In Progress'
        ? outcome
        : 'Resolved';

    this.timelineDetailOpen.emit({
      incidentNumber: this.getTimelineIncidentNumber(row) || 'INC00000000',
      team: this.getTimelineTeam(row) === 'I2C' ? 'I2C' : 'BRIM/BRM',
      category: this.getTimelineCategory(row),
      coreIssue: this.getTimelineCoreIssue(row),
      outcome: normalizedOutcome,
      resolutionPath: this.getTimelineResolutionPath(row),
      processedAt: this.mockProcessedDate,
      processedEpoch: Date.now(),
      pipelineStages: 4,
      runs: 1,
      history: [],
    });
  }

  private getRowId(row: any): string {
    // Use incident number as primary stable identifier
    const incident = this.getTimelineIncidentNumber(row);
    if (incident) {
      return incident;
    }
    // Fallback: generate stable hash from row data (incident + shared state)
    // to ensure consistent ID across re-renders, avoiding rowIndex dependency
    const sharedState = this.getTimelineSharedState(row);
    const stableKey = `${incident || 'unknown'}-${sharedState}`;
    return this.simpleHash(stableKey);
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `row-${Math.abs(hash)}`;
  }

  private getFirstValue(row: any, keys: string[]): string {
    if (!row) return '';
    for (const key of keys) {
      const value = row[key];
      if (
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ''
      ) {
        return String(value).trim();
      }
    }
    return '';
  }

  /**
   * Apply combination-based filtering across all active filters.
   *
   * Rules:
   * - When no filters are applied: Show all rows EXCEPT (Y,Y) combinations
   * - (Y,Y) rows are ONLY shown when BOTH categoryMatch='Y' AND coreIssueMatch='Y' are explicitly selected
   * - In all other cases, (Y,Y) rows are hidden
   * - Multiple values in one filter create OR logic within that filter
   * - Multiple different filters create AND logic between filters
   *
   * Example:
   * - categoryMatch=['Y'] only → Shows (Y,N) rows, NOT (Y,Y)
   * - categoryMatch=['Y'] AND coreIssueMatch=['Y'] → Shows ONLY (Y,Y) rows
   * - categoryMatch=['Y','N'] AND coreIssueMatch=['Y'] → Shows (Y,Y) AND (N,Y) rows
   */
  private applyFilters(): void {
    if (!this.dataSource) return;

    // Initialize fullData lazily if not yet stored
    if (this.fullData.length === 0 && this.dataSource.data?.length) {
      this.fullData = [...this.dataSource.data];
      // Also initialize originalData (without Y,Y rows)
      this.originalData = this.fullData.filter((row) => {
        const catMatch = (row['CATEGORY_MATCH'] ?? '').toString().trim();
        const coreMatch = (row['CORE_ISSUE_MATCH'] ?? '').toString().trim();
        return !(catMatch === 'Y' && coreMatch === 'Y');
      });
    }

    // When no filters are active: restore originalData (excludes Y,Y rows)
    if (this.activeFilters.length === 0) {
      this.enforceCurrentFilterState();
      return;
    }

    // Build active filter maps grouped by filterId
    const activeFiltersMap = new Map<string, Set<string>>();

    this.activeFilters.forEach((filter) => {
      if (!activeFiltersMap.has(filter.filterId)) {
        activeFiltersMap.set(filter.filterId, new Set<string>());
      }
      activeFiltersMap.get(filter.filterId)!.add(filter.value);
    });

    // Check if (Y,Y) rows should be included
    // Only include (Y,Y) rows if BOTH categoryMatch='Y' AND coreIssueMatch='Y' are selected
    const categoryHasY =
      activeFiltersMap.get('categoryMatch')?.has('Y') ?? false;
    const coreIssueHasY =
      activeFiltersMap.get('coreIssueMatch')?.has('Y') ?? false;
    const shouldIncludeYY = categoryHasY && coreIssueHasY;

    // Apply combination-based filtering
    const filtered = this.fullData.filter((row) => {
      const catMatch = (row['CATEGORY_MATCH'] ?? '').toString().trim();
      const coreMatch = (row['CORE_ISSUE_MATCH'] ?? '').toString().trim();

      // Exclude (Y,Y) rows unless explicitly allowed
      if (catMatch === 'Y' && coreMatch === 'Y' && !shouldIncludeYY) {
        return false;
      }

      // For each filter type, check if the row matches at least one of the selected values
      let matchesAllFilters = true;

      // Check categoryMatch filter
      if (activeFiltersMap.has('categoryMatch')) {
        const selectedValues = activeFiltersMap.get('categoryMatch')!;
        const rowValue = catMatch;
        let matches = false;

        for (const value of selectedValues) {
          if (value === 'Y' && rowValue === 'Y') {
            matches = true;
            break;
          } else if (value === 'N' && rowValue !== 'Y') {
            // 'N' matches anything that's not 'Y' (including empty/null)
            matches = true;
            break;
          }
        }

        if (!matches) {
          matchesAllFilters = false;
        }
      }

      // Check coreIssueMatch filter
      if (matchesAllFilters && activeFiltersMap.has('coreIssueMatch')) {
        const selectedValues = activeFiltersMap.get('coreIssueMatch')!;
        const rowValue = coreMatch;
        let matches = false;

        for (const value of selectedValues) {
          if (value === 'Y' && rowValue === 'Y') {
            matches = true;
            break;
          } else if (value === 'N' && rowValue !== 'Y') {
            matches = true;
            break;
          }
        }

        if (!matches) {
          matchesAllFilters = false;
        }
      }

      // Check incidentState filter
      if (matchesAllFilters && activeFiltersMap.has('incidentState')) {
        const selectedValues = activeFiltersMap.get('incidentState')!;
        const rowValue = (row['INCIDENT_STATE'] ?? '').toString().trim();

        // Normalize 'Canceled' to 'Cancelled' for comparison
        let normalizedRowValue = rowValue;
        if (rowValue.toLowerCase() === 'canceled') {
          normalizedRowValue = 'Cancelled';
        }

        if (!selectedValues.has(normalizedRowValue)) {
          matchesAllFilters = false;
        }
      }

      // Check cancelPrediction filter
      if (matchesAllFilters && activeFiltersMap.has('cancelPrediction')) {
        const selectedValues = activeFiltersMap.get('cancelPrediction')!;

        // Try multiple possible column names
        let rawCancelPrediction: any =
          row['Cancel Prediction'] ??
          row['Cancel prediction'] ??
          row['CANCEL_PREDICTION'];

        if (rawCancelPrediction === undefined) {
          // Fallback: case-insensitive search
          const matchKey = Object.keys(row).find(
            (k) => k.toLowerCase().replace(/_/g, ' ') === 'cancel prediction',
          );
          if (matchKey) {
            rawCancelPrediction = row[matchKey];
          }
        }

        const rowValue = (rawCancelPrediction ?? '').toString().trim();

        // Empty values don't match any selected prediction
        if (rowValue === '') {
          matchesAllFilters = false;
        } else {
          // Check if rowValue matches any selected value (case-insensitive)
          let matches = false;
          for (const value of selectedValues) {
            if (value.toLowerCase() === rowValue.toLowerCase()) {
              matches = true;
              break;
            }
          }

          if (!matches) {
            matchesAllFilters = false;
          }
        }
      }

      // Check impactedServiceOffering filter
      if (
        matchesAllFilters &&
        activeFiltersMap.has('impactedServiceOffering')
      ) {
        const selectedValues = activeFiltersMap.get('impactedServiceOffering')!;
        const rowValue = (row['IMPACTED_SERVICE_OFFERING'] ?? '')
          .toString()
          .trim();
        if (!selectedValues.has(rowValue)) {
          matchesAllFilters = false;
        }
      }

      // Check incidentNumber filter (text-based search)
      if (matchesAllFilters && activeFiltersMap.has('incidentNumber')) {
        const selectedValues = activeFiltersMap.get('incidentNumber')!;
        const rowValue = (row['INCIDENT_NUMBER'] ?? '')
          .toString()
          .trim()
          .toUpperCase();

        // Check if the incident number contains any of the search terms
        let matches = false;
        for (const searchTerm of selectedValues) {
          if (rowValue.includes(searchTerm.toUpperCase())) {
            matches = true;
            break;
          }
        }

        if (!matches) {
          matchesAllFilters = false;
        }
      }

      return matchesAllFilters;
    });

    // Update the dataSource with filtered results
    this.dataSource.data = filtered;

    // Update the table change subscription first
    this.dataSource._updateChangeSubscription();

    // Then update pagination after a micro-task to ensure data is synced
    setTimeout(() => {
      this.updatePagination(filtered.length);
    }, 0);
  }

  // Allow parent to externally set data (e.g., backend both-Y fetch) without overwriting original baseline unless requested
  public setExternalData(data: any[], replaceOriginal: boolean = false) {
    if (replaceOriginal || this.fullData.length === 0) {
      // Store complete dataset
      this.lastProcessedDataLength = data?.length || 0;
      this.fullData = [...data];

      // Filter out (Y,Y) rows for originalData
      this.originalData = this.fullData.filter((row) => {
        const catMatch = (row['CATEGORY_MATCH'] ?? '').toString().trim();
        const coreMatch = (row['CORE_ISSUE_MATCH'] ?? '').toString().trim();
        return !(catMatch === 'Y' && coreMatch === 'Y');
      });
    }

    // Data arrived: clear local fetching overlay
    this.showFetchingOverlay = false;

    // Enforce the current filter state to ensure we show the correct view
    this.enforceCurrentFilterState();

    // Update pagination with proper reset
    this.updatePagination(this.dataSource.data.length);
    this.dataSource._updateChangeSubscription();
  }
}
