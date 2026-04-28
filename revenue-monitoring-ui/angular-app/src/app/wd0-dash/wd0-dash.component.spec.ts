import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Wd0DashComponent } from './wd0-dash.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BusinessInsightsModule } from '../business-insights/business-insights.module';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('Wd0DashComponent', () => {
  let component: Wd0DashComponent;
  let fixture: ComponentFixture<Wd0DashComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BusinessInsightsModule,
        HttpClientTestingModule,
        RouterTestingModule,
        BrowserAnimationsModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Wd0DashComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default state', () => {
    expect(component.refreshInterval).toBe(300000);
    expect(component.wd0ArMidCloseTableData).toEqual([]);
  });
});
