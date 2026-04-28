import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserFormComponent } from './user-form.component';

describe('UserFormComponent', () => {
  let component: UserFormComponent;
  let fixture: ComponentFixture<UserFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.isEdit).toBeFalse();
    expect(component.roleFieldLabel).toBe('Role');
    expect(component.useRoleDropdown).toBeFalse();
  });

  it('should update formData.userName on onUserNameChange', () => {
    component.onUserNameChange('testuser');
    expect(component.formData.userName).toBe('testuser');
  });

  it('should update formData.email on onEmailChange', () => {
    component.onEmailChange('test@test.com');
    expect(component.formData.email).toBe('test@test.com');
  });

  it('should update formData.roles to single item on onRoleChange', () => {
    component.onRoleChange('admin');
    expect(component.formData.roles).toEqual(['admin']);
  });

  it('should set empty roles array when onRoleChange called with empty string', () => {
    component.onRoleChange('');
    expect(component.formData.roles).toEqual([]);
  });

  it('should update formData.roles on onMultiRoleChange', () => {
    component.onMultiRoleChange(['admin', 'viewer']);
    expect(component.formData.roles).toEqual(['admin', 'viewer']);
  });

  it('should update formData.enabled on onEnabledChange', () => {
    component.onEnabledChange(false);
    expect(component.formData.enabled).toBeFalse();
  });

  it('should emit cancel on onCancel', () => {
    const spy = jasmine.createSpy('cancel');
    component.cancel.subscribe(spy);
    component.onCancel();
    expect(spy).toHaveBeenCalled();
  });

  it('should not emit submit when userName is empty', () => {
    const spy = jasmine.createSpy('submit');
    component.submit.subscribe(spy);
    spyOn(window, 'alert');
    component.formData = { userName: '', email: 'a@b.com', roles: [], enabled: true };
    const event = new Event('submit');
    spyOn(event, 'preventDefault');
    spyOn(event, 'stopPropagation');
    component.onSubmit(event);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should emit submit when form is valid', () => {
    const spy = jasmine.createSpy('submit');
    component.submit.subscribe(spy);
    component.formData = { userName: 'user', email: 'u@c.com', roles: ['admin'], enabled: true };
    const event = new Event('submit');
    spyOn(event, 'preventDefault');
    spyOn(event, 'stopPropagation');
    component.onSubmit(event);
    expect(spy).toHaveBeenCalledWith(component.formData);
  });

  it('should sync formData with value input on ngOnInit', () => {
    component.value = { userName: 'bob', email: 'bob@x.com', roles: [], enabled: false };
    component.ngOnInit();
    expect(component.formData.userName).toBe('bob');
  });

  it('should sync formData with value on ngOnChanges when not dirty', () => {
    component.value = { userName: 'alice', email: 'a@x.com', roles: [], enabled: true };
    (component as any).isDirty = false;
    component.ngOnChanges();
    expect(component.formData.userName).toBe('alice');
  });
});
