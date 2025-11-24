import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtmfBarLineChartComponent } from './atmf-bar-line-chart.component';

describe('AtmfBarLineChartComponent', () => {
  let component: AtmfBarLineChartComponent;
  let fixture: ComponentFixture<AtmfBarLineChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtmfBarLineChartComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AtmfBarLineChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
