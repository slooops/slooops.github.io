import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContinuousMonitoringComponent } from './continuous-monitoring.component';

describe('ContinuousMonitoringComponent', () => {
  let component: ContinuousMonitoringComponent;
  let fixture: ComponentFixture<ContinuousMonitoringComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContinuousMonitoringComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContinuousMonitoringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
