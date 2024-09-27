import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DataService } from 'src/app/providers/data.service';
import { ApiHttpService } from 'src/app/providers/http.service';

@Component({
  selector: 'app-assign-dialog',
  templateUrl: './assign-dialog.component.html',
  styleUrls: ['./assign-dialog.component.css'],
})
export class AssignDialogComponent implements OnInit {
  @Input() data: any; // Get the input data from parent
  @Output() close = new EventEmitter<void>(); // Notify the parent to close the modal

  updateForm: FormGroup;
  username: any;

  // Fields separated into disabled and enabled for rendering in the form
  disabledFields = [
    { controlName: 'periodName', label: 'Period Name' },
    { controlName: 'appName', label: 'Application Name' },
    { controlName: 'processFlow', label: 'Process Flow' },
    { controlName: 'orgName', label: 'Organization Name' },
    { controlName: 'creationDate', label: 'Creation Date' },
    { controlName: 'aging', label: 'Aging' },
  ];

  enabledFields = [
    { controlName: 'assignedTo', label: 'Assigned To' },
    { controlName: 'comments', label: 'Comments' },
  ];

  constructor(
    private formBuilder: FormBuilder,

    private http: ApiHttpService,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    console.log('Data received in dialog:', this.data); // Make sure this is not undefined or null
    if (!this.data || !this.data[0]) {
      console.error('No data received or data is malformed:', this.data);
      return;
    }

    console.log('Data received in dialog:', this.data);
    this.updateForm = this.formBuilder.group({
      periodName: [{ value: this.data[0].PERIOD_NAME || '', disabled: true }],
      appName: [{ value: this.data[0].APPLICATION_NAME || '', disabled: true }],
      processFlow: [{ value: this.data[0].PROCESS_FLOW || '', disabled: true }],
      orgName: [{ value: this.data[0].ORG_NAME || '', disabled: true }],
      creationDate: [
        { value: this.data[0].CREATION_DATE || '', disabled: true },
      ],
      aging: [{ value: this.data[0].AGING || '', disabled: true }],
      assignedTo: [''], // Enabled for user input
      comments: [''], // Enabled for user input
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

    console.log('Form data before closing:', this.updateForm);
    // Notify parent to close the modal
    this.close.emit(this.updateForm.value);

    this.http
      .post('rol-errors-summary-update', updateData)
      .subscribe((data) => {
        console.log('POST request response:', data);
      });
  }

  closeDialog(result: any) {
    this.close.emit(result);
  }
}
