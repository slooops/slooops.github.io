import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
    component.totalItems = 100;
    component.pageSize = 25;
    component.pageIndex = 0;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate totalPages correctly', () => {
    expect(component.totalPages).toBe(4);
  });

  it('should calculate startItem correctly', () => {
    expect(component.startItem).toBe(1);
  });

  it('should calculate endItem correctly', () => {
    expect(component.endItem).toBe(25);
  });

  it('should return 0 for startItem when totalItems is 0', () => {
    component.totalItems = 0;
    expect(component.startItem).toBe(0);
  });

  it('should cap endItem at totalItems', () => {
    component.pageIndex = 3;
    expect(component.endItem).toBe(100);
  });

  it('should report hasPrevious as false on first page', () => {
    component.pageIndex = 0;
    expect(component.hasPrevious).toBeFalse();
  });

  it('should report hasPrevious as true on page > 0', () => {
    component.pageIndex = 1;
    expect(component.hasPrevious).toBeTrue();
  });

  it('should report hasNext as true when not on last page', () => {
    component.pageIndex = 0;
    expect(component.hasNext).toBeTrue();
  });

  it('should report hasNext as false on last page', () => {
    component.pageIndex = 3;
    expect(component.hasNext).toBeFalse();
  });

  it('should emit pageChange with decremented index on onPrevious', () => {
    const spy = jasmine.createSpy('pageChange');
    component.pageChange.subscribe(spy);
    component.pageIndex = 2;
    component.onPrevious();
    expect(spy).toHaveBeenCalledWith({ pageIndex: 1, pageSize: 25 });
  });

  it('should not emit on onPrevious when already on first page', () => {
    const spy = jasmine.createSpy('pageChange');
    component.pageChange.subscribe(spy);
    component.pageIndex = 0;
    component.onPrevious();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should emit pageChange with incremented index on onNext', () => {
    const spy = jasmine.createSpy('pageChange');
    component.pageChange.subscribe(spy);
    component.pageIndex = 0;
    component.onNext();
    expect(spy).toHaveBeenCalledWith({ pageIndex: 1, pageSize: 25 });
  });

  it('should not emit on onNext when already on last page', () => {
    const spy = jasmine.createSpy('pageChange');
    component.pageChange.subscribe(spy);
    component.pageIndex = 3;
    component.onNext();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should emit pageChange with pageIndex 0 on page size change', () => {
    const spy = jasmine.createSpy('pageChange');
    component.pageChange.subscribe(spy);
    component.onPageSizeSelectChange('50');
    expect(spy).toHaveBeenCalledWith({ pageIndex: 0, pageSize: 50 });
  });

  it('should generate pageSizeSelectOptions from pageSizeOptions', () => {
    component.pageSizeOptions = [10, 25];
    const opts = component.pageSizeSelectOptions;
    expect(opts.length).toBe(2);
    expect(opts[0].label).toBe('10 per page');
    expect(opts[0].value).toBe('10');
  });
});
