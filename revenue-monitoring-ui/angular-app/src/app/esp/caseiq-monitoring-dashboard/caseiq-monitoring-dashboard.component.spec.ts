import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CaseiqMonitoringDashboardComponent } from './caseiq-monitoring-dashboard.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('CaseiqMonitoringDashboardComponent', () => {
  let component: CaseiqMonitoringDashboardComponent;
  let fixture: ComponentFixture<CaseiqMonitoringDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CaseiqMonitoringDashboardComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        BrowserAnimationsModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CaseiqMonitoringDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
