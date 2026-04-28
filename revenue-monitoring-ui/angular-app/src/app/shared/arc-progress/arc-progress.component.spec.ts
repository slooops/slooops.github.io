import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArcProgressComponent } from './arc-progress.component';

describe('ArcProgressComponent', () => {
  let component: ArcProgressComponent;
  let fixture: ComponentFixture<ArcProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArcProgressComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ArcProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.value).toBeNull();
    expect(component.max).toBe(100);
    expect(component.size).toBe(80);
    expect(component.strokeWidth).toBe(8);
    expect(component.showTrack).toBeFalse();
    expect(component.showValue).toBeTrue();
  });

  it('should detect no data when value is null', () => {
    component.value = null;
    expect(component.hasNoData).toBeTrue();
  });

  it('should detect data when value is set', () => {
    component.value = 50;
    expect(component.hasNoData).toBeFalse();
  });

  it('should show track when showTrack is true', () => {
    component.showTrack = true;
    component.value = 50;
    expect(component.shouldShowTrack).toBeTrue();
  });

  it('should show track when there is no data', () => {
    component.showTrack = false;
    component.value = null;
    expect(component.shouldShowTrack).toBeTrue();
  });

  it('should use noDataTrackColor when no data', () => {
    component.value = null;
    expect(component.effectiveTrackColor).toBe(component.noDataTrackColor);
  });

  it('should use trackColor when data is present', () => {
    component.value = 50;
    expect(component.effectiveTrackColor).toBe(component.trackColor);
  });

  it('should compute center as half of size', () => {
    component.size = 100;
    expect(component.center).toBe(50);
  });

  it('should compute radius correctly', () => {
    component.size = 100;
    component.strokeWidth = 10;
    expect(component.radius).toBe(45);
  });

  it('should detect open-ended metric', () => {
    component.max = null;
    expect(component.isOpenEnded).toBeTrue();
  });

  it('should not be open-ended when max is set', () => {
    component.max = 100;
    expect(component.isOpenEnded).toBeFalse();
  });

  it('should format value as K for thousands', () => {
    component.value = 5000;
    expect(component.formattedValue).toContain('5');
    expect(component.computedSuffix).toBe('K');
  });

  it('should format value as M for millions', () => {
    component.value = 2_000_000;
    expect(component.computedSuffix).toBe('M');
  });

  it('should format value as B for billions', () => {
    component.value = 1_000_000_000;
    expect(component.computedSuffix).toBe('B');
  });

  it('should use % suffix for PERCENT format', () => {
    component.value = 75;
    component.displayFormat = 'PERCENT';
    expect(component.computedSuffix).toBe('%');
  });

  it('should return em dash for formattedValue when no data', () => {
    component.value = null;
    expect(component.formattedValue).toBe('—');
  });

  it('should be currency for CURRENCY_M format', () => {
    component.value = 500;
    component.displayFormat = 'CURRENCY_M';
    expect(component.isCurrency).toBeTrue();
  });

  it('should not be currency for COUNT format', () => {
    component.value = 500;
    component.displayFormat = 'COUNT';
    expect(component.isCurrency).toBeFalse();
  });

  it('should have progress offset equal to arcLength when no data', () => {
    component.value = null;
    expect(component.progressOffset).toBe(component.arcLength);
  });
});
