import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingSymbolSmallComponent } from './loading-symbol-small.component';

describe('LoadingSymbolSmallComponent', () => {
  let component: LoadingSymbolSmallComponent;
  let fixture: ComponentFixture<LoadingSymbolSmallComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSymbolSmallComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingSymbolSmallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call ngOnInit without error', () => {
    expect(() => component.ngOnInit()).not.toThrow();
  });
});
