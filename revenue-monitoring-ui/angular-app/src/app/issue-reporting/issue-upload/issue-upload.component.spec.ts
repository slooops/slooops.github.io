import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { IssueUploadComponent } from './issue-upload.component';

describe('IssueUploadComponent', () => {
  let component: IssueUploadComponent;
  let fixture: ComponentFixture<IssueUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        IssueUploadComponent,
        HttpClientTestingModule,
        MatDialogModule,
        BrowserAnimationsModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: jasmine.createSpyObj('MatDialogRef', ['close']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IssueUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
