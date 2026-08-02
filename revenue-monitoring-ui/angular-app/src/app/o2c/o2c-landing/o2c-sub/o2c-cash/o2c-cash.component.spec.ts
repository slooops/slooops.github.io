import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { O2cCashComponent } from './o2c-cash.component';

describe('O2cCashComponent', () => {
  let component: O2cCashComponent;
  let fixture: ComponentFixture<O2cCashComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [DestroyManager],
      imports: [O2cCashComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(O2cCashComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
