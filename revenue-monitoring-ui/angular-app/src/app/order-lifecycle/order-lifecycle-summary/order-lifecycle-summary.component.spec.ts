import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderLifecycleSummaryComponent } from './order-lifecycle-summary.component';

describe('OrderLifecycleSummaryComponent', () => {
  let component: OrderLifecycleSummaryComponent;
  let fixture: ComponentFixture<OrderLifecycleSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrderLifecycleSummaryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderLifecycleSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
