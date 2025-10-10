import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaseiqSmComponent } from './caseiq-sm.component';

describe('CaseiqSmComponent', () => {
  let component: CaseiqSmComponent;
  let fixture: ComponentFixture<CaseiqSmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaseiqSmComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CaseiqSmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
