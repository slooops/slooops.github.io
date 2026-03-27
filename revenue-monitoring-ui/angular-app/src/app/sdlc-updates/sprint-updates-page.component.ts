import { Component } from '@angular/core';
import { SdlcExecUpdateComponent } from './sdlc-exec-update.component';
import { SdlcComponentAdoptionComponent } from './sdlc-component-adoption.component';

@Component({
  selector: 'app-sprint-updates-page',
  standalone: true,
  imports: [SdlcExecUpdateComponent, SdlcComponentAdoptionComponent],
  template: `
    <app-sdlc-exec-update [showEmailButton]="false" />
    <!-- <app-sdlc-component-adoption [showEmailButton]="false" /> -->
  `,
})
export class SprintUpdatesPageComponent {}
