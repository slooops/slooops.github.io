import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SbpEspCaseAnalyzerComponent } from './sbp-esp-case-analyzer.component';

describe('SbpEspCaseAnalyzerComponent', () => {
  let component: SbpEspCaseAnalyzerComponent;
  let fixture: ComponentFixture<SbpEspCaseAnalyzerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SbpEspCaseAnalyzerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SbpEspCaseAnalyzerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
