import { Component } from '@angular/core';
import { ScorecardComponent } from '../scorecard/scorecard.component';
import { ExecutiveSummaryComponent } from '../executive-summary/executive-summary.component';

@Component({
  selector: 'app-performance-hub',
  standalone: true,
  imports: [ScorecardComponent, ExecutiveSummaryComponent],
  templateUrl: './performance-hub.component.html',
  styleUrls: ['./performance-hub.component.css'],
})
export class PerformanceHubComponent {}
