import { ComponentFixture, TestBed } from '@angular/core/testing';

import { O2cInvoiceComponent } from './o2c-invoice.component';

describe('O2cInvoiceComponent', () => {
  let component: O2cInvoiceComponent;
  let fixture: ComponentFixture<O2cInvoiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [O2cInvoiceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(O2cInvoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
