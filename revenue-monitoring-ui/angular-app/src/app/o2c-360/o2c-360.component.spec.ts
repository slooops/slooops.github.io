import { ComponentFixture, TestBed } from '@angular/core/testing';

import { O2c360Component } from './o2c-360.component';

describe('O2c360Component', () => {
  let component: O2c360Component;
  let fixture: ComponentFixture<O2c360Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [O2c360Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(O2c360Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
