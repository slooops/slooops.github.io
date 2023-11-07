import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeriodCloseTrackingComponent } from './period-close-tracking.component';

describe('PeriodCloseTrackingComponent', () => {
  let component: PeriodCloseTrackingComponent;
  let fixture: ComponentFixture<PeriodCloseTrackingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PeriodCloseTrackingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PeriodCloseTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
