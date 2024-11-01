import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoInvoicingRealComponent } from './auto-invoicing-real.component';

describe('AutoInvoicingRealComponent', () => {
  let component: AutoInvoicingRealComponent;
  let fixture: ComponentFixture<AutoInvoicingRealComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutoInvoicingRealComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AutoInvoicingRealComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
