import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
  CuiTableOptions,
  CuiTableColumnOption,
} from '@cisco-ngx/cui-components';
import { CngProgressbarColor } from '@cisco/cui-ng';
import { ApiHttpService } from 'src/app/providers/http.service';
import { NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap';
import { DatePipe } from '@angular/common';
import { PeriodCloseTrackingComponent } from '../period-close-tracking.component';

@Component({
  selector: 'app-preclose',
  templateUrl: './preclose.component.html',
  styleUrls: ['./preclose.component.css'],
})
export class PrecloseComponent
  extends PeriodCloseTrackingComponent
  implements OnInit
{
  constructor(http: ApiHttpService) {
    super(http);
  }

  showCommentSave: boolean = false;
  updatedComments: string;

  updateComments() {
    console.log(this.updatedComments);
  }
}
