import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaseiqTableComponent } from './caseiq-table.component';

describe('CaseiqTableComponent', () => {
  let component: CaseiqTableComponent;
  let fixture: ComponentFixture<CaseiqTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaseiqTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CaseiqTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
