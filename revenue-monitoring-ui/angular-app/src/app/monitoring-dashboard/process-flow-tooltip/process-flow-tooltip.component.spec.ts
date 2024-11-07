import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessFlowTooltipComponent } from './process-flow-tooltip.component';

describe('ProcessFlowTooltipComponent', () => {
  let component: ProcessFlowTooltipComponent;
  let fixture: ComponentFixture<ProcessFlowTooltipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessFlowTooltipComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProcessFlowTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
