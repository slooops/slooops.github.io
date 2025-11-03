import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
// import { FormControl, FormGroup } from '@angular/forms';
// import {
//   CuiTableOptions,
//   CuiTableColumnOption,
// } from '@cisco-ngx/cui-components';
// import { CngProgressbarColor } from '@cisco/cui-ng';
import { ApiHttpService } from 'src/app/providers/http.service';
import { PeriodCloseTrackingComponent } from '../period-close-tracking.component';
import { DataService } from 'src/app/providers/data.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { AuthenticationService } from 'src/app/providers/authentication.service';
import { MenuService } from 'src/app/providers/menu.service';
import { ActivatedRoute, Router } from '@angular/router';

export interface PeriodClose {
  operatingUnit: string;
  arInterface: string;
  invoicing: string;
  accounting: string;
  glPosting: string;
  ngccrm: string;
  interCompany: string;
}

@Component({
  selector: 'app-midclose',
  templateUrl: './midclose.component.html',
  styleUrls: ['./midclose.component.css'],
  providers: [DestroyManager],
})
export class MidcloseComponent extends PeriodCloseTrackingComponent {
  constructor(
    http: ApiHttpService,
    destroyManager: DestroyManager,
    authService: AuthenticationService,
    menuService: MenuService,
    route: ActivatedRoute,
    cdr: ChangeDetectorRef,
    router: Router
  ) {
    super(http, destroyManager, authService, menuService, route, cdr, router);
  }
}
