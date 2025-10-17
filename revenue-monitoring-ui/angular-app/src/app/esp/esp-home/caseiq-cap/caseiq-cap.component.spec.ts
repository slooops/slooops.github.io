import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaseiqCapComponent } from './caseiq-cap.component';

describe('CaseiqCapComponent', () => {
  let component: CaseiqCapComponent;
  let fixture: ComponentFixture<CaseiqCapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaseiqCapComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CaseiqCapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
