import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuComponent, NavItem } from './menu.component';

describe('MenuComponent', () => {
  let component: MenuComponent;
  let fixture: ComponentFixture<MenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.isAdmin).toBeFalse();
    expect(component.userRoles).toEqual([]);
    expect(component.currentUrl).toBe('');
    expect(component.collapsed).toBeTrue();
    expect(component.activeDrawer).toBeNull();
  });

  it('should emit navigateEvent when navigating to route', () => {
    const spy = jasmine.createSpy('navigateEvent');
    component.navigateEvent.subscribe(spy);
    const item: NavItem = { label: 'Test', icon: 'x', route: '/some-route' };
    component.navigateTo(item);
    expect(spy).toHaveBeenCalledWith('/some-route');
  });

  it('should emit navigateEvent on toggleDrawer for leaf item with route', () => {
    const spy = jasmine.createSpy('navigateEvent');
    component.navigateEvent.subscribe(spy);
    const item: NavItem = { label: 'Home', icon: 'x', route: '/home' };
    component.toggleDrawer(item);
    expect(spy).toHaveBeenCalledWith('/home');
  });

  it('should open drawer for item with children', () => {
    const item: NavItem = {
      label: 'Monitoring',
      icon: 'x',
      children: [{ label: 'Child', icon: 'x', route: '/child' }],
    };
    component.toggleDrawer(item);
    expect(component.activeDrawer).toBe('Monitoring');
  });

  it('should close drawer when toggling same drawer again', () => {
    const item: NavItem = {
      label: 'Monitoring',
      icon: 'x',
      children: [{ label: 'Child', icon: 'x', route: '/child' }],
    };
    component.activeDrawer = 'Monitoring';
    component.toggleDrawer(item);
    expect(component.activeDrawer).toBeNull();
  });

  it('should return true from isVisible when isAdmin', () => {
    component.isAdmin = true;
    const item: NavItem = { label: 'Admin', icon: 'x', roles: ['ADMIN'] };
    expect(component.isVisible(item)).toBeTrue();
  });

  it('should return true from isVisible when item has no roles', () => {
    component.isAdmin = false;
    const item: NavItem = { label: 'Public', icon: 'x' };
    expect(component.isVisible(item)).toBeTrue();
  });

  it('should return false from isVisible when user lacks role', () => {
    component.isAdmin = false;
    component.userRoles = ['USER'];
    const item: NavItem = { label: 'Admin', icon: 'x', roles: ['ADMIN'] };
    expect(component.isVisible(item)).toBeFalse();
  });

  it('should return true from isVisible when user has required role', () => {
    component.isAdmin = false;
    component.userRoles = ['ADMIN'];
    const item: NavItem = { label: 'Admin', icon: 'x', roles: ['ADMIN'] };
    expect(component.isVisible(item)).toBeTrue();
  });

  it('should determine if route is active by url inclusion', () => {
    component.currentUrl = '/dashboard/monitoring';
    expect(component.isRouteActive('/monitoring')).toBeTrue();
    expect(component.isRouteActive('/settings')).toBeFalse();
  });

  it('should return false for isRouteActive when route is undefined', () => {
    expect(component.isRouteActive(undefined)).toBeFalse();
  });

  it('should determine parent active based on children routes', () => {
    component.currentUrl = '/child-route';
    const item: NavItem = {
      label: 'Parent',
      icon: 'x',
      children: [{ label: 'Child', icon: 'x', route: '/child-route' }],
    };
    expect(component.isParentActive(item)).toBeTrue();
  });

  it('should return false from isParentActive when no children', () => {
    const item: NavItem = { label: 'Leaf', icon: 'x' };
    expect(component.isParentActive(item)).toBeFalse();
  });

  it('should get visible children filtered by visibility', () => {
    component.isAdmin = false;
    component.userRoles = [];
    const item: NavItem = {
      label: 'Parent',
      icon: 'x',
      children: [
        { label: 'Child1', icon: 'x', roles: ['ADMIN'] },
        { label: 'Child2', icon: 'x' },
      ],
    };
    const visible = component.getVisibleChildren(item);
    expect(visible.length).toBe(1);
    expect(visible[0].label).toBe('Child2');
  });
});
