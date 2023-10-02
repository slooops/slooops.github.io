import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevAccruals2Component } from './rev-accruals2.component';

describe('RevAccruals2Component', () => {
  let component: RevAccruals2Component;
  let fixture: ComponentFixture<RevAccruals2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RevAccruals2Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RevAccruals2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
