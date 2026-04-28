import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { InvoicingComponent } from './invoicing.component';

describe('InvoicingComponent', () => {
  let component: InvoicingComponent;
  let fixture: ComponentFixture<InvoicingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoicingComponent, HttpClientTestingModule, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoicingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
