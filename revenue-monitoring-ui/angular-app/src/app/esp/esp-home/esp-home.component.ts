import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from 'src/app/providers/http.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { AuthenticationService } from 'src/app/providers/authentication.service';

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
})
export class EspHomeComponent implements OnInit {
  constructor(
    private readonly http: ApiHttpService,
    private readonly destroyManager: DestroyManager,
    private authService: AuthenticationService
  ) {}

  activeTab: string = ''; // Will be set based on user roles
  overallAccuracy: string = '';

  // Quarter filter properties
  selectedQuarter: string = 'Q1FY26';
  showQuarterDropdown: boolean = false;
  isLoadingQuarter: boolean = false;
  loadingQuarterMessage: string = '';

  // Store raw API data to extract quarters per team
  private accuracyData: AccuracyData[] = [];

  // All available quarters (master list)
  private allQuarters: { label: string; value: string }[] = [
    { label: 'Q1 FY26', value: 'Q1FY26' },
    { label: 'Q2 FY26', value: 'Q2FY26' },
    { label: 'Q3 FY26', value: 'Q3FY26' },
    { label: 'Q4 FY26', value: 'Q4FY26' },
    { label: 'Q1 FY25', value: 'Q1FY25' },
    { label: 'Q2 FY25', value: 'Q2FY25' },
    { label: 'Q3 FY25', value: 'Q3FY25' },
    { label: 'Q4 FY25', value: 'Q4FY25' },
  ];

  // Dynamically filtered quarters based on active team
  quarters: { label: string; value: string }[] = [];

  // Base metric tiles structure - preserving all tile names
  private readonly baseMetricTiles: MetricTile[] = [
    { name: 'Overall', percentage: '-' },
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

  ngOnInit(): void {
    this.roles = this.authService.getRoles();
    this.setDefaultActiveTab();
    this.getXxcaseiqValidatedCasesAccuracyV();

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      this.showQuarterDropdown = false;
    });
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
      `Quarter changed to: ${this.selectedQuarter} for team: ${this.activeTab}`
    );

    // Use setTimeout to allow UI to update with loading overlay
    setTimeout(() => {
      // Update metric tiles with quarter-filtered data
      if (this.accuracyData.length > 0) {
        const filteredData = this.accuracyData.filter(
          (item) => item.Quarter === this.selectedQuarter
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
    // Find the first accessible tile (excluding Overall)
    const accessibleTile = this.baseMetricTiles.find(
      (tile) => tile.name !== 'Overall' && this.isTileAccessible(tile.name)
    );

    if (accessibleTile) {
      this.activeTab = accessibleTile.name;
      // Update quarters for the default tab if data is already loaded
      if (this.accuracyData.length > 0) {
        this.updateQuartersForActiveTab();
      }
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

          // Filter by selected quarter
          const filteredData = data.filter(
            (item) => item.Quarter === this.selectedQuarter
          );

          this.updateMetricTiles(filteredData);
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
        (item) => item.TEAM_NAME.toUpperCase() === tile.name.toUpperCase()
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
      (tile) => tile.name !== 'Overall' && !isNaN(Number(tile.percentage))
    );

    if (validTiles.length > 0) {
      const overallAcc =
        validTiles.reduce((sum, tile) => sum + Number(tile.percentage), 0) /
        validTiles.length;

      this.overallAccuracy = Math.round(overallAcc * 100) / 100 + '';

      // Assign overall accuracy to the "Overall" tile
      const overallTileIndex = this.metricTiles.findIndex(
        (tile) => tile.name === 'Overall'
      );
      if (overallTileIndex !== -1) {
        this.metricTiles[overallTileIndex].percentage =
          Math.round(overallAcc * 100) / 100;
      }
    }
  }

  onTileClick(tileName: string): void {
    // Prevent Overall tile from being clickable
    if (tileName === 'Overall') {
      return;
    }

    // Check if user has permission to access this tile
    if (!this.isTileAccessible(tileName)) {
      return;
    }

    this.activeTab = tileName;
    console.log(`Selected tile: ${tileName}`);

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
    // Overall tile is never clickable
    if (tileName === 'Overall') {
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
      '🟢 ESP-HOME: Upload success received in esp-home, refreshing accuracy metrics'
    );
    this.getXxcaseiqValidatedCasesAccuracyV();
  }

  /**
   * Updates the quarters dropdown based on the active team tab
   * Filters quarters to show only those available for the selected team
   */
  private updateQuartersForActiveTab(): void {
    if (
      !this.activeTab ||
      this.activeTab === 'Overall' ||
      !this.accuracyData.length
    ) {
      // If no tab selected or Overall, show all quarters
      this.quarters = [...this.allQuarters];
      return;
    }

    // Get quarters available for the active team
    const teamData = this.accuracyData.filter(
      (item) => item.TEAM_NAME.toUpperCase() === this.activeTab.toUpperCase()
    );

    if (teamData.length === 0) {
      // No data for this team, show all quarters
      this.quarters = [...this.allQuarters];
      return;
    }

    // Extract unique quarters from team data
    const availableQuarters = new Set(
      teamData.map((item) => item.Quarter?.trim()).filter(Boolean)
    );

    // Filter allQuarters to show only those available for this team
    this.quarters = this.allQuarters.filter((quarter) =>
      availableQuarters.has(quarter.value)
    );

    // If current selected quarter is not available for this team, select the first available
    if (
      this.quarters.length > 0 &&
      !availableQuarters.has(this.selectedQuarter)
    ) {
      this.selectedQuarter = this.quarters[0].value;
      console.log(`Quarter auto-selected to: ${this.selectedQuarter}`);

      // Update metric tiles with the new quarter's data
      if (this.accuracyData.length > 0) {
        const filteredData = this.accuracyData.filter(
          (item) => item.Quarter === this.selectedQuarter
        );
        this.updateMetricTiles(filteredData);
      }
    }

    console.log(`Updated quarters for ${this.activeTab}:`, this.quarters);
  }
}
