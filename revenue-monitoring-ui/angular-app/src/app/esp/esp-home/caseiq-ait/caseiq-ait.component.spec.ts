import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaseiqAitComponent } from './caseiq-ait.component';

describe('CaseiqAitComponent', () => {
  let component: CaseiqAitComponent;
  let fixture: ComponentFixture<CaseiqAitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaseiqAitComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CaseiqAitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
