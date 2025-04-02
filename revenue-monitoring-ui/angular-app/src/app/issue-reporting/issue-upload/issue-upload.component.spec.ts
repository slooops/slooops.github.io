import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssueUploadComponent } from './issue-upload.component';

describe('IssueUploadComponent', () => {
  let component: IssueUploadComponent;
  let fixture: ComponentFixture<IssueUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueUploadComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IssueUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
