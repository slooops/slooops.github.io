import { Component } from '@angular/core';
import { ApiHttpService } from 'src/app/providers/http.service';
import { PeriodCloseTrackingComponent } from '../period-close-tracking.component';

@Component({
  selector: 'app-preclose',
  templateUrl: './preclose.component.html',
  styleUrls: ['./preclose.component.css'],
})
export class PrecloseComponent extends PeriodCloseTrackingComponent {
  constructor(http: ApiHttpService) {
    super(http);
  }

  showCommentSave: boolean = false;
  updatedComments: string;

  updateComments() {
    let comments = this.updatedComments + ',PRECLOSE';
    this.http
      .post('pclose-update-dashboard-comments', comments)
      .subscribe((data: any) => {
        this.updatedComments = '';
        this.showCommentSave = false;
        this.getComments();
      });
  }
}
