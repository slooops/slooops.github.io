import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from 'src/app/providers/http.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';

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
    private readonly destroyManager: DestroyManager
  ) {}

  activeTab: string = 'I2C'; // Default I2C as active

  // Base metric tiles structure - preserving all tile names
  private readonly baseMetricTiles: MetricTile[] = [
    { name: 'Overall', percentage: '-' },
    { name: 'AIT', percentage: '-' },
    { name: 'Capital', percentage: '-' },
    { name: 'FPP', percentage: '-' },
    { name: 'I2C', percentage: '-' },
    { name: 'OM', percentage: '-' },
    { name: 'P2P', percentage: '-' },
    { name: 'SM', percentage: '-' },
  ];

  // Public metricTiles that will be updated with API data
  metricTiles: MetricTile[] = [...this.baseMetricTiles];

  ngOnInit(): void {
    this.getXxcaseiqValidatedCasesAccuracyV();
  }

  getXxcaseiqValidatedCasesAccuracyV(): void {
    this.http
      .get('xxcaseiq-validated-cases-accuracy-v', this.destroyManager)
      .subscribe((data: any) => {
        // console.log('xxcaseiqValidatedCasesAccuracyV:', data);
        // Ensure data is an array before processing
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
  }

  onTileClick(tileName: string): void {
    this.activeTab = tileName;
    console.log(`Selected tile: ${tileName}`);
  }

  isActive(tileName: string): boolean {
    return this.activeTab === tileName;
  }
}
