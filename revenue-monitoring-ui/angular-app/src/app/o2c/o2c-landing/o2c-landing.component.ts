import { Component } from '@angular/core';
import { AuthenticationService } from 'src/app/providers/authentication.service';

@Component({
  selector: 'app-o2c-landing',
  templateUrl: './o2c-landing.component.html',
  styleUrls: ['./o2c-landing.component.css'],
})
export class O2cLandingComponent {
  selectedTabIndex = 2;
  userName: string = this.authService.getUserName();

  constructor(private authService: AuthenticationService) {}

  onTabChange(event: any): void {
    this.selectedTabIndex = event.index;
  }
}
