import { ComponentFixture, TestBed } from '@angular/core/testing';

import { O2cProcessFlowComponent } from './o2c-process-flow.component';

describe('O2cProcessFlowComponent', () => {
  let component: O2cProcessFlowComponent;
  let fixture: ComponentFixture<O2cProcessFlowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [O2cProcessFlowComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(O2cProcessFlowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
