import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToggleSwitchComponent } from './toggle-switch.component';

describe('ToggleSwitchComponent', () => {
  let component: ToggleSwitchComponent;
  let fixture: ComponentFixture<ToggleSwitchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToggleSwitchComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToggleSwitchComponent);
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

  it('should toggle checked from false to true', () => {
    component.checked = false;
    component.onToggle();
    expect(component.checked).toBeTrue();
  });

  it('should toggle checked from true to false', () => {
    component.checked = true;
    component.onToggle();
    expect(component.checked).toBeFalse();
  });

  it('should emit new state on toggle', () => {
    const spy = jasmine.createSpy('checkedChange');
    component.checkedChange.subscribe(spy);
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
});
