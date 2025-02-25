import { ComponentFixture, TestBed } from '@angular/core/testing';

import { O2cLandingComponent } from './o2c-landing.component';

describe('O2cLandingComponent', () => {
  let component: O2cLandingComponent;
  let fixture: ComponentFixture<O2cLandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [O2cLandingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(O2cLandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
