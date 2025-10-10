import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaseiqFppComponent } from './caseiq-fpp.component';

describe('CaseiqFppComponent', () => {
  let component: CaseiqFppComponent;
  let fixture: ComponentFixture<CaseiqFppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaseiqFppComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CaseiqFppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
