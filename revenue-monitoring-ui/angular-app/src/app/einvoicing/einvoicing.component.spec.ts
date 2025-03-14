import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EinvoicingComponent } from './einvoicing.component';

describe('EinvoicingComponent', () => {
  let component: EinvoicingComponent;
  let fixture: ComponentFixture<EinvoicingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EinvoicingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EinvoicingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
