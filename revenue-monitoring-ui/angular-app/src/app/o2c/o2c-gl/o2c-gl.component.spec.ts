import { ComponentFixture, TestBed } from '@angular/core/testing';

import { O2cGlComponent } from './o2c-gl.component';

describe('O2cGlComponent', () => {
  let component: O2cGlComponent;
  let fixture: ComponentFixture<O2cGlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [O2cGlComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(O2cGlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
