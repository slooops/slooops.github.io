import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyMonitoringComponent } from './daily-monitoring.component';

describe('DailyMonitoringComponent', () => {
  let component: DailyMonitoringComponent;
  let fixture: ComponentFixture<DailyMonitoringComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DailyMonitoringComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DailyMonitoringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
