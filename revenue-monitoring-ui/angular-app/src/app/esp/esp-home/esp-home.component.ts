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
  CATEGORY: number;
  CORE_ISSUE: number;
  TOTAL_ACCURACY: number;
  TOTAL_VALIDATED_CASES: number;
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
    } else {
      // If no accessible tiles, set to empty (will show default content)
      this.activeTab = '';
    }
  }

  getXxcaseiqValidatedCasesAccuracyV(): void {
    this.http
      .get('xxcaseiq-validated-cases-accuracy-v', this.destroyManager)
      .subscribe((data: any) => {
        if (Array.isArray(data)) {
          this.updateMetricTiles(data);
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
  }

  isActive(tileName: string): boolean {
    return this.activeTab === tileName;
  }

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
    if (this.roles.includes('ESP_ADMIN') || this.roles.includes('ADMIN')) {
      return true;
    }

    // Check if user has specific team role
    // Role names should match tile names (e.g., 'AIT', 'Capital', 'FPP', 'I2C', 'OM', 'P2P', 'SM')
    return this.roles.includes(tileName.toUpperCase());
  }
}
