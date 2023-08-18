import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderLifecycleUploadComponent } from './order-lifecycle-upload.component';

describe('OrderLifecycleUploadComponent', () => {
  let component: OrderLifecycleUploadComponent;
  let fixture: ComponentFixture<OrderLifecycleUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrderLifecycleUploadComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderLifecycleUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
