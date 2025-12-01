import { Component, Input } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthenticationService } from 'src/app/providers/authentication.service';
import { ApiHttpService } from 'src/app/providers/http.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-upload-screen',
    templateUrl: './upload-screen.component.html',
    styleUrls: ['./upload-screen.component.css'],
    imports: [
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  standalone: true
})
export class UploadScreenComponent {
  @Input() source: string = '';

  isDragOver = false;
  selectedFile: File | null = null;
  isUploadSuccess = false;
  isUploading = false; // true while the file is being uploaded
  username: string;

  constructor(
    public http: ApiHttpService,
    private dialogRef: MatDialogRef<UploadScreenComponent>,
    public authService: AuthenticationService
  ) {
    this.username = this.authService.getUserID();
  }

  // Upload functionality methods
  downloadTemplate(): void {
    // Create a sample CSV template
    const csvHeaders = [
      'INCIDENT_NUMBER',
      'IMPACTED_SERVICE_OFFERING',
      'SUMMARY',
      'DESCRIPTION',
      'CATEGORY',
      'CATEGORY_ACTUAL',
      'CORE_ISSUE',
      'CORE_ISSUE_ACTUAL',
    ];

    const sampleRow = [
      'INC0012349',
      'Invoice Processing - Global',
      'Sample case summary',
      'Sample case description',
      'Invoicing',
      'Invoice Processing',
      'System Issue',
      'System Issue',
    ];

    const csvContent = [csvHeaders.join(','), sampleRow.join(',')].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);

    // Customize filename based on source component
    const sourcePrefix = this.source ? `${this.source.toUpperCase()}_` : '';
    link.setAttribute('download', `${sourcePrefix}Case_Data_Template.csv`);

    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Log template download with source information
    console.log('Template downloaded:', {
      source: this.source,
      filename: `${sourcePrefix}Case_Data_Template.csv`,
      timestamp: new Date().toISOString(),
    });
  }

  triggerFileInput(): void {
    // If no file is selected, open file picker
    if (!this.selectedFile) {
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput instanceof HTMLInputElement) {
        fileInput.click();
      }
    } else {
      // If file is already selected, proceed with upload
      this.uploadFile();
    }
  }

  uploadFile(): void {
    if (!this.selectedFile) {
      alert('Please select a file first.');
      return;
    }
    if (this.selectedFile) {
      let file = this.selectedFile;
      const formData: FormData = new FormData();
      formData.append('file', file, file.name);
      formData.append('username', this.username);

      // Set uploading state
      this.isUploading = true;

      this.http
        .post('xxcaseiq-esp-case-analyzer-table-update', formData, {
          responseType: 'text',
        })
        .subscribe(
          (response) => {
            console.log(response);
            // Mark success state
            this.isUploadSuccess = true;
            this.isUploading = false;
            // Close dialog passing success payload back to opener
            this.safeCloseDialog({
              success: true,
              fileName: file.name,
              source: this.source,
              response,
              timestamp: new Date().toISOString(),
            });
          },
          (error) => {
            console.error('Error uploading file:', error);
            alert('Upload failed. Please try again.');
            this.isUploading = false;
            this.safeCloseDialog({
              success: false,
              fileName: file.name,
              source: this.source,
              error,
              timestamp: new Date().toISOString(),
            });
          }
        );
    }

    // Set success state after alert is dismissed
    // (Success state & logging now handled inside subscription callbacks.)
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onFileDropped(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.handleFileSelection(target.files[0]);
    }
  }

  private handleFileSelection(file: File): void {
    // Validate file type
    if (
      !file.name.toLowerCase().endsWith('.csv') &&
      !file.name.toLowerCase().endsWith('.xlsx')
    ) {
      alert('Please select a CSV file.');
      return;
    }

    // Validate file size (20 MB limit)
    const maxSize = 20 * 1024 * 1024; // 20 MB in bytes
    if (file.size > maxSize) {
      alert('File size exceeds 20 MB limit. Please select a smaller file.');
      return;
    }

    this.selectedFile = file;
    console.log(
      'File selected:',
      file.name,
      'Size:',
      Math.round(file.size / 1024) + ' KB'
    );

    // File is selected but not uploaded yet
    // Alert will be shown when user clicks "Upload file" button
  }

  clearSelectedFile(): void {
    this.selectedFile = null;
    this.isUploadSuccess = false;
  }

  resetUpload(): void {
    this.selectedFile = null;
    this.isUploadSuccess = false;
    this.isDragOver = false;
    this.isUploading = false;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  onClose() {
    this.safeCloseDialog();
  }

  private safeCloseDialog(payload?: any) {
    try {
      if (this.dialogRef && typeof this.dialogRef.close === 'function') {
        this.dialogRef.close(payload);
      }
    } catch (e) {
      console.warn('Dialog close failed or dialogRef missing', e);
    }
  }
}
