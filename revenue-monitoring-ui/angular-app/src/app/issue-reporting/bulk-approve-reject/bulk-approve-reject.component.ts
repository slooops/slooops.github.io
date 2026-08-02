import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ApiHttpService } from 'src/app/providers/http.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bulk-approve-reject',
  templateUrl: './bulk-approve-reject.component.html',
  styleUrl: './bulk-approve-reject.component.css',
  imports: [CommonModule, FormsModule],
  standalone: true,
})
export class BulkApproveRejectComponent {
  @Input() data: any[] = [];
  @Output() closed = new EventEmitter<string | null>();

  constructor(private http: ApiHttpService) {}

  approvedBy: string = ''; // Replace with actual user info if needed
  ngOnInit() {
    this.approvedBy = this.data[0]?.approvedBy; // Assuming all rows have the same approvedBy value
  }

  onCancel(): void {
    this.closed.emit(null);
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

    this.http
      .post('issue-reporting-approval-bulk', selectedData, {
        headers: { 'Content-Type': 'application/json' }, // Ensure correct content type
        responseType: 'text',
      })
      .subscribe((data: any) => {
        this.closed.emit('success');
      });
  }
}
