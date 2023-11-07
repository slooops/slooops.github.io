import { Injectable } from '@angular/core';
import { errorDashModel } from '../error-dash/error-dash.component';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  selectedErrorData: errorDashModel[] = [];
  allErrorsSelected: boolean = true;

  constructor() {}

  setErrorData(errorData: errorDashModel[]) {
    this.selectedErrorData = errorData;
  }

  getErrorData() {
    return this.selectedErrorData;
  }

  setAllErrorsSelected(allErrorsSelected: boolean) {
    this.allErrorsSelected = allErrorsSelected;
  }

  getAllErrorsSelected() {
    return this.allErrorsSelected;
  }
}
