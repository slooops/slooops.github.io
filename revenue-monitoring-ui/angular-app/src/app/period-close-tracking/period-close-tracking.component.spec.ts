import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DatePipe } from '@angular/common';
import { DestroyManager } from '../providers/destroy-manager.service';

import { PeriodCloseTrackingComponent } from './period-close-tracking.component';

describe('PeriodCloseTrackingComponent', () => {
  let component: PeriodCloseTrackingComponent;
  let fixture: ComponentFixture<PeriodCloseTrackingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PeriodCloseTrackingComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      providers: [DestroyManager, DatePipe],
    }).compileComponents();

    fixture = TestBed.createComponent(PeriodCloseTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
