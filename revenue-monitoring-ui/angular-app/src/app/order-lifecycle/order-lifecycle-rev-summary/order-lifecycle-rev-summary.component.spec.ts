import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderLifecycleRevSummaryComponent } from './order-lifecycle-rev-summary.component';

describe('OrderLifecycleRevSummaryComponent', () => {
  let component: OrderLifecycleRevSummaryComponent;
  let fixture: ComponentFixture<OrderLifecycleRevSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrderLifecycleRevSummaryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderLifecycleRevSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
