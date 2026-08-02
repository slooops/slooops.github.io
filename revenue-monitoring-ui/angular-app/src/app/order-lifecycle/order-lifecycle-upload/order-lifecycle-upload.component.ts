import { Component, OnInit, TemplateRef } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { ApiHttpService } from '../../providers/http.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from 'src/app/providers/data.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { AuthenticationService } from 'src/app/providers/authentication.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorArrowLineDownBold,
  phosphorArrowLineUpBold,
  phosphorXBold,
  phosphorFileBold,
  phosphorCheckCircleBold,
  phosphorTrashBold,
  phosphorWarningCircleBold,
} from '@ng-icons/phosphor-icons/bold';

@Component({
  selector: 'app-order-lifecycle-upload',
  templateUrl: './order-lifecycle-upload.component.html',
  styleUrls: ['./order-lifecycle-upload.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatButtonModule,
    NgIcon,
  ],
  providers: [
    provideIcons({
      phosphorArrowLineDownBold,
      phosphorArrowLineUpBold,
      phosphorXBold,
      phosphorFileBold,
      phosphorCheckCircleBold,
      phosphorTrashBold,
      phosphorWarningCircleBold,
    }),
  ],
  standalone: true,
})
export class OrderLifecycleUploadComponent implements OnInit {
  updateForm: FormGroup;
  username: any;

  constructor(
    public dialogRef: MatDialogRef<OrderLifecycleUploadComponent>,
    public http: ApiHttpService,
    private formBuilder: FormBuilder,
    public dialog: MatDialog,
    private authService: AuthenticationService,
  ) {}

  ngOnInit(): void {
    this.updateForm = this.formBuilder.group({
      programName: [
        '',
        [Validators.required, Validators.pattern(/^[a-zA-Z]+$/)],
      ],
      account: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]],
      dealIds: [
        '',
        [Validators.required, Validators.pattern(/^\s*\d+(\s*,\s*\d+)*\s*$/)],
      ],
    });
    this.username = this.authService.getUserName();
  }

  closeDialog(result) {
    this.dialogRef.close(result);
  }

  selectedFile: File | null = null;
  fileSelected: boolean = false;
  validationError: string | null = null;
  updateModel: UpdateOrder;
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

  uploadDealsFile(dialogTemplate: TemplateRef<any>) {
    if (this.selectedFile) {
      let file = this.selectedFile;
      const formData: FormData = new FormData();
      formData.append('file', file, file.name);
      formData.append('username', this.username);
      this.isLoading = true;

      this.http
        .post('order-lifecycle-upload', formData, {
          responseType: 'text',
        })
        .subscribe(
          (response) => {
            this.uploadText = 'Deals upload successful!';
            this.closeDialog('uploaded');
            this.dialog.open(dialogTemplate);
          },
          (error) => {
            this.uploadText = 'Deals upload failed!';
            this.closeDialog('error');
            this.dialog.open(dialogTemplate);
          },
        );
    }
  }

  submitDealIds(dialogTemplate: TemplateRef<any>) {
    if (this.updateForm.valid) {
      this.validForm = false;
      const formData = this.updateForm.value;

      this.updateModel = {
        programName: formData.programName,
        account: formData.account,
        dealIds: formData.dealIds,
        username: this.username,
      };
      this.http
        .post('order-lifecycle-upload-manual', this.updateModel, {
          responseType: 'text',
        })
        .subscribe(
          (data) => {
            this.uploadText = 'Deals upload successful!';
            this.closeDialog('uploaded');
            this.dialog.open(dialogTemplate);
          },
          (error) => {
            this.uploadText = 'Deals upload failed!';
            this.closeDialog('error');
            this.dialog.open(dialogTemplate);
          },
        );
    } else {
      this.validForm = true;
    }
  }

  closeOkDialog(): void {
    this.dialog.closeAll();
  }

  handleFiles(file: File | null) {
    if (file && file.name && file.name.endsWith('.csv')) {
      this.validateCsvFile(file).then((res) => {
        if (res) {
          this.selectedFile = file;
          this.fileSelected = true;
        } else {
          this.validationError =
            'The file ' +
            file.name +
            ' could not be selected due to Invalid column headers. Please check the Sample Template file for valid header definitions.';
        }
      });
    } else if (file) {
      this.fileSelected = false;
      this.validationError =
        'Please upload a CSV file to continue. The file ' +
        file.name +
        ' is not in CSV format.';
    } else {
      this.fileSelected = false;
      this.validationError =
        'No file selected. Please upload a CSV file to continue.';
    }
  }

  async validateCsvFile(file: File): Promise<boolean> {
    const fileContent = await this.readFileContent(file);
    const expectedHeaders = ['PROGRAM NAME', 'ACCOUNT', 'DEAL ID'];
    const firstRow = fileContent[0].replace(/\r/g, '').split(',');

    if (this.areArraysEqual(firstRow, expectedHeaders)) {
      this.validationError = null;
      return true;
    } else {
      return false;
    }
  }

  readFileContent(file: File): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const content = event.target.result;
        if (content) {
          const rows = content.split('\n');
          resolve(rows);
        } else {
          reject(new Error('File content could not be read.'));
        }
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsText(file);
    });
  }

  areArraysEqual(arr1: string[], arr2: string[]): boolean {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((value, index) => value.trim() === arr2[index].trim());
  }
  removeFile() {
    this.fileSelected = false;
    this.selectedFile = null;
    this.validationError = null;
  }
}

interface UpdateOrder {
  programName: string;
  account: string;
  dealIds: string;
  username: string;
}
