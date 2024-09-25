import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiHttpService } from 'src/app/providers/http.service';

@Component({
  selector: 'app-assign-dialog',
  templateUrl: './assign-dialog.component.html',
  styleUrl: './assign-dialog.component.css',
})
export class AssignDialogComponent implements OnInit {
  updateForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<AssignDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: ApiHttpService
  ) {}

  ngOnInit(): void {
    console.log('Data received in dialog:', this.data); // Log the incoming data
    console.log(this.data[0].PERIOD_NAME); // Log a specific property
    this.updateForm = this.formBuilder.group({
      periodName: [{ value: this.data[0].PERIOD_NAME || '', disabled: true }],
      appName: [{ value: this.data[0].APPLICATION_NAME || '', disabled: true }],
      processFlow: [{ value: this.data[0].PROCESS_FLOW || '', disabled: true }],
      orgName: [{ value: this.data[0].ORG_NAME || '', disabled: true }],
      creationDate: [
        { value: this.data[0].CREATION_DATE || '', disabled: true },
      ],
      aging: [{ value: this.data[0].AGING || '', disabled: true }],
      assignedTo: [''], // This field remains enabled for user input
      assignedDate: [{ value: '', disabled: true }], // Will populate with the current date on submit
      comments: [''], // This field remains enabled for user input
    });
  }

  // Auto-populate the assignedDate and submit the form
  submitData() {
    const currentDate = new Date().toISOString().split('T')[0]; // Format date as YYYY-MM-DD

    this.updateForm.patchValue({
      assignedDate: currentDate,
    });

    const updateData = {
      periodName: this.data[0].PERIOD_NAME,
      appName: this.data[0].APPLICATION_NAME,
      subApp: this.data[0].PROCESS_FLOW,
      orgName: this.data[0].ORG_NAME,
      assignedTo: this.updateForm.value.assignedTo,
      comments: this.updateForm.value.comments,
    };

    console.log('Form data before closing:', this.updateForm);
    this.dialogRef.close(this.updateForm.value); // Close dialog and return form data
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
