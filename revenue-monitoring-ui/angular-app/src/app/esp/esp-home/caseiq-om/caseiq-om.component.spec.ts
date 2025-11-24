import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaseiqOmComponent } from './caseiq-om.component';

describe('CaseiqOmComponent', () => {
  let component: CaseiqOmComponent;
  let fixture: ComponentFixture<CaseiqOmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaseiqOmComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CaseiqOmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
