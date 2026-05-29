import { Component, EventEmitter, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { AuthenticationService } from 'src/app/providers/authentication.service';
import { ApiHttpService } from 'src/app/providers/http.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorArrowLineDownBold,
  phosphorCloudArrowUpBold,
  phosphorXBold,
  phosphorFileBold,
  phosphorCheckCircleBold,
  phosphorTrashBold,
} from '@ng-icons/phosphor-icons/bold';

@Component({
  selector: 'app-issue-upload',
  templateUrl: './issue-upload.component.html',
  styleUrl: './issue-upload.component.css',
  imports: [CommonModule, MatButtonModule, NgIcon],
  providers: [
    provideIcons({
      phosphorArrowLineDownBold,
      phosphorCloudArrowUpBold,
      phosphorXBold,
      phosphorFileBold,
      phosphorCheckCircleBold,
      phosphorTrashBold,
    }),
  ],
  standalone: true,
})
export class IssueUploadComponent {
  updateForm: FormGroup;
  username: any;

  @Output() closed = new EventEmitter<string | null>();

  constructor(
    public http: ApiHttpService,
    private authService: AuthenticationService,
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUserName();
  }

  closeDialog(result: string | null = null) {
    this.closed.emit(result);
  }

  selectedFile: File | null = null;
  fileSelected: boolean = false;
  validationError: string | null = null;
  isLoading: boolean = false;
  validForm: boolean = false;
  uploadText: string = '';

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.handleFiles(event.dataTransfer?.files[0]);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.handleFiles(input.files[0]);
  }

  uploadDealsFile() {
    if (this.selectedFile) {
      let file = this.selectedFile;
      const formData: FormData = new FormData();
      formData.append('file', file, file.name);
      formData.append('username', this.username);

      this.http
        .post('issue-reporting-upload', formData, {
          responseType: 'text',
        })
        .subscribe(
          (response) => {
            this.closeDialog('uploaded');
          },
          (error) => {
            console.error('Error uploading file:', error);
            this.closeDialog('error');
          },
        );
    }
  }

  closeOkDialog(): void {
    this.closed.emit(null);
  }

  removeFile() {
    this.fileSelected = false;
    this.selectedFile = null;
    this.validationError = null;
  }

  handleFiles(file: File | null) {
    this.selectedFile = file;
    this.fileSelected = true;
  }
}
