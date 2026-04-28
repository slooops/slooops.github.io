import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TextInputComponent } from './text-input.component';

describe('TextInputComponent', () => {
  let component: TextInputComponent;
  let fixture: ComponentFixture<TextInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TextInputComponent);
    component = fixture.componentInstance;
    component.debounceMs = 0;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.value).toBe('');
    expect(component.placeholder).toBe('');
    expect(component.type).toBe('text');
    expect(component.isDisabled).toBeFalse();
    expect(component.noBorder).toBeFalse();
  });

  it('should compute base input class', () => {
    expect(component.inputClasses).toContain('fit-input');
  });

  it('should include icon-left class', () => {
    component.iconName = 'search';
    component.iconPosition = 'left';
    expect(component.inputClasses).toContain('fit-input--icon-left');
  });

  it('should include icon-right class', () => {
    component.iconName = 'search';
    component.iconPosition = 'right';
    expect(component.inputClasses).toContain('fit-input--icon-right');
  });

  it('should include no-border class when noBorder is true', () => {
    component.noBorder = true;
    expect(component.inputClasses).toContain('fit-input--no-border');
  });

  it('should emit submitted on Enter key', () => {
    const spy = jasmine.createSpy('submitted');
    component.submitted.subscribe(spy);
    component.value = 'hello';
    component.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(spy).toHaveBeenCalledWith('hello');
  });

  it('should not emit submitted on other keys', () => {
    const spy = jasmine.createSpy('submitted');
    component.submitted.subscribe(spy);
    component.onKeydown(new KeyboardEvent('keydown', { key: 'a' }));
    expect(spy).not.toHaveBeenCalled();
  });

  it('should update value on onInput', fakeAsync(() => {
    const input = document.createElement('input');
    input.value = 'typed text';
    const event = new Event('input');
    Object.defineProperty(event, 'target', { value: input });
    component.onInput(event);
    tick(0);
    expect(component.value).toBe('typed text');
  }));

  it('should unsubscribe on destroy', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
