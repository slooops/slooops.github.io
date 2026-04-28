import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CtmAlertsDashboardComponent } from './ctm-alerts-dashboard.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('CtmAlertsDashboardComponent', () => {
  let component: CtmAlertsDashboardComponent;
  let fixture: ComponentFixture<CtmAlertsDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CtmAlertsDashboardComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        BrowserAnimationsModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CtmAlertsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
