import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { CuiTableOptions, CuiTableColumnOption } from '@cisco-ngx/cui-components';
import { CngProgressbarColor } from '@cisco/cui-ng';
import { ApiHttpService } from 'src/app/providers/http.service';
import { PeriodCloseTrackingComponent } from '../period-close-tracking.component';

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
  styleUrls: ['./midclose.component.css']
})
export class MidcloseComponent extends PeriodCloseTrackingComponent implements OnInit {
  constructor(http:ApiHttpService) {
    super(http);
  }
}
