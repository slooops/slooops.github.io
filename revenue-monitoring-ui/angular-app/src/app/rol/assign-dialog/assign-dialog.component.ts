import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DataService } from 'src/app/providers/data.service';
import { ApiHttpService } from 'src/app/providers/http.service';

@Component({
  selector: 'app-assign-dialog',
  templateUrl: './assign-dialog.component.html',
  styleUrl: './assign-dialog.component.css',
})
export class AssignDialogComponent implements OnInit {
  updateForm: FormGroup;
  username: any;

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<AssignDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: ApiHttpService,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.updateForm = this.formBuilder.group({
      periodName: [{ value: this.data[0].PERIOD_NAME || '', disabled: true }],
      appName: [{ value: this.data[0].APPLICATION_NAME || '', disabled: true }],
      processFlow: [{ value: this.data[0].PROCESS_FLOW || '', disabled: true }],
      orgName: [{ value: this.data[0].ORG_NAME || '', disabled: true }],
      creationDate: [
        { value: this.data[0].CREATION_DATE || '', disabled: true },
      ],
      aging: [{ value: this.data[0].AGING || '', disabled: true }],
      assignedTo: [''],
      comments: [''],
    });
    this.username = this.dataService.getUsername();
  }

  submitData() {
    const updateData = {
      periodName: this.data[0].PERIOD_NAME,
      appName: this.data[0].APPLICATION_NAME,
      subApp: this.data[0].PROCESS_FLOW,
      orgName: this.data[0].ORG_NAME,
      assignedTo: this.updateForm.value.assignedTo,
      comments: this.updateForm.value.comments,
      username: this.username,
    };

    this.dialogRef.close(this.updateForm.value);
    this.http
      .post('rol-errors-summary-update', updateData)
      .subscribe((data) => {
        console.log('POST request response:', data);
      });
  }

  closeDialog(result: any) {
    this.dialogRef.close(result);
  }
}
