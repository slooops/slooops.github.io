import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoInvoicingComponent } from './auto-invoicing.component';

describe('AutoInvoicingComponent', () => {
  let component: AutoInvoicingComponent;
  let fixture: ComponentFixture<AutoInvoicingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutoInvoicingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AutoInvoicingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
