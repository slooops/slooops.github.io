import { Component } from '@angular/core';

@Component({
  selector: 'app-o2c-sub',
  templateUrl: './o2c-sub.component.html',
  styleUrl: './o2c-sub.component.css',
})
export class O2cSubComponent {
  selectedTabIndex = 0;

  constructor() {}

  dummyData1 = [
    {
      INCIDENT_TYPE: 'Order Entry',
      INCIDENT_COUNT: 25,
      INCIDENT_VALUE: 40030232,
    },
    {
      INCIDENT_TYPE: 'Manual Entry',
      INCIDENT_COUNT: 32,
      INCIDENT_VALUE: 23931490,
    },
    {
      INCIDENT_TYPE: 'Data Entry',
      INCIDENT_COUNT: 9,
      INCIDENT_VALUE: 10223039,
    },
  ];

  onTabChange(event: any): void {
    this.selectedTabIndex = event.index;
  }
}
