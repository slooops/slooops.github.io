import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonitoringOnboardingComponent } from './monitoring-onboarding.component';
import { AuthenticationService } from '../providers/authentication.service';

describe('MonitoringOnboardingComponent', () => {
  let component: MonitoringOnboardingComponent;
  let fixture: ComponentFixture<MonitoringOnboardingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonitoringOnboardingComponent],
      providers: [
        {
          provide: AuthenticationService,
          useValue: {
            getControlTowerSupportAgentApiUrl: () => '',
            getHostUrl: () => '',
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MonitoringOnboardingComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
