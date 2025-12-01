import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiHttpService } from 'src/app/providers/http.service';

@Component({
    selector: 'app-bulk-approve-reject',
    templateUrl: './bulk-approve-reject.component.html',
    styleUrl: './bulk-approve-reject.component.css',
    standalone: false
})
export class BulkApproveRejectComponent {
  constructor(
    public dialogRef: MatDialogRef<BulkApproveRejectComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any[],
    private http: ApiHttpService
  ) {}

  approvedBy: string = ''; // Replace with actual user info if needed
  ngOnInit() {
    console.log(this.data);
    this.approvedBy = this.data[0].approvedBy; // Assuming all rows have the same approvedBy value
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onCheckboxChange(row: any, action: string): void {
    if (action === 'approve') {
      row.rejected = false; // Uncheck "Reject" if "Approve" is selected
    } else if (action === 'reject') {
      row.approved = false; // Uncheck "Approve" if "Reject" is selected
    }
  }

  onSubmit(): void {
    const selectedData = this.data
      .filter((row) => row.approved || row.rejected) // Only get rows where approve or reject is selected
      .map((row) => ({
        incidentNumber: row.incidentNumber,
        status: row.approved ? 'Approved' : 'Rejected',
        approvedBy: this.approvedBy, // Replace with actual user info if needed
      }));

    console.log(typeof selectedData); // Print to console
    this.http
      .post('issue-reporting-approval-bulk', selectedData, {
        headers: { 'Content-Type': 'application/json' }, // Ensure correct content type
        responseType: 'text',
      })
      .subscribe((data: any) => {
        this.dialogRef.close('success');
      });
  }
}
