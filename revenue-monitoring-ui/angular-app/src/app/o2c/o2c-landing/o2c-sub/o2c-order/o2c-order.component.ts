import { Component } from '@angular/core';

@Component({
  selector: 'app-o2c-order',
  templateUrl: './o2c-order.component.html',
  styleUrl: './o2c-order.component.css',
})
export class O2cOrderComponent {
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

  dummyData2 = [
    {
      INCIDENT_TYPE: 'Order Entry',
      INCIDENT_COUNT: 5,
      INCIDENT_VALUE: 2.1,
    },
  ];

  dummyData3 = [
    { INCIDENT_TYPE: 'Order Entry', INCIDENT_COUNT: 50, INCIDENT_VALUE: 1.4 },
    { INCIDENT_TYPE: 'Manual Entry', INCIDENT_COUNT: 3, INCIDENT_VALUE: 0.9 },
  ];

  dummyData4 = [
    {
      INCIDENT_TYPE: 'Order Entry',
      INCIDENT_COUNT: 5,
      INCIDENT_VALUE: 2.1,
    },
    {
      INCIDENT_TYPE: 'Manual Entry',
      INCIDENT_COUNT: 3,
      INCIDENT_VALUE: 1.5,
    },
    {
      INCIDENT_TYPE: 'Data Entry',
      INCIDENT_COUNT: 2,
      INCIDENT_VALUE: 0.8,
    },
    {
      INCIDENT_TYPE: 'System Error',
      INCIDENT_COUNT: 1,
      INCIDENT_VALUE: 0.3,
    },
  ];

  dummyData5 = [
    {
      INCIDENT_TYPE: 'Order Entry',
      INCIDENT_COUNT: 5,
      INCIDENT_VALUE: 2.1,
    },
  ];

  isOpen: boolean[] = Array(7).fill(true);

  toggleAccordion(index: number): void {
    this.isOpen[index] = !this.isOpen[index];
  }
}
