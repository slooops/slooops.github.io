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
  @Input() stepValues?: { [key: string]: string } = {}; // e.g. { Order: '$62000', Subscription: '$000' }

  circleSteps: string[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.circleSteps = Object.keys(this.circleStatus);
  }

  getCircleClass(step: string): string {
    const value = this.circleStatus[step];
    if (value === 2) return 'completed-circle';
    if (value === 1) return 'current-circle'; // shows halo
    if (value === -1) return 'in-progress-circle'; // optional mid-step
    return 'uncompleted-circle';
  }

  getCaptionClass(step: string): string {
    const value = this.circleStatus[step];
    if (value === 2) return 'step-value--completed';
    if (value === 1) return 'step-value--current';
    if (value === -1) return 'step-value--in-progress';
    return 'step-value--uncompleted';
  }

  getSliderBarStyle(index: number): { [key: string]: string } {
    const step = this.circleSteps[index];
    const value = this.circleStatus[step];

    return {
      background: value === 1 ? '#c0c4c4' : '#c0c4c4',
    };
  }

  navigateToRoute(identifier: string) {
    if (this.navigationMap[identifier]) {
      this.router.navigate([this.navigationMap[identifier]]);
      console.log(`Navigating to ${this.navigationMap[identifier]}`);
    } else {
      // console.warn('No navigation path found for:', identifier);
    }
  }

  removeUnderscores(key: string): string {
    return key.replace(/_/g, ' ');
  }
}
