import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { O2cOrderComponent } from './o2c-order.component';

describe('O2cOrderComponent', () => {
  let component: O2cOrderComponent;
  let fixture: ComponentFixture<O2cOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [DestroyManager],
      imports: [O2cOrderComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(O2cOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
