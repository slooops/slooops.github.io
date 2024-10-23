import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreInvoicingComponent } from './pre-invoicing.component';

describe('PreInvoicingComponent', () => {
  let component: PreInvoicingComponent;
  let fixture: ComponentFixture<PreInvoicingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreInvoicingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PreInvoicingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
