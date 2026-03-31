import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorArrowLeftBold,
  phosphorArrowRightBold,
  phosphorClockCounterClockwiseBold,
} from '@ng-icons/phosphor-icons/bold';
import { DestroyManager } from '../../providers/destroy-manager.service';
import {
  ExecSummaryDataService,
  ExecSummaryVersion,
} from '../executive-summary-data.service';

@Component({
  selector: 'app-executive-summary-archive',
  standalone: true,
  imports: [NgIcon],
  providers: [
    DestroyManager,
    provideIcons({
      phosphorArrowLeftBold,
      phosphorArrowRightBold,
      phosphorClockCounterClockwiseBold,
    }),
  ],
  templateUrl: './executive-summary-archive.component.html',
  styleUrls: ['../../shared/archive.css'],
})
export class ExecutiveSummaryArchiveComponent implements OnInit {
  sprints: ExecSummaryVersion[] = [];
  isLoading = true;

  constructor(
    private dataService: ExecSummaryDataService,
    private dm: DestroyManager,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.dataService.getArchive(this.dm).subscribe({
      next: (data) => {
        this.sprints = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  openSprint(version: ExecSummaryVersion): void {
    this.router.navigate(['/executive-summary/history'], {
      queryParams: { version: version.versionId, sprint: version.sprintName },
    });
  }

  goBack(): void {
    this.router.navigate(['/scorecard'], { queryParams: { tab: 0 } });
  }

  goToHistory(): void {
    this.router.navigate(['/executive-summary/history']);
  }

  formatTimestamp(ts: string): string {
    if (!ts) return '';
    const d = new Date(ts);
    return (
      d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) +
      ' at ' +
      d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    );
  }
}
