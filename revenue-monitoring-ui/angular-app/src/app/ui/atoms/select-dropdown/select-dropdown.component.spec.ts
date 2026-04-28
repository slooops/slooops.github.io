import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectDropdownComponent } from './select-dropdown.component';

describe('SelectDropdownComponent', () => {
  let component: SelectDropdownComponent;
  let fixture: ComponentFixture<SelectDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectDropdownComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectDropdownComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    fixture.detectChanges();
    expect(component.options).toEqual([]);
    expect(component.placeholder).toBe('Select an option');
    expect(component.value).toBe('');
    expect(component.isDisabled).toBeFalse();
  });

  it('should emit value on onChange', () => {
    fixture.detectChanges();
    const spy = jasmine.createSpy('valueChange');
    component.valueChange.subscribe(spy);
    const event = { target: { value: 'option1' } } as unknown as Event;
    component.onChange(event);
    expect(spy).toHaveBeenCalledWith('option1');
  });

  it('should update value property on onChange', () => {
    fixture.detectChanges();
    const event = { target: { value: 'test-value' } } as unknown as Event;
    component.onChange(event);
    expect(component.value).toBe('test-value');
  });

  it('should accept options input', () => {
    component.options = [
      { label: 'One', value: '1' },
      { label: 'Two', value: '2' },
    ];
    fixture.detectChanges();
    expect(component.options.length).toBe(2);
  });
});
