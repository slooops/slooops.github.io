import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input values', () => {
    expect(component.label).toBe('');
    expect(component.variant).toBe('primary');
    expect(component.size).toBe('md');
    expect(component.isDisabled).toBeFalse();
    expect(component.isLoading).toBeFalse();
    expect(component.iconPosition).toBe('left');
    expect(component.type).toBe('button');
  });

  it('should return base class for primary variant', () => {
    expect(component.buttonClasses).toBe('fit-btn');
  });

  it('should include variant class for non-primary variant', () => {
    component.variant = 'secondary';
    expect(component.buttonClasses).toContain('fit-btn--secondary');
  });

  it('should include size class for non-medium size', () => {
    component.size = 'sm';
    expect(component.buttonClasses).toContain('fit-btn--sm');
  });

  it('should include loading class when isLoading is true', () => {
    component.isLoading = true;
    expect(component.buttonClasses).toContain('fit-btn--loading');
  });

  it('should include icon-left class when iconName set and position is left', () => {
    component.iconName = 'search';
    component.iconPosition = 'left';
    expect(component.buttonClasses).toContain('fit-btn--icon-left');
  });

  it('should include icon-right class when iconName set and position is right', () => {
    component.iconName = 'search';
    component.iconPosition = 'right';
    expect(component.buttonClasses).toContain('fit-btn--icon-right');
  });

  it('should emit clicked event on handleClick when not disabled or loading', () => {
    const spy = jasmine.createSpy('clicked');
    component.clicked.subscribe(spy);
    const event = new MouseEvent('click');
    component.handleClick(event);
    expect(spy).toHaveBeenCalledWith(event);
  });

  it('should not emit clicked when isDisabled is true', () => {
    const spy = jasmine.createSpy('clicked');
    component.clicked.subscribe(spy);
    component.isDisabled = true;
    component.handleClick(new MouseEvent('click'));
    expect(spy).not.toHaveBeenCalled();
  });

  it('should not emit clicked when isLoading is true', () => {
    const spy = jasmine.createSpy('clicked');
    component.clicked.subscribe(spy);
    component.isLoading = true;
    component.handleClick(new MouseEvent('click'));
    expect(spy).not.toHaveBeenCalled();
  });
});
