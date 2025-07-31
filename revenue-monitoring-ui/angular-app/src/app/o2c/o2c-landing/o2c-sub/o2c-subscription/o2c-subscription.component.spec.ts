import { ComponentFixture, TestBed } from '@angular/core/testing';

import { O2cSubscriptionComponent } from './o2c-subscription.component';

describe('O2cSubscriptionComponent', () => {
  let component: O2cSubscriptionComponent;
  let fixture: ComponentFixture<O2cSubscriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [O2cSubscriptionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(O2cSubscriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
