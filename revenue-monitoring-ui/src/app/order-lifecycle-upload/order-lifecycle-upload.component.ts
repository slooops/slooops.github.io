import { Component, OnInit, TemplateRef } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { ApiHttpService } from '../providers/http.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-order-lifecycle-upload',
  templateUrl: './order-lifecycle-upload.component.html',
  styleUrls: ['./order-lifecycle-upload.component.css'],
})
export class OrderLifecycleUploadComponent implements OnInit {
  updateForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<OrderLifecycleUploadComponent>,
    public http: ApiHttpService,
    private formBuilder: FormBuilder,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.updateForm = this.formBuilder.group({
      programName: [
        '',
        [Validators.required, Validators.pattern(/^[a-zA-Z]+$/)],
      ],
      account: ['', [Validators.required, Validators.pattern(/^[a-zA-Z]+$/)]],
      dealIds: [
        '',
        [Validators.required, Validators.pattern(/^\s*\d+(\s*,\s*\d+)*\s*$/)],
      ],
    });
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
      this.isLoading = true;

      this.http
        .post('order-lifecycle-upload', formData, { responseType: 'text' })
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
          }
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
          }
        );
    } else {
      this.validForm = true;
    }
  }

  closeOkDialog(): void {
    this.dialog.closeAll();
  }

  handleFiles(file: File | null) {
    if (file && file.name.endsWith('.csv')) {
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
    } else {
      this.fileSelected = false;
      this.validationError = '';
      this.validationError +=
        'Please upload a CSV file to continue. The file ' +
        file.name +
        ' is not in CSV format.';
    }
  }

  async validateCsvFile(file: File): Promise<boolean> {
    const fileContent = await this.readFileContent(file);
    const expectedHeaders = ['PROGRAM NAME', 'ACCOUNT', 'DEAL ID'].toString();
    const firstRow = fileContent[0].replace(/\r/g, '');

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
        const rows = content.split('\n');
        resolve(rows);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsText(file);
    });
  }

  areArraysEqual(arr1: string, arr2: string): boolean {
    return JSON.stringify(arr1) === JSON.stringify(arr2);
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
}
