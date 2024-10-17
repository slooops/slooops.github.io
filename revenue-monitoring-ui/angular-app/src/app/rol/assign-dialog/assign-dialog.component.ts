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
  isAdmin: boolean = false;
  userRoles: String[] = [];

  availableNames = [
    { name: 'Sai Sreepathi', username: 'ssreepat' },
    { name: 'Sunith Acha', username: 'suacha' },
    { name: 'Siva Prasad Thimmi Chetty', username: 'tprasad' },
    { name: 'Abhijith Vuduthala', username: 'avudutha' },
    { name: 'Jack Sloop', username: 'jasloop' },
    { name: 'Chandan Rungta', username: 'crungta' },
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
  ) {
    this.username = this.dataService.getUsername();
    this.userRoles = this.dataService.getUserRoles();
  }

  ngOnInit(): void {
    if (!this.data || !this.data[0]) {
      console.error('No data received or data is malformed:', this.data);
      return;
    }
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
          disabled: this.userRoles.includes('ADMIN')
            ? false
            : !!this.data[0].ASSIGNED_TO,
        },
      ],
      comments: [this.data[0].COMMENTS || ''],
    });
  }

  submitData() {
    let assigneeName = '';
    if (this.userRoles.includes('ADMIN')) {
      assigneeName =
        this.updateForm.value.assignedTo !== this.data[0].ASSIGNED_TO
          ? this.updateForm.value.assignedTo
          : this.data[0].ASSIGNED_TO;
    } else {
      assigneeName =
        this.data[0].ASSIGNED_TO || this.updateForm.value.assignedTo;
    }
    const updateData = {
      periodName: this.data[0].PERIOD_NAME,
      appName: this.data[0].APPLICATION_NAME,
      subApp: this.data[0].PROCESS_FLOW,
      orgName: this.data[0].ORG_NAME,
      assignedTo: assigneeName,
      comments:
        this.updateForm.value.comments !== this.data[0].COMMENTS
          ? this.updateForm.value.comments
          : this.data[0].COMMENTS,
      username: this.username,
    };

    this.http
      .post('rol-errors-summary-update', updateData, { responseType: 'text' })
      .subscribe({
        next: (data) => {
          this.close.emit(this.updateForm.value);
        },
        error: (err) => {
          console.error('Error while submitting data:', err);
          this.closeDialog('failed');
        },
        complete: () => {
          this.sendWebexMessage();
          this.closeDialog('successful');
        },
      });
  }

  sendWebexMessage() {
    let assigneeName = '';
    if (this.userRoles.includes('ADMIN')) {
      assigneeName =
        this.updateForm.value.assignedTo !== this.data[0].ASSIGNED_TO
          ? this.updateForm.value.assignedTo
          : this.data[0].ASSIGNED_TO;
    } else {
      assigneeName =
        this.data[0].ASSIGNED_TO || this.updateForm.value.assignedTo;
    }

    const assignee = this.availableNames.find(
      (data) => data.name === assigneeName
    ).username;
    const webexMessageData = {
      assignee: assignee,
      assigner: this.username,
      periodName: this.data[0].PERIOD_NAME,
      appName: this.data[0].APPLICATION_NAME,
      subApp: this.data[0].PROCESS_FLOW,
      orgName: this.data[0].ORG_NAME,
      amount: this.data[0].AMOUNT,
      comments:
        this.updateForm.value.comments !== this.data[0].COMMENTS
          ? this.updateForm.value.comments
          : this.data[0].COMMENTS,
    };

    this.http
      .post('send-message-rol', webexMessageData, { responseType: 'text' })
      .subscribe({
        next: (data) => {},
        error: (err) => {
          console.error('Error while sending message:', err);
          this.closeDialog('webex-message-failed');
        },
        complete: () => {
          this.closeDialog('webex-message-successful');
        },
      });
  }

  closeDialog(result: any) {
    this.close.emit(result);
  }
}
