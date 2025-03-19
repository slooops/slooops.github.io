import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessInsightsComponent } from './business-insights.component';

describe('BusinessInsightsComponent', () => {
  let component: BusinessInsightsComponent;
  let fixture: ComponentFixture<BusinessInsightsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessInsightsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BusinessInsightsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
