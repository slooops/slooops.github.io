import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LineChartComponent } from './line-chart.component';

describe('LineChartComponent', () => {
  let component: LineChartComponent;
  let fixture: ComponentFixture<LineChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LineChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.points).toEqual([]);
    expect(component.lineColor).toBe('#00bceb');
    expect(component.showDataLabels).toBeFalse();
    expect(component.labelInterval).toBe(2);
  });

  it('should update chart paths on ngOnChanges with data', () => {
    component.points = [
      { label: 'Jan', value: 10 },
      { label: 'Feb', value: 20 },
      { label: 'Mar', value: 30 },
    ];
    component.ngOnChanges();
    expect(component.linePath).toBeTruthy();
    expect(component.dots.length).toBe(3);
  });

  it('should have empty paths with no data', () => {
    component.points = [];
    component.ngOnChanges();
    expect(component.linePath).toBe('');
  });
});
