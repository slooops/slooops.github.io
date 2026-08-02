import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { O2cBillDetailsComponent } from './o2c-bill-details.component';

describe('O2cBillDetailsComponent', () => {
  let component: O2cBillDetailsComponent;
  let fixture: ComponentFixture<O2cBillDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [DestroyManager],
      imports: [O2cBillDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(O2cBillDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
