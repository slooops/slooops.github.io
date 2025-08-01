import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DestroyManager } from '../../providers/destroy-manager.service';
import { ApiHttpService } from '../../providers/http.service';
import { MatTableDataSource } from '@angular/material/table';
import { AuthenticationService } from 'src/app/providers/authentication.service';

@Component({
  selector: 'app-o2c-landing',
  templateUrl: './o2c-landing.component.html',
  styleUrls: ['./o2c-landing.component.css'],
})
export class O2cLandingComponent {
  selectedTabIndex = 0;
  userName: string = this.authService.getUserName();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: ApiHttpService,
    private destroyManager: DestroyManager,
    private authService: AuthenticationService
  ) {}

  dummyData1 = [
    {
      INCIDENT_TYPE: 'Order Entry',
      INCIDENT_COUNT: 5,
      INCIDENT_VALUE: 4,
    },
    {
      INCIDENT_TYPE: 'Manual Entry',
      INCIDENT_COUNT: 3,
      INCIDENT_VALUE: 2,
    },
    {
      INCIDENT_TYPE: 'Data Entry',
      INCIDENT_COUNT: 2,
      INCIDENT_VALUE: 1.2,
    },
  ];

  onTabChange(event: any): void {
    this.selectedTabIndex = event.index;
  }
}
