import { Component } from '@angular/core';
import {
  StackedBarChartDataPoint,
  BarChartDataPoint,
} from 'src/app/components/bar-chart/bar-chart.component';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-esp-home',
  templateUrl: './esp-home.component.html',
  styleUrls: ['./esp-home.component.css'],
})
export class EspHomeComponent {
  constructor() {}

  activeTab: string = 'I2C'; // Default I2C as active

  metricTiles = [
    { name: 'Overall', percentage: 83 },
    { name: 'AIT', percentage: 80 },
    { name: 'Capital', percentage: 80 },
    { name: 'FPP', percentage: 23 },
    { name: 'I2C', percentage: 89 },
    { name: 'OM', percentage: 35 },
    { name: 'P2P', percentage: 82 },
    { name: 'SM', percentage: 89 },
  ];

  onTileClick(tileName: string): void {
    this.activeTab = tileName;
    console.log(`Selected tile: ${tileName}`);
  }

  isActive(tileName: string): boolean {
    return this.activeTab === tileName;
  }
}
