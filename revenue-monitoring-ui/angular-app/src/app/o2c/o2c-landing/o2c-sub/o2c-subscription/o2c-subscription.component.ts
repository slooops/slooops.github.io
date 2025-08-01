import { Component } from '@angular/core';

@Component({
  selector: 'app-o2c-subscription',
  templateUrl: './o2c-subscription.component.html',
  styleUrl: './o2c-subscription.component.css',
})
export class O2cSubscriptionComponent {
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
