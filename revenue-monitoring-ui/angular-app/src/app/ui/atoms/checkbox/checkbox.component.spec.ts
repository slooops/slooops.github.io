import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CheckboxComponent } from './checkbox.component';

describe('CheckboxComponent', () => {
  let component: CheckboxComponent;
  let fixture: ComponentFixture<CheckboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckboxComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.checked).toBeFalse();
    expect(component.isDisabled).toBeFalse();
    expect(component.label).toBeUndefined();
  });

  it('should toggle checked state on onToggle when not disabled', () => {
    component.checked = false;
    component.onToggle();
    expect(component.checked).toBeTrue();
  });

  it('should emit new checked state on toggle', () => {
    const spy = jasmine.createSpy('checkedChange');
    component.checkedChange.subscribe(spy);
    component.checked = false;
    component.onToggle();
    expect(spy).toHaveBeenCalledWith(true);
  });

  it('should not toggle when isDisabled is true', () => {
    component.checked = false;
    component.isDisabled = true;
    component.onToggle();
    expect(component.checked).toBeFalse();
  });

  it('should not emit when isDisabled is true', () => {
    const spy = jasmine.createSpy('checkedChange');
    component.checkedChange.subscribe(spy);
    component.isDisabled = true;
    component.onToggle();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should toggle from true to false', () => {
    component.checked = true;
    component.onToggle();
    expect(component.checked).toBeFalse();
  });
});
