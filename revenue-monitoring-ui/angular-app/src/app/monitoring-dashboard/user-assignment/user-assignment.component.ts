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
import { HttpService } from '../providers/http.service';

@Component({
  selector: 'app-user-assignment',
  templateUrl: './user-assignment.component.html',
  styleUrl: './user-assignment.component.css',
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
  @Input() assignmentUsersFilter: string = '';

  updateForm: FormGroup;
  username: any;
  isAdmin: boolean = false;
  userRoles: String[] = [];
  assignmentUsers: any;
  submitKeys: string[] = [];
  webeKeys: string[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpService,
    private dataService: DataService,
    private authService: AuthenticationService
  ) {
    this.username = this.authService.getUserID();
    this.userRoles = this.authService.getRoles();
  }
  ngOnInit(): void {
    this.assignmentUsers = this.dataService.getAssignmentUsers(
      this.assignmentUsersFilter
    );
    if (!this.data || !this.data[0]) {
      console.error('No data received or data is malformed:', this.data);
      return;
    }
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

        const controlConfig = [{ value: rawValue, disabled: isDisabled }];

        if (field.validators && field.validators.length) {
          controlConfig.push(field.validators);
        }

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
    Object.assign(updateData, this.getChangedFields());
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

  /**
   * Returns an object of changed fields (not disabled) with their new values.
   */
  private getChangedFields(): { [key: string]: any } {
    const changed: { [key: string]: any } = {};
    this.fieldConfig.forEach((field) => {
      // Skip if field is disabled (true or 'dynamic' and already assigned)
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
      if (!isDisabled) {
        const originalValue = this.data[0]?.[field.sourceKey];
        const currentValue = this.updateForm.value[field.controlName];
        if (currentValue !== originalValue) {
          changed[field.controlName] = currentValue;
        } else {
          changed[field.controlName] = originalValue;
        }
      }
    });
    return changed;
  }
  sendWebexMessage() {
    const assigneeName = this.getAssigneeName();
    const assignee =
      this.assignmentUsers.find((data) => data.NAME === assigneeName)?.EMAIL ||
      assigneeName;

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
  getOptions(fieldName: string): any[] | null {
    const valueArr = this.updateForm?.controls?.[fieldName]?.value;
    if (!Array.isArray(valueArr)) return null;
    return (
      valueArr.find(
        (optArr) =>
          Array.isArray(optArr) &&
          optArr.length &&
          typeof optArr[0] === 'object' &&
          'value' in optArr[0] &&
          'label' in optArr[0]
      ) || null
    );
  }
}
