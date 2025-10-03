import { ComponentFixture, TestBed } from '@angular/core/testing';

import { O2cAccountingComponent } from './o2c-accounting.component';

describe('O2cAccountingComponent', () => {
  let component: O2cAccountingComponent;
  let fixture: ComponentFixture<O2cAccountingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [O2cAccountingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(O2cAccountingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
