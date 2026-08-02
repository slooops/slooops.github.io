import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { EspCaseAnalyzerComponent } from './esp-case-analyzer.component';

describe('EspCaseAnalyzerComponent', () => {
  let component: EspCaseAnalyzerComponent;
  let fixture: ComponentFixture<EspCaseAnalyzerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EspCaseAnalyzerComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        BrowserAnimationsModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EspCaseAnalyzerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default tab index of 0', () => {
    expect(component.selectedTabIndex).toBe(0);
  });
});
