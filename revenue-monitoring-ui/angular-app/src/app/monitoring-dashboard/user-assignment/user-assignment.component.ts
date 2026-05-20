import { Component, effect, input, output, signal } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { HttpService } from '../providers/http.service';
import { MonitoringDataService } from '../providers/data.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ModalShellComponent } from '../../ui/atoms/modal-shell/modal-shell.component';
import { SingleSelectDropdownComponent } from '../../ui/atoms/single-select-dropdown/single-select-dropdown.component';
import { SelectOption } from '../../ui/types/common.types';
import { provideIcons } from '@ng-icons/core';
import { phosphorTrashBold } from '@ng-icons/phosphor-icons/bold';
import { LoadingSymbolComponent } from '../shared/loading-symbol/loading-symbol.component';
import { ToggleSwitchComponent } from '../../ui/atoms/toggle-switch/toggle-switch.component';

export interface UserContext {
  username: string;
  userId: string;
  roles: string[];
  apiUrl: string;
  assignmentUsersFilterKey: string;
}

@Component({
  selector: 'app-user-assignment',
  templateUrl: './user-assignment.component.html',
  styleUrl: './user-assignment.component.css',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ModalShellComponent,
    SingleSelectDropdownComponent,
    LoadingSymbolComponent,
    ToggleSwitchComponent,
  ],
  viewProviders: [provideIcons({ phosphorTrashBold })],
  standalone: true,
})
export class UserAssignmentComponent {
  submitKeysToMap = input<string[]>([]);
  webexKeysToMap = input<string[]>([]);
  data = input<any>();
  updateUrl = input<string>('');
  webexUrl = input<string>('');
  componentName = input<string>('');
  fieldConfig = input<any[]>([]);
  userContext = input<UserContext>({
    username: '',
    userId: '',
    roles: [],
    apiUrl: '',
    assignmentUsersFilterKey: '',
  });

  close = output<any>();

  updateForm!: FormGroup;
  formReady = signal(false);
  refreshingUsers = signal(false);

  // Getter method to access assignment users from service
  getAssignmentUsersForTemplate(): any[] {
    return (
      this.dataService.getAssignmentUsers(
        this.userContext().assignmentUsersFilterKey,
      ) || []
    );
  }

  /** Convert assignment users to SelectOption[] for the dropdown (only enabled users) */
  assignmentUserOptions(): SelectOption[] {
    return this.getAssignmentUsersForTemplate()
      .filter((user: any) => user.FLAG === 'Y')
      .map((user: any) => ({
        label: user.NAME,
        value: user.NAME,
      }));
  }

  /** ── Update Assignment Users modal ── */
  showUsersModal = false;
  usersSearch = '';

  /** Inline add user */
  showInlineAddRow = false;
  newUserName = '';
  newUserEmail = '';
  inlineValidation: { name?: string; email?: string } = {};
  inlineSaving = false;

  onAddUserClick(): void {
    this.showInlineAddRow = true;
    this.newUserName = '';
    this.newUserEmail = '';
    this.inlineValidation = {};
  }

  onCancelInlineAdd(): void {
    this.showInlineAddRow = false;
    this.newUserName = '';
    this.newUserEmail = '';
    this.inlineValidation = {};
  }

  onSaveInlineAdd(): void {
    this.inlineValidation = {};
    const name = this.newUserName.trim();
    const email = this.newUserEmail.trim();

    if (!name) this.inlineValidation.name = 'Name is required';
    if (!email) {
      this.inlineValidation.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.inlineValidation.email = 'Invalid email format';
    }

    if (Object.keys(this.inlineValidation).length) return;

    this.inlineSaving = true;
    const team = this.userContext().assignmentUsersFilterKey;

    this.http
      .post(
        'insert-summary-assignment-user',
        { name, email, team },
        { responseType: 'text' },
      )
      .subscribe({
        next: () => {
          this.showInlineAddRow = false;
          this.newUserName = '';
          this.newUserEmail = '';
          this.inlineSaving = false;
          // Close modal and show loading while refreshing users
          this.showUsersModal = false;
          this.refreshingUsers.set(true);
          this.formReady.set(false);
          this.http.get('summary-assignment-users').subscribe((data) => {
            this.dataService.setAssignmentUsers(data);
            this.refreshingUsers.set(false);
            this.formReady.set(true);
          });
        },
        error: (err) => {
          console.error('Error adding user:', err);
          this.inlineSaving = false;
        },
      });
  }

  /** Toggle user enabled/disabled flag via API */
  onToggleUserFlag(user: any, newChecked: boolean): void {
    const endpoint = newChecked
      ? 'enable-summary-assignment-user'
      : 'disable-summary-assignment-user';

    this.http
      .get(endpoint, { params: { email: user.EMAIL }, responseType: 'text' })
      .subscribe({
        next: () => {
          // Refresh the users list from server
          this.http.get('summary-assignment-users').subscribe((data) => {
            this.dataService.setAssignmentUsers(data);
          });
        },
        error: (err) => {
          console.error('Error toggling user flag:', err);
        },
      });
  }

  get allTeamUsers(): any[] {
    return this.getAssignmentUsersForTemplate();
  }

  get filteredTeamUsers(): any[] {
    const q = this.usersSearch.trim().toLowerCase();
    if (!q) return this.allTeamUsers;
    return this.allTeamUsers.filter(
      (u: any) =>
        (u.NAME || '').toLowerCase().includes(q) ||
        (u.EMAIL || '').toLowerCase().includes(q),
    );
  }

  openUsersModal(): void {
    this.usersSearch = '';
    this.showUsersModal = true;
  }

  closeUsersModal(): void {
    this.showUsersModal = false;
  }

  /** Check if user has ADMIN or any _ADMIN role */
  isAdminUser(): boolean {
    return this.userContext().roles.some(
      (role) => role === 'ADMIN' || role.endsWith('_ADMIN'),
    );
  }

  /** Handle selection from the single-select dropdown */
  onAssignedToChange(value: string): void {
    this.updateForm.patchValue({ assignedTo: value });
  }

  /** Handle selection change for any field's single-select dropdown */
  onFieldChange(controlName: string, value: string): void {
    this.updateForm.patchValue({ [controlName]: value });
  }

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpService,
    private dataService: MonitoringDataService,
  ) {
    this.updateForm = this.formBuilder.group({});

    effect(() => {
      const config = this.fieldConfig();
      const currentData = this.data();

      if (config.length && currentData?.[0]) {
        const formGroupObj: { [key: string]: any } = {};

        config.forEach((field) => {
          const rawValue =
            'value' in field
              ? field.value
              : currentData[0]?.[field.sourceKey] || '';
          let isDisabled = false;

          if (field.disabled === true) {
            isDisabled = true;
          } else if (
            field.disabled === 'dynamic' &&
            field.controlName === 'assignedTo'
          ) {
            const assignedToValue =
              currentData[0]?.ASSIGNED_TO ?? currentData[0]?.assigned_to;
            isDisabled =
              !this.userContext().roles.includes('ADMIN') && !!assignedToValue;
          }

          const controlConfig = [{ value: rawValue, disabled: isDisabled }];

          if (field.validators && field.validators.length) {
            controlConfig.push(field.validators);
          }

          formGroupObj[field.controlName] = controlConfig;
        });

        this.updateForm = this.formBuilder.group(formGroupObj);
        this.formReady.set(true);
      } else {
        this.formReady.set(false);
      }
    });
  }

  submitData() {
    const assigneeName = this.getAssigneeName();
    const updateData = this.createDynamicObject(
      assigneeName,
      this.submitKeysToMap(),
      true,
    );
    Object.assign(updateData, this.getChangedFields());
    this.http
      .post(this.updateUrl(), updateData, {
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

  private getChangedFields(): { [key: string]: any } {
    const changed: { [key: string]: any } = {};
    this.fieldConfig().forEach((field) => {
      let isDisabled = false;
      if (field.disabled === true) {
        isDisabled = true;
      } else if (
        field.disabled === 'dynamic' &&
        field.controlName === 'assignedTo'
      ) {
        const assignedToValue =
          this.data()[0]?.ASSIGNED_TO ?? this.data()[0]?.assigned_to;
        isDisabled =
          !this.userContext().roles.includes('ADMIN') && !!assignedToValue;
      }
      if (!isDisabled) {
        const originalValue = this.data()[0]?.[field.sourceKey];
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
    const assignmentUsers = this.dataService.getAssignmentUsers(
      this.userContext().assignmentUsersFilterKey,
    );
    const assignee =
      assignmentUsers?.find((data: any) => data.NAME === assigneeName)?.EMAIL ||
      assigneeName;

    const webexMessageData = this.createDynamicObject(
      assignee,
      this.webexKeysToMap(),
      false,
    );

    this.http
      .post(this.webexUrl(), webexMessageData, {
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
      this.data()[0]?.ASSIGNED_TO ?? this.data()[0]?.assigned_to;
    const currentAssignedTo = this.updateForm.value.assignedTo;
    return this.userContext().roles.includes('ADMIN')
      ? currentAssignedTo !== originalAssignedTo
        ? currentAssignedTo
        : originalAssignedTo
      : originalAssignedTo || currentAssignedTo;
  }

  private createDynamicObject(
    assigneeName: string,
    keysToMap: string[],
    update: boolean,
  ): any {
    const result = {
      assignedTo: assigneeName,
      comments: this.getUpdatedComments(),
      username: this.userContext().userId,
    };

    if (!update) {
      result['componentName'] = this.componentName();
    }

    keysToMap.forEach((key) => {
      result[this.toCamelCase(key)] = this.data()[0][key];
    });

    return result;
  }

  private getUpdatedComments(): string {
    const originalComments =
      this.data()[0]?.COMMENTS ?? this.data()[0]?.comments;
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
          'label' in optArr[0],
      ) || null
    );
  }
}
