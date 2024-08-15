import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-cms-sftp-modal',
  templateUrl: './cms-sftp-modal.component.html',
  styleUrls: ['./cms-sftp-modal.component.css'],
})
export class CmsSftpModalComponent {
  constructor(
    public dialogRef: MatDialogRef<CmsSftpModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any[]
  ) {}

  onOverlayClicked(): void {
    this.dialogRef.close(); // Close the modal when clicking the overlay
  }

  onClose(): void {
    this.dialogRef.close(); // Close the modal when clicking the close button
  }

  formatTimestamp(timestamp: string): string {
    // Implement your desired date format here
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  replaceUnderscore(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    return value
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => {
        if (word.toLowerCase() === 'data') {
          return 'Data';
        }
        if (word.toLowerCase() === 'no') {
          return 'No';
        } else if (word.length > 4) {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        return word;
      })
      .join(' ');
  }
}
