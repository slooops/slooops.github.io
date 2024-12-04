import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from '../providers/http.service';
import { DataService } from '../providers/data.service';

@Component({
  selector: 'app-gl-posting',
  templateUrl: './gl-posting.component.html',
  styleUrl: './gl-posting.component.css',
})
export class GlPostingComponent implements OnInit {
  constructor(private dataService: DataService) {}
  roles: string[] = [];

  ngOnInit() {
    this.getErrorSummaryPeriodStatus();
    this.getUserId();
  }

  getUserId() {
    this.dataService.setLoading(true);
    this.dataService.getUserId().subscribe((data) => {
      let username = data['auth_user'];
      this.getUserRoles(username);
    });
  }

  getUserRoles(username: string) {
    this.dataService.getRoles(username).subscribe((data) => {
      this.roles = data['userRoles'];
    });
  }

  glTotals: { [key: string]: number } = {
    '2 - GL Interface': 0,
  };

  glFilters: { formControlName: string; columnName: string }[] = [];

  specialWords: string[] = [
    'name',
    'amount',
    'interface',
    'error',
    'number',
    'total',
    'hold',
    'pending',
    'status',
    'num',
    'year',
    'status',
    'sub',
    'staging',
    'id',
    'line',
  ];

  skippedWords: string[] = ['IOL', 'AR', 'ID'];

  glUrls: { [key: string]: string } = {
    summaryUrl: 'gl-error-summary',
    detailsUrl: 'gl-error-details',
    filteredDetailsUrl: 'gl-details-filtered',
    summaryUpdateUrl: 'gl-summary-update',
    webexMessageUrl: 'send-message-gl',
    chartTotalsUrl: '',
    chartDetailsUrl: '',
  };

  // Define the steps array with both original keys and formatted labels
  formattedglSteps = Object.keys(this.glTotals).map((key) => ({
    label: this.formatLabel(key),
    impact: key,
  }));

  // Function to format the label
  formatLabel(label: string): string {
    const acronyms = this.skippedWords || [];

    return label
      .toLowerCase() // Convert to lowercase
      .replace(/_/g, ' ') // Replace underscores with spaces
      .split(' ') // Split into words
      .map(
        (word) =>
          acronyms.includes(word.toUpperCase())
            ? word.toUpperCase() // Keep the word in uppercase if it's in skippedWords
            : word.charAt(0).toUpperCase() + word.slice(1) // Capitalize the first letter otherwise
      )
      .join(' '); // Join words back with spaces
  }

  periodStatus: any;

  getErrorSummaryPeriodStatus() {
    this.dataService.getMonitoringPeriodStatus().subscribe((data: any) => {
      this.periodStatus = data;
    });
  }

  glflowCss: string = `
  .flowchart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 82px;
  width: 250px;
  background: #ffffff;
  top: 0px;
  padding-bottom: 20px;
}

.slider-bar {
  margin-top: 40px;
  position: absolute;
  width: fit-content;
  height: 4px;
  background: #16371e43;
  border-radius: 5px;
  z-index: 0;
  display: flex;
  flex-direction: row;
}

.circle-wrapper-loop {
  align-items: center;
  text-align: center;
  position: relative;
  width: 150px;
  top: -40px;
}

.circle-loop {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #828d9b;
  position: relative;
  margin-top: -0px;
  left: 67px;
}

.circle-caption-loop {
  font-size: 12px;
  color: #333;
  text-align: center;
  height: 20px;
}

.circle-subcaption {
  font-size: 10px;
  color: #000;
  font-weight: bold;
}

.chevron-wrapper-loop {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0px; /* Matches the circle wrapper width */
  position: relative;
  top: -105px;
  left: 150px;
}

.chevron,
.chevron-white {
  width: 0;
  height: 0;
  border-style: solid;
  position: relative;
}

.chevron {
  border-width: 2px 2px 2px 2px;
  border-color: transparent #16371e43 transparent transparent;
  transform: rotate(180deg);
  z-index: 1;
  top: 0px;
}

.chevron-white {
  border-width: 8px 8px 8px 8px;
  border-color: transparent #fcfcfc transparent transparent;
  transform: rotate(180deg);
  margin-left: -4px; /* To overlay on the darker chevron */
  top: 0px;
}
  `;
}
