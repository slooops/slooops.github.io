import { ComponentFixture, TestBed } from '@angular/core/testing';

import { O2cHardwareComponent } from './o2c-hardware.component';

describe('O2cHardwareComponent', () => {
  let component: O2cHardwareComponent;
  let fixture: ComponentFixture<O2cHardwareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [O2cHardwareComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(O2cHardwareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
