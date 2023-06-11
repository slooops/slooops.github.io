import { Component, OnInit } from '@angular/core';
import { ApiHttpService } from 'src/app/providers/http.service';
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
    this.http
      .post('pclose-update-dashboard-comments', this.updatedComments)
      .subscribe((data: any) => {
        console.log(data);
        this.updatedComments = '';
        this.showCommentSave = false;
        this.getComments();
      });
  }
}
