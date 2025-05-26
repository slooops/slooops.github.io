import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { AuthenticationService } from 'src/app/providers/authentication.service';
import { DataService } from 'src/app/providers/data.service';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { ApiHttpService } from 'src/app/providers/http.service';

@Component({
  selector: 'app-user-assignment',
  templateUrl: './user-assignment.component.html',
  styleUrl: './user-assignment.component.css',
  providers: [DestroyManager],
})
export class UserAssignmentComponent implements OnInit, OnChanges {
  @Input() submitKeysToMap: string[] = []; // Keys for submitData
  @Input() webexKeysToMap: string[] = [];
  @Input() data: any;
  @Input() updateUrl: string;
  @Input() webexUrl: string;
  @Input() componentName: string;
  @Output() close = new EventEmitter<void>();
  @Input() fieldConfig: any[] = [];

  updateForm: FormGroup;
  username: any;
  isAdmin: boolean = false;
  userRoles: String[] = [];
  assignmentUsers: any;
  submitKeys: string[] = [];
  webeKeys: string[] = [];

  // disabledFields = [
  //   { controlName: 'periodName', label: 'Period Name' },
  //   { controlName: 'appName', label: 'Application Name' },
  //   { controlName: 'processFlow', label: 'Process Flow' },
  //   { controlName: 'orgName', label: 'Organization Name' },
  //   { controlName: 'creationDate', label: 'Transaction Date' },
  //   { controlName: 'aging', label: 'Aging' },
  // ];

  // enabledFields = [
  //   { controlName: 'assignedTo', label: 'Assigned To' },
  //   { controlName: 'comments', label: 'Comments' },
  // ];

  constructor(
    private formBuilder: FormBuilder,
    private http: ApiHttpService,
    private dataService: DataService,
    private authService: AuthenticationService
  ) {
    this.username = this.authService.getUserID();
    this.userRoles = this.authService.getRoles();
  }
  ngOnInit(): void {
    // if (this.componentName === 'General Ledger') {
    //   this.disabledFields = [
    //     { controlName: 'periodName', label: 'Period Name' },
    //     { controlName: 'appName', label: 'Application Name' },
    //     { controlName: 'processFlow', label: 'Process Flow' },
    //     { controlName: 'orgName', label: 'Ledger Name' },
    //     { controlName: 'creationDate', label: 'Transaction Date' },
    //     { controlName: 'aging', label: 'Aging' },
    //   ];
    // }
    this.assignmentUsers = this.dataService.getAssignmentUsers();
    if (!this.data || !this.data[0]) {
      console.error('No data received or data is malformed:', this.data);
      return;
    }
    // let OrgValue =
    //   this.componentName !== 'General Ledger'
    //     ? this.data[0].ORG_NAME
    //     : this.data[0].LEDGER_NAME;
    // this.updateForm = this.formBuilder.group({
    //   periodName: [{ value: this.data[0].PERIOD_NAME || '', disabled: true }],
    //   appName: [{ value: this.data[0].APPLICATION_NAME || '', disabled: true }],
    //   processFlow: [{ value: this.data[0].PROCESS_FLOW || '', disabled: true }],
    //   orgName: [{ value: OrgValue || '', disabled: true }],
    //   creationDate: [
    //     { value: this.data[0].TRANSACTION_DATE || '', disabled: true },
    //   ],
    //   aging: [{ value: this.data[0].AGING || '', disabled: true }],
    //   assignedTo: [
    //     {
    //       value: this.data[0].ASSIGNED_TO || '',
    //       disabled: this.userRoles.includes('ADMIN')
    //         ? false
    //         : !!this.data[0].ASSIGNED_TO,
    //     },
    //     Validators.required,
    //   ],
    //   comments: [this.data[0].COMMENTS || ''],
    // });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['submitKeysToMap'] &&
      changes['webexKeysToMap'] &&
      changes['fieldConfig']
    ) {
      const formGroupObj: { [key: string]: any } = {};

      this.fieldConfig.forEach((field) => {
        const rawValue =
          'value' in field
            ? field.value
            : this.data[0]?.[field.sourceKey] || '';
        let isDisabled = false;

        if (field.disabled === true) {
          isDisabled = true;
        } else if (
          field.disabled === 'dynamic' &&
          field.controlName === 'assignedTo'
        ) {
          const assignedToValue =
            this.data[0]?.ASSIGNED_TO ?? this.data[0]?.assigned_to;
          isDisabled = !this.userRoles.includes('ADMIN') && !!assignedToValue;
        }

        const controlConfig = [
          { value: rawValue, disabled: isDisabled },
          field.validators || [],
        ];

        formGroupObj[field.controlName] = controlConfig;
      });

      this.updateForm = this.formBuilder.group(formGroupObj);
      this.submitKeys = this.submitKeysToMap;
      this.webeKeys = this.webexKeysToMap;
    }
  }

  submitData() {
    const assigneeName = this.getAssigneeName();
    const updateData = this.createDynamicObject(
      assigneeName,
      this.submitKeys,
      true
    );
    console.log('updateData:', updateData);
    console.log(this.updateUrl);
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
    const assigneeName = this.getAssigneeName();
    const assignee =
      this.assignmentUsers.find((data) => data.LOOKUP_CODE === assigneeName)
        ?.MEANING || assigneeName;

    const webexMessageData = this.createDynamicObject(
      assignee,
      this.webeKeys,
      false
    );

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

  private getAssigneeName(): string {
    const originalAssignedTo =
      this.data[0]?.ASSIGNED_TO ?? this.data[0]?.assigned_to;
    const currentAssignedTo = this.updateForm.value.assignedTo;
    return this.userRoles.includes('ADMIN')
      ? currentAssignedTo !== originalAssignedTo
        ? currentAssignedTo
        : originalAssignedTo
      : originalAssignedTo || currentAssignedTo;
  }

  private createDynamicObject(
    assigneeName: string,
    keysToMap: string[],
    update: boolean
  ): any {
    const result = {
      assignedTo: assigneeName,
      comments: this.getUpdatedComments(),
      username: this.username,
    };

    if (!update) {
      result['componentName'] = this.componentName;
    }

    keysToMap.forEach((key) => {
      result[this.toCamelCase(key)] = this.data[0][key];
    });

    return result;
  }

  private getUpdatedComments(): string {
    const originalComments = this.data[0]?.COMMENTS ?? this.data[0]?.comments;
    const currentComments = this.updateForm.value.comments;
    return currentComments !== originalComments
      ? currentComments
      : originalComments;
  }

  private toCamelCase(str: string): string {
    return str
      .toLowerCase()
      .replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
  }
}
