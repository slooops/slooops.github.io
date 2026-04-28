import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterBarComponent } from './filter-bar.component';

describe('FilterBarComponent', () => {
  let component: FilterBarComponent;
  let fixture: ComponentFixture<FilterBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.searchValue).toBe('');
    expect(component.roleOptions).toEqual([]);
    expect(component.selectedRoles).toEqual([]);
    expect(component.selectedStatuses).toEqual([]);
    expect(component.isFullAdmin).toBeFalse();
    expect(component.canCreateSubAdmin).toBeFalse();
    expect(component.totalCount).toBe(0);
    expect(component.selectedCount).toBe(0);
  });

  it('should emit searchChange on onSearchChange', () => {
    const spy = jasmine.createSpy('searchChange');
    component.searchChange.subscribe(spy);
    component.onSearchChange('query');
    expect(spy).toHaveBeenCalledWith('query');
  });

  it('should emit roleFilterChange on onRoleChange', () => {
    const spy = jasmine.createSpy('roleFilterChange');
    component.roleFilterChange.subscribe(spy);
    component.onRoleChange(['admin']);
    expect(spy).toHaveBeenCalledWith(['admin']);
  });

  it('should emit enabledFilterChange on onStatusChange', () => {
    const spy = jasmine.createSpy('enabledFilterChange');
    component.enabledFilterChange.subscribe(spy);
    component.onStatusChange(['Y']);
    expect(spy).toHaveBeenCalledWith(['Y']);
  });

  it('should emit addUserClick on onAddUser', () => {
    const spy = jasmine.createSpy('addUserClick');
    component.addUserClick.subscribe(spy);
    component.onAddUser();
    expect(spy).toHaveBeenCalled();
  });

  it('should have two status options by default', () => {
    expect(component.statusOptions.length).toBe(2);
    expect(component.statusOptions[0].value).toBe('Y');
    expect(component.statusOptions[1].value).toBe('N');
  });
});
