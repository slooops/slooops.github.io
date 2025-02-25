import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-o2c-process-flow',
  templateUrl: './o2c-process-flow.component.html',
  styleUrls: ['./o2c-process-flow.component.css'],
})
export class O2cProcessFlowComponent implements OnInit {
  @Input() circleStatus: { [key: string]: number } = {};
  @Input() navigationMap: { [key: string]: string } = {};

  circleSteps: string[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.circleSteps = Object.keys(this.circleStatus);
  }

  getCircleClass(step: string): string {
    const value = this.circleStatus[step];
    return value === 2
      ? 'completed-circle'
      : value === 1
      ? 'current-circle'
      : 'uncompleted-circle';
  }

  getSliderBarStyle(index: number): { [key: string]: string } {
    const step = this.circleSteps[index];
    const value = this.circleStatus[step];

    return {
      background:
        value === 1
          ? 'linear-gradient(to right, #16371e43, #08ace4, #16371e43)'
          : '#16371e43',
    };
  }

  navigateToRoute(identifier: string) {
    if (this.navigationMap[identifier]) {
      this.router.navigate([this.navigationMap[identifier]]);
      console.log(`Navigating to ${this.navigationMap[identifier]}`);
    } else {
      console.warn('No navigation path found for:', identifier);
    }
  }

  removeUnderscores(key: string): string {
    return key.replace(/_/g, ' ');
  }
}
