import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconComponent } from './icon.component';

describe('IconComponent', () => {
  let component: IconComponent;
  let fixture: ComponentFixture<IconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input values', () => {
    expect(component.name).toBe('');
    expect(component.size).toBe('1rem');
    expect(component.ariaLabel).toBeUndefined();
  });

  it('should return search-icon class for "search" name', () => {
    component.name = 'search';
    expect(component.iconClasses).toBe('search-icon');
  });

  it('should return close-icon class for "close" name', () => {
    component.name = 'close';
    expect(component.iconClasses).toBe('close-icon');
  });

  it('should return download-icon class for "download" name', () => {
    component.name = 'download';
    expect(component.iconClasses).toBe('download-icon');
  });

  it('should return refresh icon class', () => {
    component.name = 'refresh';
    expect(component.iconClasses).toBe('ph-refresh-icon');
  });

  it('should return fit-icon for unknown name', () => {
    component.name = 'unknown-icon-name';
    expect(component.iconClasses).toBe('fit-icon');
  });

  it('should return delayed-icon class', () => {
    component.name = 'delayed';
    expect(component.iconClasses).toBe('delayed-icon');
  });

  it('should return in-progress-icon class', () => {
    component.name = 'in-progress';
    expect(component.iconClasses).toBe('in-progress-icon');
  });
});
