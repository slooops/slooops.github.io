import { Component } from '@angular/core';
import { AuthenticationService } from 'src/app/providers/authentication.service';
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
  constructor(private readonly authService: AuthenticationService) {}

  userName: string = this.authService.getUserName() || 'Jack';
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

  // I2C Chart Data - Similar to the screenshot
  i2cChartData: StackedBarChartDataPoint[] = [
    {
      label: 'Access Management',
      segments: [
        { name: 'Validated', value: 30, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 5, color: '#E5E5E5' },
      ],
    },
    {
      label: 'Accounting',
      segments: [
        { name: 'Validated', value: 34, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 8, color: '#E5E5E5' },
      ],
    },
    {
      label: 'Cash Apps',
      segments: [
        { name: 'Validated', value: 27, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 13, color: '#E5E5E5' },
      ],
    },
    {
      label: 'Credit & Collections',
      segments: [
        { name: 'Validated', value: 60, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 24, color: '#E5E5E5' },
      ],
    },
    {
      label: 'Order to Cash',
      segments: [
        { name: 'Validated', value: 123, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 45, color: '#E5E5E5' },
      ],
    },
    {
      label: 'Invoicing',
      segments: [
        { name: 'Validated', value: 30, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 45, color: '#E5E5E5' },
      ],
    },
    {
      label: 'VT Customs',
      segments: [
        { name: 'Validated', value: 34, color: '#36A2EB' },
        { name: 'Incorrect/Not Validated', value: 2, color: '#E5E5E5' },
      ],
    },
  ];

  // I2C Simple Chart Data - Monthly totals
  i2cSimpleChartData: BarChartDataPoint[] = [
    { label: 'AUG', value: 115, color: '#E5E5E5' },
    { label: 'SEP', value: 120, color: '#E5E5E5' },
    { label: 'OCT', value: 111, color: '#E5E5E5' },
    { label: 'NOV', value: 110, color: '#E5E5E5' },
    { label: 'DEC', value: 105, color: '#E5E5E5' },
    { label: 'JAN', value: 99, color: '#E5E5E5' },
    { label: 'FEB', value: 95, color: '#E5E5E5' },
    { label: 'MAR', value: 90, color: '#E5E5E5' },
  ];

  // Table data combining chart information
  i2cTableData = new MatTableDataSource([
    {
      category: 'Access Management',
      validated: 30,
      incorrect_not_validated: 5,
      total_cases: 35,
      validation_rate: '85.7%',
      status: 'Good',
    },
    {
      category: 'Accounting',
      validated: 34,
      incorrect_not_validated: 8,
      total_cases: 42,
      validation_rate: '81.0%',
      status: 'Good',
    },
    {
      category: 'Cash Apps',
      validated: 27,
      incorrect_not_validated: 13,
      total_cases: 40,
      validation_rate: '67.5%',
      status: 'Needs Attention',
    },
    {
      category: 'Credit & Collections',
      validated: 60,
      incorrect_not_validated: 24,
      total_cases: 84,
      validation_rate: '71.4%',
      status: 'Needs Attention',
    },
    {
      category: 'Order to Cash',
      validated: 123,
      incorrect_not_validated: 45,
      total_cases: 168,
      validation_rate: '73.2%',
      status: 'Needs Attention',
    },
    {
      category: 'Invoicing',
      validated: 30,
      incorrect_not_validated: 45,
      total_cases: 75,
      validation_rate: '40.0%',
      status: 'Critical',
    },
    {
      category: 'VT Customs',
      validated: 34,
      incorrect_not_validated: 2,
      total_cases: 36,
      validation_rate: '94.4%',
      status: 'Excellent',
    },
  ]);

  i2cTableColumns = [
    'category',
    'validated',
    'incorrect_not_validated',
    'total_cases',
    'validation_rate',
    'status',
  ];

  onTileClick(tileName: string): void {
    this.activeTab = tileName;
    console.log(`Selected tile: ${tileName}`);
  }

  isActive(tileName: string): boolean {
    return this.activeTab === tileName;
  }
}
