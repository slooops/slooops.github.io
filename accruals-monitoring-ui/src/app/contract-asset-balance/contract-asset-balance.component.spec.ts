import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractAssetBalanceComponent } from './contract-asset-balance.component';

describe('ContractAssetBalanceComponent', () => {
  let component: ContractAssetBalanceComponent;
  let fixture: ComponentFixture<ContractAssetBalanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ContractAssetBalanceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ContractAssetBalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
