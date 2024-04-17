import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DataService } from 'src/app/providers/data.service';
import { ApiHttpService } from 'src/app/providers/http.service';

@Component({
  selector: 'app-clo-updates',
  templateUrl: './clo-updates.component.html',
  styleUrls: ['./clo-updates.component.css'],
})
export class CloUpdatesComponent implements OnInit {
  updateForm: FormGroup;
  currentDate: Date;
  username: any;

  constructor(
    public dialogRef: MatDialogRef<CloUpdatesComponent>,
    public http: ApiHttpService,
    private formBuilder: FormBuilder,
    public dialog: MatDialog,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.currentDate = new Date();
    this.updateForm = this.formBuilder.group({
      programName: [
        '',
        [Validators.required, Validators.pattern(/^[a-zA-Z]+$/)],
      ],
      account: ['', [Validators.required, Validators.pattern(/^[a-zA-Z]+$/)]],
      dealIds: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      orderNum: [''],
      invoiceDate: [''],
      cloComments: [''],
    });
    this.username = this.dataService.getUsername();
  }

  selectedFile: File | null = null;
  fileSelected: boolean = false;
  validationError: string | null = null;
  updateCloData: UpdateCLOData;
  isLoading: boolean = false;
  validForm: boolean = false;
  uploadText: string = '';

  closeDialog(result) {
    this.dialogRef.close(result);
  }

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

  uploadCLODataFile(dialogTemplate: TemplateRef<any>) {
    if (this.selectedFile) {
      let file = this.selectedFile;
      const formData: FormData = new FormData();
      formData.append('file', file, file.name);
      formData.append('username', this.username);

      this.isLoading = true;
      this.http
        .post('clo-bulk-upload-file', formData, {
          responseType: 'text',
        })
        .subscribe(
          (response) => {
            this.uploadText = 'CLO Data upload successful!';
            this.closeDialog('uploaded');
            this.dialog.open(dialogTemplate);
          },
          (error) => {
            this.uploadText = 'CLO Data upload failed!';
            this.closeDialog('error');
            this.dialog.open(dialogTemplate);
          }
        );
    }
  }

  submitCLOData(dialogTemplate: TemplateRef<any>) {
    if (this.updateForm.valid) {
      this.validForm = false;
      const formData = this.updateForm.value;

      this.updateCloData = {
        programName: formData.programName,
        account: formData.account,
        dealIds: formData.dealIds,
        orderNum: formData.orderNum,
        invoiceDate: formData.invoiceDate.toLocaleDateString('en-US', {
          timeZone: 'America/Los_Angeles',
        }),
        cloComments: formData.cloComments,
        username: this.username,
      };
      console.log(this.updateCloData);
      this.http
        .post('clo-bulk-upload', this.updateCloData, {
          responseType: 'text',
        })
        .subscribe(
          (data) => {
            this.uploadText = 'CLO Data upload successful!';
            this.closeDialog('uploaded');
            this.dialog.open(dialogTemplate);
          },
          (error) => {
            this.uploadText = 'CLO Data upload failed!';
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
    const expectedHeaders = [
      'PROGRAM NAME',
      'ACCOUNT',
      'DEAL ID',
      'ORDER/SUBSCRIPTION NUMBER',
      'INVOICE ELIGIBLE DATE',
      'CLO COMMENTS',
    ].toString();
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

interface UpdateCLOData {
  programName: string;
  account: string;
  dealIds: string;
  orderNum: string;
  invoiceDate: string;
  cloComments: string;
  username: string;
}
