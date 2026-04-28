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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.options).toEqual([]);
    expect(component.placeholder).toBe('Select an option');
    expect(component.value).toBe('');
    expect(component.isDisabled).toBeFalse();
  });

  it('should emit value on onChange', () => {
    const spy = jasmine.createSpy('valueChange');
    component.valueChange.subscribe(spy);
    const select = document.createElement('select');
    select.value = 'option1';
    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: select });
    component.onChange(event);
    expect(spy).toHaveBeenCalledWith('option1');
  });

  it('should update value property on onChange', () => {
    const select = document.createElement('select');
    select.value = 'test-value';
    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: select });
    component.onChange(event);
    expect(component.value).toBe('test-value');
  });

  it('should accept options input', () => {
    component.options = [{ label: 'One', value: '1' }, { label: 'Two', value: '2' }];
    fixture.detectChanges();
    expect(component.options.length).toBe(2);
  });
});
