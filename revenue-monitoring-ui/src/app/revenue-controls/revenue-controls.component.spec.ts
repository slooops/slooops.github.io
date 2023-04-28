import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevenueControlsComponent } from './revenue-controls.component';

describe('RevenueControlsComponent', () => {
  let component: RevenueControlsComponent;
  let fixture: ComponentFixture<RevenueControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RevenueControlsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RevenueControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
