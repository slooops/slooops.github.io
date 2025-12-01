import { Component } from '@angular/core';
import { AuthenticationService } from 'src/app/providers/authentication.service';

@Component({
    selector: 'app-o2c-landing',
    templateUrl: './o2c-landing.component.html',
    styleUrls: ['./o2c-landing.component.css'],
    standalone: false
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
