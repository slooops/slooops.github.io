import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';

import { UserAssignmentComponent } from './user-assignment.component';

describe('UserAssignmentComponent', () => {
  let component: UserAssignmentComponent;
  let fixture: ComponentFixture<UserAssignmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        UserAssignmentComponent,
        HttpClientTestingModule,
        ReactiveFormsModule,
        CommonModule,
      ],
      providers: [DatePipe],
    }).compileComponents();

    fixture = TestBed.createComponent(UserAssignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
