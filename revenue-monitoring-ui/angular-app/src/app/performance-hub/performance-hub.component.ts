import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ScorecardComponent } from '../scorecard/scorecard.component';
import { ExecutiveSummaryComponent } from '../executive-summary/executive-summary.component';

@Component({
  selector: 'app-performance-hub',
  standalone: true,
  imports: [ScorecardComponent, ExecutiveSummaryComponent],
  templateUrl: './performance-hub.component.html',
  styleUrls: ['./performance-hub.component.css'],
})
export class PerformanceHubComponent implements OnInit {
  activeTab: 'scorecard' | 'exec-summary' = 'scorecard';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['tab'] === 'exec-summary') {
        this.activeTab = 'exec-summary';
      }
    });
  }
}
