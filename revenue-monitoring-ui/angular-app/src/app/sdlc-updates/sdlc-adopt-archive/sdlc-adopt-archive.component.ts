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
  SdlcAdoptDataService,
  SdlcAdoptVersion,
} from '../sdlc-adopt-data.service';

@Component({
  selector: 'app-sdlc-adopt-archive',
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
  templateUrl: './sdlc-adopt-archive.component.html',
  styleUrls: ['../../shared/archive.css'],
})
export class SdlcAdoptArchiveComponent implements OnInit {
  sprints: SdlcAdoptVersion[] = [];
  isLoading = true;

  constructor(
    private dataService: SdlcAdoptDataService,
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

  openSprint(version: SdlcAdoptVersion): void {
    this.router.navigate(['/sdlc-adopt/history'], {
      queryParams: { version: version.versionId, sprint: version.sprintName },
    });
  }

  goBack(): void {
    this.router.navigate(['/scorecard'], { queryParams: { tab: 2 } });
  }

  goToHistory(): void {
    this.router.navigate(['/sdlc-adopt/history']);
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
