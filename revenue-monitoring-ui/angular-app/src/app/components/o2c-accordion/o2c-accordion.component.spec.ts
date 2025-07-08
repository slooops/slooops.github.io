import { ComponentFixture, TestBed } from '@angular/core/testing';

import { O2cAccordionComponent } from './o2c-accordion.component';

describe('O2cAccordionComponent', () => {
  let component: O2cAccordionComponent;
  let fixture: ComponentFixture<O2cAccordionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [O2cAccordionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(O2cAccordionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
