import { TestBed } from '@angular/core/testing';
import { MenuService, MenuCategory } from './menu.service';
import { AuthenticationService } from './authentication.service';

describe('MenuService', () => {
  let service: MenuService;
  let authServiceSpy: jasmine.SpyObj<AuthenticationService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthenticationService', [
      'getUserAccessRoles',
    ]);
    authServiceSpy.getUserAccessRoles.and.returnValue([
      'ADMIN',
      'CASE_IQ_MONITORING',
    ]);

    TestBed.configureTestingModule({
      providers: [
        MenuService,
        { provide: AuthenticationService, useValue: authServiceSpy },
      ],
    });
    service = TestBed.inject(MenuService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('menuItems$', () => {
    it('should emit empty array initially', (done) => {
      service.menuItems$.subscribe((items) => {
        expect(items).toEqual([]);
        done();
      });
    });
  });

  describe('updateMenuItems', () => {
    it('should filter items by user roles', (done) => {
      const menuData: MenuCategory[] = [
        { label: 'Dashboard', route: '/dashboard', role: ['ADMIN'] },
        { label: 'Secret', route: '/secret', role: ['SUPER_ADMIN'] },
      ];

      service.updateMenuItems(menuData);

      service.menuItems$.subscribe((items) => {
        expect(items.length).toBe(1);
        expect(items[0].label).toBe('Dashboard');
        done();
      });
    });

    it('should filter category items by roles', (done) => {
      const menuData: MenuCategory[] = [
        {
          category: 'Monitoring',
          items: [
            {
              label: 'CaseIQ',
              route: '/caseiq',
              role: ['CASE_IQ_MONITORING'],
            },
            { label: 'Hidden', route: '/hidden', role: ['SUPER_ADMIN'] },
          ],
        },
      ];

      service.updateMenuItems(menuData);

      service.menuItems$.subscribe((items) => {
        expect(items.length).toBe(1);
        expect(items[0].items!.length).toBe(1);
        expect(items[0].items![0].label).toBe('CaseIQ');
        done();
      });
    });

    it('should remove empty categories', (done) => {
      const menuData: MenuCategory[] = [
        {
          category: 'Empty',
          items: [{ label: 'Hidden', route: '/hidden', role: ['SUPER_ADMIN'] }],
        },
      ];

      service.updateMenuItems(menuData);

      service.menuItems$.subscribe((items) => {
        expect(items.length).toBe(0);
        done();
      });
    });

    it('should pass all items when user has all roles', (done) => {
      authServiceSpy.getUserAccessRoles.and.returnValue([
        'ADMIN',
        'CASE_IQ_MONITORING',
        'SUPER_ADMIN',
      ]);

      const menuData: MenuCategory[] = [
        { label: 'Dashboard', route: '/dashboard', role: ['ADMIN'] },
        { label: 'Secret', route: '/secret', role: ['SUPER_ADMIN'] },
      ];

      service.updateMenuItems(menuData);

      service.menuItems$.subscribe((items) => {
        expect(items.length).toBe(2);
        done();
      });
    });
  });

  describe('header$', () => {
    it('should emit default header', (done) => {
      service.header$.subscribe((header) => {
        expect(header).toBe('Continuous Monitoring');
        done();
      });
    });
  });

  describe('updateSubHeader', () => {
    it('should update subHeader observable', (done) => {
      service.updateSubHeader('New Sub Header');
      service.subHeader$.subscribe((subHeader) => {
        expect(subHeader).toBe('New Sub Header');
        done();
      });
    });
  });
});
