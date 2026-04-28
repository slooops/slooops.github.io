import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableFilterComponent, SimpleFilterOption } from './table-filter.component';

describe('TableFilterComponent', () => {
  let component: TableFilterComponent;
  let fixture: ComponentFixture<TableFilterComponent>;

  const options: SimpleFilterOption[] = [
    { label: 'All', value: 'all', default: true },
    { label: 'USD', value: 'usd', default: false },
    { label: 'EUR', value: 'eur', default: false },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableFilterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TableFilterComponent);
    component = fixture.componentInstance;
    component.options = options;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.columnLabel).toBe('USD');
    expect(component.isOpen).toBeFalse();
    expect(component.currentValue).toBe('');
  });

  it('should select default option on ngOnInit when no currentValue', () => {
    component.currentValue = '';
    component.options = options;
    component.ngOnInit();
    expect(component.selectedOption).toBe('all');
  });

  it('should use currentValue when provided on ngOnInit', () => {
    component.currentValue = 'eur';
    component.ngOnInit();
    expect(component.selectedOption).toBe('eur');
  });

  it('should update selectedOption on ngOnChanges when currentValue changes', () => {
    component.currentValue = 'usd';
    component.ngOnChanges();
    expect(component.selectedOption).toBe('usd');
  });

  it('should emit optionSelected on selectOption', () => {
    const spy = jasmine.createSpy('optionSelected');
    component.optionSelected.subscribe(spy);
    component.selectOption({ label: 'USD', value: 'usd', default: false });
    expect(spy).toHaveBeenCalledWith('usd');
  });

  it('should update selectedOption on selectOption', () => {
    component.selectOption({ label: 'EUR', value: 'eur', default: false });
    expect(component.selectedOption).toBe('eur');
  });

  it('should emit clickOutside when clicking outside app-table-filter', () => {
    const spy = jasmine.createSpy('clickOutside');
    component.clickOutside.subscribe(spy);
    const div = document.createElement('div');
    document.body.appendChild(div);
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'target', { value: div });
    component.onDocumentClick(event);
    expect(spy).toHaveBeenCalled();
    document.body.removeChild(div);
  });
});
