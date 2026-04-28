import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgeComponent } from './badge.component';

describe('BadgeComponent', () => {
  let component: BadgeComponent;
  let fixture: ComponentFixture<BadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have empty label by default', () => {
    expect(component.label).toBe('');
  });

  it('should have default variant', () => {
    expect(component.variant).toBe('default');
  });

  it('should compute badgeClasses with default variant', () => {
    expect(component.badgeClasses).toBe('fit-badge fit-badge--default');
  });

  it('should compute badgeClasses with success variant', () => {
    component.variant = 'success';
    expect(component.badgeClasses).toBe('fit-badge fit-badge--success');
  });

  it('should compute badgeClasses with error variant', () => {
    component.variant = 'danger';
    expect(component.badgeClasses).toBe('fit-badge fit-badge--danger');
  });

  it('should compute badgeClasses with warning variant', () => {
    component.variant = 'warning';
    expect(component.badgeClasses).toBe('fit-badge fit-badge--warning');
  });

  it('should accept a label input', () => {
    component.label = 'Active';
    fixture.detectChanges();
    expect(component.label).toBe('Active');
  });
});
