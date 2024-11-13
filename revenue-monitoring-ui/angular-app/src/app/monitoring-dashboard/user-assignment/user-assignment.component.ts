import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { DataService } from 'src/app/providers/data.service';
import { ApiHttpService } from 'src/app/providers/http.service';

@Component({
  selector: 'app-user-assignment',
  templateUrl: './user-assignment.component.html',
  styleUrl: './user-assignment.component.css',
})
export class UserAssignmentComponent implements OnInit {
  @Input() data: any;
  @Input() updateUrl: string;
  @Input() webexUrl: string;
  @Input() componentName: string;
  @Output() close = new EventEmitter<void>();

  updateForm: FormGroup;
  username: any;
  isAdmin: boolean = false;
  userRoles: String[] = [];
  assignmentUsers: any;

  disabledFields = [
    { controlName: 'periodName', label: 'Period Name' },
    { controlName: 'appName', label: 'Application Name' },
    { controlName: 'processFlow', label: 'Process Flow' },
    { controlName: 'orgName', label: 'Organization Name' },
    { controlName: 'creationDate', label: 'Transaction Date' },
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
    this.assignmentUsers = this.dataService.getAssignmentUsers();
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
        { value: this.data[0].TRANSACTION_DATE || '', disabled: true },
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
      processFlow: this.data[0].PROCESS_FLOW,
      orgName: this.data[0].ORG_NAME,
      creationDate: this.data[0].TRANSACTION_DATE,
      assignedTo: assigneeName,
      comments:
        this.updateForm.value.comments !== this.data[0].COMMENTS
          ? this.updateForm.value.comments
          : this.data[0].COMMENTS,
      username: this.username,
    };

    console.log('updateData:', updateData);
    this.http
      .post(this.updateUrl, updateData, {
        responseType: 'text',
      })
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

    const assignee = this.assignmentUsers.find(
      (data) => data.LOOKUP_CODE === assigneeName
    ).MEANING;
    const webexMessageData = {
      assignee: assignee,
      assigner: this.username,
      componentName: this.componentName,
      periodName: this.data[0].PERIOD_NAME,
      appName: this.data[0].APPLICATION_NAME,
      subApp: this.data[0].PROCESS_FLOW,
      orgName: this.data[0].ORG_NAME,
      date: this.data[0].TRANSACTION_DATE,
      amount: this.data[0].AMOUNT,
      comments:
        this.updateForm.value.comments !== this.data[0].COMMENTS
          ? this.updateForm.value.comments
          : this.data[0].COMMENTS,
    };
    console.log('webexMessageData:', webexMessageData);
    this.http
      .post(this.webexUrl, webexMessageData, {
        responseType: 'text',
      })
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
