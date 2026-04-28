import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MultiSelectDropdownComponent } from './multi-select-dropdown.component';

describe('MultiSelectDropdownComponent', () => {
  let component: MultiSelectDropdownComponent;
  let fixture: ComponentFixture<MultiSelectDropdownComponent>;

  const options = [
    { label: 'Red', value: 'red' },
    { label: 'Green', value: 'green' },
    { label: 'Blue', value: 'blue' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiSelectDropdownComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MultiSelectDropdownComponent);
    component = fixture.componentInstance;
    component.options = options;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.selected).toEqual([]);
    expect(component.placeholder).toBe('Select...');
    expect(component.isOpen).toBeFalse();
    expect(component.searchTerm).toBe('');
  });

  it('should show placeholder when nothing selected', () => {
    component.selected = [];
    expect(component.displayText).toBe('Select...');
  });

  it('should show label when exactly one item selected', () => {
    component.selected = ['red'];
    expect(component.displayText).toBe('Red');
  });

  it('should show count when multiple items selected', () => {
    component.selected = ['red', 'green'];
    expect(component.displayText).toBe('2 selected');
  });

  it('should filter options by searchTerm', () => {
    component.searchTerm = 'gr';
    expect(component.filteredOptions.length).toBe(1);
    expect(component.filteredOptions[0].value).toBe('green');
  });

  it('should return all options when searchTerm is empty', () => {
    component.searchTerm = '';
    expect(component.filteredOptions.length).toBe(3);
  });

  it('should toggle option on/off', () => {
    component.selected = [];
    component.toggleOption('red');
    expect(component.selected).toContain('red');
    component.toggleOption('red');
    expect(component.selected).not.toContain('red');
  });

  it('should emit selectionChange on toggleOption', () => {
    const spy = jasmine.createSpy('selectionChange');
    component.selectionChange.subscribe(spy);
    component.toggleOption('blue');
    expect(spy).toHaveBeenCalledWith(['blue']);
  });

  it('should clear all selections', () => {
    component.selected = ['red', 'green'];
    component.clearAll();
    expect(component.selected).toEqual([]);
  });

  it('should emit empty array on clearAll', () => {
    const spy = jasmine.createSpy('selectionChange');
    component.selectionChange.subscribe(spy);
    component.clearAll();
    expect(spy).toHaveBeenCalledWith([]);
  });

  it('should correctly report isSelected', () => {
    component.selected = ['red'];
    expect(component.isSelected('red')).toBeTrue();
    expect(component.isSelected('blue')).toBeFalse();
  });

  it('should toggle dropdown', () => {
    component.toggleDropdown();
    expect(component.isOpen).toBeTrue();
  });

  it('should not toggle when disabled', () => {
    component.isDisabled = true;
    component.toggleDropdown();
    expect(component.isOpen).toBeFalse();
  });

  it('should close and clear searchTerm on toggle close', () => {
    component.isOpen = true;
    component.searchTerm = 'test';
    component.toggleDropdown();
    expect(component.isOpen).toBeFalse();
    expect(component.searchTerm).toBe('');
  });

  it('should update searchTerm on onSearchInput', () => {
    const input = document.createElement('input');
    input.value = 'gre';
    const event = new Event('input');
    Object.defineProperty(event, 'target', { value: input });
    component.onSearchInput(event);
    expect(component.searchTerm).toBe('gre');
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
