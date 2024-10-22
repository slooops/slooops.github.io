import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomRevenueComponent } from './custom-revenue.component';

describe('CustomRevenueComponent', () => {
  let component: CustomRevenueComponent;
  let fixture: ComponentFixture<CustomRevenueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomRevenueComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CustomRevenueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
