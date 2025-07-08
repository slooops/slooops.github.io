import { ComponentFixture, TestBed } from '@angular/core/testing';

import { O2cCardComponent } from './o2c-card.component';

describe('O2cCardComponent', () => {
  let component: O2cCardComponent;
  let fixture: ComponentFixture<O2cCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [O2cCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(O2cCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
