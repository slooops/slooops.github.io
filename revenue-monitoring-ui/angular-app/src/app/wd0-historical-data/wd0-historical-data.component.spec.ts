import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Wd0HistoricalDataComponent } from './wd0-historical-data.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BusinessInsightsModule } from '../business-insights/business-insights.module';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';

describe('Wd0HistoricalDataComponent', () => {
  let component: Wd0HistoricalDataComponent;
  let fixture: ComponentFixture<Wd0HistoricalDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BusinessInsightsModule,
        HttpClientTestingModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        MatDialogModule,
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
