import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevenueAccrualsComponent } from './revenue-accruals.component';

describe('RevAccruals2Component', () => {
  let component: RevenueAccrualsComponent;
  let fixture: ComponentFixture<RevenueAccrualsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RevenueAccrualsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RevenueAccrualsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
