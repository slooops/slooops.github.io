import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaseiqComponent } from './caseiq.component';

describe('CaseiqComponent', () => {
  let component: CaseiqComponent;
  let fixture: ComponentFixture<CaseiqComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaseiqComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CaseiqComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
