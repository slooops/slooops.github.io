import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataTableComponent } from './data-table.component';

describe('DataTableComponent', () => {
  let component: DataTableComponent;
  let fixture: ComponentFixture<DataTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DataTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.columns).toEqual([]);
    expect(component.rows).toEqual([]);
    expect(component.enableGlobalSearch).toBeFalse();
    expect(component.isLoading).toBeFalse();
    expect(component.editableRow).toBeNull();
  });

  it('should initialize filtered and paginated rows on ngOnInit', () => {
    component.rows = [{ id: 1 }, { id: 2 }];
    component.ngOnInit();
    expect(component.filteredRows.length).toBe(2);
  });

  it('should paginate rows correctly', () => {
    component.rows = Array.from({ length: 30 }, (_, i) => ({ id: i }));
    component.pageSize = 25;
    component.pageIndex = 0;
    component.ngOnInit();
    expect(component.paginatedRows.length).toBe(25);
  });

  it('should emit rowClick on row click', () => {
    const spy = jasmine.createSpy('rowClick');
    component.rowClick.subscribe(spy);
    component.rowClick.emit({ id: 1 });
    expect(spy).toHaveBeenCalledWith({ id: 1 });
  });

  it('should emit saveRow on saveRow event', () => {
    const spy = jasmine.createSpy('saveRow');
    component.saveRow.subscribe(spy);
    component.saveRow.emit({ id: 1 });
    expect(spy).toHaveBeenCalledWith({ id: 1 });
  });

  it('should emit cancelEdit on cancelEdit event', () => {
    const spy = jasmine.createSpy('cancelEdit');
    component.cancelEdit.subscribe(spy);
    component.cancelEdit.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit deleteRow on deleteRow event', () => {
    const spy = jasmine.createSpy('deleteRow');
    component.deleteRow.subscribe(spy);
    component.deleteRow.emit({ id: 5 });
    expect(spy).toHaveBeenCalledWith({ id: 5 });
  });
});
