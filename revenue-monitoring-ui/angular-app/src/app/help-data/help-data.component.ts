import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-help-data',
  templateUrl: './help-data.component.html',
  styleUrl: './help-data.component.css',
})
export class HelpDataComponent {
  helpSections = HELP_SECTIONS;
  @Output() closeDropdown = new EventEmitter<void>();
  expandedSection: string | null = null;

  toggleSection(dashboard: string): void {
    this.expandedSection =
      this.expandedSection === dashboard ? null : dashboard;
  }
}

export interface HelpSection {
  dashboard: string;
  helpText: string;
}

export const HELP_SECTIONS: HelpSection[] = [
  { dashboard: 'Period Close Dashboard', helpText: 'Period close dashboard' },
  { dashboard: 'Large Deal Tracker', helpText: 'Large deal tracker' },
  { dashboard: 'ROL Monitoring', helpText: 'ROL ' },
];
