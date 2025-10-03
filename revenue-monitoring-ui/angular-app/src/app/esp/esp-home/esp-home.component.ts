import { Component } from '@angular/core';
import { AuthenticationService } from 'src/app/providers/authentication.service';

@Component({
  selector: 'app-esp-home',
  templateUrl: './esp-home.component.html',
  styleUrls: ['./esp-home.component.css'],
})
export class EspHomeComponent {
  constructor(private authService: AuthenticationService) {}

  userName: string = this.authService.getUserName() || 'Jack';
  activeTile: string = 'I2C'; // Default I2C as active

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
    this.activeTile = tileName;
    console.log(`Selected tile: ${tileName}`);
  }

  isActive(tileName: string): boolean {
    return this.activeTile === tileName;
  }
}
