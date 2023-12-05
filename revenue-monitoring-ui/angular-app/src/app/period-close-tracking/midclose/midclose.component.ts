import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
  CuiTableOptions,
  CuiTableColumnOption,
} from '@cisco-ngx/cui-components';
import { CngProgressbarColor } from '@cisco/cui-ng';
import { ApiHttpService } from 'src/app/providers/http.service';
import { PeriodCloseTrackingComponent } from '../period-close-tracking.component';
import { DataService } from 'src/app/providers/data.service';

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
})
export class MidcloseComponent extends PeriodCloseTrackingComponent {
  constructor(http: ApiHttpService, dataService: DataService) {
    super(http, dataService);
  }

  username: string = 'Admin';

  showCommentSave: boolean = false;
  updatedComments: string;

  updateComments() {
    let comments = this.updatedComments + ',MIDCLOSE';
    this.http
      .post('pclose-update-dashboard-comments', comments)
      .subscribe((data: any) => {
        this.updatedComments = '';
        this.showCommentSave = false;
        this.getComments();
      });
  }
}
