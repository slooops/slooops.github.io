import { ComponentFixture, TestBed } from '@angular/core/testing';

import { O2cDemoComponent } from './o2c-demo.component';

describe('O2cDemoComponent', () => {
  let component: O2cDemoComponent;
  let fixture: ComponentFixture<O2cDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [O2cDemoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(O2cDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
