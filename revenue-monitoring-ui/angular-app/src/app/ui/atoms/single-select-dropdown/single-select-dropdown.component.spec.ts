import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SingleSelectDropdownComponent } from './single-select-dropdown.component';

describe('SingleSelectDropdownComponent', () => {
  let component: SingleSelectDropdownComponent;
  let fixture: ComponentFixture<SingleSelectDropdownComponent>;

  const options = [
    { label: 'Alpha', value: 'alpha' },
    { label: 'Beta', value: 'beta' },
    { label: 'Gamma', value: 'gamma' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SingleSelectDropdownComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SingleSelectDropdownComponent);
    component = fixture.componentInstance;
    component.options = options;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.selected).toBe('');
    expect(component.placeholder).toBe('Select...');
    expect(component.isOpen).toBeFalse();
    expect(component.searchTerm).toBe('');
  });

  it('should show placeholder when nothing selected', () => {
    component.selected = '';
    expect(component.displayText).toBe('Select...');
  });

  it('should show label when an option is selected', () => {
    component.selected = 'alpha';
    expect(component.displayText).toBe('Alpha');
  });

  it('should show raw value when selected value not in options', () => {
    component.selected = 'unknown';
    expect(component.displayText).toBe('unknown');
  });

  it('should filter options by search term', () => {
    component.searchTerm = 'bet';
    expect(component.filteredOptions.length).toBe(1);
    expect(component.filteredOptions[0].value).toBe('beta');
  });

  it('should return all options when searchTerm is empty', () => {
    component.searchTerm = '';
    expect(component.filteredOptions.length).toBe(3);
  });

  it('should toggle dropdown open state', () => {
    component.isOpen = false;
    component.toggleDropdown();
    expect(component.isOpen).toBeTrue();
  });

  it('should not toggle when disabled', () => {
    component.isDisabled = true;
    component.isOpen = false;
    component.toggleDropdown();
    expect(component.isOpen).toBeFalse();
  });

  it('should select an option and close dropdown', () => {
    component.isOpen = true;
    component.selectOption('beta');
    expect(component.selected).toBe('beta');
    expect(component.isOpen).toBeFalse();
  });

  it('should emit selectionChange on selectOption', () => {
    const spy = jasmine.createSpy('selectionChange');
    component.selectionChange.subscribe(spy);
    component.selectOption('gamma');
    expect(spy).toHaveBeenCalledWith('gamma');
  });

  it('should update searchTerm on onSearchInput', () => {
    const input = document.createElement('input');
    input.value = 'alp';
    const event = new Event('input');
    Object.defineProperty(event, 'target', { value: input });
    component.onSearchInput(event);
    expect(component.searchTerm).toBe('alp');
  });

  it('should close dropdown when clicking outside', () => {
    component.isOpen = true;
    const outside = document.createElement('div');
    const event = new MouseEvent('click');
    Object.defineProperty(event, 'target', { value: outside });
    component.onClickOutside(event);
    expect(component.isOpen).toBeFalse();
  });
});
