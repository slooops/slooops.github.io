import { Component } from '@angular/core';
import { ApiHttpService } from 'src/app/providers/http.service';
import { PeriodCloseTrackingComponent } from '../period-close-tracking.component';
import { DataService } from 'src/app/providers/data.service';

@Component({
  selector: 'app-preclose',
  templateUrl: './preclose.component.html',
  styleUrls: ['./preclose.component.css'],
})
export class PrecloseComponent extends PeriodCloseTrackingComponent {
  username: string = 'Admin';
  constructor(http: ApiHttpService, dataService: DataService) {
    super(http, dataService);
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
