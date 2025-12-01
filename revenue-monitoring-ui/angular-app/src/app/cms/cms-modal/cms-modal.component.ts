import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-cms-modal',
    templateUrl: './cms-modal.component.html',
    styleUrls: ['./cms-modal.component.css'],
    standalone: false
})
export class CmsModalComponent {
  displayedColumns: string[] = [
    'EXTRACT_NAME',
    'FILE_NAME',
    'FILE_REC_COUNT',
    'SOURCE_TYPE',
    'STATUS',
    'STG_REC_COUNT',
    'TOTAL_ELIGIBLE_REC_COUNT',
  ];

  constructor(
    public dialogRef: MatDialogRef<CmsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any[]
  ) {}

  onOverlayClicked(): void {
    this.dialogRef.close(); // Close the modal when clicking the overlay
  }

  onClose(): void {
    this.dialogRef.close(); // Close the modal when clicking the close button
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
