import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EspCaseAnalyzerComponent } from './esp-case-analyzer.component';

describe('EspCaseAnalyzerComponent', () => {
  let component: EspCaseAnalyzerComponent;
  let fixture: ComponentFixture<EspCaseAnalyzerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EspCaseAnalyzerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EspCaseAnalyzerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    // expect(component).toBeTruthy();
  });
});
