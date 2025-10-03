import { Component } from '@angular/core';

interface MetricTile {
  name: string;
  percentage: number;
  status: 'high' | 'medium' | 'low';
}

@Component({
  selector: 'app-esp-home',
  templateUrl: './esp-home.component.html',
  styleUrls: ['./esp-home.component.css'],
})
export class EspHomeComponent {
  metricTiles: MetricTile[] = [
    { name: 'Overall', percentage: 83, status: 'high' },
    { name: 'AIT', percentage: 80, status: 'medium' },
    { name: 'CAPITAL', percentage: 80, status: 'medium' },
    { name: 'FPP', percentage: 23, status: 'low' },
    { name: 'I2C', percentage: 89, status: 'high' },
    { name: 'OM', percentage: 35, status: 'low' },
    { name: 'P2P', percentage: 82, status: 'high' },
    { name: 'SM', percentage: 89, status: 'high' },
  ];

  getStatusClass(status: string): string {
    switch (status) {
      case 'high':
        return 'status-high';
      case 'medium':
        return 'status-medium';
      case 'low':
        return 'status-low';
      default:
        return '';
    }
  }
}
