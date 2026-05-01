import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Wd0HistoricalDataComponent } from './wd0-historical-data.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { BusinessInsightsModule } from '../business-insights/business-insights.module';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';

describe('Wd0HistoricalDataComponent', () => {
  let component: Wd0HistoricalDataComponent;
  let fixture: ComponentFixture<Wd0HistoricalDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessInsightsModule, MatDialogModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Wd0HistoricalDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default loading state', () => {
    expect(component.loading).toBeTrue();
  });
});
