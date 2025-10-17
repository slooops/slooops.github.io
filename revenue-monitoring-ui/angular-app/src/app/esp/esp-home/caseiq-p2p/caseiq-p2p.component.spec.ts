import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaseiqP2pComponent } from './caseiq-p2p.component';

describe('CaseiqP2pComponent', () => {
  let component: CaseiqP2pComponent;
  let fixture: ComponentFixture<CaseiqP2pComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaseiqP2pComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CaseiqP2pComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
