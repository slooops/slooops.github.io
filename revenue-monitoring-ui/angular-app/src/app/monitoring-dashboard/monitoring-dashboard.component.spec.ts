import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonitoringDashboardComponent } from './monitoring-dashboard.component';

describe('MonitoringDashboardComponent', () => {
  let component: MonitoringDashboardComponent<any>;
  let fixture: ComponentFixture<MonitoringDashboardComponent<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonitoringDashboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MonitoringDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
