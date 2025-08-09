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
      INCIDENT_COUNT: 5,
      INCIDENT_VALUE: 4,
    },
    {
      INCIDENT_TYPE: 'Manual Entry',
      INCIDENT_COUNT: 3,
      INCIDENT_VALUE: 2,
    },
    {
      INCIDENT_TYPE: 'Data Entry',
      INCIDENT_COUNT: 2,
      INCIDENT_VALUE: 1.2,
    },
  ];

  onTabChange(event: any): void {
    this.selectedTabIndex = event.index;
  }
}
