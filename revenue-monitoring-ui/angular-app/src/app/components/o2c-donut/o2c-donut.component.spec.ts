import { ComponentFixture, TestBed } from '@angular/core/testing';

import { O2cDonutComponent } from './o2c-donut.component';

describe('O2cDonutComponent', () => {
  let component: O2cDonutComponent;
  let fixture: ComponentFixture<O2cDonutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [O2cDonutComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(O2cDonutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
