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
  @Input() data: any;
  @Output() close = new EventEmitter<void>();

  updateForm: FormGroup;
  username: any;

  availableNames = [
    'Sai Sreepathi',
    'Sunith Acha',
    'Siva Prasad Thimmi Chetty',
    'Abhijith Vuduthala',
    'Jack Sloop',
  ];

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
    if (!this.data || !this.data[0]) {
      console.error('No data received or data is malformed:', this.data);
      return;
    }
    console.log('Data received:', this.data);
    this.updateForm = this.formBuilder.group({
      periodName: [{ value: this.data[0].PERIOD_NAME || '', disabled: true }],
      appName: [{ value: this.data[0].APPLICATION_NAME || '', disabled: true }],
      processFlow: [{ value: this.data[0].PROCESS_FLOW || '', disabled: true }],
      orgName: [{ value: this.data[0].ORG_NAME || '', disabled: true }],
      creationDate: [
        { value: this.data[0].CREATION_DATE || '', disabled: true },
      ],
      aging: [{ value: this.data[0].AGING || '', disabled: true }],
      assignedTo: [
        {
          value: this.data[0].ASSIGNED_TO || '',
          disabled: !!this.data[0].ASSIGNED_TO,
        },
      ],
      comments: [
        {
          value: this.data[0].COMMENTS?.text || '',
        },
      ],
    });
    this.username = this.dataService.getUsername();
  }

  assignedToDisabled = false;

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

    this.http
      .post('rol-errors-summary-update', updateData, { responseType: 'text' })
      .subscribe({
        next: (data) => {
          this.assignedToDisabled = true;
          this.close.emit(this.updateForm.value);
        },
        error: (err) => {
          console.error('Error while submitting data:', err);
          this.closeDialog('failed');
        },
        complete: () => {
          this.closeDialog('successful');
        },
      });
  }

  closeDialog(result: any) {
    this.close.emit(result);
  }
}
