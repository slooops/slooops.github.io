import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { BusinessInsightsModule } from '../business-insights/business-insights.module';

import { IssueReportingComponent } from './issue-reporting.component';

describe('IssueReportingComponent', () => {
  let component: IssueReportingComponent;
  let fixture: ComponentFixture<IssueReportingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BusinessInsightsModule,
        HttpClientTestingModule,
        MatDialogModule,
        BrowserAnimationsModule,
        RouterTestingModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IssueReportingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
