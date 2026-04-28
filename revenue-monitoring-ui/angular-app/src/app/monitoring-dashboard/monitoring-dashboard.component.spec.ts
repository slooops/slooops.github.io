import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DatePipe } from '@angular/common';

import { MonitoringDashboardComponent } from './monitoring-dashboard.component';

describe('MonitoringDashboardComponent', () => {
  let component: MonitoringDashboardComponent<any>;
  let fixture: ComponentFixture<MonitoringDashboardComponent<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MonitoringDashboardComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      providers: [DatePipe],
    }).compileComponents();

    fixture = TestBed.createComponent(MonitoringDashboardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('urls', {});
    fixture.componentRef.setInput('keysToMap', []);
    fixture.componentRef.setInput('componentName', 'test');
    fixture.componentRef.setInput('columnsToFilter', []);
    fixture.componentRef.setInput('userContext', { roles: [], isAdmin: false });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
