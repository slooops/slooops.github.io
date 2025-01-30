import { ComponentFixture, TestBed } from '@angular/core/testing';

import { O2cDetailsComponent } from './o2c-details.component';

describe('O2cDetailsComponent', () => {
  let component: O2cDetailsComponent;
  let fixture: ComponentFixture<O2cDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [O2cDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(O2cDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
