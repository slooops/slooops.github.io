import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingSymbolComponent } from './loading-symbol.component';

describe('MonitoringDashboard LoadingSymbolComponent', () => {
  let component: LoadingSymbolComponent;
  let fixture: ComponentFixture<LoadingSymbolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSymbolComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingSymbolComponent);
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
