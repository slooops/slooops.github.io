import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountReconComponent } from './account-recon.component';

describe('AccountReconComponent', () => {
  let component: AccountReconComponent;
  let fixture: ComponentFixture<AccountReconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountReconComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AccountReconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
