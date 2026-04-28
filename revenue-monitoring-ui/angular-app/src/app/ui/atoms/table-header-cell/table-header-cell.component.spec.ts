import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableHeaderCellComponent } from './table-header-cell.component';

describe('TableHeaderCellComponent', () => {
  let component: TableHeaderCellComponent;
  let fixture: ComponentFixture<TableHeaderCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableHeaderCellComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TableHeaderCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.isSortable).toBeFalse();
    expect(component.sortDirection).toBeUndefined();
    expect(component.align).toBe('left');
  });

  it('should emit sort when isSortable is true', () => {
    const spy = jasmine.createSpy('sort');
    component.sort.subscribe(spy);
    component.isSortable = true;
    component.onSort();
    expect(spy).toHaveBeenCalled();
  });

  it('should not emit sort when isSortable is false', () => {
    const spy = jasmine.createSpy('sort');
    component.sort.subscribe(spy);
    component.isSortable = false;
    component.onSort();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should accept sortDirection input', () => {
    component.sortDirection = 'asc';
    fixture.detectChanges();
    expect(component.sortDirection).toBe('asc');
  });
});
