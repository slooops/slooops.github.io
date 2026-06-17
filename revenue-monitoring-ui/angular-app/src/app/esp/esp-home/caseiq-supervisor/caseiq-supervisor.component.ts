import { Component, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from 'src/app/providers/theme.service';
import {
  CaseiqIncidentsComponent,
  SupervisorIncident,
} from '../caseiq-incidents/caseiq-incidents.component';
import { CaseiqIncidentDetailComponent } from '../caseiq-incident-detail/caseiq-incident-detail.component';

@Component({
  selector: 'app-caseiq-supervisor',
  standalone: true,
  imports: [
    CommonModule,
    CaseiqIncidentsComponent,
    CaseiqIncidentDetailComponent,
  ],
  templateUrl: './caseiq-supervisor.component.html',
  styleUrls: ['./caseiq-supervisor.component.css'],
})
export class CaseiqSupervisorComponent {
  @HostBinding('class.dark-theme')
  get darkThemeClass(): boolean {
    return this.themeService.isDarkMode;
  }

  selectedIncident: SupervisorIncident | null = null;

  periodStatus = {
    periodName: 'JUN-26',
    periodEndDate: '06/20/2026',
    lastUpdated: '6/16/2026, 4:12:19 PM',
  };

  constructor(public themeService: ThemeService) {}

  onSharedStateOpen(incident: SupervisorIncident): void {
    this.selectedIncident = incident;
  }

  onBackFromDetail(): void {
    this.selectedIncident = null;
  }
}
