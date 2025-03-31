import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StandardRevenueComponent } from './standard-revenue.component';

describe('StandardRevenueComponent', () => {
  let component: StandardRevenueComponent;
  let fixture: ComponentFixture<StandardRevenueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StandardRevenueComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StandardRevenueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
