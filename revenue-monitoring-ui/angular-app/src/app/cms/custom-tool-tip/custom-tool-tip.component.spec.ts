import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomToolTipComponent } from './custom-tool-tip.component';

describe('CustomToolTipComponent', () => {
  let component: CustomToolTipComponent;
  let fixture: ComponentFixture<CustomToolTipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomToolTipComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomToolTipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call ngOnInit without error', () => {
    expect(() => component.ngOnInit()).not.toThrow();
  });

  it('should accept text input', () => {
    component.text = 'Tooltip text';
    expect(component.text).toBe('Tooltip text');
  });
});
