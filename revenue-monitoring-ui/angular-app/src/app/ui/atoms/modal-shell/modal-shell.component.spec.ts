import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalShellComponent } from './modal-shell.component';

describe('ModalShellComponent', () => {
  let component: ModalShellComponent;
  let fixture: ComponentFixture<ModalShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalShellComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input values', () => {
    expect(component.title).toBe('');
    expect(component.isOpen).toBeFalse();
  });

  it('should emit close on onClose()', () => {
    const spy = jasmine.createSpy('close');
    component.close.subscribe(spy);
    component.onClose();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit close on Escape key when isOpen is true', () => {
    const spy = jasmine.createSpy('close');
    component.close.subscribe(spy);
    component.isOpen = true;
    component.onEscapeKey();
    expect(spy).toHaveBeenCalled();
  });

  it('should not emit close on Escape key when isOpen is false', () => {
    const spy = jasmine.createSpy('close');
    component.close.subscribe(spy);
    component.isOpen = false;
    component.onEscapeKey();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should emit close on backdrop click targeting the backdrop itself', () => {
    const spy = jasmine.createSpy('close');
    component.close.subscribe(spy);
    const div = document.createElement('div');
    const event = new MouseEvent('click');
    Object.defineProperty(event, 'target', { value: div });
    Object.defineProperty(event, 'currentTarget', { value: div });
    component.onBackdropClick(event);
    expect(spy).toHaveBeenCalled();
  });

  it('should not emit close on backdrop click targeting a child element', () => {
    const spy = jasmine.createSpy('close');
    component.close.subscribe(spy);
    const parent = document.createElement('div');
    const child = document.createElement('button');
    const event = new MouseEvent('click');
    Object.defineProperty(event, 'target', { value: child });
    Object.defineProperty(event, 'currentTarget', { value: parent });
    component.onBackdropClick(event);
    expect(spy).not.toHaveBeenCalled();
  });
});
