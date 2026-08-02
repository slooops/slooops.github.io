import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { BulkApproveRejectComponent } from './bulk-approve-reject.component';

describe('BulkApproveRejectComponent', () => {
  let component: BulkApproveRejectComponent;
  let fixture: ComponentFixture<BulkApproveRejectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BulkApproveRejectComponent],
      providers: [
        {
          provide: MatDialogRef,
          useValue: { close: jasmine.createSpy('close') },
        },
        { provide: MAT_DIALOG_DATA, useValue: [{ approvedBy: 'testUser' }] },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BulkApproveRejectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
