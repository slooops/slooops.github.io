import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HealthRingComponent } from './health-ring.component';

describe('HealthRingComponent', () => {
  let component: HealthRingComponent;
  let fixture: ComponentFixture<HealthRingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HealthRingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HealthRingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input values', () => {
    expect(component.totalIncidents).toBe(0);
    expect(component.successPct).toBe(0);
    expect(component.errorPct).toBe(0);
    expect(component.showMeta).toBeTrue();
  });

  it('should update dasharray on ngOnChanges', () => {
    component.successPct = 75;
    component.errorPct = 25;
    component.ngOnChanges();
    expect(component.successLabel).toBe('75');
    expect(component.errorLabel).toBe('25');
  });

  it('should clamp success percentage to 100', () => {
    component.successPct = 150;
    component.errorPct = 0;
    component.ngOnChanges();
    expect(component.successLabel).toBe('100');
  });

  it('should clamp negative percentages to 0', () => {
    component.successPct = -10;
    component.errorPct = -5;
    component.ngOnChanges();
    expect(component.successLabel).toBe('0');
    expect(component.errorLabel).toBe('0');
  });

  it('should handle non-finite values safely', () => {
    component.successPct = NaN;
    component.errorPct = Infinity;
    component.ngOnChanges();
    expect(component.successLabel).toBe('0');
    expect(component.errorLabel).toBe('100');
  });
});
