import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ApiHttpService } from 'src/app/providers/http.service';
import { PeriodCloseTrackingComponent } from '../period-close-tracking.component';
import { DataService } from 'src/app/providers/data.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { AuthenticationService } from 'src/app/providers/authentication.service';
import { MenuService } from 'src/app/providers/menu.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-preclose',
  templateUrl: './preclose.component.html',
  styleUrls: ['./preclose.component.css'],
  providers: [DestroyManager],
})
export class PrecloseComponent extends PeriodCloseTrackingComponent {
  username: string = 'Admin';
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

  showCommentSave: boolean = false;
  updatedComments: string;
  dataSource: any;

  updateComments() {
    let comments = this.updatedComments + ',PRECLOSE';
    this.http
      .post('pclose-update-dashboard-comments', comments, this.destroyManager)
      .subscribe((data: any) => {
        this.updatedComments = '';
        this.showCommentSave = false;
        this.getComments();
      });
  }
}
