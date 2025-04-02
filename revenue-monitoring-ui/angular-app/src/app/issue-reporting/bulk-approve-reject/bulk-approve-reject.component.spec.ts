import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BulkApproveRejectComponent } from './bulk-approve-reject.component';

describe('BulkApproveRejectComponent', () => {
  let component: BulkApproveRejectComponent;
  let fixture: ComponentFixture<BulkApproveRejectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BulkApproveRejectComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BulkApproveRejectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
