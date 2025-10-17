import { ComponentFixture, TestBed } from '@angular/core/testing';

import { O2cServicesComponent } from './o2c-services.component';

describe('O2cServicesComponent', () => {
  let component: O2cServicesComponent;
  let fixture: ComponentFixture<O2cServicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [O2cServicesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(O2cServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
