import { Component } from '@angular/core';
import { AuthenticationService } from 'src/app/providers/authentication.service';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { O2cSubComponent } from './o2c-sub/o2c-sub.component';

@Component({
    selector: 'app-o2c-landing',
    templateUrl: './o2c-landing.component.html',
    styleUrls: ['./o2c-landing.component.css'],
    imports: [
    CommonModule,
    MatTabsModule,
    O2cSubComponent
  ],
  standalone: true
})
export class O2cLandingComponent {
  selectedTabIndex = 2;
  userName: string;

  constructor(private authService: AuthenticationService) {
    this.userName = this.authService.getUserName();
  }

  onTabChange(event: any): void {
    this.selectedTabIndex = event.index;
  }
}
