import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaseiqI2cComponent } from './caseiq-i2c.component';

describe('CaseiqI2cComponent', () => {
  let component: CaseiqI2cComponent;
  let fixture: ComponentFixture<CaseiqI2cComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaseiqI2cComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CaseiqI2cComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
