import { ComponentFixture, TestBed } from '@angular/core/testing';

import { O2cBillingScheduleComponent } from './o2c-billing-schedule.component';

describe('O2cBillingScheduleComponent', () => {
  let component: O2cBillingScheduleComponent;
  let fixture: ComponentFixture<O2cBillingScheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [O2cBillingScheduleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(O2cBillingScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
