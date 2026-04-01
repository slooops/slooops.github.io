import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiHttpService } from 'src/app/providers/http.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { AuthenticationService } from 'src/app/providers/authentication.service';
import { CommonModule } from '@angular/common';
import { MetricTileComponent } from '../../components/metric-tile/metric-tile.component';
import { CaseiqComponent } from './caseiq/caseiq.component';
import { CaseiqCapComponent } from './caseiq-cap/caseiq-cap.component';
import { CaseiqFppComponent } from './caseiq-fpp/caseiq-fpp.component';
import { CaseiqI2cComponent } from './caseiq-i2c/caseiq-i2c.component';
import { CaseiqOmComponent } from './caseiq-om/caseiq-om.component';
import { CaseiqP2pComponent } from './caseiq-p2p/caseiq-p2p.component';
import { CaseiqSmComponent } from './caseiq-sm/caseiq-sm.component';
import { CaseiqAitComponent } from './caseiq-ait/caseiq-ait.component';
import { HomeDataService } from 'src/app/home/home-data.service';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { GlobalSearchDialogComponent } from '../global-search-dialog/global-search-dialog.component';
import { DataService } from 'src/app/providers/data.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { provideIcons } from '@ng-icons/core';
import { phosphorSparkleBold } from '@ng-icons/phosphor-icons/bold';
import { MatIconModule } from '@angular/material/icon';

interface MetricTile {
  name: string;
  percentage: number | string;
}

interface AccuracyData {
  TEAM_NAME: string;
  Quarter?: string;
  CATEGORY: number;
  CORE_ISSUE: number;
  TOTAL_ACCURACY: number;
  TOTAL_VALIDATED_CASES: number;
  'Total Cases'?: number;
  'Total Accuracy'?: number;
  'Category Accuracy'?: number;
  'Core Issue Accuracy'?: number;
}

@Component({
  selector: 'app-esp-home',
  templateUrl: './esp-home.component.html',
  styleUrls: ['./esp-home.component.css'],
  providers: [
    DestroyManager,
    provideIcons({
      phosphorSparkleBold,
    }),
  ],
  imports: [
    CommonModule,
    CaseiqComponent,
    CaseiqCapComponent,
    CaseiqFppComponent,
    CaseiqI2cComponent,
    CaseiqOmComponent,
    CaseiqP2pComponent,
    CaseiqSmComponent,
    CaseiqAitComponent,
    MatTooltipModule,
    MatIconModule,
  ],
  standalone: true,
})
export class EspHomeComponent implements OnInit {
  constructor(
    private readonly http: ApiHttpService,
    private readonly destroyManager: DestroyManager,
    private authService: AuthenticationService,
    private homeDataService: HomeDataService,
    private dialog: MatDialog,
    private dataService: DataService,
    public router: Router,
  ) {}

  activeTab: string = ''; // Will be set based on user roles
  overallAccuracy: string = '';

  // Quarter filter properties
  selectedQuarter: string = '';
  showQuarterDropdown: boolean = false;
  showGridMenu: boolean = false;
  isLoadingQuarter: boolean = false;
  loadingQuarterMessage: string = '';
  periodInfo = signal<any>(null);

  // Store raw API data to extract quarters per team
  private accuracyData: AccuracyData[] = [];

  // All available quarters (master list)
  private allQuarters: { label: string; value: string }[] = [];

  /**
   * Build the master quarter list from API data instead of hard-coding.
   * Also ensures selectedQuarter always points to a valid value.
   */
  private buildAllQuartersFromData(data: AccuracyData[]): void {
    const rawValues = (data || [])
      .map((item) => item.Quarter?.trim())
      .filter((q): q is string => !!q);

    const values = Array.from(new Set(rawValues));

    // Sort by fiscal year and quarter, newest first (e.g. Q4FY26 before Q1FY26)
    values.sort((a, b) => {
      const parse = (val: string) => {
        const match = val.match(/Q(\d)FY(\d+)/i);
        if (!match) {
          return { q: 0, fy: 0 };
        }
        return { q: Number(match[1]), fy: Number(match[2]) };
      };

      const pa = parse(a);
      const pb = parse(b);

      if (pa.fy !== pb.fy) {
        return pb.fy - pa.fy;
      }
      return pb.q - pa.q;
    });

    this.allQuarters = values.map((value) => ({
      value,
      label: this.formatQuarterLabel(value),
    }));

    // Ensure selectedQuarter is valid; default to latest if not set or invalid
    if (this.allQuarters.length) {
      const exists = this.allQuarters.some(
        (quarter) => quarter.value === this.selectedQuarter,
      );
      if (!exists) {
        this.selectedQuarter = this.allQuarters[0].value;
      }
    }
  }

  /**
   * Convert compact quarter codes like "Q1FY26" into display labels like "Q1 FY26".
   */
  private formatQuarterLabel(value: string): string {
    return value.replace('FY', ' FY');
  }

  // Dynamically filtered quarters based on active team
  quarters: { label: string; value: string }[] = [];

  // Base metric tiles structure - preserving all tile names
  private readonly baseMetricTiles: MetricTile[] = [
    { name: 'Finance IT', percentage: '-' },
    { name: 'OM', percentage: '-' },
    { name: 'SM', percentage: '-' },
    { name: 'I2C', percentage: '-' },
    { name: 'AIT', percentage: '-' },
    { name: 'FPP', percentage: '-' },
    { name: 'P2P', percentage: '-' },
    { name: 'Capital', percentage: '-' },
  ];

  // Public metricTiles that will be updated with API data
  metricTiles: MetricTile[] = [...this.baseMetricTiles];
  roles: string[] = [];
  private userName: string = '';

  // Columns to show in global search results dialog (common keys + TEAM_NAME)
  private readonly globalSearchColumnsOrder: string[] = [
    'TEAM_NAME',
    'INCIDENT_NUMBER',
    'IMPACTED_SERVICE_OFFERING',
    'LLM_SUMMARY',
    'CATEGORY_MATCH',
    'CATEGORY',
    'CATEGORY_ACTUAL',
    'CORE_ISSUE_MATCH',
    'CORE_ISSUE',
    'CORE_ISSUE_ACTUAL',
    'INCIDENT_STATE',
    'COMMENTS',
  ];

  ngOnInit(): void {
    this.roles = this.authService.getRoles();
    this.userName = this.authService.getUserName();

    // On /caseiq route, force Finance IT tab (no hamburger menu available)
    if (this.router.url.includes('/caseiq')) {
      this.activeTab = 'Finance IT';
    } else {
      this.setDefaultActiveTab();
    }

    this.updateTime();
    this.getXxcaseiqValidatedCasesAccuracyV();
    this.loadPeriodInfo();
    this.loadCaseAnalyzerMetrics();

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      this.showQuarterDropdown = false;
      this.showGridMenu = false;
    });
  }

  timeNow: string = '';

  updateTime() {
    const currentDate = new Date();
    const pstDate = currentDate.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
    });
    const timestamp = Date.parse(pstDate);
    const currentPstDate = new Date(timestamp);

    const currentHour = currentPstDate.getHours();

    if (
      currentHour === 0 ||
      currentHour === 6 ||
      currentHour === 12 ||
      currentHour === 18
    ) {
      this.getXxcaseiqValidatedCasesAccuracyV();
      this.loadPeriodInfo();
      this.loadCaseAnalyzerMetrics();
    }

    if (currentHour >= 0 && currentHour < 6) {
      this.timeNow = 'Today at 12 AM PST';
    } else if (currentHour >= 6 && currentHour < 12) {
      this.timeNow = 'Today at 6 AM PST';
    } else if (currentHour >= 12 && currentHour < 18) {
      this.timeNow = 'Today at 12 PM PST';
    } else {
      this.timeNow = 'Today at 6 PM PST';
    }
  }

  componentLevelMetrics: any;
  loadCaseAnalyzerMetrics(): void {
    this.dataService.getCaseIqMetrics(this.destroyManager).subscribe({
      next: (data) => {
        console.log('Case Analyzer Metrics:', data);
        this.componentLevelMetrics = data;
      },
      error: (error) => {
        console.error('Error loading Case Analyzer metrics:', error);
      },
    });
  }

  loadCaseAnalyzerMetricsByComponent(component: string): any {
    if (!Array.isArray(this.componentLevelMetrics)) {
      return null;
    }

    return this.componentLevelMetrics.find(
      (item: any) => item && item.TEAM_NAME === component,
    );
  }

  private loadPeriodInfo(): void {
    this.homeDataService.getPeriodInfo(this.destroyManager).subscribe({
      next: (periodData) => {
        this.periodInfo.set(periodData);
      },
      error: (error) => {
        console.error('Error loading period info:', error);
        this.periodInfo.set({
          periodName: '',
          periodEndDate: '',
          lastUpdated: new Date().toLocaleString(),
        });
      },
    });
  }

  onGlobalSearchClick(rawTerm: string): void {
    const normalized = (rawTerm || '')
      .split(',')
      .map((t) => t.trim())
      .filter((t) => !!t)
      .join(',');

    if (!normalized) {
      return;
    }
    this.globalSearch(normalized);
  }

  globalSearch(incidentNumber: string) {
    const formData: FormData = new FormData();
    formData.append('incidentNumber', incidentNumber);

    this.http.post<any[]>('xxcaseiq-global-search', formData).subscribe(
      (rows: any) => {
        const resultRows: any[] = Array.isArray(rows) ? rows : [];
        if (!resultRows.length) {
          console.log('Global search returned no results');
          return;
        }

        // Determine which of the desired columns actually exist in the data
        const availableColumns = this.globalSearchColumnsOrder.filter((col) =>
          resultRows.some(
            (row) => row && Object.prototype.hasOwnProperty.call(row, col),
          ),
        );

        if (!availableColumns.length) {
          console.log('Global search results do not contain expected columns');
          return;
        }

        // Build a filtered dataset that only contains the common keys + TEAM_NAME
        const filteredRows = resultRows.map((row) => {
          const filtered: any = {};
          availableColumns.forEach((col) => {
            filtered[col] = row[col];
          });
          return filtered;
        });

        const dataSource = new MatTableDataSource(filteredRows);

        this.dialog.open(GlobalSearchDialogComponent, {
          width: '90vw',
          maxWidth: '1200px',
          data: {
            dataSource,
            displayedColumns: availableColumns,
          },
        });
      },
      (err) => {
        console.error('Global search error:', err);
      },
    );
  }

  /**
   * Toggle quarter dropdown visibility
   */
  toggleQuarterDropdown(event: Event): void {
    event.stopPropagation();
    this.showQuarterDropdown = !this.showQuarterDropdown;
  }

  /**
   * Select a quarter and close dropdown
   */
  selectQuarter(quarter: string): void {
    // Get the label for display
    const quarterLabel =
      this.allQuarters.find((q) => q.value === quarter)?.label || quarter;

    // Show loading overlay
    this.isLoadingQuarter = true;
    this.loadingQuarterMessage = `Loading data for ${this.activeTab}...`;

    this.selectedQuarter = quarter;
    this.showQuarterDropdown = false;
    console.log(
      `Quarter changed to: ${this.selectedQuarter} for team: ${this.activeTab}`,
    );

    // Use setTimeout to allow UI to update with loading overlay
    setTimeout(() => {
      // Update metric tiles with quarter-filtered data
      if (this.accuracyData.length > 0) {
        const filteredData = this.accuracyData.filter(
          (item) => item.Quarter === this.selectedQuarter,
        );
        this.updateMetricTiles(filteredData);
      }

      // Hide loading overlay after child components have updated (increased delay for chart rendering)
      setTimeout(() => {
        this.isLoadingQuarter = false;
      }, 2000);
    }, 0);
  }

  /**
   * Handle quarter selection change
   * Refreshes data based on selected quarter
   */
  onQuarterChange(): void {
    console.log(`Quarter changed to: ${this.selectedQuarter}`);
    // TODO: Add API call with quarter parameter when backend is ready
    // this.getXxcaseiqValidatedCasesAccuracyV();
  }

  /**
   * Sets the default active tab based on user roles
   * If ESP_ADMIN, defaults to first team tile (AIT)
   * Otherwise, sets to the first accessible team tile
   */
  private setDefaultActiveTab(): void {
    // Find the first accessible tile (including Overall)
    const accessibleTile = this.baseMetricTiles.find((tile) =>
      this.isTileAccessible(tile.name),
    );

    if (accessibleTile) {
      this.activeTab = accessibleTile.name;
      // Update quarters for the default tab if data is already loaded
      if (this.accuracyData.length > 0) {
        this.updateQuartersForActiveTab();
      }
      // Log initial tab visit
      this.logTabVisit(this.activeTab);
    } else {
      // If no accessible tiles, set to empty (will show default content)
      this.activeTab = '';
    }
  }

  getXxcaseiqValidatedCasesAccuracyV(): void {
    this.http
      .get('xxcaseiq-validated-cases-accuracy-v', this.destroyManager)
      .subscribe((data: any) => {
        console.log(data);
        if (Array.isArray(data)) {
          // Store raw data for quarter filtering
          this.accuracyData = data;

          // Build dynamic quarter list and ensure selectedQuarter is valid
          this.buildAllQuartersFromData(data);

          // Filter by selected quarter
          const filteredData = data.filter(
            (item) => item.Quarter === this.selectedQuarter,
          );

          // this.updateMetricTiles(filteredData);
          // Update quarters based on current active tab
          this.updateQuartersForActiveTab();
        }
      });
  }

  /**
   * Updates metric tiles with API data
   * Matches TEAM_NAME to tile names and sets TOTAL_ACCURACY as percentage
   */
  private updateMetricTiles(apiData: AccuracyData[]): void {
    // Reset to base tiles to ensure we start fresh
    this.metricTiles = [...this.baseMetricTiles];

    // Update tiles with API data
    this.metricTiles = this.metricTiles.map((tile) => {
      const matchingData = apiData.find(
        (item) => item.TEAM_NAME.toUpperCase() === tile.name.toUpperCase(),
      );

      return {
        ...tile,
        percentage: matchingData
          ? Math.round(matchingData['Total Accuracy'] * 100) / 100
          : '-',
      };
    });

    // Calculate overall accuracy after updating individual tiles
    const validTiles = this.metricTiles.filter(
      (tile) => tile.name !== 'Finance IT' && !isNaN(Number(tile.percentage)),
    );

    if (validTiles.length > 0) {
      const overallAcc =
        validTiles.reduce((sum, tile) => sum + Number(tile.percentage), 0) /
        validTiles.length;

      this.overallAccuracy = Math.round(overallAcc * 100) / 100 + '';

      // Assign overall accuracy to the "Overall" tile
      const overallTileIndex = this.metricTiles.findIndex(
        (tile) => tile.name === 'Finance IT',
      );
      if (overallTileIndex !== -1) {
        this.metricTiles[overallTileIndex].percentage =
          Math.round(overallAcc * 100) / 100;
      }
    }
  }

  onTileClick(tileName: string): void {
    // Check if user has permission to access this tile
    if (!this.isTileAccessible(tileName)) {
      return;
    }

    this.activeTab = tileName;
    console.log(`Selected tile: ${tileName}`);

    // Log tab visit for analytics
    this.logTabVisit(tileName);

    // Show loading overlay when switching tabs
    const quarterLabel =
      this.allQuarters.find((q) => q.value === this.selectedQuarter)?.label ||
      this.selectedQuarter;
    this.isLoadingQuarter = true;
    this.loadingQuarterMessage = `Loading data for ${tileName}...`;

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      // Update quarters when tab changes
      this.updateQuartersForActiveTab();

      // Hide loading overlay after charts have rendered
      setTimeout(() => {
        this.isLoadingQuarter = false;
      }, 1500);
    }, 0);
  }

  isActive(tileName: string): boolean {
    return this.activeTab === tileName;
  }

  toggleGridMenu(event: Event): void {
    event.stopPropagation();
    this.showGridMenu = !this.showGridMenu;
  }

  onGridMenuItemClick(tileName: string): void {
    this.showGridMenu = false;
    this.onTileClick(tileName);
  }

  roleDefinitions: string[] = [
    'CASE_IQ_OM',
    'CASE_IQ_SBP',
    'CASE_IQ_I2C',
    'CASE_IQ_AIT',
    'CASE_IQ_FPP',
    'CASE_IQ_P2P',
    'CASE_IQ_CAPITAL',
  ];

  /**
   * Determines if a tile is accessible based on user roles
   * @param tileName - The name of the tile to check
   * @returns true if the user has access to this tile
   */
  isTileAccessible(tileName: string): boolean {
    // Overall tile is always accessible
    if (tileName === 'Finance IT') {
      if (
        this.roles.includes('CASE_IQ_FINANCE_IT') ||
        this.roles.includes('CASE_IQ_MANAGER') ||
        this.roles.includes('ADMIN')
      ) {
        return true;
      }
      return false;
    }

    // ESP_ADMIN has access to all tiles
    if (
      this.roles.includes('CASE_IQ_MANAGER') ||
      this.roles.includes('ADMIN')
    ) {
      return true;
    }

    // Special mapping: CASE_IQ_SBP role maps to SM tile
    if (tileName.toUpperCase() === 'SM' && this.roles.includes('CASE_IQ_SBP')) {
      return true;
    }

    // Check if user has specific team role
    // Role names should match tile names (e.g., 'AIT', 'Capital', 'FPP', 'I2C', 'OM', 'P2P')
    return this.roles.includes('CASE_IQ_' + tileName.toUpperCase());
  }

  /**
   * Handle upload success event from child components
   * Refreshes overall accuracy metrics when upload is completed
   */
  onUploadSuccess(): void {
    console.log(
      '🟢 ESP-HOME: Upload success received in esp-home, refreshing accuracy metrics',
    );
    this.getXxcaseiqValidatedCasesAccuracyV();
  }

  /**
   * Updates the quarters dropdown based on all available data
   * Shows all quarters that exist across ANY team (not team-specific)
   */
  private updateQuartersForActiveTab(): void {
    if (!this.accuracyData.length) {
      // If no data loaded yet, show all quarters
      this.quarters = [...this.allQuarters];
      return;
    }

    // Extract ALL unique quarters from entire dataset (not team-specific)
    const availableQuarters = new Set(
      this.accuracyData.map((item) => item.Quarter?.trim()).filter(Boolean),
    );

    // Filter allQuarters to show only those that exist in the data
    this.quarters = this.allQuarters.filter((quarter) =>
      availableQuarters.has(quarter.value),
    );

    // If no quarters found, show all quarters as fallback
    if (this.quarters.length === 0) {
      this.quarters = [...this.allQuarters];
    }

    console.log(`Updated quarters (all teams):`, this.quarters);
  }

  /**
   * Logs a tab visit for analytics.
   * Creates a pseudo-route like "/case-iq/capital" to track tile usage.
   */
  private logTabVisit(tileName: string): void {
    if (!tileName || !this.userName) {
      return;
    }

    // Convert tile name to URL-friendly slug: "Capital" -> "capital"
    const tileSlug = tileName.toLowerCase();
    const pseudoRoute = `/case-iq/${tileSlug}`;

    // Fire-and-forget POST request
    this.http
      .post('log-page-visit', {
        userName: this.userName,
        pageRoute: pseudoRoute,
      })
      .subscribe({
        next: () =>
          console.log('[ANALYTICS-ESP] Successfully logged:', pseudoRoute),
        error: (err) =>
          console.error('[ANALYTICS-ESP] Tab analytics log failed:', err),
      });
  }
}
